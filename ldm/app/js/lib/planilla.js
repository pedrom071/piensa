// Lectura y validación de la planilla de carga de estudiantes (.xlsx o .csv).
import { normalizarRut } from './rut.js';

const SHEETJS = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
let cargando;
function cargarSheetJS() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  cargando ??= new Promise((ok, mal) => {
    const s = document.createElement('script');
    s.src = SHEETJS;
    s.onload = () => ok(window.XLSX);
    s.onerror = () => mal(new Error('No se pudo cargar el lector de Excel. Revisa tu conexión.'));
    document.head.appendChild(s);
  });
  return cargando;
}

const quitarTildes = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Encabezados aceptados (sin tildes, minúsculas) → campo
const COLUMNAS = {
  rut: 'rut',
  nombres: 'nombres', nombre: 'nombres',
  apellidos: 'apellidos', apellido: 'apellidos',
  curso: 'curso',
  correo: 'correo', email: 'correo', 'correo (opcional)': 'correo',
  'rbd colegio': 'rbd', rbd: 'rbd', 'rbd del colegio': 'rbd',
  'consentimiento apoderado': 'consentimiento', consentimiento: 'consentimiento',
  'consentimiento del apoderado': 'consentimiento',
};

export async function leerPlanilla(archivo) {
  const XLSX = await cargarSheetJS();
  const datos = await archivo.arrayBuffer();
  const libro = XLSX.read(datos, { type: 'array' });
  const hoja = libro.Sheets['Estudiantes'] ?? libro.Sheets[libro.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: '', raw: false });
  const iEnc = filas.findIndex((f) => f.some((c) => quitarTildes(c) === 'rut'));
  if (iEnc < 0) throw new Error('No encontré la columna "RUT". Usa la plantilla de carga.');
  const mapa = filas[iEnc].map((c) => COLUMNAS[quitarTildes(c)] ?? null);
  return filas.slice(iEnc + 1)
    .map((f, i) => ({ fila: iEnc + i + 2, ...Object.fromEntries(mapa.map((k, j) => [k, String(f[j] ?? '').trim()]).filter(([k]) => k)) }))
    .filter((r) => r.rut || r.nombres || r.apellidos)
    .filter((r) => !/^ejemplo/i.test(r.nombres) && r.rut !== '12.345.678-5');
}

// Valida cada fila. colegios: lista; colegioFijo: id del colegio del profesor (o null si es admin);
// existentes: estudiantes ya cargados ese año.
export function validarFilas(filas, { colegios, colegioFijo, existentes }) {
  const yaEstan = new Set(existentes.map((e) => e.rut));
  const vistos = new Set();
  return filas.map((r) => {
    const errores = [];
    const n = normalizarRut(r.rut);
    if (n.error) errores.push(`RUT: ${n.error}`);
    else if (yaEstan.has(n.rut)) errores.push('Ya está inscrito este año');
    else if (vistos.has(n.rut)) errores.push('RUT repetido en la planilla');
    if (n.rut) vistos.add(n.rut);
    if (!r.nombres) errores.push('Faltan los nombres');
    if (!r.apellidos) errores.push('Faltan los apellidos');
    let colegio_id = colegioFijo;
    if (!colegioFijo) {
      const c = colegios.find((c) => String(c.rbd) === String(r.rbd).replace(/\D/g, ''));
      if (!c) errores.push(r.rbd ? `No hay colegio con RBD ${r.rbd}` : 'Falta el RBD del colegio');
      colegio_id = c?.id;
    }
    if (r.correo && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.correo)) errores.push('Correo con formato inválido');
    const consentimiento = /^(s[ií]|si|x|true|1)$/i.test(r.consentimiento ?? '');
    return {
      fila: r.fila, errores,
      datos: { rut: n.rut, nombres: r.nombres, apellidos: r.apellidos, curso: r.curso || null, correo: r.correo || null, colegio_id, consentimiento_apoderado: consentimiento },
    };
  });
}

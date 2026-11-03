// Modo demostración: datos ficticios en el navegador, misma interfaz que api/supabase.js.
// Nada sale del computador. Sirve para mostrar la app y probar cambios sin tocar datos reales.
import { digitoVerificador } from '../lib/rut.js';

export const HOY_DEMO = '2027-10-20';
const CLAVE = 'ldm-demo-v1';

function azar(semilla) {
  return () => { semilla |= 0; semilla = (semilla + 0x6d2b79f5) | 0; let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

async function sembrar() {
  const enc = await fetch(new URL('../../data/encuestas-2027.json', import.meta.url)).then((r) => r.json());
  const r = azar(2027);
  const programa = { id: 'p27', anio: 2027, nombre: 'Líderes del Mañana 2027', min_asistencias: 4, max_visitas_que_cuentan: 1, fecha_graduacion: '2027-11-16', meta_graduados: 40, activo: true };
  const colegios = [
    ['1734', 'Liceo Bicentenario Cerro Alegre', 'Valparaíso', 'SLEP'],
    ['14522', 'Colegio San Marcos', 'Quilpué', 'Particular subvencionado'],
    ['1862', 'Escuela Bahía de Concón', 'Concón', 'Municipal'],
    ['2035', 'Liceo Técnico Puerto Viejo', 'San Antonio', 'SLEP'],
    ['14907', 'Colegio Los Aromos', 'Villa Alemana', 'Particular subvencionado'],
    ['15210', 'Colegio Altamar', 'Viña del Mar', 'Particular pagado'],
  ].map(([rbd, nombre, comuna, dependencia]) => ({ id: 'c' + rbd, rbd, nombre, comuna, dependencia }));
  const profes = ['Carolina Vidal Ortiz', 'Rodrigo Saavedra Lagos', 'Paula Henríquez Mella', 'Marcelo Fuentealba Ríos', 'Daniela Orellana Paz', 'Francisca Leiva Moya'];
  const profesores = [
    { id: 'u-admin', rol: 'admin', nombre: 'Equipo P!ensa (demo)', correo: 'equipo@fundacionpiensa.cl' },
    ...colegios.map((c, i) => ({ id: 'u-prof-' + c.rbd, rol: 'profesor', nombre: profes[i], correo: `profe.${c.rbd}@colegio.cl`, colegio_id: c.id })),
  ];
  const programaColegios = colegios.map((c) => ({ programa_id: 'p27', colegio_id: c.id, profesor_id: 'u-prof-' + c.rbd, cupos: 8 }));
  const A = (tipo, codigo, nombre, fecha, h1, h2, lugar, cuenta = true) => ({ id: 'a-' + codigo, programa_id: 'p27', tipo, codigo, nombre, fecha, hora_inicio: h1, hora_fin: h2, lugar, cuenta_para_graduacion: cuenta, cupos: tipo === 'visita' ? 60 : null, cupos_por_colegio: tipo === 'visita' ? 6 : null });
  const actividades = [
    A('jornada', 'J1', 'Jornada Líderes del Mañana', '2027-05-19', '09:00', '14:00', 'Aula Magna PUCV', false),
    A('sesion', 'S1', 'Sesión 1 · Bienvenida y liderazgo', '2027-08-11', '15:00', '17:00', 'Colegio San Ignacio, Viña del Mar'),
    A('sesion', 'S2', 'Sesión 2 · Democracia e instituciones', '2027-08-25', '15:00', '17:00', 'Liceo Bicentenario Cerro Alegre'),
    A('sesion', 'S3', 'Sesión 3 · Simulación de decisiones públicas', '2027-09-08', '15:00', '17:00', 'Colegio San Marcos, Quilpué'),
    A('sesion', 'S4', 'Sesión 4 · Gestión de proyectos', '2027-09-29', '15:00', '17:00', 'Colegio Altamar'),
    A('sesion', 'S5', 'Sesión 5 · Comunicación estratégica', '2027-10-13', '15:00', '17:00', 'Escuela Bahía de Concón'),
    A('sesion', 'S6', 'Sesión 6 · Presentación de iniciativas', '2027-10-27', '15:00', '17:00', 'Colegio SS.CC. Padres Franceses'),
    A('visita', 'V1', 'Visita cívica · Congreso Nacional', '2027-11-03', '11:30', '13:30', 'Av. Pedro Montt s/n, Valparaíso'),
    A('visita', 'V2', 'Visita cívica · SEREMI Desarrollo Social', '2027-11-05', '10:00', '12:00', 'Álvarez 646, Viña del Mar'),
  ];
  const FN = ['Antonia', 'Sofía', 'Isidora', 'Florencia', 'Martina', 'Catalina', 'Josefa', 'Agustina', 'Emilia', 'Trinidad', 'Benjamín', 'Vicente', 'Matías', 'Joaquín', 'Tomás', 'Agustín', 'Martín', 'Lucas', 'Cristóbal', 'Diego'];
  const SN = ['González', 'Muñoz', 'Rojas', 'Díaz', 'Pérez', 'Soto', 'Contreras', 'Silva', 'Martínez', 'Sepúlveda', 'Morales', 'Rodríguez', 'López', 'Fuentes', 'Hernández', 'Torres', 'Araya', 'Flores', 'Espinoza', 'Valenzuela'];
  const CURSOS = ['8° básico', '1° medio', '2° medio', '3° medio'];
  const pick = (l) => l[Math.floor(r() * l.length)];
  const estudiantes = [], asistencias = [], inscripciones = [], cuentas = [];
  colegios.forEach((c, ci) => {
    const n = 7 + Math.floor(r() * 3);
    for (let k = 1; k <= n; k++) {
      const cuerpo = 23000000 + Math.floor(r() * 2500000);
      const rut = `${cuerpo}-${digitoVerificador(cuerpo)}`;
      const e = {
        id: `e-${c.rbd}-${k}`, programa_id: 'p27', colegio_id: c.id, codigo: `LDM27-${c.rbd}-${String(k).padStart(2, '0')}`,
        rut, nombres: pick(FN), apellidos: `${pick(SN)} ${pick(SN)}`, curso: pick(CURSOS), correo: null,
        user_id: k <= n - 1 ? `u-est-${c.rbd}-${k}` : null, estado: 'activo', fecha_alta: '2027-05-01', fecha_baja: null,
        motivo_baja: null, reemplaza_a: null, consentimiento_apoderado: r() > 0.1,
      };
      estudiantes.push(e);
      if (e.user_id) cuentas.push({ user_id: e.user_id, rut, clave: 'demo-1234' });
      const compromiso = 0.92 - ci * 0.07 - r() * 0.35;
      for (const a of actividades) {
        if (a.fecha >= HOY_DEMO) continue;
        if (a.tipo === 'visita') continue;
        asistencias.push({ actividad_id: a.id, estudiante_id: e.id, presente: r() < compromiso });
      }
    }
  });
  // Una baja con reemplazo, para mostrar el flujo
  const b = estudiantes[3];
  b.estado = 'baja'; b.fecha_baja = '2027-09-01'; b.motivo_baja = 'Cambio de colegio';
  const reemplazo = { ...estudiantes[3], id: 'e-repl', codigo: `LDM27-1734-${String(estudiantes.filter((e) => e.colegio_id === 'c1734').length + 1).padStart(2, '0')}`, rut: '24512338-8', nombres: 'Gaspar', apellidos: 'Tapia Reyes', user_id: null, estado: 'activo', fecha_alta: '2027-09-02', fecha_baja: null, motivo_baja: null, reemplaza_a: b.id };
  estudiantes.push(reemplazo);
  for (const code of ['S3', 'S4', 'S5']) asistencias.push({ actividad_id: 'a-' + code, estudiante_id: 'e-repl', presente: true });
  // Inscripciones a visitas: algunos colegios ya inscribieron
  for (const e of estudiantes.filter((e) => ['c1734', 'c14522', 'c15210'].includes(e.colegio_id)).slice(0, 18)) {
    inscripciones.push({ actividad_id: r() > 0.5 ? 'a-V1' : 'a-V2', estudiante_id: e.id });
  }
  const encuestas = [
    { id: 'enc-entrada', programa_id: 'p27', tipo: 'entrada', titulo: 'Encuesta de entrada 2027', preguntas: enc.entrada, abierta: false },
    { id: 'enc-salida', programa_id: 'p27', tipo: 'salida', titulo: 'Encuesta de salida 2027 (borrador)', preguntas: enc.salida, abierta: true },
  ];
  const respuestas = [];
  const items = enc.entrada.secciones.flatMap((s) => s.items.map((it) => ({ id: it.id, esc: s.escala })));
  for (const e of estudiantes) {
    if (r() < 0.82) {
      const resp = {};
      for (const it of items) { const o = enc.entrada.escalas[it.esc]; resp[it.id] = o[Math.floor(r() * o.length)][0]; }
      respuestas.push({ encuesta_id: 'enc-entrada', estudiante_id: e.id, respuestas: resp, enviada_en: '2027-08-11T15:30:00Z' });
    }
  }
  return { programa, colegios, profesores, programaColegios, actividades, estudiantes, asistencias, inscripciones, encuestas, respuestas, cuentas, sesion: null };
}

let S;
async function estado() {
  if (S) return S;
  try { S = JSON.parse(localStorage.getItem(CLAVE)); } catch { S = null; }
  if (!S?.programa) S = await sembrar();
  return S;
}
function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(S)); } catch { /* sin almacenamiento: queda en memoria */ } }
const pausa = () => new Promise((r) => setTimeout(r, 120));

function visibles(s) {
  const p = s.profesores.find((x) => x.id === s.sesion?.id) ?? null;
  const est = s.estudiantes.find((e) => e.user_id === s.sesion?.id) ?? null;
  const rol = p?.rol ?? (est ? 'estudiante' : null);
  let ests = s.estudiantes;
  if (rol === 'profesor') ests = ests.filter((e) => e.colegio_id === p.colegio_id);
  if (rol === 'estudiante') ests = [est];
  const ids = new Set(ests.map((e) => e.id));
  return { rol, perfil: p, est, ests, ids };
}

export const api = {
  modo: 'demo',

  async reiniciarDemo() { try { localStorage.removeItem(CLAVE); } catch { /* nada */ } S = null; await estado(); },

  // Atajo del modo demo: entrar como un rol sin clave
  async entrarComo(id) { const s = await estado(); s.sesion = { id, debeCambiarClave: false }; guardar(); },

  async usuariosDemo() {
    const s = await estado();
    return {
      admin: s.profesores.find((p) => p.rol === 'admin'),
      profesores: s.profesores.filter((p) => p.rol === 'profesor').map((p) => ({ ...p, colegio: s.colegios.find((c) => c.id === p.colegio_id)?.nombre })),
      estudiantes: s.estudiantes.filter((e) => e.user_id).slice(0, 4).map((e) => ({ id: e.user_id, nombre: `${e.nombres} ${e.apellidos}`, rut: e.rut })),
    };
  },

  async sesion() {
    const s = await estado();
    if (!s.sesion) return null;
    const v = visibles(s);
    if (!v.rol) return null;
    const perfil = v.perfil ?? { id: s.sesion.id, rol: 'estudiante', nombre: `${v.est.nombres} ${v.est.apellidos}`, colegio_id: v.est.colegio_id };
    return { usuario: { id: s.sesion.id }, perfil, debeCambiarClave: !!s.sesion.debeCambiarClave };
  },
  async ingresarEstudiante(rut, clave) {
    const s = await estado(); await pausa();
    const c = s.cuentas.find((x) => x.rut === rut && x.clave === clave);
    if (!c) throw new Error('RUT o clave incorrectos. En la demo, la clave de los estudiantes es demo-1234.');
    s.sesion = { id: c.user_id, debeCambiarClave: !!c.temporal }; guardar();
  },
  async ingresarCorreo(correo, clave) {
    const s = await estado(); await pausa();
    const p = s.profesores.find((x) => x.correo === correo.trim().toLowerCase());
    if (!p || clave !== 'demo-1234') throw new Error('Correo o clave incorrectos. En la demo, la clave es demo-1234.');
    s.sesion = { id: p.id, debeCambiarClave: false }; guardar();
  },
  async salir() { const s = await estado(); s.sesion = null; guardar(); },
  async cambiarClave(nueva) {
    const s = await estado();
    if (nueva.length < 8) throw new Error('La clave debe tener al menos 8 caracteres.');
    const c = s.cuentas.find((x) => x.user_id === s.sesion.id);
    if (c) { c.clave = nueva; c.temporal = false; }
    s.sesion.debeCambiarClave = false; guardar();
  },

  async datos() {
    const s = await estado();
    const v = visibles(s);
    const enIds = (l) => l.filter((x) => v.ids.has(x.estudiante_id));
    return {
      programa: s.programa, colegios: s.colegios, actividades: [...s.actividades].sort((a, b) => a.fecha.localeCompare(b.fecha)),
      estudiantes: v.ests, encuestas: s.encuestas, programaColegios: s.programaColegios,
      asistencias: enIds(s.asistencias), inscripciones: enIds(s.inscripciones),
      avance: v.ests.flatMap((e) => s.encuestas.map((en) => ({ estudiante_id: e.id, tipo: en.tipo, enviada: s.respuestas.some((r) => r.encuesta_id === en.id && r.estudiante_id === e.id) }))),
      respuestasPropias: v.rol === 'estudiante' ? enIds(s.respuestas) : [],
      profesores: v.rol === 'admin' ? s.profesores : [],
    };
  },

  async agregarEstudiantes(filas) {
    const s = await estado(); await pausa();
    const v = visibles(s);
    const out = filas.map((f) => {
      const colegio_id = v.rol === 'profesor' ? v.perfil.colegio_id : f.colegio_id;
      if (s.estudiantes.some((e) => e.rut === f.rut)) throw new Error(`El RUT ${f.rut} ya está inscrito este año.`);
      const c = s.colegios.find((x) => x.id === colegio_id);
      const sig = 1 + Math.max(0, ...s.estudiantes.filter((e) => e.colegio_id === colegio_id).map((e) => Number(e.codigo.split('-')[2]) || 0));
      const e = { estado: 'activo', fecha_alta: HOY_DEMO, fecha_baja: null, motivo_baja: null, reemplaza_a: null, correo: null, curso: null, consentimiento_apoderado: false, ...f, id: uid(), programa_id: 'p27', colegio_id, user_id: null, codigo: `LDM27-${c.rbd}-${String(sig).padStart(2, '0')}` };
      s.estudiantes.push(e);
      return e;
    });
    guardar(); return out;
  },
  async actualizarEstudiante(id, cambios) {
    const s = await estado(); await pausa();
    const e = s.estudiantes.find((x) => x.id === id);
    Object.assign(e, cambios); guardar(); return e;
  },
  async marcarAsistencia(actividad_id, estudiante_id, presente) {
    const s = await estado();
    s.asistencias = s.asistencias.filter((x) => !(x.actividad_id === actividad_id && x.estudiante_id === estudiante_id));
    if (presente !== null) s.asistencias.push({ actividad_id, estudiante_id, presente });
    guardar();
  },
  async inscribir(actividad_id, estudiante_id, si) {
    const s = await estado();
    s.inscripciones = s.inscripciones.filter((x) => !(x.actividad_id === actividad_id && x.estudiante_id === estudiante_id));
    if (si) s.inscripciones.push({ actividad_id, estudiante_id });
    guardar();
  },
  async guardarActividad(a) {
    const s = await estado(); await pausa();
    if (a.id) Object.assign(s.actividades.find((x) => x.id === a.id), a);
    else s.actividades.push({ ...a, id: uid() });
    guardar();
  },
  async borrarActividad(id) {
    const s = await estado();
    s.actividades = s.actividades.filter((x) => x.id !== id);
    s.asistencias = s.asistencias.filter((x) => x.actividad_id !== id);
    s.inscripciones = s.inscripciones.filter((x) => x.actividad_id !== id);
    guardar();
  },
  async guardarColegio(c) {
    const s = await estado(); await pausa();
    if (c.id) { Object.assign(s.colegios.find((x) => x.id === c.id), c); guardar(); return c; }
    const nuevo = { ...c, id: uid() }; s.colegios.push(nuevo); guardar(); return nuevo;
  },
  async asignarColegio(programa_id, colegio_id, profesor_id) {
    const s = await estado();
    s.programaColegios = s.programaColegios.filter((x) => x.colegio_id !== colegio_id);
    s.programaColegios.push({ programa_id, colegio_id, profesor_id: profesor_id || null });
    guardar();
  },
  async guardarPrograma(id, cambios) { const s = await estado(); Object.assign(s.programa, cambios); guardar(); return s.programa; },
  async abrirEncuesta(id, abierta) { const s = await estado(); s.encuestas.find((x) => x.id === id).abierta = abierta; guardar(); },
  async responderEncuesta(encuesta_id, estudiante_id, respuestas) {
    const s = await estado(); await pausa();
    s.respuestas = s.respuestas.filter((x) => !(x.encuesta_id === encuesta_id && x.estudiante_id === estudiante_id));
    s.respuestas.push({ encuesta_id, estudiante_id, respuestas, enviada_en: new Date().toISOString() });
    guardar();
  },
  async respuestasEncuesta(encuesta_id) { const s = await estado(); return s.respuestas.filter((x) => x.encuesta_id === encuesta_id); },

  async crearCuentas(ids) {
    const s = await estado(); await pausa();
    return ids.map((id) => {
      const e = s.estudiantes.find((x) => x.id === id);
      const nombre = `${e.nombres} ${e.apellidos}`;
      if (e.user_id) return { id, codigo: e.codigo, nombre, rut: e.rut, estado: 'ya tenía cuenta' };
      const clave = 'faro-' + String(1000 + Math.floor(Math.random() * 9000));
      e.user_id = 'u-' + uid();
      s.cuentas.push({ user_id: e.user_id, rut: e.rut, clave, temporal: true });
      guardar();
      return { id, codigo: e.codigo, nombre, rut: e.rut, clave, estado: 'creada' };
    });
  },
  async reiniciarClave(id) {
    const s = await estado();
    const e = s.estudiantes.find((x) => x.id === id);
    const c = s.cuentas.find((x) => x.user_id === e.user_id);
    if (!c) throw new Error('Ese estudiante aún no tiene cuenta');
    c.clave = 'brisa-' + String(1000 + Math.floor(Math.random() * 9000)); c.temporal = true; guardar();
    return { codigo: e.codigo, nombre: `${e.nombres} ${e.apellidos}`, clave: c.clave };
  },
  async crearProfesor({ correo, nombre, colegio_id }) {
    const s = await estado();
    const p = { id: 'u-' + uid(), rol: 'profesor', nombre, correo: correo.trim().toLowerCase(), colegio_id };
    s.profesores.push(p); guardar();
    return { correo: p.correo, clave: 'demo-1234' };
  },
};

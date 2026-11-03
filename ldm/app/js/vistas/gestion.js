// Gestión de estudiantes, compartida por la vista de administración y la de profesor:
// lista con estado, agregar uno a uno, cargar planilla, baja/reemplazo y cuentas.
import { esc, pill, cadena, nombre, fecha, descargarCSV } from '../lib/ui.js';
import { normalizarRut, formatearRut } from '../lib/rut.js';
import { ETIQUETA_ESTADO } from '../lib/reglas.js';
import { leerPlanilla, validarFilas } from '../lib/planilla.js';

const colegioDe = (app, id) => app.d.colegios.find((c) => c.id === id);
const esAdmin = (app) => app.rol() === 'admin';

export function filtrar(app, lista) {
  const f = app.ui.filtros;
  const q = (f.q ?? '').trim().toLowerCase();
  return lista.filter((e) => {
    const st = app.estados.get(e.id);
    if (f.colegio && e.colegio_id !== f.colegio) return false;
    if (f.estado && st.estado !== f.estado) return false;
    if (f.cuenta === 'sin' && e.user_id) return false;
    if (q && !`${e.nombres} ${e.apellidos} ${e.rut} ${e.codigo}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function filtros(app, { conColegio }) {
  const f = app.ui.filtros;
  return `<div class="filters">
    <div class="field"><label for="f-q">Buscar</label><input class="inp" id="f-q" type="search" data-filtro="q" value="${esc(f.q ?? '')}" placeholder="Nombre, RUT o código"></div>
    ${conColegio ? `<div class="field"><label for="f-col">Colegio</label><select class="inp" id="f-col" data-filtro="colegio"><option value="">Todos</option>
      ${app.d.colegios.filter((c) => app.d.estudiantes.some((e) => e.colegio_id === c.id)).map((c) => `<option value="${c.id}" ${f.colegio === c.id ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('')}</select></div>` : ''}
    <div class="field"><label for="f-est">Estado</label><select class="inp" id="f-est" data-filtro="estado"><option value="">Todos</option>
      ${Object.entries(ETIQUETA_ESTADO).map(([k, l]) => `<option value="${k}" ${f.estado === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="field"><label for="f-cta">Cuenta</label><select class="inp" id="f-cta" data-filtro="cuenta"><option value="">Todas</option><option value="sin" ${f.cuenta === 'sin' ? 'selected' : ''}>Sin cuenta creada</option></select></div>
  </div>`;
}

export function tablaEstudiantes(app, lista, { conColegio }) {
  if (!lista.length) return `<p class="muted">No hay estudiantes que coincidan.</p>`;
  return `<div class="tw"><table>
    <thead><tr><th>Estudiante</th>${conColegio ? '<th>Colegio</th>' : ''}<th>Asistencia</th><th class="r">Válidas</th><th>Estado</th><th>Cuenta</th><th></th></tr></thead>
    <tbody>${lista.map((e) => {
      const st = app.estados.get(e.id);
      const reemp = e.reemplaza_a ? app.d.estudiantes.find((x) => x.id === e.reemplaza_a) : null;
      return `<tr class="${e.estado === 'baja' ? 'is-baja' : ''}">
        <td><span class="who">${esc(nombre(e))}</span><span class="sub mono">${esc(e.codigo ?? '')} · ${esc(formatearRut(e.rut))}${e.curso ? ' · ' + esc(e.curso) : ''}</span>
          ${reemp ? `<span class="sub">Reemplaza a ${esc(nombre(reemp))}</span>` : ''}</td>
        ${conColegio ? `<td class="small">${esc(colegioDe(app, e.colegio_id)?.nombre ?? '')}</td>` : ''}
        <td>${cadena(e, app.d.actividades, app.d.asistencias, app.hoy)}</td>
        <td class="r num"><b>${st.total}</b><span class="muted">/${app.d.programa.min_asistencias}</span></td>
        <td>${pill(st.estado)}<span class="sub">${esc(st.texto)}</span></td>
        <td class="small">${e.user_id ? 'Creada' : '<span class="tag">Pendiente</span>'}</td>
        <td class="r"><button class="btn sm" data-a="ver-estudiante" data-id="${e.id}">Gestionar</button></td>
      </tr>`;
    }).join('')}</tbody></table></div>
    <div class="legend"><span><i class="lk on"></i>Asistió</span><span><i class="lk off"></i>No asistió</span><span><i class="lk pend"></i>Por venir</span><span><i class="lk visita on"></i>Visita cívica</span></div>`;
}

export function bloqueEstudiantes(app, { titulo, conColegio }) {
  const lista = filtrar(app, app.d.estudiantes);
  const sinCuenta = app.d.estudiantes.filter((e) => !e.user_id && e.estado === 'activo');
  return `<section class="block">
    <div class="block-h"><h2>${titulo}</h2>
      <div class="btns">
        <button class="btn" data-a="nuevo-estudiante">Agregar estudiante</button>
        <button class="btn" data-a="cargar-planilla">Cargar planilla</button>
        ${sinCuenta.length ? `<button class="btn pri" data-a="crear-cuentas">Crear ${sinCuenta.length} ${sinCuenta.length === 1 ? 'cuenta pendiente' : 'cuentas pendientes'}</button>` : ''}
      </div></div>
    ${filtros(app, { conColegio })}
    <p class="small muted">${lista.length} de ${app.d.estudiantes.length} estudiantes</p>
    ${tablaEstudiantes(app, lista, { conColegio })}
  </section>`;
}

// ---------- formularios (modal) ----------

function selectColegio(app, sel) {
  return `<div class="field"><label for="m-col">Colegio</label><select class="inp" id="m-col" name="colegio_id" required>
    <option value="">Elige…</option>${app.d.colegios.map((c) => `<option value="${c.id}" ${sel === c.id ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('')}</select></div>`;
}

function formEstudiante(app, e = {}, { reemplazaA } = {}) {
  return `<form class="stack-form" data-a="guardar-estudiante">
    ${e.id ? `<input type="hidden" name="id" value="${e.id}">` : ''}
    ${reemplazaA ? `<input type="hidden" name="reemplaza_a" value="${reemplazaA.id}"><p class="flash info">Reemplazará a <b>${esc(nombre(reemplazaA))}</b>, que quedará de baja desde hoy.</p>` : ''}
    <div class="form-grid">
      <div class="field"><label for="m-rut">RUT</label><input class="inp" id="m-rut" name="rut" value="${esc(e.rut ? formatearRut(e.rut) : '')}" ${e.id ? 'readonly' : 'required autofocus'} placeholder="12.345.678-5"></div>
      <div class="field"><label for="m-nom">Nombres</label><input class="inp" id="m-nom" name="nombres" value="${esc(e.nombres ?? '')}" required ${e.id ? 'autofocus' : ''}></div>
      <div class="field"><label for="m-ape">Apellidos</label><input class="inp" id="m-ape" name="apellidos" value="${esc(e.apellidos ?? '')}" required></div>
      <div class="field"><label for="m-cur">Curso</label><input class="inp" id="m-cur" name="curso" value="${esc(e.curso ?? '')}" placeholder="2° medio"></div>
      <div class="field"><label for="m-cor">Correo (opcional)</label><input class="inp" id="m-cor" name="correo" type="email" value="${esc(e.correo ?? '')}"></div>
      ${esAdmin(app) && !reemplazaA ? selectColegio(app, e.colegio_id) : ''}
    </div>
    <label class="check"><input type="checkbox" name="consentimiento_apoderado" ${e.consentimiento_apoderado ? 'checked' : ''}> Tenemos la autorización firmada del apoderado/a</label>
    <div class="btns"><button class="btn pri" type="submit">${e.id ? 'Guardar cambios' : 'Agregar'}</button><button class="btn" type="button" data-a="cerrar-modal">Cancelar</button></div>
  </form>`;
}

function fichaEstudiante(app, e) {
  const st = app.estados.get(e.id);
  const asis = new Map(app.d.asistencias.filter((x) => x.estudiante_id === e.id).map((x) => [x.actividad_id, x]));
  const insc = new Set(app.d.inscripciones.filter((x) => x.estudiante_id === e.id).map((x) => x.actividad_id));
  const enc = app.d.avance.filter((x) => x.estudiante_id === e.id);
  return `<div class="stack-form">
    <div class="srow"><div><b>${esc(nombre(e))}</b><span class="sub mono">${esc(e.codigo ?? '')} · RUT ${esc(formatearRut(e.rut))}</span></div>${pill(st.estado)}</div>
    <p>${esc(st.texto)}. Tiene <b>${st.total}</b> de ${app.d.programa.min_asistencias} asistencias válidas (${st.sesiones} ${st.sesiones === 1 ? 'sesión' : 'sesiones'}, ${st.visitas} ${st.visitas === 1 ? 'visita' : 'visitas'}).</p>
    <div class="tw"><table><thead><tr><th>Actividad</th><th>Fecha</th><th>Registro</th></tr></thead><tbody>
      ${app.d.actividades.map((a) => {
        const x = asis.get(a.id);
        const r = x ? (x.presente ? 'Asistió' : 'Ausente') : a.fecha >= app.hoy ? (insc.has(a.id) ? 'Inscrito/a' : 'Por venir') : 'Sin registro';
        return `<tr><td>${esc(a.codigo)} · ${esc(a.nombre)}${a.cuenta_para_graduacion ? '' : ' <span class="tag">no cuenta</span>'}</td><td class="num">${fecha(a.fecha)}</td><td>${r}</td></tr>`;
      }).join('')}</tbody></table></div>
    <p class="small">Encuestas: ${enc.map((x) => `${x.tipo} ${x.enviada ? '✓ respondida' : '· pendiente'}`).join(' · ') || 'sin encuestas'}</p>
    <p class="small muted">Autorización del apoderado: ${e.consentimiento_apoderado ? 'sí' : 'no registrada'}${e.estado === 'baja' ? ` · Baja desde ${fecha(e.fecha_baja)}${e.motivo_baja ? ': ' + esc(e.motivo_baja) : ''}` : ''}</p>
    <div class="btns">
      <button class="btn" data-a="editar-estudiante" data-id="${e.id}">Editar datos</button>
      ${e.estado === 'activo' ? `<button class="btn" data-a="baja-estudiante" data-id="${e.id}">Dar de baja o reemplazar</button>` : `<button class="btn" data-a="reactivar-estudiante" data-id="${e.id}">Reactivar</button>`}
      ${e.user_id ? `<button class="btn" data-a="reiniciar-clave" data-id="${e.id}">Nueva clave temporal</button>` : `<button class="btn pri" data-a="crear-cuenta-una" data-id="${e.id}">Crear cuenta</button>`}
    </div>
  </div>`;
}

function tablaCredenciales(cuentas) {
  const nuevas = cuentas.filter((c) => c.clave);
  return `<div class="stack-form">
    <p class="flash info">Entrega a cada estudiante su RUT y su clave temporal. Al entrar por primera vez deberá crear una clave propia. <b>Estas claves no se vuelven a mostrar</b>: descárgalas o anótalas ahora.</p>
    <div class="tw"><table><thead><tr><th>Estudiante</th><th>RUT</th><th>Clave temporal</th><th>Estado</th></tr></thead><tbody>
    ${cuentas.map((c) => `<tr><td>${esc(c.nombre)}<span class="sub mono">${esc(c.codigo ?? '')}</span></td><td class="mono">${esc(formatearRut(c.rut))}</td><td class="mono"><b>${esc(c.clave ?? '—')}</b></td><td class="small">${esc(c.estado)}</td></tr>`).join('')}
    </tbody></table></div>
    <div class="btns">${nuevas.length ? `<button class="btn pri" data-a="descargar-credenciales">Descargar claves (CSV)</button>` : ''}<button class="btn" data-a="imprimir">Imprimir</button><button class="btn" data-a="cerrar-modal">Listo</button></div>
  </div>`;
}

let ultimaCarga = null;   // filas validadas de la planilla
let ultimasCuentas = [];  // para descargar

function vistaPlanilla(app) {
  const adm = esAdmin(app);
  if (!ultimaCarga) {
    return `<div class="stack-form">
      <p>Usa la <a href="plantillas/carga_estudiantes.xlsx" download>plantilla de carga (Excel)</a>: una fila por estudiante con RUT, nombres, apellidos y curso${adm ? ', y el RBD del colegio' : ''}. También acepta CSV.</p>
      <div class="field"><label for="m-arch">Planilla</label><input class="inp" id="m-arch" type="file" accept=".xlsx,.xls,.csv" data-cambio="leer-planilla" autofocus></div>
      <p class="small muted">Antes de guardar verás una revisión fila por fila: RUT válido, duplicados y datos faltantes.</p>
    </div>`;
  }
  const ok = ultimaCarga.filter((r) => !r.errores.length), mal = ultimaCarga.filter((r) => r.errores.length);
  return `<div class="stack-form">
    <p><b>${ok.length}</b> ${ok.length === 1 ? 'fila lista' : 'filas listas'} para cargar${mal.length ? ` · <b class="err-t">${mal.length} con problemas</b> (no se cargarán)` : ''}.</p>
    <div class="tw"><table><thead><tr><th>Fila</th><th>Estudiante</th><th>RUT</th>${adm ? '<th>Colegio</th>' : ''}<th>Revisión</th></tr></thead><tbody>
      ${ultimaCarga.map((r) => `<tr><td class="num">${r.fila}</td><td>${esc(r.datos.nombres)} ${esc(r.datos.apellidos)}<span class="sub">${esc(r.datos.curso ?? '')}</span></td>
        <td class="mono">${esc(r.datos.rut ? formatearRut(r.datos.rut) : '')}</td>${adm ? `<td class="small">${esc(colegioDe(app, r.datos.colegio_id)?.nombre ?? '')}</td>` : ''}
        <td>${r.errores.length ? `<span class="pill wrap st-no_alcanza">${esc(r.errores.join(' · '))}</span>` : '<span class="pill st-graduado">OK</span>'}</td></tr>`).join('')}
    </tbody></table></div>
    <div class="btns">${ok.length ? `<button class="btn pri" data-a="confirmar-planilla">Cargar ${ok.length} estudiantes</button>` : ''}<button class="btn" data-a="cargar-planilla">Elegir otro archivo</button></div>
  </div>`;
}

export const acciones = {
  'ver-estudiante': (app, d) => {
    const e = app.d.estudiantes.find((x) => x.id === d.id);
    app.modal({ titulo: 'Estudiante', html: fichaEstudiante(app, e) });
  },
  'nuevo-estudiante': (app) => app.modal({ titulo: 'Agregar estudiante', html: formEstudiante(app) }),
  'editar-estudiante': (app, d) => app.modal({ titulo: 'Editar estudiante', html: formEstudiante(app, app.d.estudiantes.find((x) => x.id === d.id)) }),
  'guardar-estudiante': async (app, f) => {
    const datos = {
      nombres: f.nombres.trim(), apellidos: f.apellidos.trim(), curso: f.curso?.trim() || null,
      correo: f.correo?.trim() || null, consentimiento_apoderado: f.consentimiento_apoderado === 'on',
    };
    if (f.id) {
      if (esAdmin(app) && f.colegio_id) datos.colegio_id = f.colegio_id;
      await app.api.actualizarEstudiante(f.id, datos);
      app.ui.modal = null; app.ui.flash = { tipo: 'ok', texto: 'Datos actualizados.' };
      return app.recargar();
    }
    const n = normalizarRut(f.rut);
    if (n.error) return app.flash('err', n.error);
    if (app.d.estudiantes.some((e) => e.rut === n.rut)) return app.flash('err', 'Ese RUT ya está inscrito este año.');
    const viejo = f.reemplaza_a ? app.d.estudiantes.find((x) => x.id === f.reemplaza_a) : null;
    const colegio_id = viejo ? viejo.colegio_id : esAdmin(app) ? f.colegio_id : app.sesion.perfil.colegio_id;
    if (!colegio_id) return app.flash('err', 'Elige el colegio.');
    const [nuevo] = await app.api.agregarEstudiantes([{ ...datos, rut: n.rut, colegio_id, programa_id: app.d.programa.id, reemplaza_a: viejo?.id ?? null }]);
    if (viejo) await app.api.actualizarEstudiante(viejo.id, { estado: 'baja', fecha_baja: app.hoy, motivo_baja: `Reemplazado por ${datos.nombres} ${datos.apellidos}` });
    app.ui.modal = null;
    app.ui.flash = { tipo: 'ok', texto: `${datos.nombres} quedó inscrito/a con el código ${nuevo.codigo}. Falta crear su cuenta.` };
    await app.recargar();
  },
  'baja-estudiante': (app, d) => {
    const e = app.d.estudiantes.find((x) => x.id === d.id);
    app.modal({ titulo: 'Dar de baja o reemplazar', html: `<div class="stack-form">
      <p>¿Qué pasa con <b>${esc(nombre(e))}</b>?</p>
      <div class="picks">
        <button class="pick" data-a="reemplazar" data-id="${e.id}"><b>Lo reemplaza otro estudiante</b><span class="small muted">Inscribes al nuevo y este queda de baja. Su asistencia previa se mantiene en el historial.</span></button>
        <button class="pick" data-a="solo-baja" data-id="${e.id}"><b>Solo dar de baja</b><span class="small muted">Deja el programa sin reemplazo.</span></button>
      </div>
      <div class="field"><label for="m-mot">Motivo (opcional)</label><input class="inp" id="m-mot" placeholder="Cambio de colegio, horario…"></div>
    </div>` });
  },
  'reemplazar': (app, d) => {
    const e = app.d.estudiantes.find((x) => x.id === d.id);
    app.modal({ titulo: 'Inscribir reemplazo', html: formEstudiante(app, {}, { reemplazaA: e }) });
  },
  'solo-baja': async (app, d) => {
    const motivo = document.getElementById('m-mot')?.value?.trim() || null;
    await app.api.actualizarEstudiante(d.id, { estado: 'baja', fecha_baja: app.hoy, motivo_baja: motivo });
    app.ui.modal = null; app.ui.flash = { tipo: 'ok', texto: 'Estudiante dado de baja.' };
    await app.recargar();
  },
  'reactivar-estudiante': async (app, d) => {
    await app.api.actualizarEstudiante(d.id, { estado: 'activo', fecha_baja: null, motivo_baja: null });
    app.ui.modal = null; app.ui.flash = { tipo: 'ok', texto: 'Estudiante reactivado.' };
    await app.recargar();
  },
  'crear-cuentas': async (app) => {
    const ids = app.d.estudiantes.filter((e) => !e.user_id && e.estado === 'activo').map((e) => e.id);
    ultimasCuentas = await app.api.crearCuentas(ids);
    await app.recargar();
    app.modal({ titulo: 'Cuentas creadas', html: tablaCredenciales(ultimasCuentas) });
  },
  'crear-cuenta-una': async (app, d) => {
    ultimasCuentas = await app.api.crearCuentas([d.id]);
    await app.recargar();
    app.modal({ titulo: 'Cuenta creada', html: tablaCredenciales(ultimasCuentas) });
  },
  'reiniciar-clave': async (app, d) => {
    const e = app.d.estudiantes.find((x) => x.id === d.id);
    const r = await app.api.reiniciarClave(d.id);
    ultimasCuentas = [{ ...r, rut: e.rut, estado: 'clave reiniciada' }];
    app.modal({ titulo: 'Nueva clave temporal', html: tablaCredenciales(ultimasCuentas) });
  },
  'descargar-credenciales': (app) => {
    descargarCSV(`claves_temporales_${app.hoy}.csv`, [['Código', 'Estudiante', 'RUT', 'Clave temporal'],
      ...ultimasCuentas.filter((c) => c.clave).map((c) => [c.codigo, c.nombre, formatearRut(c.rut), c.clave])]);
  },
  'imprimir': () => window.print(),
  'cargar-planilla': (app) => { ultimaCarga = null; app.modal({ titulo: 'Cargar planilla de estudiantes', html: vistaPlanilla(app) }); },
  'leer-planilla': async (app, d, el) => {
    const archivo = el.files?.[0];
    if (!archivo) return;
    const filas = await leerPlanilla(archivo);
    if (!filas.length) throw new Error('La planilla no tiene filas con estudiantes.');
    ultimaCarga = validarFilas(filas, { colegios: app.d.colegios, colegioFijo: esAdmin(app) ? null : app.sesion.perfil.colegio_id, existentes: app.d.estudiantes });
    app.modal({ titulo: 'Revisar planilla', html: vistaPlanilla(app) });
  },
  'confirmar-planilla': async (app) => {
    const filas = ultimaCarga.filter((r) => !r.errores.length).map((r) => ({ ...r.datos, programa_id: app.d.programa.id }));
    const creados = await app.api.agregarEstudiantes(filas);
    ultimaCarga = null; app.ui.modal = null;
    app.ui.flash = { tipo: 'ok', texto: `${creados.length === 1 ? 'Se cargó 1 estudiante' : `Se cargaron ${creados.length} estudiantes`}. Ahora puedes crear sus cuentas.` };
    await app.recargar();
  },
};

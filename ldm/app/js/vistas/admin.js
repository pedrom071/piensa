// Vista del equipo P!ensa: resumen, estudiantes, asistencia, visitas, calendario, colegios y encuestas.
import { esc, fecha, hora, nombre, pill, descargarCSV } from '../lib/ui.js';
import { formatearRut } from '../lib/rut.js';
import { ETIQUETA_ESTADO } from '../lib/reglas.js';
import { bloqueEstudiantes, acciones as accGestion } from './gestion.js';
import { bloqueVisitas, acciones as accVisitas } from './visitas.js';
import { calendario as calendarioLectura } from './profesor.js';

export const TABS = [
  ['resumen', 'Resumen'], ['estudiantes', 'Estudiantes'], ['asistencia', 'Asistencia'],
  ['visitas', 'Visitas cívicas'], ['calendario', 'Calendario y regla'], ['colegios', 'Colegios y profesores'], ['encuestas', 'Encuestas y datos'],
];

const activos = (app) => app.d.estudiantes.filter((e) => e.estado === 'activo');
function conteo(app, lista) {
  const c = { graduado: 0, en_camino: 0, no_alcanza: 0 };
  lista.forEach((e) => { const s = app.estados.get(e.id).estado; if (s in c) c[s]++; });
  return c;
}

// ---------- Resumen ----------
function resumen(app) {
  const act = activos(app), c = conteo(app, act), p = app.d.programa;
  const meta = p.meta_graduados;
  const total = Math.max(act.length, 1);
  const prox = app.d.actividades.find((a) => a.fecha >= app.hoy);
  const enc = app.d.encuestas.find((e) => e.tipo === 'entrada');
  const respEntrada = (cid) => {
    const l = act.filter((e) => !cid || e.colegio_id === cid);
    const n = l.filter((e) => app.d.avance.some((x) => x.estudiante_id === e.id && x.tipo === 'entrada' && x.enviada)).length;
    return l.length ? Math.round((n / l.length) * 100) : 0;
  };
  const colegios = app.d.colegios.filter((col) => act.some((e) => e.colegio_id === col.id));
  return `
  <div class="head"><div><p class="eyebrow">${esc(p.nombre)}</p><h1>Resumen del programa</h1>
    <p class="muted">${c.graduado} de ${act.length} estudiantes activos ya cumplen la regla de graduación${meta ? `; la meta es ${meta}` : ''}.</p></div>
    <button class="btn" data-a="exportar-estado">Descargar estado (CSV)</button></div>
  <div class="kpis">
    <div class="kpi"><span class="eyebrow">Activos</span><span class="v">${act.length}</span><span class="s">${app.d.estudiantes.length - act.length} de baja</span></div>
    <div class="kpi"><span class="eyebrow">Graduados</span><span class="v">${c.graduado}${meta ? `<small> / ${meta}</small>` : ''}</span><span class="s">Cumplen ${p.min_asistencias} asistencias</span></div>
    <div class="kpi"><span class="eyebrow">En camino</span><span class="v">${c.en_camino}</span><span class="s">Aún pueden graduarse</span></div>
    <div class="kpi"><span class="eyebrow">No alcanzan</span><span class="v">${c.no_alcanza}</span><span class="s">Ya no les da</span></div>
  </div>
  <section class="block">
    <div class="block-h"><h2>Proyección de graduación</h2><span class="small muted">Máximo posible: ${c.graduado + c.en_camino}</span></div>
    <div class="stack-wrap">
      ${meta ? `<span class="meta-lab" style="left:${Math.min(meta / total, 1) * 100}%">Meta ${meta}</span>` : ''}
      <div class="stack" role="img" aria-label="${c.graduado} graduados, ${c.en_camino} en camino, ${c.no_alcanza} no alcanzan">
        <span class="sg-graduado" style="width:${(c.graduado / total) * 100}%"></span>
        <span class="sg-borde" style="width:${(c.en_camino / total) * 100}%"></span>
        <span class="sg-noalcanza" style="width:${(c.no_alcanza / total) * 100}%"></span>
        ${meta ? `<span class="meta-line" style="left:${Math.min(meta / total, 1) * 100}%"></span>` : ''}
      </div>
    </div>
    <div class="legend"><span><i class="sw sg-graduado"></i>Graduados ${c.graduado}</span><span><i class="sw sg-borde"></i>En camino ${c.en_camino}</span><span><i class="sw sg-noalcanza"></i>No alcanzan ${c.no_alcanza}</span></div>
    ${prox ? `<p class="small">Próxima actividad: <b>${esc(prox.codigo)} · ${esc(prox.nombre)}</b>, ${fecha(prox.fecha, true)}${prox.lugar ? ' en ' + esc(prox.lugar) : ''}.</p>` : ''}
  </section>
  <section class="block">
    <div class="block-h"><h2>Por colegio</h2></div>
    <div class="tw"><table><thead><tr><th>Colegio</th><th class="r">Activos</th><th class="r">Graduados</th><th class="r">En camino</th><th class="r">No alcanzan</th><th class="r">Sin cuenta</th>${enc ? '<th class="r">Encuesta entrada</th>' : ''}</tr></thead>
    <tbody>${colegios.map((col) => {
      const l = act.filter((e) => e.colegio_id === col.id), k = conteo(app, l);
      return `<tr><td><span class="who">${esc(col.nombre)}</span><span class="sub">${esc(col.comuna ?? '')}</span></td><td class="r num">${l.length}</td>
        <td class="r num">${k.graduado}</td><td class="r num">${k.en_camino}</td><td class="r num">${k.no_alcanza}</td>
        <td class="r num">${l.filter((e) => !e.user_id).length}</td>${enc ? `<td class="r num">${respEntrada(col.id)}%</td>` : ''}</tr>`;
    }).join('')}</tbody></table></div>
  </section>`;
}

// ---------- Asistencia ----------
function asistencia(app) {
  const f = app.ui.filtros;
  const acts = app.d.actividades;
  const porDefecto = [...acts].reverse().find((a) => a.fecha <= app.hoy) ?? acts[0];
  const act = acts.find((a) => a.id === f.actividad) ?? porDefecto;
  if (!act) return `<section class="block"><p>No hay actividades en el calendario.</p></section>`;
  let lista = activos(app);
  if (act.tipo === 'visita') {
    const insc = new Set(app.d.inscripciones.filter((i) => i.actividad_id === act.id).map((i) => i.estudiante_id));
    if (f.soloInscritos !== 'no') lista = lista.filter((e) => insc.has(e.id));
  }
  if (f.colegioAsis) lista = lista.filter((e) => e.colegio_id === f.colegioAsis);
  const q = (f.qa ?? '').toLowerCase().trim();
  if (q) lista = lista.filter((e) => `${e.nombres} ${e.apellidos} ${e.rut}`.toLowerCase().includes(q));
  const reg = new Map(app.d.asistencias.filter((x) => x.actividad_id === act.id).map((x) => [x.estudiante_id, x.presente]));
  const presentes = lista.filter((e) => reg.get(e.id) === true).length;
  const col = (id) => app.d.colegios.find((c) => c.id === id)?.nombre ?? '';
  return `
  <div class="head"><div><h1>Asistencia</h1><p class="muted">Marca quién asistió. Cada cambio se guarda al instante.</p></div></div>
  <section class="block">
    <div class="filters">
      <div class="field"><label for="f-act">Actividad</label><select class="inp" id="f-act" data-filtro="actividad">
        ${acts.map((a) => `<option value="${a.id}" ${a.id === act.id ? 'selected' : ''}>${esc(a.codigo)} · ${esc(a.nombre)} · ${fecha(a.fecha)}</option>`).join('')}</select></div>
      <div class="field"><label for="f-ca">Colegio</label><select class="inp" id="f-ca" data-filtro="colegioAsis"><option value="">Todos</option>
        ${app.d.colegios.filter((c) => activos(app).some((e) => e.colegio_id === c.id)).map((c) => `<option value="${c.id}" ${f.colegioAsis === c.id ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('')}</select></div>
      ${act.tipo === 'visita' ? `<div class="field"><label for="f-si">Mostrar</label><select class="inp" id="f-si" data-filtro="soloInscritos"><option value="si">Solo inscritos</option><option value="no" ${f.soloInscritos === 'no' ? 'selected' : ''}>Todos los activos</option></select></div>` : ''}
      <div class="field"><label for="f-qa">Buscar</label><input class="inp" id="f-qa" type="search" data-filtro="qa" value="${esc(f.qa ?? '')}" placeholder="Nombre o RUT"></div>
    </div>
    <div class="block-h"><p class="small"><b>${presentes}</b> presentes de ${lista.length} en la lista${act.fecha > app.hoy ? ' · <span class="tag">actividad futura</span>' : ''}</p>
      ${lista.length ? `<div class="btns"><button class="btn sm" data-a="todos-presentes" data-act="${act.id}">Marcar a todos presentes</button></div>` : ''}</div>
    <div class="tw"><table><thead><tr><th>Estudiante</th><th>Colegio</th><th>Asistencia</th><th>Estado</th></tr></thead><tbody>
    ${lista.map((e) => {
      const v = reg.get(e.id);
      const b = (val, txt) => `<button class="seg ${v === val ? 'on' : ''}" data-a="marcar" data-act="${act.id}" data-est="${e.id}" data-v="${val}" aria-pressed="${v === val}">${txt}</button>`;
      return `<tr><td><span class="who">${esc(nombre(e))}</span><span class="sub mono">${esc(formatearRut(e.rut))}</span></td><td class="small">${esc(col(e.colegio_id))}</td>
        <td><span class="segs">${b(true, 'Presente')}${b(false, 'Ausente')}${v !== undefined ? `<button class="seg" data-a="marcar" data-act="${act.id}" data-est="${e.id}" data-v="null" title="Quitar registro">×</button>` : ''}</span></td>
        <td>${pill(app.estados.get(e.id).estado)}</td></tr>`;
    }).join('') || `<tr><td colspan="4" class="muted">${act.tipo === 'visita' ? 'No hay inscritos para esta visita con estos filtros.' : 'Sin estudiantes.'}</td></tr>`}
    </tbody></table></div>
  </section>`;
}

// ---------- Calendario y regla ----------
function calendario(app) {
  const p = app.d.programa;
  return `${calendarioLectura(app)}
  <section class="block">
    <div class="block-h"><h2>Editar actividades</h2><button class="btn" data-a="nueva-actividad">Agregar actividad</button></div>
    <div class="tw"><table><tbody>${app.d.actividades.map((a) => `<tr><td><span class="tag">${esc(a.codigo)}</span> ${esc(a.nombre)}</td><td class="num">${fecha(a.fecha)}</td>
      <td class="r"><button class="btn sm" data-a="editar-actividad" data-id="${a.id}">Editar</button></td></tr>`).join('')}</tbody></table></div>
  </section>
  <section class="block">
    <h2>Regla de graduación ${esc(p.anio)}</h2>
    <form class="form-grid" data-a="guardar-programa">
      <div class="field"><label for="p-min">Asistencias mínimas</label><input class="inp" id="p-min" name="min_asistencias" type="number" min="1" value="${p.min_asistencias}"></div>
      <div class="field"><label for="p-maxv">Visitas que cuentan (máx.)</label><input class="inp" id="p-maxv" name="max_visitas_que_cuentan" type="number" min="0" value="${p.max_visitas_que_cuentan}"></div>
      <div class="field"><label for="p-meta">Meta de graduados</label><input class="inp" id="p-meta" name="meta_graduados" type="number" min="0" value="${p.meta_graduados ?? ''}"></div>
      <div class="field"><label for="p-grad">Fecha de graduación</label><input class="inp" id="p-grad" name="fecha_graduacion" type="date" value="${p.fecha_graduacion ?? ''}"></div>
      <div class="btns" style="align-self:end"><button class="btn pri" type="submit">Guardar regla</button></div>
    </form>
  </section>`;
}

function formActividad(app, a = {}) {
  const T = { jornada: 'Jornada', sesion: 'Sesión', visita: 'Visita cívica' };
  return `<form class="stack-form" data-a="guardar-actividad">
    ${a.id ? `<input type="hidden" name="id" value="${a.id}">` : ''}
    <div class="form-grid">
      <div class="field"><label for="a-tipo">Tipo</label><select class="inp" id="a-tipo" name="tipo">${Object.entries(T).map(([k, l]) => `<option value="${k}" ${a.tipo === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label for="a-cod">Código</label><input class="inp" id="a-cod" name="codigo" value="${esc(a.codigo ?? '')}" placeholder="S1, V3…" required autofocus></div>
      <div class="field"><label for="a-fecha">Fecha</label><input class="inp" id="a-fecha" name="fecha" type="date" value="${a.fecha ?? ''}" required></div>
    </div>
    <div class="field"><label for="a-nom">Nombre</label><input class="inp" id="a-nom" name="nombre" value="${esc(a.nombre ?? '')}" required></div>
    <div class="form-grid">
      <div class="field"><label for="a-h1">Inicio</label><input class="inp" id="a-h1" name="hora_inicio" type="time" value="${hora(a.hora_inicio)}"></div>
      <div class="field"><label for="a-h2">Término</label><input class="inp" id="a-h2" name="hora_fin" type="time" value="${hora(a.hora_fin)}"></div>
      <div class="field"><label for="a-cpc">Cupos por colegio</label><input class="inp" id="a-cpc" name="cupos_por_colegio" type="number" min="0" value="${a.cupos_por_colegio ?? ''}"></div>
    </div>
    <div class="field"><label for="a-lug">Lugar</label><input class="inp" id="a-lug" name="lugar" value="${esc(a.lugar ?? '')}"></div>
    <label class="check"><input type="checkbox" name="cuenta_para_graduacion" ${a.cuenta_para_graduacion !== false ? 'checked' : ''}> Cuenta para la graduación</label>
    <div class="btns"><button class="btn pri" type="submit">Guardar</button><button class="btn" type="button" data-a="cerrar-modal">Cancelar</button>
      ${a.id ? `<button class="btn peligro" type="button" data-a="borrar-actividad" data-id="${a.id}">Eliminar</button>` : ''}</div>
  </form>`;
}

// ---------- Colegios y profesores ----------
function colegios(app) {
  const pc = app.d.programaColegios;
  const profe = (cid) => {
    const r = pc.find((x) => x.colegio_id === cid);
    return app.d.profesores.find((p) => p.id === r?.profesor_id) ?? app.d.profesores.find((p) => p.rol === 'profesor' && p.colegio_id === cid);
  };
  return `<div class="head"><div><h1>Colegios y profesores</h1><p class="muted">Cada colegio participante tiene un profesor/a a cargo, con cuenta propia para inscribir y seguir a sus estudiantes.</p></div>
    <div class="btns"><button class="btn" data-a="nuevo-colegio">Agregar colegio</button><button class="btn pri" data-a="nuevo-profesor">Crear cuenta de profesor</button></div></div>
  <section class="block"><div class="tw"><table><thead><tr><th>Colegio</th><th>RBD</th><th>Profesor/a</th><th class="r">Estudiantes</th><th></th></tr></thead><tbody>
    ${app.d.colegios.map((c) => {
      const p = profe(c.id);
      const n = app.d.estudiantes.filter((e) => e.colegio_id === c.id && e.estado === 'activo').length;
      return `<tr><td><span class="who">${esc(c.nombre)}</span><span class="sub">${esc([c.comuna, c.dependencia].filter(Boolean).join(' · '))}</span></td><td class="mono">${esc(c.rbd ?? '')}</td>
        <td>${p ? `${esc(p.nombre)}<span class="sub">${esc(p.correo ?? '')}</span>` : '<span class="tag">Sin profesor</span>'}</td><td class="r num">${n}</td>
        <td class="r"><button class="btn sm" data-a="editar-colegio" data-id="${c.id}">Editar</button></td></tr>`;
    }).join('')}</tbody></table></div></section>`;
}

function formColegio(c = {}) {
  return `<form class="stack-form" data-a="guardar-colegio">${c.id ? `<input type="hidden" name="id" value="${c.id}">` : ''}
    <div class="form-grid">
      <div class="field"><label for="c-nom">Nombre</label><input class="inp" id="c-nom" name="nombre" value="${esc(c.nombre ?? '')}" required autofocus></div>
      <div class="field"><label for="c-rbd">RBD</label><input class="inp" id="c-rbd" name="rbd" value="${esc(c.rbd ?? '')}" inputmode="numeric"></div>
      <div class="field"><label for="c-com">Comuna</label><input class="inp" id="c-com" name="comuna" value="${esc(c.comuna ?? '')}"></div>
    </div>
    <div class="field"><label for="c-dep">Dependencia</label><input class="inp" id="c-dep" name="dependencia" value="${esc(c.dependencia ?? '')}" placeholder="SLEP, municipal, particular subvencionado…"></div>
    <div class="btns"><button class="btn pri" type="submit">Guardar</button><button class="btn" type="button" data-a="cerrar-modal">Cancelar</button></div></form>`;
}

function formProfesor(app) {
  return `<form class="stack-form" data-a="guardar-profesor">
    <div class="form-grid">
      <div class="field"><label for="pr-nom">Nombre completo</label><input class="inp" id="pr-nom" name="nombre" required autofocus></div>
      <div class="field"><label for="pr-cor">Correo</label><input class="inp" id="pr-cor" name="correo" type="email" required></div>
      <div class="field"><label for="pr-col">Colegio</label><select class="inp" id="pr-col" name="colegio_id" required><option value="">Elige…</option>
        ${app.d.colegios.map((c) => `<option value="${c.id}">${esc(c.nombre)}</option>`).join('')}</select></div>
    </div>
    <p class="small muted">Se crea con una clave temporal que verás en la siguiente pantalla. Al entrar, el profesor/a deberá cambiarla.</p>
    <div class="btns"><button class="btn pri" type="submit">Crear cuenta</button><button class="btn" type="button" data-a="cerrar-modal">Cancelar</button></div></form>`;
}

// ---------- Encuestas y datos ----------
function encuestas(app) {
  const act = activos(app);
  return `<div class="head"><div><h1>Encuestas y datos</h1><p class="muted">Abre cada encuesta cuando corresponda aplicarla. Las respuestas se descargan con el código del estudiante para cruzarlas en R, Python o Stata.</p></div></div>
  ${app.d.encuestas.map((en) => {
    const n = act.filter((e) => app.d.avance.some((x) => x.estudiante_id === e.id && x.tipo === en.tipo && x.enviada)).length;
    const preguntas = (en.preguntas?.secciones ?? []).reduce((s, x) => s + x.items.length, 0);
    return `<section class="block">
      <div class="block-h"><div><h2>${esc(en.titulo)}</h2><p class="small muted">${preguntas} preguntas · ${n} de ${act.length} estudiantes activos respondieron</p></div>
        <span class="pill ${en.abierta ? 'st-graduado' : 'st-baja'}">${en.abierta ? 'Abierta' : 'Cerrada'}</span></div>
      <div class="btns">
        <button class="btn ${en.abierta ? '' : 'pri'}" data-a="abrir-encuesta" data-id="${en.id}" data-abrir="${!en.abierta}">${en.abierta ? 'Cerrar encuesta' : 'Abrir encuesta'}</button>
        <button class="btn" data-a="descargar-respuestas" data-id="${en.id}">Descargar respuestas (CSV)</button>
      </div></section>`;
  }).join('')}
  <section class="block"><h2>Datos del programa</h2>
    <p class="small">Descarga el estado de cada estudiante (asistencia, total válido y estado) para analizarlo o enviarlo a los colegios.</p>
    <div class="btns"><button class="btn" data-a="exportar-estado">Estado por estudiante (CSV)</button><button class="btn" data-a="exportar-asistencia">Asistencia detallada (CSV)</button></div>
  </section>`;
}

export function vista(app) {
  switch (app.ui.tab) {
    case 'estudiantes': return `<div class="head"><div><h1>Estudiantes</h1><p class="muted">Todos los estudiantes inscritos en ${esc(app.d.programa.anio)}, con su avance hacia la graduación.</p></div></div>${bloqueEstudiantes(app, { titulo: 'Inscritos', conColegio: true })}`;
    case 'asistencia': return asistencia(app);
    case 'visitas': return bloqueVisitas(app);
    case 'calendario': return calendario(app);
    case 'colegios': return colegios(app);
    case 'encuestas': return encuestas(app);
    default: return resumen(app);
  }
}

const numOrNull = (v) => (v === '' || v == null ? null : Number(v));

export const acciones = {
  ...accGestion, ...accVisitas,
  'marcar': async (app, d) => {
    const v = d.v === 'null' ? null : d.v === 'true';
    await app.api.marcarAsistencia(d.act, d.est, v);
    app.d.asistencias = app.d.asistencias.filter((x) => !(x.actividad_id === d.act && x.estudiante_id === d.est));
    if (v !== null) app.d.asistencias.push({ actividad_id: d.act, estudiante_id: d.est, presente: v });
    app.recalcular(); app.render();
  },
  'todos-presentes': async (app, d) => {
    const ids = [...document.querySelectorAll(`[data-a="marcar"][data-act="${d.act}"][data-v="true"]`)].map((b) => b.dataset.est);
    for (const id of ids) {
      await app.api.marcarAsistencia(d.act, id, true);
      app.d.asistencias = app.d.asistencias.filter((x) => !(x.actividad_id === d.act && x.estudiante_id === id));
      app.d.asistencias.push({ actividad_id: d.act, estudiante_id: id, presente: true });
    }
    app.recalcular(); app.flash('ok', `${ids.length} estudiantes marcados presentes.`);
  },
  'nueva-actividad': (app) => app.modal({ titulo: 'Agregar actividad', html: formActividad(app, { tipo: 'visita', cuenta_para_graduacion: true }) }),
  'editar-actividad': (app, d) => app.modal({ titulo: 'Editar actividad', html: formActividad(app, app.d.actividades.find((a) => a.id === d.id)) }),
  'guardar-actividad': async (app, f) => {
    await app.api.guardarActividad({
      ...(f.id ? { id: f.id } : {}), programa_id: app.d.programa.id, tipo: f.tipo, codigo: f.codigo.trim().toUpperCase(), nombre: f.nombre.trim(),
      fecha: f.fecha, hora_inicio: f.hora_inicio || null, hora_fin: f.hora_fin || null, lugar: f.lugar?.trim() || null,
      cupos_por_colegio: numOrNull(f.cupos_por_colegio), cuenta_para_graduacion: f.cuenta_para_graduacion === 'on',
    });
    app.ui.modal = null; app.ui.flash = { tipo: 'ok', texto: 'Calendario actualizado.' };
    await app.recargar();
  },
  'borrar-actividad': async (app, d) => {
    const n = app.d.asistencias.filter((x) => x.actividad_id === d.id).length;
    if (!confirm(n ? `Esta actividad tiene ${n} registros de asistencia que también se borrarán. ¿Eliminar?` : '¿Eliminar esta actividad?')) return;
    await app.api.borrarActividad(d.id);
    app.ui.modal = null; app.ui.flash = { tipo: 'ok', texto: 'Actividad eliminada.' };
    await app.recargar();
  },
  'guardar-programa': async (app, f) => {
    await app.api.guardarPrograma(app.d.programa.id, {
      min_asistencias: Number(f.min_asistencias), max_visitas_que_cuentan: Number(f.max_visitas_que_cuentan),
      meta_graduados: numOrNull(f.meta_graduados), fecha_graduacion: f.fecha_graduacion || null,
    });
    app.ui.flash = { tipo: 'ok', texto: 'Regla de graduación guardada. Los estados se recalcularon.' };
    await app.recargar();
  },
  'nuevo-colegio': (app) => app.modal({ titulo: 'Agregar colegio', html: formColegio() }),
  'editar-colegio': (app, d) => app.modal({ titulo: 'Editar colegio', html: formColegio(app.d.colegios.find((c) => c.id === d.id)) }),
  'guardar-colegio': async (app, f) => {
    const c = await app.api.guardarColegio({ ...(f.id ? { id: f.id } : {}), nombre: f.nombre.trim(), rbd: f.rbd.replace(/\D/g, '') || null, comuna: f.comuna?.trim() || null, dependencia: f.dependencia?.trim() || null });
    if (!f.id) await app.api.asignarColegio(app.d.programa.id, c.id, null);
    app.ui.modal = null; app.ui.flash = { tipo: 'ok', texto: 'Colegio guardado.' };
    await app.recargar();
  },
  'nuevo-profesor': (app) => app.modal({ titulo: 'Crear cuenta de profesor', html: formProfesor(app) }),
  'guardar-profesor': async (app, f) => {
    const r = await app.api.crearProfesor({ correo: f.correo, nombre: f.nombre.trim(), colegio_id: f.colegio_id });
    await app.recargar();
    const p = app.d.profesores.find((x) => x.correo === r.correo);
    if (p) await app.api.asignarColegio(app.d.programa.id, f.colegio_id, p.id);
    await app.recargar();
    app.modal({ titulo: 'Cuenta creada', html: `<div class="stack-form"><p>Envía estos datos al profesor/a. Deberá cambiar la clave al entrar.</p>
      <div class="cred-box"><div><span class="eyebrow">Correo</span><b class="mono">${esc(r.correo)}</b></div><div><span class="eyebrow">Clave temporal</span><b class="mono">${esc(r.clave)}</b></div></div>
      <p class="small muted">La clave no se vuelve a mostrar.</p><div class="btns"><button class="btn pri" data-a="cerrar-modal">Listo</button></div></div>` });
  },
  'abrir-encuesta': async (app, d) => {
    await app.api.abrirEncuesta(d.id, d.abrir === 'true');
    app.ui.flash = { tipo: 'ok', texto: d.abrir === 'true' ? 'Encuesta abierta: los estudiantes ya pueden responderla.' : 'Encuesta cerrada.' };
    await app.recargar();
  },
  'descargar-respuestas': async (app, d) => {
    const en = app.d.encuestas.find((x) => x.id === d.id);
    const items = (en.preguntas?.secciones ?? []).flatMap((s) => s.items.map((it) => it.id));
    const resp = await app.api.respuestasEncuesta(d.id);
    const est = new Map(app.d.estudiantes.map((e) => [e.id, e]));
    const rbd = (cid) => app.d.colegios.find((c) => c.id === cid)?.rbd ?? '';
    descargarCSV(`respuestas_${en.tipo}_${app.d.programa.anio}.csv`, [
      ['codigo', 'rbd', 'curso', 'enviada_en', ...items],
      ...resp.map((r) => { const e = est.get(r.estudiante_id) ?? {}; return [e.codigo, rbd(e.colegio_id), e.curso, r.enviada_en, ...items.map((i) => r.respuestas[i] ?? '')]; }),
    ]);
  },
  'exportar-estado': (app) => {
    const col = (cid) => app.d.colegios.find((c) => c.id === cid) ?? {};
    descargarCSV(`estado_graduacion_${app.d.programa.anio}_${app.hoy}.csv`, [
      ['codigo', 'rut', 'nombres', 'apellidos', 'curso', 'colegio', 'rbd', 'sesiones', 'visitas', 'total_valido', 'estado', 'detalle'],
      ...app.d.estudiantes.map((e) => { const s = app.estados.get(e.id), c = col(e.colegio_id); return [e.codigo, formatearRut(e.rut), e.nombres, e.apellidos, e.curso, c.nombre, c.rbd, s.sesiones, s.visitas, s.total, ETIQUETA_ESTADO[s.estado], s.texto]; }),
    ]);
  },
  'exportar-asistencia': (app) => {
    const acts = app.d.actividades;
    const reg = new Map(app.d.asistencias.map((x) => [x.actividad_id + '|' + x.estudiante_id, x.presente]));
    descargarCSV(`asistencia_${app.d.programa.anio}_${app.hoy}.csv`, [
      ['codigo', 'nombres', 'apellidos', 'rbd', ...acts.map((a) => a.codigo)],
      ...app.d.estudiantes.map((e) => [e.codigo, e.nombres, e.apellidos, app.d.colegios.find((c) => c.id === e.colegio_id)?.rbd, ...acts.map((a) => { const v = reg.get(a.id + '|' + e.id); return v === undefined ? '' : v ? 1 : 0; })]),
    ]);
  },
};

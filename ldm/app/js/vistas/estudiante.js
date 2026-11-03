// Vista del estudiante: su avance hacia la graduación y sus encuestas.
import { esc, fecha, hora, cadena, pill } from '../lib/ui.js';
import { formatearRut } from '../lib/rut.js';

export const TABS = [['inicio', 'Mi avance'], ['encuesta', 'Encuestas']];

const yo = (app) => app.d.estudiantes[0];

function inicio(app) {
  const e = yo(app), st = app.estados.get(e.id), p = app.d.programa;
  const colegio = app.d.colegios.find((c) => c.id === e.colegio_id);
  const proximas = app.d.actividades.filter((a) => a.fecha >= app.hoy).slice(0, 4);
  const insc = new Set(app.d.inscripciones.map((i) => i.actividad_id));
  const pendiente = app.d.encuestas.find((en) => en.abierta && !app.d.respuestasPropias.some((r) => r.encuesta_id === en.id));
  const mensaje = {
    graduado: '¡Ya cumples los requisitos para graduarte! Sigue participando hasta el final.',
    en_camino: `Te ${st.faltan === 1 ? 'falta' : 'faltan'} ${st.faltan} ${st.faltan === 1 ? 'asistencia' : 'asistencias'} para graduarte.`,
    no_alcanza: 'Con las actividades que quedan ya no alcanzas la asistencia para graduarte. Conversa con tu profesor/a.',
    baja: 'Ya no participas en el programa este año.',
  }[st.estado];
  return `
  <section class="cred">
    <span class="eyebrow">${esc(p.nombre)}</span>
    <h1>${esc(e.nombres)}</h1>
    <div class="cred-code"><span>${esc(e.codigo ?? '')}</span><span>${esc(colegio?.nombre ?? '')}</span></div>
    <div class="cred-motif" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  </section>
  ${pendiente ? `<div class="flash info"><span>Tienes pendiente la <b>${esc(pendiente.titulo)}</b>.</span><button class="btn sm pri" data-a="tab" data-tab="encuesta">Responder</button></div>` : ''}
  <section class="block">
    <div class="block-h"><h2>Tu avance</h2>${pill(st.estado)}</div>
    <div class="avance"><span class="big num">${st.total}</span><p><span class="small muted">${st.total === 1 ? 'asistencia válida' : 'asistencias válidas'} de ${p.min_asistencias} requeridas</span><br>${esc(mensaje)}</p></div>
    ${cadena(e, app.d.actividades, app.d.asistencias, app.hoy, true)}
    <div class="legend"><span><i class="lk on"></i>Asististe</span><span><i class="lk off"></i>No asististe</span><span><i class="lk pend"></i>Por venir</span><span><i class="lk visita on"></i>Visita cívica</span></div>
    <p class="small muted">Para graduarte necesitas ${p.min_asistencias} asistencias entre las sesiones${p.max_visitas_que_cuentan ? ` y las visitas cívicas (cuenta como máximo ${p.max_visitas_que_cuentan} visita)` : ''}.</p>
  </section>
  <section class="block">
    <h2>Próximas actividades</h2>
    ${proximas.length ? proximas.map((a) => `<div class="srow"><div><b>${esc(a.nombre)}</b><span class="sub">${fecha(a.fecha, true)}${a.hora_inicio ? ' · ' + hora(a.hora_inicio) + ' h' : ''}${a.lugar ? ' · ' + esc(a.lugar) : ''}</span></div>
      ${a.tipo === 'visita' ? (insc.has(a.id) ? '<span class="tag acc">Estás inscrito/a</span>' : '<span class="tag">Inscripción con tu profesor/a</span>') : ''}</div>`).join('') : '<p class="muted">No quedan actividades en el calendario.</p>'}
  </section>
  <p class="small muted">RUT ${esc(formatearRut(e.rut))}. Si ves un error en tu asistencia, avísale a tu profesor/a.</p>`;
}

let borrador = {}, faltantes = new Set();

function encuesta(app) {
  const e = yo(app);
  const abiertas = app.d.encuestas.filter((en) => en.abierta);
  const lista = app.d.encuestas.map((en) => {
    const r = app.d.respuestasPropias.find((x) => x.encuesta_id === en.id);
    return `<div class="srow"><div><b>${esc(en.titulo)}</b><span class="sub">${r ? 'Respondida el ' + fecha(r.enviada_en.slice(0, 10)) : en.abierta ? 'Disponible' : 'Aún no está disponible'}</span></div>
      ${en.abierta ? `<button class="btn sm ${r ? '' : 'pri'}" data-a="abrir-form" data-id="${en.id}">${r ? 'Revisar mis respuestas' : 'Responder'}</button>` : ''}</div>`;
  }).join('');
  const en = abiertas.find((x) => x.id === app.ui.encuesta);
  if (!en) return `<div class="head"><h1>Encuestas</h1></div><section class="block">${lista || '<p class="muted">No hay encuestas.</p>'}</section>`;
  const q = en.preguntas;
  const prev = app.d.respuestasPropias.find((x) => x.encuesta_id === en.id)?.respuestas ?? {};
  const val = (id) => (id in borrador ? borrador[id] : prev[id]);
  const items = q.secciones.flatMap((s) => s.items.map((it) => ({ ...it, escala: s.escala })));
  const obligatorios = items.filter((it) => it.escala !== 'texto');
  const listos = obligatorios.filter((it) => val(it.id) !== undefined && val(it.id) !== '').length;
  return `<div class="head"><div><p class="eyebrow">${esc(e.nombres)}</p><h1>${esc(en.titulo)}</h1>
    <p class="muted">No hay respuestas correctas ni incorrectas. Tus respuestas se usan para evaluar el programa y no las ve tu colegio.</p></div></div>
  <form class="stack-form" data-a="enviar-encuesta" data-id="${en.id}">
    ${q.secciones.map((s) => `<section class="block sv-sec"><h3>${esc(s.texto)}</h3>
      ${s.items.map((it) => s.escala === 'texto'
        ? `<div class="q"><label for="t-${it.id}" class="sr-only">${esc(s.texto)}</label><textarea class="inp txt" id="t-${it.id}" name="${it.id}" data-cambio="resp" data-item="${it.id}" rows="3" maxlength="1000" placeholder="Escribe tu respuesta (opcional)">${esc(val(it.id) ?? '')}</textarea></div>`
        : `<fieldset class="q ${faltantes.has(it.id) ? 'missing' : ''}">${it.texto ? `<legend>${esc(it.texto)}</legend>` : `<legend class="sr-only">${esc(s.texto)}</legend>`}
          <div class="opts">${q.escalas[s.escala].map(([v, l]) => `<label><input type="radio" name="${it.id}" value="${esc(JSON.stringify(v))}" data-cambio="resp" data-item="${it.id}" ${JSON.stringify(val(it.id)) === JSON.stringify(v) ? 'checked' : ''}><span>${esc(l)}</span></label>`).join('')}</div>
        </fieldset>`).join('')}
    </section>`).join('')}
    <div class="sticky-progress"><span class="small"><b>${listos}</b> de ${obligatorios.length} respondidas</span>
      <div class="btns"><button class="btn" type="button" data-a="cerrar-form">Volver</button><button class="btn pri" type="submit">Enviar respuestas</button></div></div>
  </form>`;
}

export function vista(app) {
  return app.ui.tab === 'encuesta' ? encuesta(app) : inicio(app);
}

export const acciones = {
  'abrir-form': (app, d) => { app.ui.encuesta = d.id; borrador = {}; faltantes = new Set(); app.render(); window.scrollTo(0, 0); },
  'cerrar-form': (app) => { app.ui.encuesta = null; app.render(); },
  'resp': (app, d, el) => {
    borrador[d.item] = el.type === 'radio' ? JSON.parse(el.value) : el.value;
    faltantes.delete(d.item);
    el.closest('fieldset')?.classList.remove('missing');
    const prog = document.querySelector('.sticky-progress b');
    if (prog) prog.textContent = String(document.querySelectorAll('.opts input:checked').length);
  },
  'enviar-encuesta': async (app, f, form) => {
    const en = app.d.encuestas.find((x) => x.id === form.dataset.id);
    const prev = app.d.respuestasPropias.find((x) => x.encuesta_id === en.id)?.respuestas ?? {};
    const resp = { ...prev, ...borrador };
    const oblig = en.preguntas.secciones.filter((s) => s.escala !== 'texto').flatMap((s) => s.items.map((it) => it.id));
    faltantes = new Set(oblig.filter((id) => resp[id] === undefined));
    if (faltantes.size) {
      app.flash('err', `Te ${faltantes.size === 1 ? 'falta 1 pregunta' : `faltan ${faltantes.size} preguntas`} por responder (marcadas en rojo).`);
      document.querySelector('.q.missing')?.scrollIntoView({ block: 'center' });
      return;
    }
    for (const k of Object.keys(resp)) if (resp[k] === '') delete resp[k];
    await app.api.responderEncuesta(en.id, yo(app).id, resp);
    borrador = {}; app.ui.encuesta = null;
    app.ui.flash = { tipo: 'ok', texto: '¡Gracias! Tus respuestas quedaron guardadas.' };
    await app.recargar();
  },
};

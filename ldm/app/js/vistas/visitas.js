// Inscripción a visitas cívicas (profesor para su colegio; admin para cualquiera).
import { esc, fecha, hora, nombre, pill } from '../lib/ui.js';

export function bloqueVisitas(app) {
  const visitas = app.d.actividades.filter((a) => a.tipo === 'visita' && a.fecha >= app.hoy);
  if (!visitas.length) return `<section class="block"><h2>Visitas cívicas</h2><p class="muted">No hay visitas cívicas programadas por ahora.</p></section>`;
  const esAdmin = app.rol() === 'admin';
  const colegio = esAdmin ? app.ui.filtros.colegioVisita || app.d.colegios.find((c) => app.d.estudiantes.some((e) => e.colegio_id === c.id))?.id : app.sesion.perfil.colegio_id;
  const activos = app.d.estudiantes.filter((e) => e.estado === 'activo' && e.colegio_id === colegio);
  const maxV = app.d.programa.max_visitas_que_cuentan;
  return `
  <div class="head"><div><h1>Visitas cívicas</h1>
    <p class="muted">Cada visita cuenta como una asistencia para la graduación (máximo ${maxV}). Marca quiénes irán; destacamos a quienes la necesitan para graduarse.</p></div>
    ${esAdmin ? `<div class="field"><label for="f-cv">Colegio</label><select class="inp" id="f-cv" data-filtro="colegioVisita">
      ${app.d.colegios.filter((c) => app.d.estudiantes.some((e) => e.colegio_id === c.id)).map((c) => `<option value="${c.id}" ${c.id === colegio ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('')}</select></div>` : ''}
  </div>
  ${visitas.map((v) => {
    const insc = new Set(app.d.inscripciones.filter((i) => i.actividad_id === v.id).map((i) => i.estudiante_id));
    const delColegio = activos.filter((e) => insc.has(e.id)).length;
    const lleno = v.cupos_por_colegio && delColegio >= v.cupos_por_colegio;
    return `<section class="block">
      <div class="block-h"><div><h2>${esc(v.nombre)}</h2><p class="small muted">${fecha(v.fecha, true)}${v.hora_inicio ? ' · ' + hora(v.hora_inicio) + ' h' : ''}${v.lugar ? ' · ' + esc(v.lugar) : ''}</p></div>
        <span class="tag ${lleno ? '' : 'acc'}">${delColegio}${v.cupos_por_colegio ? ' de ' + v.cupos_por_colegio : ''} inscritos de tu colegio</span></div>
      <div class="checks">${activos.map((e) => {
        const st = app.estados.get(e.id);
        const laNecesita = st.estado === 'en_camino' && Math.min(st.visitas, maxV) < maxV && st.faltan > st.sesRest;
        const on = insc.has(e.id);
        return `<label class="checkrow ${laNecesita ? 'necesita' : ''}">
          <input type="checkbox" data-cambio="inscribir" data-act="${v.id}" data-est="${e.id}" ${on ? 'checked' : ''} ${!on && lleno ? 'disabled' : ''}>
          <span><b>${esc(nombre(e))}</b><span class="sub">${st.total}/${app.d.programa.min_asistencias} asistencias${laNecesita ? ' · la necesita para graduarse' : ''}</span></span>
          ${pill(st.estado)}</label>`;
      }).join('') || '<p class="muted">No hay estudiantes activos.</p>'}</div>
      ${lleno ? `<p class="small muted">Se completaron los cupos de tu colegio para esta visita.</p>` : ''}
    </section>`;
  }).join('')}`;
}

export const acciones = {
  'inscribir': async (app, d) => {
    await app.api.inscribir(d.act, d.est, d.valor);
    const i = app.d.inscripciones.findIndex((x) => x.actividad_id === d.act && x.estudiante_id === d.est);
    if (d.valor && i < 0) app.d.inscripciones.push({ actividad_id: d.act, estudiante_id: d.est });
    if (!d.valor && i >= 0) app.d.inscripciones.splice(i, 1);
    app.recalcular(); app.render();
  },
};

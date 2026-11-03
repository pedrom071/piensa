// Vista de profesor/a: sus estudiantes, inscripción a visitas y calendario.
import { esc, fecha, hora } from '../lib/ui.js';
import { bloqueEstudiantes, acciones as accGestion } from './gestion.js';
import { bloqueVisitas, acciones as accVisitas } from './visitas.js';

export const TABS = [['estudiantes', 'Mis estudiantes'], ['visitas', 'Visitas cívicas'], ['calendario', 'Calendario']];

export function resumenColegio(app) {
  const ests = app.d.estudiantes.filter((e) => e.estado === 'activo');
  const c = { graduado: 0, en_camino: 0, no_alcanza: 0 };
  ests.forEach((e) => { c[app.estados.get(e.id).estado]++; });
  return `<div class="kpis">
    <div class="kpi"><span class="eyebrow">Activos</span><span class="v">${ests.length}</span></div>
    <div class="kpi"><span class="eyebrow">Graduados</span><span class="v">${c.graduado}</span></div>
    <div class="kpi"><span class="eyebrow">En camino</span><span class="v">${c.en_camino}</span></div>
    <div class="kpi"><span class="eyebrow">No alcanzan</span><span class="v">${c.no_alcanza}</span></div>
  </div>`;
}

export function calendario(app) {
  return `<div class="head"><h1>Calendario ${esc(app.d.programa.anio)}</h1></div>
  <section class="block"><div class="tw"><table>
    <thead><tr><th>Fecha</th><th>Actividad</th><th>Lugar</th><th>Cuenta para graduarse</th></tr></thead>
    <tbody>${app.d.actividades.map((a) => `<tr class="${a.fecha < app.hoy ? 'pasada' : ''}"><td class="num">${fecha(a.fecha, true)}${a.hora_inicio ? `<span class="sub">${hora(a.hora_inicio)}–${hora(a.hora_fin)}</span>` : ''}</td>
      <td><span class="tag">${esc(a.codigo)}</span> ${esc(a.nombre)}</td><td class="small">${esc(a.lugar ?? '')}</td>
      <td class="small">${a.cuenta_para_graduacion ? (a.tipo === 'visita' ? 'Sí (máx. ' + app.d.programa.max_visitas_que_cuentan + ' visita)' : 'Sí') : 'No'}</td></tr>`).join('')}</tbody>
  </table></div>
  <p class="small muted">Regla de graduación: ${app.d.programa.min_asistencias} asistencias, contando como máximo ${app.d.programa.max_visitas_que_cuentan} visita cívica.${app.d.programa.fecha_graduacion ? ' Graduación: ' + fecha(app.d.programa.fecha_graduacion, true) + '.' : ''}</p></section>`;
}

export function vista(app) {
  const colegio = app.d.colegios.find((c) => c.id === app.sesion.perfil.colegio_id);
  switch (app.ui.tab) {
    case 'visitas': return bloqueVisitas(app);
    case 'calendario': return calendario(app);
    default: return `<div class="head"><div><p class="eyebrow">${esc(colegio?.nombre ?? '')}</p><h1>Mis estudiantes</h1>
      <p class="muted">Inscribe a tus estudiantes, crea sus cuentas y revisa cuánto le falta a cada uno para graduarse.</p></div></div>
      ${resumenColegio(app)}
      ${bloqueEstudiantes(app, { titulo: 'Estudiantes inscritos', conColegio: false })}`;
  }
}

export const acciones = { ...accGestion, ...accVisitas };

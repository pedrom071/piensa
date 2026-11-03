// Regla de graduación. Debe calzar con la vista estado_graduacion de supabase/schema.sql.
//
// total válido = sesiones (y jornada, si cuenta) + visitas (con tope max_visitas_que_cuentan)
// graduado     total válido >= min_asistencias
// en_camino    aún puede llegar con las sesiones y visitas que quedan
// no_alcanza   ni asistiendo a todo lo que queda llega
// baja         dejó el programa

const ES_SESION = (a) => a.tipo === 'sesion' || a.tipo === 'jornada';

export function estadoEstudiante(est, { programa, actividades, asistencias, inscripciones, hoy }) {
  const min = programa.min_asistencias, maxV = programa.max_visitas_que_cuentan;
  const cuentan = actividades.filter((a) => a.cuenta_para_graduacion);
  const mias = new Map(asistencias.filter((x) => x.estudiante_id === est.id).map((x) => [x.actividad_id, x]));
  let sesiones = 0, visitas = 0, sesRest = 0, visRest = 0;
  for (const a of cuentan) {
    const x = mias.get(a.id);
    if (x) {
      if (x.presente) ES_SESION(a) ? sesiones++ : visitas++;
    } else if (a.fecha >= hoy) {
      ES_SESION(a) ? sesRest++ : visRest++;
    }
  }
  const total = sesiones + Math.min(visitas, maxV);
  const faltan = Math.max(min - total, 0);
  const inscritas = actividades.filter((a) => a.tipo === 'visita' && a.fecha >= hoy && !mias.has(a.id)
    && inscripciones.some((i) => i.actividad_id === a.id && i.estudiante_id === est.id));
  let estado;
  if (est.estado === 'baja') estado = 'baja';
  else if (total >= min) estado = 'graduado';
  else if (sesiones + sesRest + Math.min(visitas + visRest, maxV) >= min) estado = 'en_camino';
  else estado = 'no_alcanza';

  return { sesiones, visitas, total, faltan, sesRest, visRest, inscritas, estado, texto: textoFalta() };

  function textoFalta() {
    if (estado === 'baja') return 'Dio de baja del programa';
    if (estado === 'graduado') return 'Cumple los requisitos de graduación';
    if (estado === 'no_alcanza') return `Le faltan ${faltan} y no quedan actividades suficientes`;
    const visitaCuenta = Math.min(visitas, maxV) < maxV && (visRest > 0);
    const partes = [];
    if (sesRest) partes.push(`${sesRest} ${sesRest === 1 ? 'sesión' : 'sesiones'} por delante`);
    if (visitaCuenta) partes.push(inscritas.length ? `inscrito/a a ${inscritas.map((a) => a.codigo).join(', ')}` : 'una visita cívica disponible');
    return `Le ${faltan === 1 ? 'falta' : 'faltan'} ${faltan}` + (partes.length ? ` · ${partes.join(' · ')}` : '');
  }
}

export const ETIQUETA_ESTADO = {
  graduado: 'Graduado/a',
  en_camino: 'En camino',
  no_alcanza: 'No alcanza',
  baja: 'Baja',
};

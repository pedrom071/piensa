// Utilidades de interfaz: escape de HTML, fechas, píldoras y descargas.
import { ETIQUETA_ESTADO } from './reglas.js';

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
export function fecha(iso, conDia = false) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return (conDia ? DIA[d.getDay()] + ' ' : '') + d.getDate() + ' ' + MES[d.getMonth()];
}
export const hora = (t) => (t ? String(t).slice(0, 5) : '');
export const hoyISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export const pill = (estado) => `<span class="pill st-${estado}">${esc(ETIQUETA_ESTADO[estado] ?? estado)}</span>`;
export const nombre = (e) => `${e.nombres} ${e.apellidos}`;

// Cadena de actividades: cuadrado = sesión, círculo = visita
export function cadena(est, actividades, asistencias, hoy, grande = false) {
  const mias = new Map(asistencias.filter((x) => x.estudiante_id === est.id).map((x) => [x.actividad_id, x]));
  const items = actividades.filter((a) => a.cuenta_para_graduacion).map((a) => {
    const x = mias.get(a.id);
    const cls = x ? (x.presente ? 'on' : 'off') : a.fecha >= hoy ? 'pend' : 'off';
    const t = `${a.codigo} · ${fecha(a.fecha)} · ${x ? (x.presente ? 'asistió' : 'ausente') : a.fecha >= hoy ? 'por venir' : 'sin registro'}`;
    return `<i class="lk ${a.tipo === 'visita' ? 'visita' : ''} ${cls}" title="${esc(t)}"></i>`;
  });
  return `<span class="chain${grande ? ' lg' : ''}" role="img" aria-label="Asistencia">${items.join('')}</span>`;
}

export function descargarCSV(nombreArchivo, filas) {
  const csv = filas.map((f) => f.map((v) => {
    const s = String(v ?? '');
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

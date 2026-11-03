// Piezas compartidas: marco de la app, modal, cambio de clave y acciones generales.
import { esc } from '../lib/ui.js';
import * as admin from './admin.js';
import * as profesor from './profesor.js';
import * as estudiante from './estudiante.js';

const TABS = { admin: admin.TABS, profesor: profesor.TABS, estudiante: estudiante.TABS };
const ROL = { admin: 'Equipo P!ensa', profesor: 'Profesor/a', estudiante: 'Estudiante' };

export const marca = (anio) => `
  <div class="brand">
    <span class="motif" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="brand-name">Líderes <span class="it">del</span> Mañana</span>
    ${anio ? `<span class="brand-yr">${esc(anio)}</span>` : ''}
  </div>`;

export function bandaDemo(app) {
  if (!app.demo) return '';
  return `<div class="demo"><b>Modo demostración</b><span>Datos ficticios guardados solo en este navegador · fecha simulada 20 oct 2027</span>
    <button class="linkbtn" data-a="reiniciar-demo">Reiniciar datos</button></div>`;
}

export function marco(app, contenido) {
  const rol = app.rol();
  const tabs = TABS[rol];
  const tab = app.ui.tab && tabs.some(([k]) => k === app.ui.tab) ? app.ui.tab : tabs[0][0];
  app.ui.tab = tab;
  const f = app.ui.flash;
  return `
  <header class="top"><div class="top-in">
    ${marca(app.d.programa.anio)}
    <div class="who-top"><span class="small"><b>${esc(app.sesion.perfil.nombre)}</b> <span class="muted">· ${ROL[rol]}</span></span>
    <button class="btn sm" data-a="salir">Salir</button></div>
  </div>${bandaDemo(app)}</header>
  <div class="shell${rol === 'estudiante' ? ' solo' : ''}">
    ${tabs.length > 1 ? `<nav class="side" aria-label="Secciones">${tabs.map(([k, l]) => `<button data-a="tab" data-tab="${k}" ${k === tab ? 'aria-current="page"' : ''}>${l}</button>`).join('')}</nav>` : ''}
    <main>
      ${f ? `<div class="flash ${f.tipo}" role="status"><span>${esc(f.texto)}</span><button class="linkbtn" data-a="cerrar-flash" aria-label="Cerrar aviso">Cerrar</button></div>` : ''}
      ${contenido}
    </main>
  </div>`;
}

export function modal(app) {
  const m = app.ui.modal;
  return `<div class="modal-fondo" data-a="cerrar-modal"></div>
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-t">
    <div class="modal-h"><h2 id="modal-t">${esc(m.titulo)}</h2><button class="btn sm" data-a="cerrar-modal" aria-label="Cerrar">Cerrar</button></div>
    <div class="modal-c">${app.ui.flash ? `<div class="flash ${app.ui.flash.tipo}" role="alert">${esc(app.ui.flash.texto)}</div>` : ''}${m.html}</div>
  </div>`;
}

function pantallaSimple(app, contenido) {
  return `<header class="top"><div class="top-in">${marca(app.d?.programa?.anio)}
    ${app.sesion ? '<button class="btn sm" data-a="salir">Salir</button>' : ''}</div>${bandaDemo(app)}</header>
    <div class="shell solo"><main>
    ${app.ui.flash ? `<div class="flash ${app.ui.flash.tipo}" role="status">${esc(app.ui.flash.texto)}</div>` : ''}
    ${contenido}</main></div>`;
}

export function cambiarClave(app) {
  return pantallaSimple(app, `<section class="block login-card">
    <h1>Crea tu clave</h1>
    <p class="muted">Estás usando una clave temporal. Elige una nueva de al menos 8 caracteres; la usarás desde ahora para entrar.</p>
    <form class="stack-form" data-a="cambiar-clave">
      <div class="field"><label for="c1">Nueva clave</label><input class="inp" id="c1" name="c1" type="password" minlength="8" required autocomplete="new-password"></div>
      <div class="field"><label for="c2">Repite la clave</label><input class="inp" id="c2" name="c2" type="password" minlength="8" required autocomplete="new-password"></div>
      <button class="btn pri" type="submit">Guardar y entrar</button>
    </form></section>`);
}

export function sinPerfil(app) {
  return pantallaSimple(app, `<section class="block"><h1>Tu cuenta aún no tiene un rol</h1>
    <p>Entraste correctamente, pero falta que el equipo P!ensa asocie tu cuenta a un rol (administración, profesor o estudiante).</p>
    <p class="muted small">Si eres del equipo P!ensa, sigue el paso "Crear la primera cuenta de administración" del README.</p></section>`);
}

export function sinPrograma(app) {
  return pantallaSimple(app, `<section class="block"><h1>No hay un programa activo</h1>
    <p>La base de datos no tiene un año del programa marcado como activo. Ejecuta <span class="mono">supabase/seed_2027.sql</span> en el SQL Editor de Supabase.</p></section>`);
}

export const acciones = {
  'tab': (app, d) => { app.ui.tab = d.tab; app.ui.flash = null; app.render(); window.scrollTo(0, 0); },
  'salir': async (app) => { await app.api.salir(); app.ui = { tab: null, filtros: {}, modal: null, flash: null }; await app.recargar(); },
  'cerrar-modal': (app) => { app.ui.flash = null; app.cerrarModal(); },
  'cerrar-flash': (app) => { app.ui.flash = null; app.render(); },
  'reiniciar-demo': async (app) => { await app.api.reiniciarDemo(); await app.api.salir(); app.ui.flash = null; await app.recargar(); },
  'cambiar-clave': async (app, f) => {
    if (f.c1 !== f.c2) return app.flash('err', 'Las claves no coinciden.');
    if (f.c1.length < 8) return app.flash('err', 'La clave debe tener al menos 8 caracteres.');
    await app.api.cambiarClave(f.c1);
    app.ui.flash = { tipo: 'ok', texto: 'Listo, tu clave quedó guardada.' };
    await app.recargar();
  },
};

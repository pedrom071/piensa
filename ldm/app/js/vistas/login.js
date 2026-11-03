// Pantalla de ingreso: estudiantes con RUT + clave; profesores y equipo con correo + clave.
import { esc } from '../lib/ui.js';
import { normalizarRut, formatearRut } from '../lib/rut.js';
import { marca, bandaDemo } from './comun.js';

let tipo = 'estudiante';
let ultimoRut = '', ultimoCorreo = ''; // se conservan si la clave falla
let atajos = null;

export function vista(app) {
  if (app.demo && !atajos) {
    app.api.usuariosDemo().then((u) => { atajos = u; app.render(); });
  }
  const f = app.ui.flash;
  return `
  <header class="top"><div class="top-in">${marca(null)}</div>${bandaDemo(app)}</header>
  <div class="shell solo"><main>
    <section class="login-hero">
      <p class="eyebrow">Fundación P!ensa</p>
      <h1>Programa <span class="it">Líderes del Mañana</span></h1>
      <p class="muted">Revisa tu asistencia, tu avance hacia la graduación y responde las encuestas del programa.</p>
    </section>
    ${f ? `<div class="flash ${f.tipo}" role="alert">${esc(f.texto)}</div>` : ''}
    <section class="block login-card">
      <div class="roles" role="tablist" aria-label="Tipo de cuenta">
        <button role="tab" data-a="login-tipo" data-tipo="estudiante" aria-pressed="${tipo === 'estudiante'}">Soy estudiante</button>
        <button role="tab" data-a="login-tipo" data-tipo="correo" aria-pressed="${tipo === 'correo'}">Profesor/a o equipo P!ensa</button>
      </div>
      ${tipo === 'estudiante' ? `
      <form class="stack-form" data-a="login-estudiante">
        <div class="field"><label for="l-rut">RUT</label><input class="inp" id="l-rut" name="rut" inputmode="text" autocomplete="username" placeholder="12.345.678-5" value="${esc(ultimoRut)}" required></div>
        <div class="field"><label for="l-clave">Clave</label><input class="inp" id="l-clave" name="clave" type="password" autocomplete="current-password" required></div>
        <button class="btn pri" type="submit">Entrar</button>
        <p class="small muted">¿Primera vez u olvidaste tu clave? Pídele a tu profesor/a la clave temporal.</p>
      </form>` : `
      <form class="stack-form" data-a="login-correo">
        <div class="field"><label for="l-correo">Correo</label><input class="inp" id="l-correo" name="correo" type="email" autocomplete="username" value="${esc(ultimoCorreo)}" required></div>
        <div class="field"><label for="l-clave2">Clave</label><input class="inp" id="l-clave2" name="clave" type="password" autocomplete="current-password" required></div>
        <button class="btn pri" type="submit">Entrar</button>
        <p class="small muted">Las cuentas de profesores las crea el equipo P!ensa. Si olvidaste tu clave, escríbenos.</p>
      </form>`}
    </section>
    ${app.demo && atajos ? `
    <section class="block">
      <div class="block-h"><h2>Entrar a la demostración</h2><span class="small muted">Sin clave, para recorrer cada vista</span></div>
      <div class="picks">
        <button class="pick" data-a="demo-entrar" data-id="${esc(atajos.admin.id)}"><b>Equipo P!ensa</b><span class="small muted">Administración del programa completo</span></button>
        ${atajos.profesores.slice(0, 3).map((p) => `<button class="pick" data-a="demo-entrar" data-id="${esc(p.id)}"><b>${esc(p.nombre)}</b><span class="small muted">Profesor/a · ${esc(p.colegio)}</span></button>`).join('')}
        ${atajos.estudiantes.slice(0, 2).map((e) => `<button class="pick" data-a="demo-entrar" data-id="${esc(e.id)}"><b>${esc(e.nombre)}</b><span class="small muted">Estudiante · RUT ${esc(formatearRut(e.rut))} · clave demo-1234</span></button>`).join('')}
      </div>
    </section>` : ''}
  </main></div>`;
}

export const acciones = {
  'login-tipo': (app, d) => { tipo = d.tipo; app.ui.flash = null; app.render(); },
  'login-estudiante': async (app, f) => {
    ultimoRut = f.rut;
    const n = normalizarRut(f.rut);
    if (n.error) return app.flash('err', n.error);
    await app.api.ingresarEstudiante(n.rut, f.clave);
    app.ui.flash = null;
    await app.recargar();
  },
  'login-correo': async (app, f) => {
    ultimoCorreo = f.correo;
    await app.api.ingresarCorreo(f.correo, f.clave);
    app.ui.flash = null;
    await app.recargar();
  },
  'demo-entrar': async (app, d) => { await app.api.entrarComo(d.id); app.ui.flash = null; await app.recargar(); },
};

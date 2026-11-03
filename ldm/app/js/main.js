// Punto de entrada: estado de la app, navegación y despacho de acciones.
import { cargarApi, enDemo } from './api/index.js';
import { estadoEstudiante } from './lib/reglas.js';
import { esc, hoyISO } from './lib/ui.js';
import * as login from './vistas/login.js';
import * as admin from './vistas/admin.js';
import * as profesor from './vistas/profesor.js';
import * as estudiante from './vistas/estudiante.js';
import * as comun from './vistas/comun.js';

const VISTAS = { admin, profesor, estudiante };
const raiz = document.getElementById('app');

export const app = {
  api: null,
  hoy: hoyISO(),
  demo: enDemo,
  sesion: null,
  d: null,             // datos visibles para el usuario
  estados: new Map(),  // estudiante_id → resultado de la regla de graduación
  ui: { tab: null, filtros: {}, modal: null, flash: null, ocupado: false },

  rol() { return this.sesion?.perfil?.rol ?? null; },

  async recargar() {
    const antes = this.sesion?.usuario?.id;
    this.sesion = await this.api.sesion();
    if (this.sesion?.usuario?.id !== antes) window.scrollTo(0, 0);
    if (this.sesion?.perfil && !this.sesion.debeCambiarClave) {
      this.d = await this.api.datos();
      this.recalcular();
    } else {
      this.d = null;
    }
    this.render();
  },

  recalcular() {
    this.estados = new Map();
    if (!this.d?.programa) return;
    const ctx = { programa: this.d.programa, actividades: this.d.actividades, asistencias: this.d.asistencias, inscripciones: this.d.inscripciones, hoy: this.hoy };
    for (const e of this.d.estudiantes) this.estados.set(e.id, estadoEstudiante(e, ctx));
  },

  flash(tipo, texto) { this.ui.flash = { tipo, texto }; this.render(); },
  modal(m) { this.ui.modal = m; this.ui.flash = null; this.render(); },
  cerrarModal() { this.ui.modal = null; this.render(); },

  render() {
    let html;
    if (!this.sesion) html = login.vista(this);
    else if (this.sesion.sinPerfil) html = comun.sinPerfil(this);
    else if (this.sesion.debeCambiarClave) html = comun.cambiarClave(this);
    else if (!this.d?.programa) html = comun.sinPrograma(this);
    else html = comun.marco(this, VISTAS[this.rol()].vista(this));
    const foco = document.activeElement?.id;
    raiz.innerHTML = html + (this.ui.modal ? comun.modal(this) : '');
    document.body.classList.toggle('con-modal', !!this.ui.modal);
    const el = foco && document.getElementById(foco);
    if (el) {
      el.focus();
      if (el.setSelectionRange && /^(text|search)$/.test(el.type)) el.setSelectionRange(el.value.length, el.value.length);
    }
    if (this.ui.modal) raiz.querySelector('.modal [autofocus]')?.focus();
  },

  // Ejecuta una acción mostrando errores de forma amable
  async correr(fn) {
    if (this.ui.ocupado) return;
    this.ui.ocupado = true;
    document.body.classList.add('ocupado');
    try { await fn(); } catch (err) {
      console.error(err);
      this.flash('err', err.message || String(err));
    } finally {
      this.ui.ocupado = false;
      document.body.classList.remove('ocupado');
    }
  },
};

// Acciones disponibles: comunes + las del rol + login
function acciones() {
  return { ...login.acciones, ...comun.acciones, ...(VISTAS[app.rol()]?.acciones ?? {}) };
}

raiz.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-a]');
  if (!el || el.tagName === 'FORM') return;
  const fn = acciones()[el.dataset.a];
  if (!fn) return;
  ev.preventDefault();
  app.correr(() => fn(app, el.dataset, el));
});

raiz.addEventListener('submit', (ev) => {
  const form = ev.target.closest('form[data-a]');
  if (!form) return;
  ev.preventDefault();
  const fn = acciones()[form.dataset.a];
  if (fn) app.correr(() => fn(app, Object.fromEntries(new FormData(form)), form));
});

raiz.addEventListener('change', (ev) => {
  const el = ev.target.closest('[data-cambio]');
  if (!el) return;
  const fn = acciones()[el.dataset.cambio];
  if (fn) app.correr(() => fn(app, { ...el.dataset, valor: el.type === 'checkbox' ? el.checked : el.value }, el));
});

raiz.addEventListener('input', (ev) => {
  const el = ev.target.closest('[data-filtro]');
  if (!el) return;
  app.ui.filtros[el.dataset.filtro] = el.value;
  clearTimeout(app._t);
  app._t = setTimeout(() => app.render(), el.tagName === 'INPUT' ? 180 : 0);
});

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && app.ui.modal) app.cerrarModal();
});

(async () => {
  try {
    const { api, hoyDemo } = await cargarApi();
    app.api = api;
    if (hoyDemo) app.hoy = hoyDemo;
    await app.recargar();
  } catch (err) {
    console.error(err);
    raiz.innerHTML = `<div class="shell solo"><main><div class="flash err">No se pudo iniciar la app: ${esc(err.message)}</div></main></div>`;
  }
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();

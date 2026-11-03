// Service worker mínimo: permite instalar la app en el celular y abrirla sin conexión
// (muestra la última versión guardada). Los datos siempre se piden en línea a Supabase.
const VERSION = 'ldm-v1';
const ARCHIVOS = ['./', 'index.html', 'styles.css', 'config.js', 'manifest.webmanifest', 'icono.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Red primero; si no hay conexión, lo guardado. Nunca guarda llamadas a Supabase.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then((r) => {
      const copia = r.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copia));
      return r;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))),
  );
});

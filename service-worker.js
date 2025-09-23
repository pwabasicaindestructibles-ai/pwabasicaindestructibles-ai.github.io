const CACHE_NAME = 'los-indestructibles-cache';
const PRECACHE_URLS = [
  '/',
  'index.html',
  'style.css',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

// Instalación: precache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activación: limpieza de caches antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: responder desde cache primero, fallback a network
self.addEventListener('fetch', event => {
  const req = event.request;
  // solo manejar GET
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(req).then(networkResponse => {
        // opcional: colocar nuevos recursos en cache runtime
        return caches.open(CACHE_NAME).then(cache => {
          try {
            // evita cachear respuestas opacas o con errores
            if (networkResponse && networkResponse.ok) {
              cache.put(req, networkResponse.clone());
            }
          } catch (e) {
            // si falla el put, ignorar (no rompe la respuesta)
          }
          return networkResponse;
        });
      }).catch(() => {
        // fallback si todo falla (puedes usar offline.html si lo agregas al PRECACHE)
        return caches.match('index.html');
      });
    })
  );
});



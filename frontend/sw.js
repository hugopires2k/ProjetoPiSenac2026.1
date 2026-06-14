const CACHE = 'senac-pi-v1';

const ASSETS = [
  '/frontend/html/login.html',
  '/frontend/html/certificados.html',
  '/frontend/html/enviar.html',
  '/frontend/html/coordenador.html',
  '/frontend/html/admin.html',
  '/frontend/css/global.css',
  '/frontend/css/login.css',
  '/frontend/css/certificados.css',
  '/frontend/css/enviar.css',
  '/frontend/css/coordenador.css',
  '/frontend/css/admin.css',
  '/frontend/js/login.js',
  '/frontend/js/certificados.js',
  '/frontend/js/enviar.js',
  '/frontend/js/coordenador.js',
  '/frontend/js/admin.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/') || e.request.url.includes('localhost:3000')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

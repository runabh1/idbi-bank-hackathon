const CACHE_NAME = 'creditpulse-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests normally. 
  // Having a fetch handler is required by some browsers to qualify as a PWA.
});

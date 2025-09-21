// Имя кэша. Меняйте его при обновлении файлов, чтобы старый кэш удалился.
const CACHE_NAME = 'project-auditor-3d-v1';

// Список файлов "оболочки" приложения, которые будут кэшироваться для оффлайн-работы.
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/js/main.js',
  // Основные скрипты
  '/js/state.js',
  '/js/utils.js',
  '/js/core/graphicsManager.js',
  '/js/core/interactionManager.js',
  '/js/core/minimapManager.js',
  '/js/core/modelManager.js',
  '/js/core/touchControls.js',
  '/js/three-core/sceneSetup.js',
  '/js/ui/attributeManager.js',
  '/js/ui/uiManager.js',
  // Важные библиотеки с CDN
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/controls/OrbitControls.js',
  // ... (можно добавить другие CDN ссылки если они критичны для оффлайн работы)
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Кэш открыт, добавляем файлы оболочки');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
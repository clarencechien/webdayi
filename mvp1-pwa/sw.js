/**
 * Service Worker for WebDaYi PWA
 *
 * Implements offline-first caching strategy for:
 * - Static assets (HTML, CSS, JS)
 * - Database files (dayi_db.json, ngram_db.json)
 * - User data (IndexedDB for user_ngram.db)
 *
 * @version 1.0.0
 * @date 2025-11-12
 */

const CACHE_NAME = 'webdayi-pwa-v1.0.0';
const RUNTIME_CACHE = 'webdayi-runtime-v1.0.0';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/user_db_indexeddb.js',
  '/js/core_logic_v11.js',
  '/js/core_logic_v11_ui.js',
  '/js/viterbi_module.js',
  '/manifest.json'
];

// Large database files to cache separately
const DATABASE_ASSETS = [
  '/mvp1/dayi_db.json',
  '/mvp1/ngram_db.json'
];

/**
 * Install Event
 * Pre-cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    (async () => {
      try {
        // Cache static assets
        const staticCache = await caches.open(CACHE_NAME);
        console.log('[Service Worker] Caching static assets');
        await staticCache.addAll(STATIC_ASSETS);

        // Cache database files separately (they're large)
        console.log('[Service Worker] Caching database files');
        for (const url of DATABASE_ASSETS) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await staticCache.put(url, response);
            }
          } catch (e) {
            console.warn(`[Service Worker] Failed to cache ${url}:`, e);
          }
        }

        console.log('[Service Worker] Installation complete');

        // Force the waiting service worker to become the active service worker
        self.skipWaiting();
      } catch (error) {
        console.error('[Service Worker] Installation failed:', error);
      }
    })()
  );
});

/**
 * Activate Event
 * Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    (async () => {
      // Delete old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map(name => {
            console.log(`[Service Worker] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );

      // Claim all clients immediately
      await self.clients.claim();
      console.log('[Service Worker] Activation complete');
    })()
  );
});

/**
 * Fetch Event
 * Implement caching strategy: Cache First, falling back to Network
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Strategy: Cache First, Network Fallback
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
          console.log(`[Service Worker] Cache hit: ${url.pathname}`);

          // Update cache in the background for database files
          if (DATABASE_ASSETS.some(asset => url.pathname.endsWith(asset))) {
            updateCacheInBackground(request);
          }

          return cachedResponse;
        }

        // Not in cache, fetch from network
        console.log(`[Service Worker] Fetching from network: ${url.pathname}`);
        const networkResponse = await fetch(request);

        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, networkResponse.clone());
        }

        return networkResponse;

      } catch (error) {
        console.error(`[Service Worker] Fetch failed for ${url.pathname}:`, error);

        // Return offline page if available
        if (request.destination === 'document') {
          const offlineResponse = await caches.match('/offline.html');
          if (offlineResponse) {
            return offlineResponse;
          }
        }

        // Return a basic error response
        return new Response('Offline - Resource not available', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      }
    })()
  );
});

/**
 * Update cache in background (for large database files)
 */
async function updateCacheInBackground(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response);
      console.log(`[Service Worker] Updated cache for: ${request.url}`);
    }
  } catch (error) {
    console.warn(`[Service Worker] Background update failed for ${request.url}:`, error);
  }
}

/**
 * Message Event
 * Handle messages from clients
 */
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_NAME
    });
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

/**
 * Sync Event (Background Sync API)
 * Handle background sync for user data export
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sync event:', event.tag);

  if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  }
});

/**
 * Sync user learned data (placeholder for future implementation)
 */
async function syncUserData() {
  console.log('[Service Worker] Syncing user data...');
  // This will be implemented in Phase 4 (Chrome Extension with chrome.storage.sync)
  // For PWA POC, we use manual export/import
}

/**
 * Push Event (for future notifications)
 */
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');

  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'webdayi-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('WebDaYi PWA', options)
  );
});

/**
 * Notification Click Event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');

  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('[Service Worker] Loaded');

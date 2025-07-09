// Service Worker for Flappy Dog
// Provides aggressive caching for faster loading and offline gameplay

const CACHE_NAME = 'flappy-dog-v1.2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/css/dark-mode.css',
  '/manifest.json',
  
  // Critical game assets
  '/assets/images/taz.png',
  '/assets/images/chloe.png',
  '/assets/images/background.png',
  '/assets/images/ground.png',
  '/assets/images/pipe-top.png',
  '/assets/images/pipe-bottom.png',
  '/assets/fonts/PressStart2P-Regular.ttf',
  
  // Critical JavaScript files
  '/js/game.js',
  '/js/drawing-functions.js',
  '/js/config.js',
  '/js/env-loader.js',
  '/js/supabase.js',
  
  // Secondary assets (loaded after critical)
  '/js/sounds.js',
  '/js/8bit-music.js',
  '/js/dark-mode.js',
  '/js/leaderboard.js',
  '/js/background-effects.js',
  '/js/mobile-optimization.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker and caching assets');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching assets for faster loading');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[SW] All assets cached successfully');
        // Force the waiting service worker to become the active service worker
        self.skipWaiting();
      })
      .catch((error) => {
        console.warn('[SW] Failed to cache some assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip external requests (except Supabase CDN)
  const url = new URL(event.request.url);
  if (url.origin !== location.origin && !url.origin.includes('supabase')) {
    // Let external CDN requests (like Supabase) go through normally
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          // Serve from cache immediately
          console.log('[SW] Serving from cache:', event.request.url);
          
          // Update cache in background for next time
          fetch(event.request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseClone);
                  });
              }
            })
            .catch(() => {
              // Network failed, but we have cache - no problem
            });
          
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response.ok) {
              return response;
            }
            
            // Clone the response
            const responseClone = response.clone();
            
            // Add to cache for next time
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });
            
            return response;
          })
          .catch((error) => {
            console.warn('[SW] Network request failed:', event.request.url, error);
            
            // For HTML requests, return a basic offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>FLAPPY DOG - Offline</title>
                  <style>
                    body { 
                      font-family: monospace; 
                      text-align: center; 
                      padding: 50px;
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                    }
                    h1 { font-size: 3rem; margin-bottom: 1rem; }
                    p { font-size: 1.2rem; opacity: 0.8; }
                  </style>
                </head>
                <body>
                                      <h1>FLAPPY DOG</h1>
                  <p>You're offline, but the game should still work!</p>
                  <p>Check your internet connection and refresh to sync your scores.</p>
                  <button onclick="location.reload()" style="
                    padding: 10px 20px; 
                    font-size: 1rem; 
                    background: #4facfe; 
                    border: none; 
                    border-radius: 5px; 
                    color: white; 
                    cursor: pointer;
                    margin-top: 20px;
                  ">Retry</button>
                </body>
                </html>
              `, {
                headers: { 'Content-Type': 'text/html' }
              });
            }
            
            throw error;
          });
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Preload critical assets when service worker starts
self.addEventListener('fetch', (event) => {
  // Preload critical game assets on first visit
  if (event.request.url.includes('/index.html') || event.request.url === location.origin + '/') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        // Preload most critical assets
        const criticalAssets = [
          '/assets/images/taz.png',
          '/assets/images/chloe.png',
          '/js/game.js',
          '/js/drawing-functions.js'
        ];
        
        return Promise.all(
          criticalAssets.map((asset) => 
            fetch(asset).then((response) => {
              if (response.ok) {
                cache.put(asset, response.clone());
              }
            }).catch(() => {
              // Ignore preload failures
            })
          )
        );
      })
    );
  }
}); 
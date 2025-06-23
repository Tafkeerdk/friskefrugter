// Service Worker for Multi Grønt PWA - Enhanced Image Loading
const CACHE_NAME = 'multi-groent-v2';
const STATIC_CACHE_NAME = 'multi-groent-static-v2';
const DYNAMIC_CACHE_NAME = 'multi-groent-dynamic-v2';
const IMAGE_CACHE_NAME = 'multi-groent-images-v2';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other critical assets here
];

// API endpoints to cache with network-first strategy
const API_ENDPOINTS = [
  '/.netlify/functions/',
  '/api/',
];

// External image domains that should be cached (like Unsplash)
const EXTERNAL_IMAGE_DOMAINS = [
  'images.unsplash.com',
  'unsplash.com',
  'cdn.example.com', // Add other image CDNs as needed
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing v2 with enhanced image support...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets', error);
      })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating v2...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.includes('v2')) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker: Activated and claimed all clients');
    })
  );
});

// Fetch event - implement enhanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle the request
  event.respondWith(
    handleRequest(request)
  );
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // API requests - Network first, then cache
    if (isApiRequest(url)) {
      return await networkFirstStrategy(request, DYNAMIC_CACHE_NAME);
    }
    
    // Static assets - Cache first, then network
    if (isStaticAsset(url)) {
      return await cacheFirstStrategy(request, STATIC_CACHE_NAME);
    }
    
    // Images (both local and external) - Enhanced handling
    if (isImageRequest(url)) {
      return await enhancedImageStrategy(request, url);
    }
    
    // HTML pages - Network first with fallback to cache
    if (isHtmlRequest(request)) {
      return await networkFirstStrategy(request, DYNAMIC_CACHE_NAME);
    }
    
    // Default: Network first for other resources
    return await networkFirstStrategy(request, DYNAMIC_CACHE_NAME);
    
  } catch (error) {
    console.error('Service Worker: Error handling request for', url.href, error);
    
    // Return offline fallback for HTML requests
    if (isHtmlRequest(request)) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      const cachedResponse = await cache.match('/');
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // For images, try to return a placeholder or cached version
    if (isImageRequest(url)) {
      const cache = await caches.open(IMAGE_CACHE_NAME);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Return a simple placeholder response for failed images
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f3f4f6"/><text x="200" y="150" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="16">Billede ikke tilgængeligt</text></svg>',
        {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'max-age=3600'
          }
        }
      );
    }
    
    // Default offline response
    return new Response('Offline - ingen internetforbindelse', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  }
}

// Enhanced image strategy for both local and external images
async function enhancedImageStrategy(request, url) {
  console.log('🔍 SW: Image request intercepted:', {
    url: url.href,
    pathname: url.pathname,
    hostname: url.hostname,
    isExternal: isExternalImageDomain(url),
    timestamp: new Date().toISOString()
  });

  const cache = await caches.open(IMAGE_CACHE_NAME);
  
  // Check cache first for all images
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    console.log('✅ SW: Image served from cache:', url.href);
    return cachedResponse;
  }
  
  try {
    // Create request with appropriate headers for external images
    let fetchRequest = request;
    
    if (isExternalImageDomain(url)) {
      // For external images, create a new request with CORS headers
      fetchRequest = new Request(request.url, {
        method: request.method,
        headers: new Headers({
          ...Object.fromEntries(request.headers.entries()),
        }),
        mode: 'cors',
        credentials: 'omit', // Don't send credentials for external images
        cache: 'default'
      });
      console.log('🌐 SW: Fetching external image with CORS:', url.href);
    } else {
      console.log('📍 SW: Fetching local image:', url.href);
    }
    
    console.log('🚀 SW: Starting fetch for image:', url.href);
    const networkResponse = await fetch(fetchRequest);
    console.log('📥 SW: Fetch response received:', {
      url: url.href,
      status: networkResponse.status,
      statusText: networkResponse.statusText,
      ok: networkResponse.ok,
      headers: Object.fromEntries(networkResponse.headers.entries())
    });
    
    if (networkResponse.ok) {
      // Cache successful responses
      const responseClone = networkResponse.clone();
      try {
        await cache.put(request, responseClone);
        console.log('💾 SW: Image cached successfully:', url.href);
      } catch (cacheError) {
        console.warn('⚠️ SW: Failed to cache image:', url.href, cacheError);
      }
      return networkResponse;
    } else {
      console.error('❌ SW: Image fetch failed with status:', networkResponse.status, url.href);
      throw new Error(`Image fetch failed: ${networkResponse.status} ${networkResponse.statusText}`);
    }
    
  } catch (error) {
    console.error('💥 SW: Network error fetching image:', {
      url: url.href,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Try to return any cached version (even if stale)
    const staleResponse = await cache.match(request);
    if (staleResponse) {
      console.log('🔄 SW: Returning stale cached image:', url.href);
      return staleResponse;
    }
    
    // Return placeholder SVG for completely failed images
    console.log('🎨 SW: Returning placeholder SVG for failed image:', url.href);
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#f3f4f6" stroke="#e5e7eb" stroke-width="2"/>
        <circle cx="200" cy="120" r="30" fill="#d1d5db"/>
        <path d="M170 140 L230 140 L210 180 L190 180 Z" fill="#d1d5db"/>
        <text x="200" y="220" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="14">Billede kunne ikke indlæses</text>
        <text x="200" y="240" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="12">SW: ${error.message}</text>
      </svg>`,
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'max-age=60' // Cache placeholder for 1 minute
        }
      }
    );
  }
}

// Network first strategy
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Cache first strategy
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Both cache and network failed for:', request.url, error);
    throw error;
  }
}

// Helper functions
function isApiRequest(url) {
  return API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint));
}

function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.eot'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
         url.pathname === '/manifest.json' ||
         url.pathname.startsWith('/icons/');
}

function isHtmlRequest(request) {
  return request.headers.get('accept')?.includes('text/html');
}

function isImageRequest(url) {
  // Check file extension in pathname
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.bmp', '.tiff'];
  const hasImageExtension = imageExtensions.some(ext => url.pathname.toLowerCase().includes(ext));
  
  // Check if it's a known external image domain (like Unsplash)
  const isExternalImage = isExternalImageDomain(url);
  
  // Check for common image URL patterns (even without extensions)
  const hasImageKeywords = url.pathname.includes('/photo') || 
                          url.pathname.includes('/image') || 
                          url.pathname.includes('/img') ||
                          url.searchParams.has('auto') && url.searchParams.get('auto') === 'format'; // Unsplash pattern
  
  return hasImageExtension || isExternalImage || hasImageKeywords;
}

function isExternalImageDomain(url) {
  return EXTERNAL_IMAGE_DOMAINS.some(domain => url.hostname.includes(domain));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('Service Worker: Performing background sync');
  // Implement background sync logic here
  // For example, sync offline orders, form submissions, etc.
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Ny besked fra Multi Grønt',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Se mere',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'Luk',
        icon: '/icons/icon-72x72.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Multi Grønt', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_IMAGE_CACHE') {
    event.waitUntil(
      caches.delete(IMAGE_CACHE_NAME).then(() => {
        console.log('Service Worker: Image cache cleared');
        event.ports[0].postMessage({ success: true });
      })
    );
  }
}); 
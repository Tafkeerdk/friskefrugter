// Service Worker for Multi Grønt PWA - FIXED Image Loading v7
const CACHE_VERSION = 'v7-imgix-bypass';
const STATIC_CACHE_NAME = `multi-groent-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `multi-groent-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `multi-groent-images-${CACHE_VERSION}`;

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

// External image domains - DO NOT INTERCEPT (let browser handle naturally)
const EXTERNAL_IMAGE_DOMAINS = [
  'images.unsplash.com',
  'unsplash.com',
  'multigrontimg.imgix.net', // Multi Grønt Imgix CDN
  'imgix.net', // General Imgix domains
  'cdn.example.com', // Add other image CDNs as needed
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🚀 SW: Installing v6 with Imgix CDN support and CORS-fixed image loading...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('📦 SW: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ SW: Static assets cached');
        // Don't skip waiting immediately - let user finish current session
        // return self.skipWaiting(); // REMOVED - causes page reload
      })
      .catch((error) => {
        console.error('❌ SW: Error caching static assets', error);
      })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('🔄 SW: Activating v6 with Imgix CDN support and CORS fixes...');
  
  event.waitUntil(
    Promise.all([
      // Clean up ALL old caches to prevent conflicts
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.includes(CACHE_VERSION)) {
              console.log('🗑️ SW: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('✅ SW: Activated and claimed all clients');
    })
  );
});

// Fetch event - implement CORS-FIXED caching strategies
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

  // Skip specific external scripts that should not be cached
  const skipDomains = ['cdn.gpteng.co', 'gptengineer.js'];
  if (skipDomains.some(domain => url.hostname.includes(domain) || url.pathname.includes(domain))) {
    console.log('🚫 SW: Skipping external script:', url.href);
    return;
  }

  // CRITICAL FIX: Skip ALL external images - let browser handle naturally
  if (isImageRequest(url) && isExternalImageDomain(url)) {
    console.log('🌐 SW: Bypassing external image (let browser handle):', url.href);
    return; // Don't intercept external images at all
  }

  // ADDITIONAL FIX: Explicitly bypass Imgix domains
  if (url.hostname.includes('imgix.net') || url.hostname.includes('multigrontimg.imgix.net')) {
    console.log('🖼️ SW: Bypassing Imgix CDN (explicit check):', url.href);
    return; // Don't intercept Imgix images at all
  }

  // Handle the request with improved error handling
  event.respondWith(
    handleRequestSafely(request)
  );
});

async function handleRequestSafely(request) {
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
    
    // Images - Only handle LOCAL images (external images bypassed above)
    if (isImageRequest(url)) {
      return await localImageStrategy(request, url);
    }
    
    // HTML pages - Network first with fallback to cache
    if (isHtmlRequest(request)) {
      return await networkFirstStrategy(request, DYNAMIC_CACHE_NAME);
    }
    
    // Default: Network first for other resources
    return await networkFirstStrategy(request, DYNAMIC_CACHE_NAME);
    
  } catch (error) {
    console.error('❌ SW: Error handling request for', url.href, error);
    return handleRequestError(request, url, error);
  }
}

// FIXED: Local image strategy (external images are bypassed completely)
async function localImageStrategy(request, url) {
  try {
    // Network first for local images
    console.log('🖼️ SW: Fetching local image from network:', url.href);
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && networkResponse.status === 200) {
      console.log('✅ SW: Local image loaded successfully:', url.href);
      
      // Cache successful local image responses
      const contentType = networkResponse.headers.get('content-type');
      if (contentType && contentType.startsWith('image/')) {
        try {
          const cache = await caches.open(IMAGE_CACHE_NAME);
          await cache.put(request, networkResponse.clone());
          console.log('💾 SW: Local image cached successfully:', url.href);
        } catch (cacheError) {
          console.warn('⚠️ SW: Failed to cache local image (non-critical):', url.href, cacheError.message);
        }
      }
      
      return networkResponse;
    } else {
      throw new Error(`Network response not OK: ${networkResponse.status} ${networkResponse.statusText}`);
    }
    
  } catch (networkError) {
    console.warn('⚠️ SW: Network failed for local image:', url.href, networkError.message);
    
    // Fallback to cache for local images
    try {
      const cache = await caches.open(IMAGE_CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        console.log('📦 SW: Serving cached local image:', url.href);
        return cachedResponse;
      }
    } catch (cacheError) {
      console.warn('⚠️ SW: Cache lookup failed for local image:', url.href, cacheError.message);
    }
    
    // Let browser handle local image errors naturally
    console.log('🔄 SW: Letting browser handle local image error:', url.href);
    throw networkError;
  }
}

// Network first strategy for APIs and dynamic content
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      // Don't await this - cache in background
      cache.put(request, networkResponse.clone()).catch(e => 
        console.warn('⚠️ SW: Background cache failed:', e.message)
      );
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🔄 SW: Network failed, trying cache for:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Cache first strategy for static assets
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone()).catch(e => 
        console.warn('⚠️ SW: Background cache failed:', e.message)
      );
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ SW: Both cache and network failed for:', request.url, error);
    throw error;
  }
}

// Improved error handling
async function handleRequestError(request, url, error) {
  console.error('💥 SW: Request failed completely:', url.href, error.message);
  
  // For HTML requests, try to serve the cached index page
  if (isHtmlRequest(request)) {
    try {
      const cache = await caches.open(STATIC_CACHE_NAME);
      const cachedResponse = await cache.match('/');
      if (cachedResponse) {
        return cachedResponse;
      }
    } catch (cacheError) {
      console.error('❌ SW: Failed to serve cached HTML:', cacheError);
    }
  }
  
  // For images, let the browser handle the error naturally
  if (isImageRequest(url)) {
    console.log('🔄 SW: Letting browser handle image error naturally:', url.href);
    throw error; // This will cause the browser's natural error handling
  }
  
  // Default offline response for other resources
  return new Response('Service Worker: Resource not available offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
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
  
  // Check if it's a known external image domain (like Unsplash, Imgix)
  const isExternalImage = isExternalImageDomain(url);
  
  // Check for common image URL patterns (even without extensions)
  const hasImageKeywords = url.pathname.includes('/photo') || 
                          url.pathname.includes('/image') || 
                          url.pathname.includes('/img') ||
                          url.searchParams.has('auto') && url.searchParams.get('auto') === 'format' || // Unsplash pattern
                          url.searchParams.has('fm') || // Imgix format parameter
                          url.searchParams.has('w') || // Imgix width parameter
                          url.searchParams.has('h') || // Imgix height parameter
                          url.searchParams.has('q'); // Imgix quality parameter
  
  return hasImageExtension || isExternalImage || hasImageKeywords;
}

function isExternalImageDomain(url) {
  // Check against known external domains
  const isExternal = EXTERNAL_IMAGE_DOMAINS.some(domain => url.hostname.includes(domain));
  
  // Additional explicit check for Imgix
  const isImgix = url.hostname.includes('imgix.net') || url.hostname.includes('multigrontimg.imgix.net');
  
  if (isExternal || isImgix) {
    console.log('🔍 SW: Detected external image domain:', url.hostname, '(bypass required)');
  }
  
  return isExternal || isImgix;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 SW: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('🔄 SW: Performing background sync');
  // Implement background sync logic here
  // For example, sync offline orders, form submissions, etc.
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('📱 SW: Push received', event);
  
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
  console.log('📱 SW: Notification clicked', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Enhanced message handling for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⚡ SW: Skip waiting requested');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_IMAGE_CACHE') {
    console.log('🗑️ SW: Clearing image cache');
    event.waitUntil(
      caches.delete(IMAGE_CACHE_NAME).then(() => {
        console.log('✅ SW: Image cache cleared');
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      }).catch(error => {
        console.error('❌ SW: Failed to clear image cache:', error);
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: false, error: error.message });
        }
      })
    );
  }
  
  if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
    console.log('🗑️ SW: Clearing all caches');
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('✅ SW: All caches cleared');
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      }).catch(error => {
        console.error('❌ SW: Failed to clear all caches:', error);
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: false, error: error.message });
        }
      })
    );
  }
});

console.log('🚀 SW: Multi Grønt Service Worker v7 loaded with EXPLICIT Imgix bypass and CORS-FIXED image handling'); 
// Minimal service worker: lets phones install Warcall as an app.
// It doesn't cache anything, so you always see the latest data (Warcall needs the internet anyway).
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})

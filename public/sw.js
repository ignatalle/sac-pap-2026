// SAC-PAP 2026 - Service Worker
const CACHE = 'sac-pap-v1'
const STATIC = ['/', '/dashboard', '/hoy', '/manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ))
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})

// Notificaciones push
self.addEventListener('push', e => {
  const data = e.data?.json() || { title: 'SAC-PAP 2026', body: 'Revisá tus tareas urgentes' }
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'sac-pap-alert',
      renotify: true,
      actions: [
        { action: 'ver', title: 'Ver tareas', icon: '/icon-192.png' },
        { action: 'cerrar', title: 'Cerrar' }
      ]
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  if (e.action === 'ver') {
    e.waitUntil(clients.openWindow('/hoy'))
  }
})

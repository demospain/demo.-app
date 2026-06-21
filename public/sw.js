// Service worker mínimo, sin caché. Su único propósito es cumplir el
// requisito de los navegadores (Chrome/Edge/Android) para poder mostrar
// el botón de "Instalar". No cachea nada a propósito, para no arriesgarnos
// a servir contenido desactualizado de una app que cambia a menudo.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // Sin intervención — deja pasar todas las peticiones tal cual.
})

// Implementación del Service Worker
self.addEventListener('install', function(event) {
    console.log('Service Worker instalado');
  });
  
  self.addEventListener('activate', function(event) {
    console.log('Service Worker activado');
  });
  
  self.addEventListener('fetch', function(event) {
    console.log('Se ha interceptado una solicitud de recuperación para:', event.request.url);
    // Aquí puedes implementar estrategias de caché y otras lógicas
  });
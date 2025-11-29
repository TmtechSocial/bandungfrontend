// [firebase-messaging-sw.js]
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDDEnkD5H24grVQvG2Ti5lElqblKi9fsmo",
  authDomain: "operasional-apps.firebaseapp.com",
  projectId: "operasional-apps",
  storageBucket: "operasional-apps.appspot.com",
  messagingSenderId: "1055481409220",
  appId: "1:1055481409220:web:38350d8888b93509222391",
  measurementId: "G-0CTHTZMXH6"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: payload.data || {},
    actions: [
      {
        action: 'open',
        title: 'Open App'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Buka aplikasi ketika notification diklik
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clients) {
        // Cek apakah sudah ada window yang terbuka
        for (var i = 0; i < clients.length; i++) {
          var client = clients[i];
          if (client.url.indexOf(self.location.origin) !== -1 && 'focus' in client) {
            return client.focus();
          }
        }
        // Jika tidak ada window yang terbuka, buka yang baru
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

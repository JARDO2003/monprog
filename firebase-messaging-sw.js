// firebase-messaging-sw.js
// Service Worker for Firebase Cloud Messaging

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBZKSBcBeE_ddlqrmNAru_YZRS4tAwRRvk",
  authDomain: "database-5583e.firebaseapp.com",
  databaseURL: "https://database-5583e-default-rtdb.firebaseio.com",
  projectId: "database-5583e",
  storageBucket: "database-5583e.firebasestorage.app",
  messagingSenderId: "299502845257",
  appId: "1:299502845257:web:c77c7f9ebc743abb63ee98",
  measurementId: "G-YK85043ZPR"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Message reçu en arrière-plan:', payload);

  const { title, body, icon } = payload.notification || {};

  self.registration.showNotification(title || 'Nouvelle notification', {
    body: body || '',
    icon: icon || '/icon.png',
    badge: '/icon.png',
    requireInteraction: true,
    data: payload.data || {},
  });
});

// Click on notification → open/focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});

// Handles push messages while the app/tab is NOT in the foreground.
// Must live at the site root (/firebase-messaging-sw.js) — Firebase's
// default service-worker scope requires that exact path, it can't be moved
// into a subfolder without also changing the registration scope in
// src/lib/firebase.ts's navigator.serviceWorker.register() call.
//
// This runs in the service worker's own global scope, not the page's — it
// can only use the compat (non-modular) SDK loaded via importScripts, and
// can't read process.env, so the Firebase config below has to be filled in
// directly with the same public values from your .env (these are all
// public/client-safe values, not secrets).
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAjxrWCBVESFH5yJNtEjDEe8NQ0ArOPZZc",
  authDomain: "jestbot.firebaseapp.com",
  projectId: "jestbot",
  storageBucket: "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  appId: "1:16981214944:web:8413d2a256704f172c7285",
  messagingSenderId: "16981214944"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "New message";
  const body = payload.notification?.body || "";
  self.registration.showNotification(title, {
    body,
    icon: "/favicon-32x32.png",
    data: payload.data || {},
  });
});

// Clicking the OS notification focuses an existing Jesty tab if one is open,
// otherwise opens a new one, instead of doing nothing.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/inbox");
    })
  );
});
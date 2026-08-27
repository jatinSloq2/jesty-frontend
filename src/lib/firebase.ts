// Real Firebase Cloud Messaging wiring for the web push flow the backend
// already implements (see services/fcm.service.ts on the backend — it just
// needs a genuine FCM registration token from this file instead of the old
// crypto.randomUUID() placeholder in notifications-panel.tsx).
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// The VAPID key (Cloud Messaging → Web configuration → "Web Push
// certificates" in the Firebase console) is separate from the API key above
// and required for getToken() to work at all.
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

let app: FirebaseApp | null = null;
function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    // Not configured yet — mirrors fcm.service.ts's no-op-until-configured
    // behavior on the backend, so a missing env var never crashes the app.
    return null;
  }
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  return app;
}

let messagingPromise: Promise<Messaging | null> | null = null;
async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  if (!messagingPromise) {
    messagingPromise = (async () => {
      const supported = await isSupported().catch(() => false);
      const fbApp = getFirebaseApp();
      if (!supported || !fbApp) return null;
      return getMessaging(fbApp);
    })();
  }
  return messagingPromise;
}

// Registers firebase-messaging-sw.js (must live at /public so it's served
// from the site root — FCM requires that exact scope) and exchanges it for
// a real FCM registration token. Call this only after the browser
// Notification permission has already been granted.
export async function requestFcmToken(): Promise<string | null> {
  if (!VAPID_KEY) {
    console.warn("[firebase] NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set — push notifications are disabled.");
    return null;
  }
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  return token || null;
}

// Foreground messages (tab open & focused) don't go through the service
// worker's background handler — this is how those get shown instead.
export async function onForegroundFcmMessage(
  callback: (payload: { title?: string; body?: string; data?: Record<string, string> }) => void
): Promise<() => void> {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    callback({
      title: payload.notification?.title,
      body: payload.notification?.body,
      data: payload.data,
    });
  });
}

export function isFcmConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId && VAPID_KEY);
}
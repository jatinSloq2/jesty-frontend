"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/jesty-toast";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notificationsApi, ApiClientError } from "@/lib/api";
import { isFcmConfigured, onForegroundFcmMessage, requestFcmToken } from "@/lib/firebase";

const STORAGE_KEY = "jesty_device_token";

export function NotificationsPanel() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
    // This is a device/push registration id, not a session credential, so
    // there's no security reason to keep it out of localStorage the way we
    // did for the auth access token — it only ever unlocks push delivery,
    // never an API call.
    setToken(window.localStorage.getItem(STORAGE_KEY));
  }, []);

  // Foreground messages (tab open & focused) skip the service worker's
  // background handler entirely, so without this listener a granted,
  // correctly-registered subscription would still show nothing while the
  // user is actively looking at Jesty.
  useEffect(() => {
    if (!token) return;
    let unsubscribe: (() => void) | undefined;
    onForegroundFcmMessage(({ title, body }) => {
      toast.success(title ? `${title}${body ? ` — ${body}` : ""}` : body || "New message");
    }).then((unsub) => {
      unsubscribe = unsub;
    });
    return () => unsubscribe?.();
  }, [token]);

  const enable = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (!isFcmConfigured()) {
      toast.error("Push notifications aren't configured on this deployment yet.");
      return;
    }
    setBusy(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        toast.error("Notifications were blocked in your browser settings.");
        return;
      }
      const deviceToken = await requestFcmToken();
      if (!deviceToken) {
        toast.error("Couldn't get a push registration token from Firebase.");
        return;
      }
      await notificationsApi.registerDeviceToken(deviceToken, "web");
      window.localStorage.setItem(STORAGE_KEY, deviceToken);
      setToken(deviceToken);
      toast.success("Push notifications enabled");
    } catch (err) {
      console.error("Push registration failed:", err); // add this line
      toast.error(err instanceof ApiClientError ? err.message : "Couldn't register for notifications");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (!token) return;
    setBusy(true);
    try {
      await notificationsApi.unregisterDeviceToken(token);
      window.localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      toast.success("Push notifications disabled");
    } catch {
      toast.error("Couldn't disable notifications");
    } finally {
      setBusy(false);
    }
  };

  if (permission === "unsupported") {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
        <BellOff className="h-6 w-6" />
        <p className="text-sm">This browser doesn't support push notifications.</p>
      </div>
    );
  }

  const enabled = permission === "granted" && !!token;

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center border border-border bg-card text-brand-strong">
        {enabled ? <BellRing className="h-7 w-7" /> : <Bell className="h-7 w-7" />}
      </div>
      <h2 className="mt-4 text-xl font-semibold">Push notifications</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Get notified about new messages when you're not actively looking at Jesty — while the app is backgrounded or
        the tab is closed.
      </p>

      <div className="mt-6">
        {enabled ? (
          <Button variant="outline" onClick={disable} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellOff className="h-4 w-4" />}
            Turn off notifications
          </Button>
        ) : (
          <Button onClick={enable} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            Enable notifications
          </Button>
        )}
      </div>

      {permission === "denied" && (
        <p className="mt-3 text-xs text-destructive">
          Notifications are blocked for this site in your browser settings — allow them there first.
        </p>
      )}
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notificationsApi, ApiClientError } from "@/lib/api";

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
    setToken(window.localStorage.getItem(STORAGE_KEY));
  }, []);

  const enable = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setBusy(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        toast.error("Notifications were blocked in your browser settings.");
        return;
      }
      // NOTE: this generates a placeholder device identifier so the real
      // POST /notifications/device-token flow can be exercised end-to-end.
      // Swap this for Firebase Cloud Messaging's getToken() (with your
      // VAPID key + service worker registered) in a production deployment —
      // the backend already expects a genuine FCM token here.
      const deviceToken = window.localStorage.getItem(STORAGE_KEY) ?? crypto.randomUUID();
      await notificationsApi.registerDeviceToken(deviceToken, "web");
      window.localStorage.setItem(STORAGE_KEY, deviceToken);
      setToken(deviceToken);
      toast.success("Push notifications enabled");
    } catch (err) {
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

"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";

export type SocketStatus = "connected" | "connecting" | "reconnecting" | "disconnected" | "failed";

// Wraps the shared socket.io client (see lib/socket.ts) so any component
// can show live connection state and offer a manual reconnect once the
// automatic retry budget (reconnectionAttempts, set in lib/socket.ts) runs
// out — socket.io stops retrying on its own at that point and just sits
// disconnected until something calls socket.connect() again.
export function useSocketStatus() {
  const { socket } = useAuth();
  const [status, setStatus] = useState<SocketStatus>("connecting");

  useEffect(() => {
    if (!socket) {
      setStatus("disconnected");
      return;
    }

    setStatus(socket.connected ? "connected" : "connecting");

    const onConnect = () => setStatus("connected");
    const onDisconnect = (reason: string) => {
      // A server- or client-initiated deliberate close (e.g. logout) won't
      // auto-reconnect — anything else (network drop, transport error) will,
      // so it's shown as "reconnecting" rather than a dead "disconnected".
      setStatus(reason === "io server disconnect" || reason === "io client disconnect" ? "disconnected" : "reconnecting");
    };
    const onReconnectAttempt = () => setStatus("reconnecting");
    const onReconnectFailed = () => setStatus("failed");
    const onReconnect = () => setStatus("connected");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    // Reconnection lifecycle events live on the Manager (socket.io), not the
    // Socket instance itself.
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.io.on("reconnect_failed", onReconnectFailed);
    socket.io.on("reconnect", onReconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.io.off("reconnect_failed", onReconnectFailed);
      socket.io.off("reconnect", onReconnect);
    };
  }, [socket]);

  const reconnect = useCallback(() => {
    if (!socket) return;
    setStatus("connecting");
    socket.connect();
  }, [socket]);

  return { status, reconnect };
}
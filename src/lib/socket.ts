import { io, type Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:5000";

let socket: Socket | null = null;

// Same access token issued by /auth/login, sent in the handshake — mirrors
// resolveUser() in the backend's middleware/auth.ts.
export function getSocket(token: string): Socket {
  if (socket && socket.connected) return socket;
  if (socket) socket.disconnect();

  socket = io(SOCKET_URL, {
    auth: { token },
    withCredentials: true,
    transports: ["websocket", "polling"],
    // Auto-retry with capped exponential-ish backoff for a while, then stop
    // and let the UI (use-socket-status.ts) offer a manual "Reconnect"
    // button instead of retrying forever in the background.
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
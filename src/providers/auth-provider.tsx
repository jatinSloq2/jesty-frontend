"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, onAuthEvent, setAccessToken } from "@/lib/api";
import { disconnectSocket, getSocket } from "@/lib/socket";
import type { AuthUser } from "@/types";
import type { Socket } from "socket.io-client";

interface AuthContextValue {
  user: AuthUser | null;
  socket: Socket | null;
  isLoading: boolean;
  // True while a silent access-token refresh (proactive timer, or a
  // reactive one triggered by a 401 in lib/api.ts) is in flight. Distinct
  // from isLoading, which only covers the very first "do we have a
  // session at all" check on mount.
  isRefreshing: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithSsoToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Refresh a bit before the access token actually expires so an in-flight
// request never races the expiry. If expiresIn is very short for some
// reason, still leave a small floor so we don't refresh in a tight loop.
const REFRESH_SAFETY_MARGIN_MS = 60_000;
const MIN_REFRESH_DELAY_MS = 5_000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback(
    (expiresIn: number) => {
      clearRefreshTimer();
      const delay = Math.max(expiresIn * 1000 - REFRESH_SAFETY_MARGIN_MS, MIN_REFRESH_DELAY_MS);
      refreshTimer.current = setTimeout(() => {
        // Fire-and-forget — lib/api.ts emits "refreshing"/"refreshed"/
        // "refresh-failed" itself, and the listener below reacts to those.
        authApi.refresh().catch(() => {});
      }, delay);
    },
    [clearRefreshTimer]
  );

  // lib/api.ts emits these both for this proactive timer-driven refresh
  // and for a reactive refresh triggered when any request 401s mid-session
  // (see authorizedFetch in lib/api.ts) — one listener handles both cases.
  useEffect(() => {
    return onAuthEvent((event, data) => {
      if (event === "refreshing") {
        setIsRefreshing(true);
      } else if (event === "refreshed") {
        setIsRefreshing(false);
        if (data?.expiresIn) scheduleRefresh(data.expiresIn);
      } else if (event === "refresh-failed" || event === "logged-out") {
        setIsRefreshing(false);
        clearRefreshTimer();
        setUser(null);
        setSocket(null);
        disconnectSocket();
        router.replace("/login");
      }
    });
  }, [router, scheduleRefresh, clearRefreshTimer]);

  // The access token is memory-only and doesn't survive a hard refresh —
  // only the httpOnly refresh_token cookie does. So on mount we redeem
  // that cookie once to restore the session (this also gets a fresh access
  // token back into memory for the socket handshake, which can't read
  // httpOnly cookies itself) rather than checking localStorage.
  useEffect(() => {
    authApi
      .refresh()
      .then(({ accessToken, expiresIn }) => {
        if (!accessToken) throw new Error("No access token returned");
        setAccessToken(accessToken);
        if (expiresIn) scheduleRefresh(expiresIn);
        return authApi.me().then(({ user: me }) => {
          setUser(me);
          setSocket(getSocket(accessToken));
        });
      })
      .catch(() => {
        setAccessToken(null);
      })
      .finally(() => setIsLoading(false));

    return () => clearRefreshTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authApi.login(email, password);
      setAccessToken(result.accessToken);
      setUser(result.user);
      setSocket(getSocket(result.accessToken));
      scheduleRefresh(result.expiresIn);
      router.push("/inbox");
    },
    [router, scheduleRefresh]
  );

  // Used by /sso/callback: exchanges the one-time SSO handoff token (from
  // the other backend's "Open inbox" button) for a normal Jesty session.
  const loginWithSsoToken = useCallback(
    async (token: string) => {
      const result = await authApi.ssoLogin(token);
      setAccessToken(result.accessToken);
      setUser(result.user);
      setSocket(getSocket(result.accessToken));
      scheduleRefresh(result.expiresIn);
      router.push("/inbox");
    },
    [router, scheduleRefresh]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearRefreshTimer();
      setAccessToken(null);
      disconnectSocket();
      setUser(null);
      setSocket(null);
      router.push("/login");
    }
  }, [router, clearRefreshTimer]);

  return (
    <AuthContext.Provider value={{ user, socket, isLoading, isRefreshing, login, loginWithSsoToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
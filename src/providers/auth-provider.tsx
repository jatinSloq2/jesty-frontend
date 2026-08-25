"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, setAccessToken } from "@/lib/api";
import { disconnectSocket, getSocket } from "@/lib/socket";
import type { AuthUser } from "@/types";
import type { Socket } from "socket.io-client";

interface AuthContextValue {
  user: AuthUser | null;
  socket: Socket | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithSsoToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("jesty_access_token") : null;
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then(({ user: me }) => {
        setUser(me);
        setSocket(getSocket(token));
      })
      .catch(() => {
        setAccessToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    setAccessToken(result.accessToken);
    setUser(result.user);
    setSocket(getSocket(result.accessToken));
    router.push("/inbox");
  }, [router]);

  // Used by /sso/callback: exchanges the one-time SSO handoff token (from
  // the other backend's "Open inbox" button) for a normal Jesty session.
  const loginWithSsoToken = useCallback(async (token: string) => {
    const result = await authApi.ssoLogin(token);
    setAccessToken(result.accessToken);
    setUser(result.user);
    setSocket(getSocket(result.accessToken));
    router.push("/inbox");
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      disconnectSocket();
      setUser(null);
      setSocket(null);
      router.push("/login");
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, socket, isLoading, login, loginWithSsoToken, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useChannelStore } from "@/providers/channel-store";
import { integrationsApi } from "@/lib/api";
import { LeftRail } from "@/components/layout/left-rail";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isRefreshing } = useAuth();
  const router = useRouter();
  const setNumbers = useChannelStore((s) => s.setNumbers);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    integrationsApi
      .list()
      .then(setNumbers)
      .catch(() => setNumbers([]));
  }, [user, setNumbers]);

  // isLoading covers the initial "do we have a session" check on mount.
  // isRefreshing covers a silent access-token refresh later in the
  // session (proactive, or reactive after a request 401'd) — surface the
  // same loading screen for both rather than letting the UI flash broken
  // requests while a refresh is quietly happening underneath it.
  if (isLoading || isRefreshing || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-app">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-app text-foreground">
      <LeftRail />
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
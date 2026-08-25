"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { ApiClientError } from "@/lib/api";

// Landing page for the "Open inbox" SSO handoff from the other backend —
// it redirects the browser here with a one-time ?token=..., which we
// immediately exchange for a normal Jesty session via POST /api/auth/sso
// (see providers/auth-provider.tsx#loginWithSsoToken). Nothing else about
// the embedded-signup flow lives here — this route only does the login step.
function SsoCallbackInner() {
  const { loginWithSsoToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setError("Missing SSO token.");
      return;
    }

    loginWithSsoToken(token).catch((err) => {
      setError(err instanceof ApiClientError ? err.message : "Sign-in failed. The link may have expired.");
    });
  }, [searchParams, loginWithSsoToken]);

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg-app px-4 text-center">
        <p className="text-base text-destructive">{error}</p>
        <button
          type="button"
          onClick={() => router.replace("/login")}
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          Back to login
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg-app px-4">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </main>
  );
}

export default function SsoCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-bg-app px-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </main>
      }
    >
      <SsoCallbackInner />
    </Suspense>
  );
}
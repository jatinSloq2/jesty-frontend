"use client";

import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSocketStatus } from "@/hooks/use-socket-status";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  connected: "Live — connected",
  connecting: "Connecting…",
  reconnecting: "Connection lost — reconnecting…",
  disconnected: "Disconnected",
  failed: "Couldn't reconnect",
};

const DOT_CLASSES: Record<string, string> = {
  connected: "bg-emerald-500",
  connecting: "bg-amber-500 animate-pulse",
  reconnecting: "bg-amber-500 animate-pulse",
  disconnected: "bg-muted-foreground",
  failed: "bg-destructive",
};

// Sits in the left rail so a dropped realtime connection (new messages /
// statuses arriving over the socket) is always visible somewhere, not just
// silently degrading the inbox with no explanation. Only shows a manual
// "Reconnect" affordance once socket.io has exhausted its own automatic
// retry budget (see reconnectionAttempts in lib/socket.ts) — while it's
// still auto-retrying, clicking anything would just race the existing
// attempt.
export function SocketStatusIndicator() {
  const { status, reconnect } = useSocketStatus();
  const showReconnectButton = status === "failed" || status === "disconnected";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={showReconnectButton ? reconnect : undefined}
          className={cn(
            "flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors",
            showReconnectButton && "hover:text-foreground"
          )}
          aria-label={LABELS[status]}
        >
          <span className="relative flex h-9 w-9 items-center justify-center">
            {showReconnectButton ? (
              <RefreshCw className="h-4 w-4" />
            ) : status === "connected" ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            <span className={cn("absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-bg-panel", DOT_CLASSES[status])} />
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        {LABELS[status]}
        {showReconnectButton ? " — click to retry" : ""}
      </TooltipContent>
    </Tooltip>
  );
}
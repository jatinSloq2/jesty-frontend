"use client";

import { useState } from "react";
import gsap from "gsap";
import { Check, CheckCheck, Clock, CornerUpLeft, FileText, Forward, MoreVertical, Play, Smile, AlertCircle } from "lucide-react";
import { useGsapContext } from "@/hooks/use-gsap-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Message } from "@/types";
import { cn, formatClock } from "@/lib/utils";

const QUICK_EMOJI = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function StatusTicks({ status }: { status: Message["status"] }) {
  if (status === "pending") return <Clock className="h-3 w-3 text-tick-sent" />;
  if (status === "failed") return <AlertCircle className="h-3 w-3 text-destructive" />;
  if (status === "read") return <CheckCheck className="h-3.5 w-3.5 text-tick-read" />;
  if (status === "delivered") return <CheckCheck className="h-3.5 w-3.5 text-tick-sent" />;
  return <Check className="h-3.5 w-3.5 text-tick-sent" />;
}

function MediaContent({ message }: { message: Message }) {
  if (message.type === "image" || message.type === "sticker") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={message.mediaUrl} alt={message.caption || "Image"} className="max-h-72 w-full object-cover" />
    );
  }
  if (message.type === "video") {
    return (
      <div className="relative flex h-40 w-64 items-center justify-center bg-black/80 text-white">
        <Play className="h-8 w-8" />
      </div>
    );
  }
  if (message.type === "audio") {
    return <audio controls src={message.mediaUrl} className="w-64" />;
  }
  if (message.type === "document") {
    return (
      <div className="flex items-center gap-2 border border-border bg-card px-3 py-2">
        <FileText className="h-5 w-5 text-brand-strong" />
        <span className="truncate text-sm">{message.caption || message.mediaUrl?.split("/").pop() || "Document"}</span>
      </div>
    );
  }
  return null;
}

export function MessageBubble({
  message,
  onReact,
  onUnreact,
  onReply,
  onForward,
}: {
  message: Message;
  onReact: (emoji: string) => void;
  onUnreact: () => void;
  onReply: () => void;
  onForward: () => void;
}) {
  const outgoing = message.direction === "outbound";
  const [showReactions, setShowReactions] = useState(false);
  const reactions = message.reactions ?? [];

  const scope = useGsapContext<HTMLDivElement>((_ctx, el) => {
    gsap.from(el, {
      autoAlpha: 0,
      y: 10,
      scale: 0.97,
      duration: 0.28,
      ease: "power2.out",
      transformOrigin: outgoing ? "bottom right" : "bottom left",
    });
  }, [message._id]);

  const repliedTo = typeof message.repliedToMessage === "object" ? message.repliedToMessage : undefined;

  return (
    <div ref={scope} className={cn("group flex", outgoing ? "justify-end" : "justify-start")}>
      <div
        className="relative max-w-[70%]"
        onMouseEnter={() => setShowReactions(true)}
        onMouseLeave={() => setShowReactions(false)}
      >
        {/* Hover action row */}
        <div
          className={cn(
            "absolute -top-9 z-10 flex items-center gap-0.5 border border-border bg-card px-1 py-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100",
            outgoing ? "right-0" : "left-0"
          )}
        >
          {QUICK_EMOJI.slice(0, 4).map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReact(emoji)}
              className="flex h-6 w-6 items-center justify-center text-sm hover:bg-accent"
            >
              {emoji}
            </button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-6 w-6 items-center justify-center hover:bg-accent">
                <Smile className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {QUICK_EMOJI.map((emoji) => (
                <DropdownMenuItem key={emoji} onSelect={() => onReact(emoji)}>
                  <span className="mr-2">{emoji}</span> React
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-6 w-6 items-center justify-center hover:bg-accent">
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={onReply}>
                <CornerUpLeft className="h-3.5 w-3.5" /> Reply
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onForward}>
                <Forward className="h-3.5 w-3.5" /> Forward
              </DropdownMenuItem>
              {reactions.length > 0 && <DropdownMenuItem onSelect={onUnreact}>Remove reaction</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          className={cn(
            "relative px-3 py-2.5 text-base shadow-sm",
            outgoing ? "bg-bubble-out" : "bg-bubble-in border border-border"
          )}
        >
          {message.forwardedFromMessage && (
            <p className="mb-1 flex items-center gap-1 text-xs italic text-muted-foreground">
              <Forward className="h-3 w-3" /> Forwarded
            </p>
          )}

          {repliedTo && (
            <div className="mb-1.5 border-l-2 border-brand bg-black/5 px-2 py-1 text-xs text-muted-foreground dark:bg-white/5">
              {repliedTo.text || `[${repliedTo.type}]`}
            </div>
          )}

          {message.type !== "text" && message.type !== "reaction" && message.type !== "system" && (
            <div className="mb-1 -mx-1 -mt-1 overflow-hidden">
              <MediaContent message={message} />
            </div>
          )}

          {message.type === "template" && (
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-strong">Template · {message.templateName}</p>
          )}

          {(message.text || message.caption) && <p className="whitespace-pre-wrap break-words">{message.text || message.caption}</p>}

          {message.status === "failed" && message.errorMessage && (
            <p className="mt-1 text-xs text-destructive">{message.errorMessage}</p>
          )}

          <div className="mt-1.5 flex items-center justify-end gap-1 text-xs text-muted-foreground">
            {formatClock(message.createdAt)}
            {outgoing && <StatusTicks status={message.status} />}
          </div>

          {reactions.length > 0 && (
            <div className="absolute -bottom-3 right-1 flex items-center border border-border bg-card px-1 text-xs shadow-sm">
              {[...new Set(reactions.map((r) => r.emoji))].join(" ")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import gsap from "gsap";
import { Check, CheckCheck, Clock, CornerUpLeft, Copy, FileText, Forward, MoreVertical, Pause, Play, Smile, AlertCircle, Bot, User, Plus, Mic } from "lucide-react";
import { toast } from "@/components/ui/jesty-toast";
import { useGsapContext } from "@/hooks/use-gsap-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Message } from "@/types";
import { cn, formatClock } from "@/lib/utils";
import EmojiPicker, { Theme, EmojiStyle } from "emoji-picker-react";

const QUICK_EMOJI = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function StatusTicks({ status }: { status: Message["status"] }) {
  if (status === "pending") return <Clock className="h-3 w-3 text-tick-sent" />;
  if (status === "failed") return <AlertCircle className="h-3 w-3 text-destructive" />;
  if (status === "read") return <CheckCheck className="h-3.5 w-3.5 text-tick-read" />;
  if (status === "delivered") return <CheckCheck className="h-3.5 w-3.5 text-tick-sent" />;
  return <Check className="h-3.5 w-3.5 text-tick-sent" />;
}

function MediaContent({ message }: { message: Message }) {
  if (message.type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={message.mediaUrl} alt={message.caption || "Image"} className="max-h-72 w-full object-cover" />
    );
  }
  if (message.type === "sticker") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={message.mediaUrl} alt="Sticker" className="h-40 w-40 object-contain" draggable={false} />
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
    return <VoiceMessagePlayer message={message} outgoing={message.direction === "outbound"} />;
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

// A compact WhatsApp-style voice-note player: one play/pause button, a
// scrub bar, and elapsed/total time — instead of the bulky native <audio
// controls> bar, which doesn't fit the bubble and looks out of place
// against a solid brand-orange background.
function VoiceMessagePlayer({ message, outgoing }: { message: Message; outgoing: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0–1
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  const formatTime = (s: number) => {
    if (!Number.isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${r.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      el.play().catch(() => undefined);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    el.currentTime = ratio * duration;
  };

  const barColor = outgoing ? "bg-bubble-out-foreground/30" : "bg-muted-foreground/25";
  const barFill = outgoing ? "bg-bubble-out-foreground" : "bg-brand";
  const iconWrap = outgoing ? "bg-bubble-out-foreground/15 text-bubble-out-foreground" : "bg-brand/10 text-brand-strong";

  return (
    <div className="flex w-60 items-center gap-2 py-1">
      <audio
        ref={audioRef}
        src={message.mediaUrl}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          setCurrent(e.currentTarget.currentTime);
          setProgress(e.currentTarget.duration ? e.currentTarget.currentTime / e.currentTarget.duration : 0);
        }}
        className="hidden"
      />
      <button
        onClick={togglePlay}
        className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors", iconWrap)}
        aria-label={playing ? "Pause voice message" : "Play voice message"}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-0.5" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className={cn("relative h-1.5 w-full cursor-pointer overflow-hidden", barColor)} onClick={seek}>
          <div className={cn("absolute inset-y-0 left-0", barFill)} style={{ width: `${progress * 100}%` }} />
        </div>
        <div className={cn("mt-1 flex items-center gap-1 text-[11px]", outgoing ? "text-bubble-out-foreground/80" : "text-muted-foreground")}>
          <Mic className="h-2.5 w-2.5" />
          {formatTime(playing || current ? current : duration)}
        </div>
      </div>
    </div>
  );
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
  const { resolvedTheme } = useTheme();
  const outgoing = message.direction === "outbound";
  const isSticker = message.type === "sticker";
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickPicker, setShowQuickPicker] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const reactions = message.reactions ?? [];
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  const copyText = message.text || message.caption || (message.type !== "text" ? `[${message.type}]` : "");
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      toast.success("Message copied");
    } catch {
      toast.error("Couldn't copy message");
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    onReact(emoji);
    setShowQuickPicker(false);
    setShowFullPicker(false);
  };

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowQuickPicker(false);
        setShowFullPicker(false);
      }
    };

    if (showQuickPicker || showFullPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showQuickPicker, showFullPicker]);

  return (
    <div 
      ref={scope} 
      className={cn("group flex", outgoing ? "justify-end" : "justify-start")}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      <div className="relative max-w-[70%] flex items-start gap-2">
        {/* For outgoing messages: Both buttons on the LEFT */}
        {/* For incoming messages: Both buttons on the RIGHT */}
        <div
          className={cn(
            "flex-shrink-0 transition-all duration-200 flex items-center gap-1",
            isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none",
            // Both buttons on the same side
            outgoing ? "order-0" : "order-2"
          )}
        >
          {/* Emoji button */}
          <button
            ref={buttonRef}
            onClick={() => setShowQuickPicker(!showQuickPicker)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border hover:bg-accent shadow-sm transition-colors"
          >
            <Smile className="h-4 w-4" />
          </button>

          {/* More options dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border hover:bg-accent shadow-sm transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={onReply}>
                <CornerUpLeft className="h-3.5 w-3.5" /> Reply
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleCopy}>
                <Copy className="h-3.5 w-3.5" /> Copy
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onForward}>
                <Forward className="h-3.5 w-3.5" /> Forward
              </DropdownMenuItem>
              {reactions.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={onUnreact}>Remove reaction</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Message bubble - always in the middle */}
        <div className="flex-1 order-1">
          <div
            className={cn(
              "relative text-base",
              isSticker
                ? "w-40" // stickers ship chrome-less, like WhatsApp — no fill/border/shadow
                : cn(
                    "px-3 py-2.5 shadow-sm",
                    outgoing ? "bg-bubble-out text-bubble-out-foreground" : "bg-bubble-in border border-border"
                  )
            )}
          >
            {message.senderType && (
              <p
                className={cn(
                  "mb-1 flex items-center gap-1 text-xs font-medium",
                  outgoing
                    ? "text-bubble-out-foreground/85"
                    : message.senderType === "bot"
                      ? "text-brand-strong"
                      : "text-muted-foreground"
                )}
              >
                {message.senderType === "bot" ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                {message.senderType === "bot" ? "Bot" : "Agent"}
                {message.senderName ? ` · ${message.senderName}` : ""}
              </p>
            )}

            {message.forwardedFromMessage && (
              <p
                className={cn(
                  "mb-1 flex items-center gap-1 text-xs italic",
                  outgoing ? "text-bubble-out-foreground/80" : "text-muted-foreground"
                )}
              >
                <Forward className="h-3 w-3" /> Forwarded
              </p>
            )}

            {repliedTo && (
              <div
                className={cn(
                  "mb-1.5 border-l-2 px-2 py-1 text-xs",
                  outgoing
                    ? "border-bubble-out-foreground/50 bg-black/10 text-bubble-out-foreground/85"
                    : "border-brand bg-black/5 text-muted-foreground dark:bg-white/5"
                )}
              >
                {repliedTo.text || `[${repliedTo.type}]`}
              </div>
            )}

            {message.type !== "text" && message.type !== "reaction" && message.type !== "system" && (
              <div className={cn(!isSticker && "mb-1 -mx-1 -mt-1 overflow-hidden")}>
                <MediaContent message={message} />
              </div>
            )}

            {message.type === "template" && (
              <p className={cn("mb-1 text-xs font-medium uppercase tracking-wide", outgoing ? "text-bubble-out-foreground/85" : "text-brand-strong")}>
                Template · {message.templateName}
              </p>
            )}

            {(message.text || message.caption) && <p className="whitespace-pre-wrap break-words">{message.text || message.caption}</p>}

            {message.status === "failed" && message.errorMessage && (
              <p className={cn("mt-1 text-xs", outgoing ? "text-bubble-out-foreground" : "text-destructive")}>{message.errorMessage}</p>
            )}

            {!isSticker && (
              <div
                className={cn(
                  "mt-1.5 flex items-center justify-end gap-1 text-xs",
                  outgoing ? "text-bubble-out-foreground/75" : "text-muted-foreground"
                )}
              >
                {formatClock(message.createdAt)}
                {outgoing && <StatusTicks status={message.status} />}
              </div>
            )}
            {isSticker && (
              <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                {formatClock(message.createdAt)}
                {outgoing && <StatusTicks status={message.status} />}
              </div>
            )}

            {reactions.length > 0 && (
              <div className="absolute -bottom-3 right-1 flex items-center border border-border bg-card px-1 text-xs shadow-sm">
                {[...new Set(reactions.map((r) => r.emoji))].join(" ")}
              </div>
            )}
          </div>
        </div>

        {/* Quick emoji picker - positioned on the side */}
        {showQuickPicker && (
          <div 
            ref={pickerRef}
            className={cn(
              "absolute z-20 top-0",
              // For outgoing: picker on the LEFT of the buttons
              // For incoming: picker on the RIGHT of the buttons
              outgoing ? "right-full mr-2" : "left-full ml-2"
            )}
          >
            <div className="bg-card border border-border rounded-lg shadow-lg p-2 min-w-[200px]">
              <div className="flex flex-wrap gap-1">
                {QUICK_EMOJI.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="flex h-8 w-8 items-center justify-center text-lg hover:bg-accent rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
                
                {/* Plus button to open full emoji picker */}
                <button
                  onClick={() => {
                    setShowFullPicker(true);
                    setShowQuickPicker(false);
                  }}
                  className="flex h-8 w-8 items-center justify-center text-sm hover:bg-accent rounded transition-colors border border-dashed border-border"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full emoji picker - positioned on the side */}
        {showFullPicker && (
          <div 
            ref={pickerRef}
            className={cn(
              "absolute z-30 top-0",
              // For outgoing: picker on the LEFT
              // For incoming: picker on the RIGHT
              outgoing ? "right-full mr-2" : "left-full ml-2"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <div className="overflow-hidden border border-border bg-card shadow-xl">
                <EmojiPicker
                  onEmojiClick={(emojiData) => handleEmojiSelect(emojiData.emoji)}
                  theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
                  emojiStyle={EmojiStyle.NATIVE}
                  width={320}
                  height={380}
                  skinTonesDisabled={false}
                  searchDisabled={false}
                  previewConfig={{ showPreview: true }}
                  lazyLoadEmojis
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { Check, CheckCheck, Clock, CornerUpLeft, Copy, FileText, Forward, MoreVertical, Play, Smile, AlertCircle, Bot, User, Plus } from "lucide-react";
import { toast } from "sonner";
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
import EmojiPicker from "emoji-picker-react";

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
        // Don't close pickers immediately on mouse leave
        // They'll close via click outside
      }}
    >
      <div className="relative max-w-[70%] flex items-start gap-2">
        {/* Emoji button - appears on hover on the side */}
        <div
          className={cn(
            "flex-shrink-0 transition-all duration-200",
            isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none",
            outgoing ? "order-2" : "order-0"
          )}
        >
          <button
            ref={buttonRef}
            onClick={() => setShowQuickPicker(!showQuickPicker)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border hover:bg-accent shadow-sm transition-colors"
          >
            <Smile className="h-4 w-4" />
          </button>
        </div>

        {/* Message bubble */}
        <div className={cn("flex-1", outgoing ? "order-1" : "order-1")}>
          <div
            className={cn(
              "relative px-3 py-2.5 text-base shadow-sm",
              outgoing ? "bg-bubble-out" : "bg-bubble-in border border-border"
            )}
          >
            {message.senderType && (
              <p
                className={cn(
                  "mb-1 flex items-center gap-1 text-xs font-medium",
                  message.senderType === "bot" ? "text-brand-strong" : "text-muted-foreground"
                )}
              >
                {message.senderType === "bot" ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                {message.senderType === "bot" ? "Bot" : "Agent"}
                {message.senderName ? ` · ${message.senderName}` : ""}
              </p>
            )}

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

        {/* Quick emoji picker - positioned on the side */}
        {showQuickPicker && (
          <div 
            ref={pickerRef}
            className={cn(
              "absolute z-20 top-0",
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
              outgoing ? "right-full mr-2" : "left-full ml-2"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-border">
                <EmojiPicker
                  onEmojiClick={(emojiData) => handleEmojiSelect(emojiData.emoji)}
                  width={320}
                  height={380}
                  skinTonesDisabled={false}
                  searchDisabled={false}
                />
              </div>
            </div>
          </div>
        )}

        {/* More options dropdown - appears on hover on the side */}
        <div
          className={cn(
            "flex-shrink-0 transition-all duration-200",
            isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none",
            outgoing ? "order-3" : "order-0"
          )}
        >
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
      </div>
    </div>
  );
}
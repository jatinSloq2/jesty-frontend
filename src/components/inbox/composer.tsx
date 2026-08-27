"use client";

import { useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Mic, Paperclip, Send, Smile, Sticker, Trash2, X } from "lucide-react";
import gsap from "gsap";
import EmojiPicker, { Theme, EmojiStyle, type EmojiClickData } from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StickerPicker } from "@/components/inbox/sticker-picker";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import type { Message } from "@/types";

const MEDIA_TYPE_BY_MIME = (mime: string): "image" | "video" | "audio" | "document" => {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
};

function formatRecordingTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Composer({
  replyTo,
  onCancelReply,
  onSendText,
  onSendFile,
}: {
  replyTo: Message | null;
  onCancelReply: () => void;
  onSendText: (text: string) => Promise<void>;
  onSendFile: (file: File, type: ReturnType<typeof MEDIA_TYPE_BY_MIME> | "sticker") => Promise<void>;
}) {
  const { resolvedTheme } = useTheme();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const voice = useVoiceRecorder();

  const bounceSend = () => {
    if (!sendButtonRef.current) return;
    gsap.fromTo(sendButtonRef.current, { scale: 0.8 }, { scale: 1, duration: 0.35, ease: "back.out(3)" });
  };

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    bounceSend();
    try {
      await onSendText(trimmed);
      setText("");
    } finally {
      setSending(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSending(true);
    try {
      await onSendFile(file, MEDIA_TYPE_BY_MIME(file.type));
    } finally {
      setSending(false);
    }
  };

  const handleEmojiClick = (data: EmojiClickData) => {
    const el = textareaRef.current;
    if (!el) {
      setText((t) => t + data.emoji);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.slice(0, start) + data.emoji + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + data.emoji.length;
    });
  };

  const sendSticker = async (file: File) => {
    setStickerOpen(false);
    setSending(true);
    try {
      await onSendFile(file, "sticker");
    } finally {
      setSending(false);
    }
  };

  const startRecording = () => voice.start();

  const cancelRecording = async () => {
    await voice.cancel();
  };

  const finishRecording = async () => {
    const blob = await voice.stop();
    if (!blob) return;
    setSending(true);
    try {
      const ext = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
      const file = new File([blob], `voice-note.${ext}`, { type: blob.type });
      await onSendFile(file, "audio");
    } finally {
      setSending(false);
    }
  };

  const isRecording = voice.state.status === "recording";
  const canSendText = text.trim().length > 0;

  return (
    <div className="border-t border-border bg-bg-panel">
      {voice.state.error && (
        <div className="flex items-center justify-between border-b border-border bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {voice.state.error}
        </div>
      )}

      {replyTo && !isRecording && (
        <div className="flex items-center justify-between border-b border-border bg-accent px-4 py-2">
          <div className="min-w-0 border-l-2 border-brand pl-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Replying to</p>
            <p className="truncate">{replyTo.text || `[${replyTo.type}]`}</p>
          </div>
          <button onClick={onCancelReply} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {isRecording ? (
        // Locked recording bar — mirrors WhatsApp's "slide to cancel" affordance
        // but with explicit buttons instead of a swipe gesture (more reliable
        // across trackpads/touch devices).
        <div className="flex items-center gap-3 p-3">
          <Button variant="ghost" size="icon" onClick={cancelRecording} title="Discard recording" className="shrink-0 text-destructive">
            <Trash2 className="h-5 w-5" />
          </Button>
          <div className="flex flex-1 items-center gap-2 border border-destructive/30 bg-destructive/5 px-3 py-2">
            <span className="jesty-rec-dot h-2.5 w-2.5 rounded-full bg-destructive" />
            <span className="text-sm font-medium text-destructive">Recording…</span>
            <span className="ml-auto font-mono text-sm text-muted-foreground">{formatRecordingTime(voice.state.seconds)}</span>
          </div>
          <Button size="icon" onClick={finishRecording} disabled={sending} className="shrink-0" title="Send voice note">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-end gap-2 p-3">
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" type="button" title="Emoji" className="shrink-0">
                <Smile className="h-5 w-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-auto border-0 bg-transparent p-0 shadow-none">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
                emojiStyle={EmojiStyle.NATIVE}
                width={320}
                height={380}
                searchDisabled={false}
                previewConfig={{ showPreview: true }}
                lazyLoadEmojis
              />
            </PopoverContent>
          </Popover>

          <Popover open={stickerOpen} onOpenChange={setStickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" type="button" title="Stickers" className="shrink-0">
                <Sticker className="h-5 w-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-auto p-0">
              <StickerPicker onSend={sendSticker} disabled={sending} />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            type="button"
            title="Attach"
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} />

          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Type a message"
            className="max-h-32 min-h-9 flex-1 resize-none py-2"
            rows={1}
          />

          {canSendText ? (
            <Button ref={sendButtonRef} size="icon" onClick={submit} disabled={sending} className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              type="button"
              onClick={startRecording}
              disabled={sending}
              className="shrink-0"
              title="Record a voice note"
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
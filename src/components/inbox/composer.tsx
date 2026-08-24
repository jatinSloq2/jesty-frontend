"use client";

import { useRef, useState } from "react";
import { Paperclip, Send, SmilePlus, X } from "lucide-react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Message } from "@/types";

const MEDIA_TYPE_BY_MIME = (mime: string): "image" | "video" | "audio" | "document" => {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
};

export function Composer({
  replyTo,
  onCancelReply,
  onSendText,
  onSendFile,
}: {
  replyTo: Message | null;
  onCancelReply: () => void;
  onSendText: (text: string) => Promise<void>;
  onSendFile: (file: File, type: ReturnType<typeof MEDIA_TYPE_BY_MIME>) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);

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

  return (
    <div className="border-t border-border bg-bg-panel">
      {replyTo && (
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
      <div className="flex items-end gap-2 p-3">
        <Button variant="ghost" size="icon" type="button" title="Emoji" className="shrink-0">
          <SmilePlus className="h-5 w-5 text-muted-foreground" />
        </Button>
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

        <Button ref={sendButtonRef} size="icon" onClick={submit} disabled={sending || !text.trim()} className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Hourglass, Info, Loader2 } from "lucide-react";
import gsap from "gsap";
import { conversationsApi, messagesApi, ApiClientError } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { useGsapContext } from "@/hooks/use-gsap-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "@/components/inbox/message-bubble";
import { Composer } from "@/components/inbox/composer";
import { TemplatePicker } from "@/components/inbox/template-picker";
import { ContactDrawer } from "@/components/inbox/contact-drawer";
import { ForwardDialog } from "@/components/inbox/forward-dialog";
import type { Conversation, Message } from "@/types";
import { formatDaySeparator, initials } from "@/lib/utils";

const STATUS_OPTIONS: Conversation["status"][] = ["open", "pending", "closed"];

export function ChatPane({ conversationId }: { conversationId: string }) {
  const { socket } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [forwardId, setForwardId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scope = useGsapContext<HTMLDivElement>((_ctx, el) => {
    gsap.from(el, { autoAlpha: 0, duration: 0.25, ease: "power1.out" });
  }, [conversationId]);

  // Load conversation + first page of messages, join the socket room.
  useEffect(() => {
    setLoading(true);
    setReplyTo(null);
    Promise.all([conversationsApi.get(conversationId), conversationsApi.messages(conversationId, 1, 50)])
      .then(([conv, msgs]) => {
        setConversation(conv);
        setMessages(msgs.data);
        conversationsApi.markRead(conversationId).catch(() => undefined);
      })
      .finally(() => setLoading(false));

    socket?.emit("conversation:join", conversationId);
    return () => {
      socket?.emit("conversation:leave", conversationId);
    };
  }, [conversationId, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!socket) return;
    const onNewMessage = (message: Message) => {
      if (message.conversation !== conversationId) return;
      setMessages((prev) => (prev.some((m) => m._id === message._id) ? prev : [...prev, message]));
    };
    const onStatus = (status: { messageId: string; status: Message["status"] }) => {
      setMessages((prev) => prev.map((m) => (m._id === status.messageId ? { ...m, status: status.status } : m)));
    };
    const onReaction = (payload: { messageId: string; emoji: string; from: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === payload.messageId
            ? {
                ...m,
                reactions: payload.emoji
                  ? [...m.reactions.filter((r) => r.waId !== payload.from), { emoji: payload.emoji, waId: payload.from, reactedAt: new Date().toISOString() }]
                  : m.reactions.filter((r) => r.waId !== payload.from),
              }
            : m
        )
      );
    };
    socket.on("message:new", onNewMessage);
    socket.on("message:status", onStatus);
    socket.on("message:reaction", onReaction);
    return () => {
      socket.off("message:new", onNewMessage);
      socket.off("message:status", onStatus);
      socket.off("message:reaction", onReaction);
    };
  }, [socket, conversationId]);

  const sendText = async (text: string) => {
    try {
      const message = await messagesApi.send({
        conversationId,
        type: "text",
        text,
        replyToMessageId: replyTo?._id,
      });
      setMessages((prev) => [...prev, message]);
      setReplyTo(null);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Message failed to send");
    }
  };

  const sendFile = async (file: File, type: "image" | "video" | "audio" | "document") => {
    try {
      const message = await messagesApi.upload({ conversationId, type, file, replyToMessageId: replyTo?._id ?? undefined });
      setMessages((prev) => [...prev, message]);
      setReplyTo(null);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Upload failed");
    }
  };

  const sendTemplate = async (templateName: string, languageCode: string) => {
    try {
      const message = await messagesApi.send({ conversationId, type: "template", templateName, languageCode });
      setMessages((prev) => [...prev, message]);
      toast.success("Template sent");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Template failed to send");
    }
  };

  const updateStatus = async (status: Conversation["status"]) => {
    if (!conversation) return;
    const prev = conversation;
    setConversation({ ...conversation, status });
    try {
      await conversationsApi.updateStatus(conversationId, status);
    } catch {
      setConversation(prev);
      toast.error("Couldn't update status");
    }
  };

  const react = async (message: Message, emoji: string) => {
    try {
      await messagesApi.react(message._id, emoji);
    } catch {
      toast.error("Reaction failed");
    }
  };
  const unreact = async (message: Message) => {
    try {
      await messagesApi.unreact(message._id);
    } catch {
      toast.error("Couldn't remove reaction");
    }
  };

  if (loading || !conversation) {
    return (
      <div className="flex flex-1 items-center justify-center bg-bg-chat">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const name = conversation.contact?.name || conversation.contact?.phoneNumber || conversation.waId;

  let lastDay = "";

  return (
    <div ref={scope} className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-bg-panel px-4 py-2.5">
        <button className="flex min-w-0 items-center gap-3 text-left" onClick={() => setDrawerOpen(true)}>
          <Avatar className="h-9 w-9">
            <AvatarImage src={conversation.contact?.avatarUrl} alt={name} />
            <AvatarFallback>{initials(name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{name}</p>
            <p className="truncate text-sm text-muted-foreground">{conversation.contact?.phoneNumber}</p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {!conversation.canSendFreeform && (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <Hourglass className="h-3 w-3" /> Window closed — template only
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="capitalize">
                {conversation.status}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {STATUS_OPTIONS.map((s) => (
                <DropdownMenuItem key={s} onSelect={() => updateStatus(s)} className="capitalize">
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)}>
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-bg-chat px-4 py-4">
        {messages.map((message) => {
          const day = formatDaySeparator(message.createdAt);
          const showSeparator = day !== lastDay;
          lastDay = day;
          return (
            <div key={message._id}>
              {showSeparator && (
                <div className="my-3 flex justify-center">
                  <span className="bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">{day}</span>
                </div>
              )}
              <MessageBubble
                message={message}
                onReact={(emoji) => react(message, emoji)}
                onUnreact={() => unreact(message)}
                onReply={() => setReplyTo(message)}
                onForward={() => setForwardId(message._id)}
              />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {conversation.canSendFreeform ? (
        <Composer replyTo={replyTo} onCancelReply={() => setReplyTo(null)} onSendText={sendText} onSendFile={sendFile} />
      ) : (
        <TemplatePicker onSend={sendTemplate} />
      )}

      <ContactDrawer conversation={conversation} open={drawerOpen} onOpenChange={setDrawerOpen} />
      <ForwardDialog open={!!forwardId} onOpenChange={(o) => !o && setForwardId(null)} messageId={forwardId} excludeConversationId={conversationId} />
    </div>
  );
}

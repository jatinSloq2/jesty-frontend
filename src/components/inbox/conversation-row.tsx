"use client";

import Link from "next/link";
import { Hourglass } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Conversation } from "@/types";
import { cn, formatListTimestamp, initials } from "@/lib/utils";

export function ConversationRow({ conversation, active }: { conversation: Conversation; active: boolean }) {
  const name = conversation.contact?.name || conversation.contact?.phoneNumber || conversation.waId;

  return (
    <Link
      href={`/inbox/${conversation._id}`}
      data-row
      className={cn(
        "flex items-center gap-3 border-b border-border px-3 py-2.5 transition-colors hover:bg-accent",
        active && "bg-accent"
      )}
    >
      <Avatar className="h-11 w-11 shrink-0">
        <AvatarImage src={conversation.contact?.avatarUrl} alt={name} />
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-base font-semibold">{name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{formatListTimestamp(conversation.lastMessageAt)}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1 truncate text-sm text-muted-foreground">
            {!conversation.canSendFreeform && <Hourglass className="h-3 w-3 shrink-0" />}
            <span className="truncate">{conversation.lastMessagePreview || "No messages yet"}</span>
          </span>
          {conversation.unreadCount > 0 && (
            <span className="pill-circle flex h-5 min-w-5 shrink-0 items-center justify-center bg-unread-badge px-1 text-xs font-semibold text-white">
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

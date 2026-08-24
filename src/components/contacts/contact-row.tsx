"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ContactWithRelations } from "@/types";
import { initials } from "@/lib/utils";

export function ContactRow({ contact, onClick }: { contact: ContactWithRelations; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-accent"
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={contact.avatarUrl} alt={contact.name} />
        <AvatarFallback>{initials(contact.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{contact.name}</span>
          {contact.isBlocked && (
            <Badge variant="destructive" className="shrink-0">
              Blocked
            </Badge>
          )}
        </div>
        <p className="truncate text-sm text-muted-foreground">{contact.phoneNumber}</p>
      </div>
      {contact.tags.length > 0 && (
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          {contact.tags.slice(0, 3).map((tag) => (
            <span key={tag._id} className="flex items-center gap-1 border border-border px-2 py-0.5 text-xs">
              <span className="h-2 w-2" style={{ backgroundColor: tag.color }} />
              {tag.name}
            </span>
          ))}
          {contact.tags.length > 3 && <span className="text-xs text-muted-foreground">+{contact.tags.length - 3}</span>}
        </div>
      )}
    </button>
  );
}

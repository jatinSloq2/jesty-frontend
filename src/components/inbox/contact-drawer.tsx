"use client";

import { useState } from "react";
import { toast } from "@/components/ui/jesty-toast";
import { Ban, ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { contactsApi } from "@/lib/api";
import type { Conversation } from "@/types";
import { initials } from "@/lib/utils";

export function ContactDrawer({
  conversation,
  open,
  onOpenChange,
}: {
  conversation: Conversation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const contact = conversation.contact;
  const [blocked, setBlocked] = useState(contact?.isBlocked ?? false);
  const [pending, setPending] = useState(false);

  const toggleBlock = async () => {
    if (!contact) return;
    setPending(true);
    try {
      await contactsApi.setBlocked(contact._id, !blocked);
      setBlocked((b) => !b);
      toast.success(blocked ? "Contact unblocked" : "Contact blocked");
    } catch {
      toast.error("Couldn't update block status");
    } finally {
      setPending(false);
    }
  };

  if (!contact) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Contact info</SheetTitle>
          </SheetHeader>
          <p className="p-6 text-sm text-muted-foreground">No contact details available.</p>
        </SheetContent>
      </Sheet>
    );
  }

  const tags = contact.tags ?? [];
  const groups = contact.groups ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Contact info</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col items-center gap-3 border-b border-border p-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={contact.avatarUrl} alt={contact.name} />
            <AvatarFallback className="text-lg">{initials(contact.name)}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="text-base font-semibold">{contact.name}</p>
            <p className="text-sm text-muted-foreground">{contact.phoneNumber}</p>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {tags.length === 0 && <p className="text-sm text-muted-foreground">No tags</p>}
              {tags.map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Groups</h3>
            <div className="flex flex-wrap gap-1.5">
              {groups.length === 0 && <p className="text-sm text-muted-foreground">No groups</p>}
              {groups.map((g) => (
                <Badge key={g} variant="outline">
                  {g}
                </Badge>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Custom attributes</h3>
            <div className="space-y-1">
              {Object.keys(contact.attributes ?? {}).length === 0 && (
                <p className="text-sm text-muted-foreground">No attributes set</p>
              )}
              {Object.entries(contact.attributes ?? {}).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-border py-1 text-sm">
                  <span className="text-muted-foreground">{key}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <Button variant={blocked ? "outline" : "destructive"} className="w-full" onClick={toggleBlock} disabled={pending}>
            {blocked ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
            {blocked ? "Unblock contact" : "Block contact"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

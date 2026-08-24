"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { conversationsApi, messagesApi } from "@/lib/api";
import type { Conversation } from "@/types";
import { cn, initials } from "@/lib/utils";

export function ForwardDialog({
  open,
  onOpenChange,
  messageId,
  excludeConversationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string | null;
  excludeConversationId: string;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    conversationsApi.list({ page: 1, limit: 50 }).then((res) => {
      setConversations(res.data.filter((c) => c._id !== excludeConversationId));
    });
    setSelected([]);
  }, [open, excludeConversationId]);

  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = async () => {
    if (!messageId || selected.length === 0) return;
    setSending(true);
    try {
      const results = (await messagesApi.forward(messageId, selected)) as Array<{ success: boolean; error?: string }>;
      const failed = results.filter((r) => !r.success).length;
      if (failed > 0) toast.warning(`Forwarded, but ${failed} conversation(s) failed`);
      else toast.success("Message forwarded");
      onOpenChange(false);
    } catch {
      toast.error("Forward failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Forward message</DialogTitle>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto">
          {conversations.map((c) => {
            const name = c.contact?.name || c.waId;
            const checked = selected.includes(c._id);
            return (
              <button
                key={c._id}
                onClick={() => toggle(c._id)}
                className={cn("flex w-full items-center gap-3 px-2 py-2 text-left hover:bg-accent", checked && "bg-accent")}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={c.contact?.avatarUrl} alt={name} />
                  <AvatarFallback>{initials(name)}</AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-sm">{name}</span>
                <span className={cn("h-4 w-4 border border-border", checked && "bg-brand border-brand")} />
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={selected.length === 0 || sending}>
            {sending && <Loader2 className="h-4 w-4 animate-spin" />}
            Forward{selected.length > 0 ? ` (${selected.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

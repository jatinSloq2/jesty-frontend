"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/jesty-toast";
import { Loader2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { contactsApi, groupsApi } from "@/lib/api";
import type { ContactWithRelations, Group } from "@/types";
import { initials } from "@/lib/utils";

export function ManageMembersDialog({
  group,
  open,
  onOpenChange,
  onUpdated,
}: {
  group: Group | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (group: Group) => void;
}) {
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<ContactWithRelations[]>([]);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !group) return;
    setMemberIds(
      new Set((group.contactIds as (string | { _id: string })[]).map((c) => (typeof c === "string" ? c : c._id)))
    );
    setLoading(true);
    contactsApi
      .list({ search: search || undefined, limit: 30 })
      .then((res) => setContacts(res.data))
      .finally(() => setLoading(false));
  }, [open, group, search]);

  const toggle = async (contactId: string, checked: boolean) => {
    if (!group) return;
    setPendingId(contactId);
    try {
      const updated = await groupsApi.updateMembers(group._id, checked ? { add: [contactId] } : { remove: [contactId] });
      setMemberIds((prev) => {
        const next = new Set(prev);
        if (checked) next.add(contactId);
        else next.delete(contactId);
        return next;
      });
      onUpdated(updated);
    } catch {
      toast.error("Couldn't update membership");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Members · {group?.name}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts" className="pl-8" />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading &&
            contacts.map((c) => (
              <label key={c._id} className="flex items-center gap-3 px-1 py-2 text-sm hover:bg-accent">
                <Checkbox
                  checked={memberIds.has(c._id)}
                  disabled={pendingId === c._id}
                  onCheckedChange={(checked) => toggle(c._id, checked === true)}
                />
                <Avatar className="h-7 w-7">
                  <AvatarImage src={c.avatarUrl} alt={c.name} />
                  <AvatarFallback className="text-xs">{initials(c.name)}</AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate">{c.name}</span>
                {pendingId === c._id && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
              </label>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, Loader2, Save, ShieldCheck, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { contactsApi, ApiClientError } from "@/lib/api";
import type { AttributeDef, ContactWithRelations, Group, Tag } from "@/types";
import { initials } from "@/lib/utils";

export function ContactDetailSheet({
  contactId,
  open,
  onOpenChange,
  allTags,
  allGroups,
  allAttributes,
  onUpdated,
  onDeleted,
}: {
  contactId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allTags: Tag[];
  allGroups: Group[];
  allAttributes: AttributeDef[];
  onUpdated: (contact: ContactWithRelations) => void;
  onDeleted: (id: string) => void;
}) {
  const [contact, setContact] = useState<ContactWithRelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [attrValues, setAttrValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open || !contactId) return;
    setLoading(true);
    contactsApi
      .get(contactId)
      .then((c) => {
        setContact(c);
        setSelectedTags(c.tags.map((t) => t._id));
        setSelectedGroups(c.groups.map((g) => g._id));
        setAttrValues(c.attributes ?? {});
        setNotes(c.notes ?? "");
      })
      .finally(() => setLoading(false));
  }, [open, contactId]);

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const save = async () => {
    if (!contact) return;
    setSaving(true);
    try {
      await contactsApi.update(contact._id, {
        tags: selectedTags,
        groups: selectedGroups,
        attributes: attrValues,
        notes,
      });
      const refreshed = await contactsApi.get(contact._id);
      setContact(refreshed);
      onUpdated(refreshed);
      toast.success("Contact updated");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Couldn't save changes");
    } finally {
      setSaving(false);
    }
  };

  const toggleBlock = async () => {
    if (!contact) return;
    setSaving(true);
    try {
      const updated = await contactsApi.setBlocked(contact._id, !contact.isBlocked);
      const refreshed = { ...contact, isBlocked: updated.isBlocked };
      setContact(refreshed);
      onUpdated(refreshed);
      toast.success(refreshed.isBlocked ? "Contact blocked" : "Contact unblocked");
    } catch {
      toast.error("Couldn't update block status");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!contact) return;
    if (!confirm(`Delete ${contact.name}? This can't be undone.`)) return;
    setSaving(true);
    try {
      await contactsApi.remove(contact._id);
      onDeleted(contact._id);
      onOpenChange(false);
      toast.success("Contact deleted");
    } catch {
      toast.error("Couldn't delete the contact");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Contact</SheetTitle>
        </SheetHeader>

        {(loading || !contact) ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 p-6">
            <div className="flex flex-col items-center gap-2 border-b border-border pb-5">
              <Avatar className="h-16 w-16">
                <AvatarImage src={contact.avatarUrl} alt={contact.name} />
                <AvatarFallback className="text-lg">{initials(contact.name)}</AvatarFallback>
              </Avatar>
              <p className="text-base font-semibold">{contact.name}</p>
              <p className="text-sm text-muted-foreground">{contact.phoneNumber}</p>
              {contact.isBlocked && <Badge variant="destructive">Blocked</Badge>}
            </div>

            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tags</h3>
              <div className="space-y-1.5">
                {allTags.length === 0 && <p className="text-sm text-muted-foreground">No tags exist yet.</p>}
                {allTags.map((tag) => (
                  <label key={tag._id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedTags.includes(tag._id)}
                      onCheckedChange={() => toggle(selectedTags, setSelectedTags, tag._id)}
                    />
                    <span className="h-3 w-3" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Groups</h3>
              <div className="space-y-1.5">
                {allGroups.length === 0 && <p className="text-sm text-muted-foreground">No groups exist yet.</p>}
                {allGroups.map((group) => (
                  <label key={group._id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedGroups.includes(group._id)}
                      onCheckedChange={() => toggle(selectedGroups, setSelectedGroups, group._id)}
                    />
                    {group.name}
                  </label>
                ))}
              </div>
            </section>

            {allAttributes.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Custom attributes</h3>
                <div className="space-y-3">
                  {allAttributes.map((attr) => (
                    <div key={attr._id} className="space-y-1">
                      <Label htmlFor={`attr-${attr._id}`}>{attr.label}</Label>
                      <Input
                        id={`attr-${attr._id}`}
                        value={attrValues[attr.key] ?? ""}
                        onChange={(e) => setAttrValues((prev) => ({ ...prev, [attr.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-1.5">
              <Label htmlFor="contact-notes">Notes</Label>
              <Textarea id="contact-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </section>

            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save changes
            </Button>

            <div className="flex gap-2">
              <Button variant={contact.isBlocked ? "outline" : "secondary"} className="flex-1" onClick={toggleBlock} disabled={saving}>
                {contact.isBlocked ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                {contact.isBlocked ? "Unblock" : "Block"}
              </Button>
              <Button variant="destructive" className="flex-1" onClick={remove} disabled={saving}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

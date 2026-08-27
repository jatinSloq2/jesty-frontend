"use client";

import { useState } from "react";
import { toast } from "@/components/ui/jesty-toast";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { groupsApi, ApiClientError } from "@/lib/api";
import type { Group } from "@/types";

export function GroupFormDialog({
  group,
  onSaved,
  trigger,
}: {
  group?: Group;
  onSaved: (group: Group) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const saved = group
        ? await groupsApi.update(group._id, { name: name.trim(), description: description.trim() || undefined })
        : await groupsApi.create({ name: name.trim(), description: description.trim() || undefined });
      onSaved(saved);
      toast.success(group ? "Group updated" : "Group created");
      setOpen(false);
      if (!group) {
        setName("");
        setDescription("");
      }
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Couldn't save the group");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{group ? "Edit group" : "New group"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="group-name">Name</Label>
            <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Delhi customers" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="group-description">Description</Label>
            <Textarea id="group-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={saving || !name.trim()} className="w-full">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {group ? "Save changes" : "Create group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NewGroupTrigger() {
  return (
    <Button>
      <Plus className="h-4 w-4" /> New group
    </Button>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupFormDialog } from "@/components/groups/group-form-dialog";
import { groupsApi } from "@/lib/api";
import type { Group } from "@/types";

export function GroupCard({
  group,
  onUpdated,
  onDeleted,
  onManageMembers,
}: {
  group: Group;
  onUpdated: (group: Group) => void;
  onDeleted: (id: string) => void;
  onManageMembers: (group: Group) => void;
}) {
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!confirm(`Delete the "${group.name}" group?`)) return;
    setBusy(true);
    try {
      await groupsApi.remove(group._id);
      onDeleted(group._id);
      toast.success("Group deleted");
    } catch {
      toast.error("Couldn't delete the group");
    } finally {
      setBusy(false);
    }
  };

  const memberCount = group.contactCount ?? (Array.isArray(group.contactIds) ? group.contactIds.length : 0);

  return (
    <div data-group className="flex flex-col justify-between border border-border bg-card p-4">
      <div>
        <p className="font-medium">{group.name}</p>
        {group.description && <p className="mt-0.5 text-sm text-muted-foreground">{group.description}</p>}
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5" /> {memberCount} {memberCount === 1 ? "member" : "members"}
        </p>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Button variant="secondary" size="sm" className="flex-1" onClick={() => onManageMembers(group)}>
          Manage members
        </Button>
        <GroupFormDialog
          group={group}
          onSaved={onUpdated}
          trigger={
            <Button variant="ghost" size="icon" disabled={busy}>
              <Pencil className="h-4 w-4" />
            </Button>
          }
        />
        <Button variant="ghost" size="icon" onClick={remove} disabled={busy}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

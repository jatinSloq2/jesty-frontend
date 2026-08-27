"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/jesty-toast";
import { Loader2, Pencil, Plus, Trash2, UsersRound } from "lucide-react";
import gsap from "gsap";
import { useGsapContext } from "@/hooks/use-gsap-context";
import { Button } from "@/components/ui/button";
import { groupsApi } from "@/lib/api";
import { GroupFormDialog, NewGroupTrigger } from "@/components/groups/group-form-dialog";
import { ManageMembersDialog } from "@/components/groups/manage-members-dialog";
import type { Group } from "@/types";

export function GroupsManager() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [managingGroup, setManagingGroup] = useState<Group | null>(null);

  const scope = useGsapContext<HTMLTableElement>((_ctx, el) => {
    gsap.from(el.querySelectorAll("[data-group]"), { autoAlpha: 0, y: 8, duration: 0.3, stagger: 0.03, ease: "power2.out" });
  }, [groups.length]);

  useEffect(() => {
    groupsApi
      .list()
      .then(setGroups)
      .finally(() => setLoading(false));
  }, []);

  const remove = async (group: Group) => {
    if (!confirm(`Delete the "${group.name}" group?`)) return;
    setBusyId(group._id);
    try {
      await groupsApi.remove(group._id);
      setGroups((prev) => prev.filter((g) => g._id !== group._id));
      toast.success("Group deleted");
    } catch {
      toast.error("Couldn't delete the group");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Groups</h2>
          <p className="text-sm text-muted-foreground">Organize contacts for broadcasts and campaigns.</p>
        </div>
        <GroupFormDialog onSaved={(g) => setGroups((prev) => [g, ...prev])} trigger={<NewGroupTrigger />} />
      </div>

      {groups.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 border border-border py-16 text-center text-muted-foreground">
          <UsersRound className="h-6 w-6" />
          <p className="text-sm">No groups yet.</p>
        </div>
      ) : (
        <table ref={scope} className="mt-4 w-full border border-border text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-semibold">Group</th>
              <th className="px-4 py-2.5 font-semibold">Description</th>
              <th className="px-4 py-2.5 font-semibold">Members</th>
              <th className="w-40 px-4 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {groups.map((group) => {
              const memberCount = group.contactCount ?? (Array.isArray(group.contactIds) ? group.contactIds.length : 0);
              return (
                <tr key={group._id} data-group className="bg-card align-top">
                  <td className="px-4 py-3 font-medium">{group.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{group.description || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {memberCount} {memberCount === 1 ? "member" : "members"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="secondary" size="sm" onClick={() => setManagingGroup(group)}>
                        Members
                      </Button>
                      <GroupFormDialog
                        group={group}
                        onSaved={(updated) => setGroups((prev) => prev.map((g) => (g._id === updated._id ? updated : g)))}
                        trigger={
                          <Button variant="ghost" size="icon" disabled={busyId === group._id}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Button variant="ghost" size="icon" onClick={() => remove(group)} disabled={busyId === group._id}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <ManageMembersDialog
        group={managingGroup}
        open={!!managingGroup}
        onOpenChange={(o) => !o && setManagingGroup(null)}
        onUpdated={(updated) => {
          setGroups((prev) => prev.map((g) => (g._id === updated._id ? updated : g)));
          setManagingGroup(updated);
        }}
      />
    </div>
  );
}

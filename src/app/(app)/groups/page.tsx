"use client";

import { useEffect, useState } from "react";
import { UsersRound } from "lucide-react";
import gsap from "gsap";
import { useGsapContext } from "@/hooks/use-gsap-context";
import { groupsApi } from "@/lib/api";
import { GroupFormDialog, NewGroupTrigger } from "@/components/groups/group-form-dialog";
import { GroupCard } from "@/components/groups/group-card";
import { ManageMembersDialog } from "@/components/groups/manage-members-dialog";
import type { Group } from "@/types";

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [managingGroup, setManagingGroup] = useState<Group | null>(null);

  const scope = useGsapContext<HTMLDivElement>((_ctx, el) => {
    gsap.from(el.querySelectorAll("[data-group]"), { autoAlpha: 0, y: 10, duration: 0.32, stagger: 0.04, ease: "power2.out" });
  }, [groups.length]);

  useEffect(() => {
    groupsApi
      .list()
      .then(setGroups)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bg-app">
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">Groups</h1>
          <p className="text-sm text-muted-foreground">Organize contacts for broadcasts and campaigns.</p>
        </div>
        <GroupFormDialog onSaved={(g) => setGroups((prev) => [g, ...prev])} trigger={<NewGroupTrigger />} />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {!loading && groups.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <UsersRound className="h-6 w-6" />
            <p className="text-sm">No groups yet.</p>
          </div>
        )}
        <div ref={scope} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <GroupCard
              key={g._id}
              group={g}
              onUpdated={(updated) => setGroups((prev) => prev.map((x) => (x._id === updated._id ? updated : x)))}
              onDeleted={(id) => setGroups((prev) => prev.filter((x) => x._id !== id))}
              onManageMembers={setManagingGroup}
            />
          ))}
        </div>
      </div>

      <ManageMembersDialog
        group={managingGroup}
        open={!!managingGroup}
        onOpenChange={(o) => !o && setManagingGroup(null)}
        onUpdated={(updated) => {
          setGroups((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
          setManagingGroup(updated);
        }}
      />
    </div>
  );
}

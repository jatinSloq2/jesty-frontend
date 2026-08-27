"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Users } from "lucide-react";
import gsap from "gsap";
import { useGsapContext } from "@/hooks/use-gsap-context";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { contactsApi, groupsApi, tagsApi, attributesApi } from "@/lib/api";
import { ContactFormDialog } from "@/components/contacts/contact-form-dialog";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { ContactDetailSheet } from "@/components/contacts/contact-detail-sheet";
import { TagManager } from "@/components/settings/tag-manager";
import { GroupsManager } from "@/components/groups/groups-manager";
import type { AttributeDef, ContactWithRelations, Group, Tag } from "@/types";

type ContactsTab = "contacts" | "tags" | "groups";

function ContactsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: ContactsTab = tabParam === "tags" || tabParam === "groups" ? tabParam : "contacts";

  const [contacts, setContacts] = useState<ContactWithRelations[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [attributes, setAttributes] = useState<AttributeDef[]>([]);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);

  const scope = useGsapContext<HTMLDivElement>((_ctx, el) => {
    const rows = el.querySelectorAll("[data-contact-row]");
    if (rows.length === 0) return;
    gsap.from(rows, { autoAlpha: 0, y: 8, duration: 0.3, stagger: 0.02, ease: "power2.out" });
  }, [contacts.length === 0, tab]);

  useEffect(() => {
    tagsApi.list().then(setTags);
    groupsApi.list().then(setGroups);
    attributesApi.list().then(setAttributes);
  }, []);

  useEffect(() => {
    if (tab !== "contacts") return;
    let cancelled = false;
    setLoading(true);
    contactsApi
      .list({
        search: search || undefined,
        tag: tagFilter === "all" ? undefined : tagFilter,
        group: groupFilter === "all" ? undefined : groupFilter,
        page: 1,
        limit: 25,
      })
      .then((res) => {
        if (cancelled) return;
        setContacts(res.data);
        setPage(1);
        setTotalPages(res.pagination.totalPages);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [search, tagFilter, groupFilter, tab]);

  const loadMore = () => {
    if (loading || page >= totalPages) return;
    setLoading(true);
    const next = page + 1;
    contactsApi
      .list({
        search: search || undefined,
        tag: tagFilter === "all" ? undefined : tagFilter,
        group: groupFilter === "all" ? undefined : groupFilter,
        page: next,
        limit: 25,
      })
      .then((res) => {
        setContacts((prev) => [...prev, ...res.data]);
        setPage(next);
        setTotalPages(res.pagination.totalPages);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bg-app">
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">Contacts</h1>
          <p className="text-sm text-muted-foreground">People, tags, and groups — all in one place.</p>
        </div>
        {tab === "contacts" && (
          <ContactFormDialog onCreated={() => contactsApi.list({ page: 1, limit: 25 }).then((res) => setContacts(res.data))} />
        )}
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => router.push(v === "contacts" ? "/contacts" : `/contacts?tab=${v}`)}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="border-b border-border px-6">
          <TabsList>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="contacts" className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-6 py-3">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts" className="pl-8" />
            </div>
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tags</SelectItem>
                {tags.map((t) => (
                  <SelectItem key={t._id} value={t._id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All groups</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g._id} value={g._id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div ref={scope} className="flex-1 overflow-y-auto">
            {contacts.length === 0 && !loading && (
              <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
                <Users className="h-6 w-6" />
                <p className="text-sm">No contacts match these filters.</p>
              </div>
            )}
            {contacts.length > 0 && <ContactsTable contacts={contacts} onSelect={(c) => setActiveContactId(c._id)} />}
            {page < totalPages && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="w-full py-3 text-sm font-medium text-brand-strong hover:bg-accent disabled:opacity-50"
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tags" className="flex-1 overflow-y-auto p-6">
          <TagManager />
        </TabsContent>

        <TabsContent value="groups" className="flex-1 overflow-y-auto p-6">
          <GroupsManager />
        </TabsContent>
      </Tabs>

      <ContactDetailSheet
        contactId={activeContactId}
        open={!!activeContactId}
        onOpenChange={(o) => !o && setActiveContactId(null)}
        allTags={tags}
        allGroups={groups}
        allAttributes={attributes}
        onUpdated={(updated) => setContacts((prev) => prev.map((c) => (c._id === updated._id ? updated : c)))}
        onDeleted={(id) => setContacts((prev) => prev.filter((c) => c._id !== id))}
      />
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={null}>
      <ContactsPageInner />
    </Suspense>
  );
}
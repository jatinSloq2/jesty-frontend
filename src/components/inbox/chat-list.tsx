"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Search } from "lucide-react";
import gsap from "gsap";
import { conversationsApi } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { useChannelStore } from "@/providers/channel-store";
import { useGsapContext } from "@/hooks/use-gsap-context";
import { useResizableWidth } from "@/hooks/use-resizable-width";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChannelSelector } from "@/components/inbox/channel-selector";
import { ConversationRow } from "@/components/inbox/conversation-row";
import { PanelResizer } from "@/components/layout/panel-resizer";
import type { Conversation } from "@/types";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "closed", label: "Closed" },
];

export function ChatList() {
  const { socket } = useAuth();
  const params = useParams<{ conversationId?: string }>();
  const activePhoneNumberId = useChannelStore((s) => s.activePhoneNumberId);

  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  // WhatsApp-style adjustable column width, remembered across sessions.
  const { width, dragging, onPointerDown } = useResizableWidth("jesty:chatlist-width", 384, 300, 560);

  const scope = useGsapContext<HTMLDivElement>((_ctx, el) => {
    const rows = el.querySelectorAll("[data-row]");
    if (rows.length === 0) return;
    gsap.from(rows, { autoAlpha: 0, y: 8, duration: 0.3, stagger: 0.02, ease: "power2.out" });
  }, [conversations.length === 0]);

  // Refetch page 1 whenever the filters change.
  useEffect(() => {
    if (activePhoneNumberId === undefined) return;
    let cancelled = false;
    setLoading(true);
    conversationsApi
      .list({
        status: status === "all" ? undefined : status,
        search: search || undefined,
        phoneNumberId: activePhoneNumberId ?? undefined,
        page: 1,
        limit: 30,
      })
      .then((res) => {
        if (cancelled) return;
        setConversations(res.data);
        setPage(1);
        setTotalPages(res.pagination.totalPages);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [status, search, activePhoneNumberId]);

  const loadMore = () => {
    if (loading || page >= totalPages) return;
    setLoading(true);
    const next = page + 1;
    conversationsApi
      .list({
        status: status === "all" ? undefined : status,
        search: search || undefined,
        phoneNumberId: activePhoneNumberId ?? undefined,
        page: next,
        limit: 30,
      })
      .then((res) => {
        setConversations((prev) => [...prev, ...res.data]);
        setPage(next);
        setTotalPages(res.pagination.totalPages);
      })
      .finally(() => setLoading(false));
  };

  // Live updates: re-fetch just the affected conversation and splice it in
  // at the top, rather than refetching the whole list.
  useEffect(() => {
    if (!socket) return;
    const handler = ({ conversationId }: { conversationId: string }) => {
      conversationsApi.get(conversationId).then((updated) => {
        setConversations((prev) => {
          const withoutIt = prev.filter((c) => c._id !== updated._id);
          return [updated, ...withoutIt];
        });
      });
    };
    socket.on("inbox:update", handler);
    return () => {
      socket.off("inbox:update", handler);
    };
  }, [socket]);

  return (
    <div className="flex h-full shrink-0">
    <div
      className="flex h-full w-full flex-col border-r border-border bg-bg-panel md:w-[var(--jesty-chatlist-w)]"
      style={{ ["--jesty-chatlist-w" as string]: `${width}px` }}
    >
      <div className="space-y-2 border-b border-border p-3">
        <ChannelSelector />
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search or start a new chat"
            className="pl-8"
          />
        </div>
        <Tabs value={status} onValueChange={setStatus}>
          <TabsList className="w-full justify-start">
            {STATUS_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        <div
          ref={(node) => {
            listRef.current = node;
            scope.current = node;
          }}
        >
          {conversations.length === 0 && !loading && (
            <p className="p-6 text-center text-sm text-muted-foreground">No conversations yet.</p>
          )}
          {conversations.map((c) => (
            <ConversationRow key={c._id} conversation={c} active={params?.conversationId === c._id} />
          ))}
          {page < totalPages && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-3 text-xs font-medium text-brand-strong hover:bg-accent disabled:opacity-50"
            >
              {loading ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      </ScrollArea>
    </div>
      <PanelResizer onPointerDown={(e) => onPointerDown(e, "right")} dragging={dragging} className="hidden md:block" />
    </div>
  );
}
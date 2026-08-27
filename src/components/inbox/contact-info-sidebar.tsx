"use client";

import { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PanelResizer } from "@/components/layout/panel-resizer";
import { useResizableWidth } from "@/hooks/use-resizable-width";
import type { Conversation } from "@/types";
import { initials } from "@/lib/utils";

const WINDOW_HOURS = 24;

function useServiceWindowCountdown(lastCustomerMessageAt?: string) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!lastCustomerMessageAt) return { open: false, label: "No customer message yet", remainingMs: 0 };

  const expiresAt = new Date(lastCustomerMessageAt).getTime() + WINDOW_HOURS * 60 * 60 * 1000;
  const remainingMs = expiresAt - now;
  if (remainingMs <= 0) return { open: false, label: "Window closed", remainingMs: 0 };

  const hours = Math.floor(remainingMs / 3_600_000);
  const minutes = Math.floor((remainingMs % 3_600_000) / 60_000);
  const seconds = Math.floor((remainingMs % 60_000) / 1000);
  const label =
    hours > 0 ? `${hours}h ${minutes}m left` : minutes > 0 ? `${minutes}m ${seconds}s left` : `${seconds}s left`;
  return { open: true, label, remainingMs };
}

/** Live badge showing how much longer the 24h WhatsApp service window stays open. */
export function ServiceWindowBadge({ conversation }: { conversation: Conversation }) {
  const { open, label, remainingMs } = useServiceWindowCountdown(conversation.lastCustomerMessageAt);
  const urgent = open && remainingMs < 60 * 60 * 1000; // under 1h left

  if (!conversation.lastCustomerMessageAt) return null;

  return (
    <Badge
      variant={open ? (urgent ? "destructive" : "outline") : "outline"}
      className="gap-1 whitespace-nowrap text-muted-foreground"
      title="Time left in the 24-hour WhatsApp customer-service window"
    >
      <Clock className="h-3 w-3" />
      {open ? label : "Window closed — template only"}
    </Badge>
  );
}

export function ContactInfoSidebar({
  conversation,
  open,
  onClose,
}: {
  conversation: Conversation;
  open: boolean;
  onClose: () => void;
}) {
  const { width, dragging, onPointerDown } = useResizableWidth("jesty:contact-sidebar-width", 320, 260, 460);
  const contact = conversation.contact;
  const windowInfo = useServiceWindowCountdown(conversation.lastCustomerMessageAt);

  if (!open) return null;

  return (
    <>
      <PanelResizer onPointerDown={(e) => onPointerDown(e, "left")} dragging={dragging} className="hidden md:block" />
      {/* Mobile: full-screen overlay, like WhatsApp's contact-info screen.
          md+: inline, resizable sidebar sitting beside the chat. */}
      <div
        className="fixed inset-0 z-40 flex h-full w-full flex-col overflow-y-auto border-l border-border bg-bg-panel md:static md:z-auto md:w-[var(--jesty-sidebar-w)] md:shrink-0"
        style={{ ["--jesty-sidebar-w" as string]: `${width}px` }}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Contact info</p>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close contact info">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {!contact ? (
          <p className="p-6 text-sm text-muted-foreground">No contact details available.</p>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2 border-b border-border p-6">
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
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Service window</h3>
                <div className={`flex items-center gap-2 border px-3 py-2 text-sm ${windowInfo.open ? "border-online-dot/40 text-foreground" : "border-border text-muted-foreground"}`}>
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>{windowInfo.label}</span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Free-form replies are only allowed within 24 hours of the customer&apos;s last message. After that, only approved templates can be sent.
                </p>
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(contact.tags ?? []).length === 0 && <p className="text-sm text-muted-foreground">No tags</p>}
                  {(contact.tags ?? []).map((t) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Groups</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(contact.groups ?? []).length === 0 && <p className="text-sm text-muted-foreground">No groups</p>}
                  {(contact.groups ?? []).map((g) => (
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
            </div>
          </>
        )}
      </div>
    </>
  );
}
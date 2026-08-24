"use client";

import { ChevronDown, Circle, Radio } from "lucide-react";
import { useChannelStore } from "@/providers/channel-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_DOT: Record<string, string> = {
  connected: "text-online-dot fill-online-dot",
  unverified: "text-muted-foreground fill-muted-foreground",
  failed: "text-destructive fill-destructive",
  expired: "text-destructive fill-destructive",
};

export function ChannelSelector({ className }: { className?: string }) {
  const numbers = useChannelStore((s) => s.numbers);
  const activePhoneNumberId = useChannelStore((s) => s.activePhoneNumberId);
  const setActive = useChannelStore((s) => s.setActive);

  const active = numbers.find((n) => n.whatsapp?.phoneNumberId === activePhoneNumberId);
  const activeNumbers = numbers.filter((n) => n.isActive);

  const label = activePhoneNumberId === null || !active
    ? "All numbers"
    : `${active.label ?? "Number"} · ${active.whatsapp?.phoneNumber}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className={cn("h-9 w-full justify-between px-3", className)}>
          <span className="flex min-w-0 items-center gap-2">
            <Radio className="h-3.5 w-3.5 shrink-0 text-brand-strong" />
            <span className="truncate">{label}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Connected numbers</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {activeNumbers.length > 1 && (
          <>
            <DropdownMenuItem onSelect={() => setActive(null)}>
              <span className={cn("font-medium", activePhoneNumberId === null && "text-brand-strong")}>All numbers</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {activeNumbers.length === 0 && (
          <div className="px-2 py-3 text-xs text-muted-foreground">No connected numbers yet.</div>
        )}
        {activeNumbers.map((n) => (
          <DropdownMenuItem key={n.id} onSelect={() => setActive(n.whatsapp?.phoneNumberId ?? null)}>
            <Circle className={cn("h-2 w-2", STATUS_DOT[n.status])} />
            <span className={cn("flex-1 truncate", n.whatsapp?.phoneNumberId === activePhoneNumberId && "text-brand-strong")}>
              {n.label ?? "Untitled"} · {n.whatsapp?.phoneNumber}
            </span>
            {n.isDefault && <span className="text-[10px] text-muted-foreground">Default</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "channels", href: "/settings/channels", label: "Channels" },
  { value: "profile", href: "/settings/profile", label: "Business Profile" },
  { value: "tags", href: "/settings/tags", label: "Tags" },
  { value: "attributes", href: "/settings/attributes", label: "Attributes" },
] as const;

export function SettingsTabs({ active }: { active: (typeof TABS)[number]["value"] }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border">
      {TABS.map((tab) => (
        <Link
          key={tab.value}
          href={tab.href}
          className={cn(
            "relative px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground",
            active === tab.value && "text-brand-strong after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-brand"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

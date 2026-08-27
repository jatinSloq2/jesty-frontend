"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Users, Bell, PanelsTopLeft } from "lucide-react";
import gsap from "gsap";
import { useAuth } from "@/providers/auth-provider";
import { useGsapContext } from "@/hooks/use-gsap-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SocketStatusIndicator } from "@/components/layout/socket-status-indicator";
import { JestyMark } from "@/components/brand/jesty-mark";
import { cn, initials } from "@/lib/utils";

// Groups now lives inside the Contacts page as a tab (see /contacts), so it
// no longer needs its own rail entry — matches WhatsApp's "one hub for
// people & lists" pattern instead of splitting them across the nav.
const NAV_ITEMS = [
  { href: "/inbox", label: "Chats", icon: MessageSquare },
  { href: "/contacts", label: "Contacts, tags & groups", icon: Users },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/templates", label: "WhatsApp templates", icon: PanelsTopLeft },
];

export function LeftRail() {
  const pathname = usePathname();
  const { user } = useAuth();

  const scope = useGsapContext<HTMLElement>((_ctx, el) => {
    gsap.from(el.querySelectorAll("[data-rail-item]"), {
      autoAlpha: 0,
      x: -8,
      duration: 0.35,
      stagger: 0.05,
      ease: "power2.out",
    });
  }, []);

  return (
    <nav ref={scope} className="flex h-full w-14 flex-col items-center justify-between border-r border-border bg-bg-panel py-3">
      <div className="flex flex-col items-center gap-3">
        <Link href="/inbox" data-rail-item title="Jesty" className="flex h-9 w-9 items-center justify-center bg-brand">
          <JestyMark variant="inverse" className="h-5 w-5" />
        </Link>

        <div className="flex flex-col items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Tooltip key={href}>
                <TooltipTrigger asChild>
                  <Link
                    href={href}
                    data-rail-item
                    className={cn(
                      "group relative flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground",
                      active && "text-brand-strong"
                    )}
                  >
                    {active && <span className="absolute left-0 h-5 w-0.5 bg-brand" />}
                    <Icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div data-rail-item>
          <SocketStatusIndicator />
        </div>
        <div data-rail-item>
          <ThemeToggle />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/settings/channels" data-rail-item className="block">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={user?.avatarUrl} alt={user?.name ?? "Profile"} />
                <AvatarFallback>{initials(user?.name ?? "?")}</AvatarFallback>
              </Avatar>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Profile &amp; channels</TooltipContent>
        </Tooltip>
      </div>
    </nav>
  );
}
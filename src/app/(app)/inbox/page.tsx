"use client";

import { MessageSquare } from "lucide-react";
import gsap from "gsap";
import { useGsapContext } from "@/hooks/use-gsap-context";
import { ChatList } from "@/components/inbox/chat-list";

export default function InboxPage() {
  const scope = useGsapContext<HTMLDivElement>((_ctx, el) => {
    gsap.from(el, { autoAlpha: 0, y: 12, duration: 0.4, ease: "power2.out" });
  }, []);

  return (
    <>
      <ChatList />
      <div ref={scope} className="hidden flex-1 flex-col items-center justify-center gap-3 bg-bg-chat text-center md:flex">
        <div className="flex h-16 w-16 items-center justify-center border border-border bg-card text-brand-strong">
          <MessageSquare className="h-7 w-7" />
        </div>
        <div>
          <p className="text-base font-medium">Select a conversation</p>
          <p className="text-sm text-muted-foreground">Pick a chat from the list to start messaging.</p>
        </div>
      </div>
    </>
  );
}

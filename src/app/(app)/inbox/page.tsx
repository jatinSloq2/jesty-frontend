"use client";

import gsap from "gsap";
import { useGsapContext } from "@/hooks/use-gsap-context";
import { ChatList } from "@/components/inbox/chat-list";
import { JestyMark } from "@/components/brand/jesty-mark";

export default function InboxPage() {
  const scope = useGsapContext<HTMLDivElement>((_ctx, el) => {
    gsap.from(el, { autoAlpha: 0, y: 12, duration: 0.4, ease: "power2.out" });
  }, []);

  return (
    <>
      <ChatList />
      <div ref={scope} className="jesty-chat-bg hidden flex-1 flex-col items-center justify-center gap-3 text-center md:flex">
        <div className="flex h-16 w-16 items-center justify-center border border-border bg-card">
          <JestyMark className="h-8 w-8" />
        </div>
        <div>
          <p className="text-base font-medium">Select a conversation</p>
          <p className="text-sm text-muted-foreground">Pick a chat from the list to start messaging.</p>
        </div>
      </div>
    </>
  );
}
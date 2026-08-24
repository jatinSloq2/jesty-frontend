"use client";

import { use } from "react";
import { ChatList } from "@/components/inbox/chat-list";
import { ChatPane } from "@/components/inbox/chat-pane";

export default function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params);

  return (
    <>
      <div className="hidden md:block">
        <ChatList />
      </div>
      <ChatPane conversationId={conversationId} />
    </>
  );
}

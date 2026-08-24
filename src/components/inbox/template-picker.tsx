"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TemplatePicker({ onSend }: { onSend: (templateName: string, languageCode: string) => Promise<void> }) {
  const [templateName, setTemplateName] = useState("");
  const [languageCode, setLanguageCode] = useState("en_US");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!templateName.trim()) return;
    setSending(true);
    try {
      await onSend(templateName.trim(), languageCode.trim() || "en_US");
      setTemplateName("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-border bg-bg-panel p-4">
      <p className="mb-3 text-sm font-medium text-brand-strong">
        This chat is outside the 24-hour window. Start it again with an approved template.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <Label htmlFor="template-name">Template name</Label>
          <Input id="template-name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="order_update" />
        </div>
        <div className="w-full space-y-1 sm:w-32">
          <Label htmlFor="template-lang">Language</Label>
          <Input id="template-lang" value={languageCode} onChange={(e) => setLanguageCode(e.target.value)} placeholder="en_US" />
        </div>
        <Button onClick={submit} disabled={sending || !templateName.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send template
        </Button>
      </div>
    </div>
  );
}

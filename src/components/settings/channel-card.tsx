"use client";

import { useState } from "react";
import { toast } from "@/components/ui/jesty-toast";
import { Loader2, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { integrationsApi } from "@/lib/api";
import type { WhatsappIntegration } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_VARIANT: Record<WhatsappIntegration["status"], "success" | "outline" | "destructive"> = {
  connected: "success",
  unverified: "outline",
  failed: "destructive",
  expired: "destructive",
};

export function ChannelCard({
  integration,
  onUpdated,
  onRemoved,
}: {
  integration: WhatsappIntegration;
  onUpdated: (integration: WhatsappIntegration) => void;
  onRemoved: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  const toggleActive = async (checked: boolean) => {
    setBusy(true);
    try {
      const updated = await integrationsApi.update(integration.id, { isActive: checked });
      onUpdated(updated);
    } catch {
      toast.error("Couldn't update the number");
    } finally {
      setBusy(false);
    }
  };

  const setDefault = async () => {
    setBusy(true);
    try {
      const updated = await integrationsApi.update(integration.id, { isDefault: true });
      onUpdated(updated);
    } catch {
      toast.error("Couldn't set as default");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Disconnect ${integration.whatsapp?.phoneNumber}?`)) return;
    setBusy(true);
    try {
      await integrationsApi.remove(integration.id);
      onRemoved(integration.id);
      toast.success("Number disconnected");
    } catch {
      toast.error("Couldn't disconnect");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("flex items-center justify-between border border-border bg-card p-4", busy && "opacity-60")}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{integration.label || "Untitled number"}</p>
          {integration.isDefault && <Star className="h-3.5 w-3.5 fill-brand text-brand" />}
        </div>
        <p className="text-sm text-muted-foreground">{integration.whatsapp?.phoneNumber}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[integration.status]} className="capitalize">
            {integration.status}
          </Badge>
          {integration.whatsapp?.tokenType && (
            <span className="text-[11px] text-muted-foreground capitalize">{integration.whatsapp.tokenType} token</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {!integration.isDefault && (
          <Button variant="ghost" size="sm" onClick={setDefault} disabled={busy}>
            Set default
          </Button>
        )}
        <Switch checked={integration.isActive} onCheckedChange={toggleActive} disabled={busy} />
        <Button variant="ghost" size="icon" onClick={remove} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
        </Button>
      </div>
    </div>
  );
}

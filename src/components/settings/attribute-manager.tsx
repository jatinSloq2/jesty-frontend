"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ListPlus, Pencil, Plus, Trash2 } from "lucide-react";
import gsap from "gsap";
import { useGsapContext } from "@/hooks/use-gsap-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { attributesApi, ApiClientError } from "@/lib/api";
import type { AttributeDef, AttributeType } from "@/types";

const TYPE_LABEL: Record<AttributeType, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  boolean: "Yes / No",
  list: "List",
};

function AttributeFormDialog({
  attribute,
  onSaved,
  trigger,
}: {
  attribute?: AttributeDef;
  onSaved: (attribute: AttributeDef) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(attribute?.key ?? "");
  const [label, setLabel] = useState(attribute?.label ?? "");
  const [type, setType] = useState<AttributeType>(attribute?.type ?? "text");
  const [optionsText, setOptionsText] = useState((attribute?.options ?? []).join(", "));
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!key.trim() || !label.trim()) return;
    setSaving(true);
    const options = type === "list" ? optionsText.split(",").map((o) => o.trim()).filter(Boolean) : undefined;
    try {
      const saved = attribute
        ? await attributesApi.update(attribute._id, { key: key.trim(), label: label.trim(), type, options })
        : await attributesApi.create({ key: key.trim(), label: label.trim(), type, options });
      onSaved(saved);
      toast.success(attribute ? "Attribute updated" : "Attribute created");
      setOpen(false);
      if (!attribute) {
        setKey("");
        setLabel("");
        setType("text");
        setOptionsText("");
      }
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Couldn't save the attribute");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{attribute ? "Edit attribute" : "New attribute"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="attr-label">Display label</Label>
            <Input id="attr-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Order ID" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="attr-key">Machine key</Label>
            <Input
              id="attr-key"
              value={key}
              onChange={(e) => setKey(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
              placeholder="order_id"
              disabled={!!attribute}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as AttributeType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TYPE_LABEL) as AttributeType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {type === "list" && (
            <div className="space-y-1.5">
              <Label htmlFor="attr-options">Options (comma-separated)</Label>
              <Input
                id="attr-options"
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder="Bronze, Silver, Gold"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={saving || !key.trim() || !label.trim()} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : attribute ? "Save changes" : "Create attribute"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AttributeManager() {
  const [attributes, setAttributes] = useState<AttributeDef[]>([]);
  const [loading, setLoading] = useState(true);

  const scope = useGsapContext<HTMLDivElement>((_ctx, el) => {
    gsap.from(el.querySelectorAll("[data-attr]"), { autoAlpha: 0, y: 8, duration: 0.3, stagger: 0.03, ease: "power2.out" });
  }, [attributes.length]);

  useEffect(() => {
    attributesApi
      .list()
      .then(setAttributes)
      .finally(() => setLoading(false));
  }, []);

  const remove = async (attribute: AttributeDef) => {
    if (!confirm(`Delete the "${attribute.label}" attribute?`)) return;
    try {
      await attributesApi.remove(attribute._id);
      setAttributes((prev) => prev.filter((a) => a._id !== attribute._id));
      toast.success("Attribute deleted");
    } catch {
      toast.error("Couldn't delete the attribute");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Custom attributes</h2>
        <AttributeFormDialog
          onSaved={(a) => setAttributes((prev) => [...prev, a].sort((x, y) => x.label.localeCompare(y.label)))}
          trigger={
            <Button>
              <Plus className="h-4 w-4" /> New attribute
            </Button>
          }
        />
      </div>

      <div ref={scope} className="mt-4 divide-y divide-border border border-border">
        {attributes.length === 0 && (
          <p className="flex items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
            <ListPlus className="h-4 w-4" /> No custom attributes yet.
          </p>
        )}
        {attributes.map((attribute) => (
          <div key={attribute._id} data-attr className="flex items-center justify-between bg-card px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{attribute.label}</span>
                <Badge variant="outline">{TYPE_LABEL[attribute.type]}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {attribute.key}
                {attribute.type === "list" && attribute.options?.length ? ` · ${attribute.options.join(", ")}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <AttributeFormDialog
                attribute={attribute}
                onSaved={(updated) => setAttributes((prev) => prev.map((a) => (a._id === updated._id ? updated : a)))}
                trigger={
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                }
              />
              <Button variant="ghost" size="icon" onClick={() => remove(attribute)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import gsap from "gsap";
import { useGsapContext } from "@/hooks/use-gsap-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ColorSwatchPicker } from "@/components/settings/color-swatch-picker";
import { tagsApi, ApiClientError } from "@/lib/api";
import type { Tag } from "@/types";

function TagFormDialog({
  tag,
  onSaved,
  trigger,
}: {
  tag?: Tag;
  onSaved: (tag: Tag) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(tag?.name ?? "");
  const [color, setColor] = useState(tag?.color ?? "#ff7a00");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const saved = tag ? await tagsApi.update(tag._id, { name, color }) : await tagsApi.create({ name, color });
      onSaved(saved);
      toast.success(tag ? "Tag updated" : "Tag created");
      setOpen(false);
      if (!tag) {
        setName("");
        setColor("#ff7a00");
      }
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Couldn't save the tag");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{tag ? "Edit tag" : "New tag"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tag-name">Name</Label>
            <Input id="tag-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="VIP" />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <ColorSwatchPicker value={color} onChange={setColor} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={saving || !name.trim()} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : tag ? "Save changes" : "Create tag"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TagManager() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const scope = useGsapContext<HTMLTableElement>((_ctx, el) => {
    gsap.from(el.querySelectorAll("[data-tag]"), { autoAlpha: 0, y: 8, duration: 0.3, stagger: 0.03, ease: "power2.out" });
  }, [tags.length]);

  useEffect(() => {
    tagsApi
      .list()
      .then(setTags)
      .finally(() => setLoading(false));
  }, []);

  const remove = async (tag: Tag) => {
    if (!confirm(`Delete the "${tag.name}" tag? It will be removed from every contact.`)) return;
    try {
      await tagsApi.remove(tag._id);
      setTags((prev) => prev.filter((t) => t._id !== tag._id));
      toast.success("Tag deleted");
    } catch {
      toast.error("Couldn't delete the tag");
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
        <div>
          <h2 className="text-xl font-semibold">Tags</h2>
          <p className="text-sm text-muted-foreground">Label contacts for quick filtering across the inbox.</p>
        </div>
        <TagFormDialog
          onSaved={(t) => setTags((prev) => [...prev, t].sort((a, b) => a.name.localeCompare(b.name)))}
          trigger={
            <Button>
              <Plus className="h-4 w-4" /> New tag
            </Button>
          }
        />
      </div>

      {tags.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 border border-border p-8 text-center text-sm text-muted-foreground">
          <TagIcon className="h-4 w-4" /> No tags yet.
        </p>
      ) : (
        <table ref={scope} className="mt-4 w-full border border-border text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-semibold">Tag</th>
              <th className="px-4 py-2.5 font-semibold">Color</th>
              <th className="w-24 px-4 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tags.map((tag) => (
              <tr key={tag._id} data-tag className="bg-card">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2.5 font-medium">
                    <span className="h-3.5 w-3.5 shrink-0" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{tag.color}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <TagFormDialog
                      tag={tag}
                      onSaved={(updated) => setTags((prev) => prev.map((t) => (t._id === updated._id ? updated : t)))}
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <Button variant="ghost" size="icon" onClick={() => remove(tag)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
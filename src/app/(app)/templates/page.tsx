"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { templatesApi } from "@/lib/api";
import type { WhatsappTemplate } from "@/types";
import { Button } from "@/components/ui/button";

export default function TemplatesPage() {
  const [drafts, setDrafts] = useState<WhatsappTemplate[]>([]); const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const refresh = async () => { try { const [saved, live] = await Promise.all([templatesApi.drafts(), templatesApi.list()]); setDrafts(saved); setTemplates(live); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not load templates"); } };
  useEffect(() => { void refresh(); }, []);
  const remove = async (id?: string) => { if (!id) return; await templatesApi.deleteDraft(id); setDrafts((all) => all.filter((d) => d.id !== id)); toast.success("Draft deleted"); };
  return <main className="h-full overflow-y-auto p-6"><div className="mb-6 flex items-start justify-between"><div><h1 className="text-2xl font-semibold">Templates</h1><p className="mt-1 text-sm text-muted-foreground">Manage approved WhatsApp templates and unfinished drafts.</p></div><Button asChild><Link href="/templates/create"><Plus className="mr-2 h-4 w-4" />Create template</Link></Button></div><section><h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Drafts</h2>{drafts.length ? <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{drafts.map((d) => <div key={d.id} className="rounded-xl border border-border bg-bg-panel p-4"><div className="flex justify-between"><Link className="font-medium hover:text-brand-strong" href={`/templates/create?draft=${d.id}`}>{d.name || "Untitled draft"}</Link><Button size="icon" variant="ghost" onClick={() => remove(d.id)}><Trash2 className="h-4 w-4" /></Button></div><p className="mt-2 text-xs text-muted-foreground">{d.category} · {d.language}</p></div>)}</div> : <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">No saved drafts yet.</p>}</section><section className="mt-8"><h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Submitted to Meta</h2><div className="space-y-2">{templates.map((t) => <div key={`${t.id}-${t.language}`} className="flex items-center justify-between rounded-xl border border-border bg-bg-panel p-4"><div><p className="font-medium">{t.name}</p><p className="text-xs text-muted-foreground">{t.category} · {t.language}</p></div><span className="text-xs text-muted-foreground">{t.status || "PENDING"}</span></div>)}</div></section></main>;
}

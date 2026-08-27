"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { integrationsApi, templatesApi } from "@/lib/api";
import type { WhatsappIntegration, WhatsappTemplate } from "@/types";
import { TemplateBuilder } from "@/components/templates/template-builder";
export default function CreateTemplatePage() { const router = useRouter(); const params = useSearchParams(); const [numbers, setNumbers] = useState<WhatsappIntegration[]>([]); const [draft, setDraft] = useState<WhatsappTemplate>(); useEffect(() => { void integrationsApi.list().then(setNumbers).catch(() => setNumbers([])); if (params.get("draft")) void templatesApi.drafts().then((all) => setDraft(all.find((item) => item.id === params.get("draft")))); }, [params]); return <main className="h-full overflow-y-auto p-6"><button className="mb-4 text-sm text-muted-foreground hover:text-foreground" onClick={() => router.push("/templates")}>← Back to templates</button><h1 className="mb-1 text-2xl font-semibold">Create template</h1><p className="mb-6 text-sm text-muted-foreground">Build a Meta-compliant template and save your progress as a server-side draft.</p><TemplateBuilder numbers={numbers} initialDraft={draft} /></main>; }

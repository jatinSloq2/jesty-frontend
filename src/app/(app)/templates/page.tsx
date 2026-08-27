"use client";

import { useEffect, useState } from "react";
import { integrationsApi } from "@/lib/api";
import type { WhatsappIntegration } from "@/types";
import { TemplateBuilder } from "@/components/templates/template-builder";

export default function TemplatesPage() {
  const [numbers, setNumbers] = useState<WhatsappIntegration[]>([]);
  useEffect(() => { void integrationsApi.list().then(setNumbers).catch(() => setNumbers([])); }, []);
  return <main className="h-full overflow-y-auto p-6"><div className="mb-6"><h1 className="text-2xl font-semibold">WhatsApp templates</h1><p className="mt-1 text-sm text-muted-foreground">Create Meta-ready marketing, utility, and authentication templates. Every submission is reviewed by Meta.</p></div><TemplateBuilder numbers={numbers} /></main>;
}

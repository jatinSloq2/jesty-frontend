"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "success" | "error" | "warning" | "info";
type Notice = { id: number; kind: Kind; message: string };
const listeners = new Set<(items: Notice[]) => void>();
let notices: Notice[] = [];
let sequence = 0;
function publish() { listeners.forEach((listener) => listener([...notices])); }
function push(kind: Kind, message: string) { const id = ++sequence; notices = [...notices, { id, kind, message }]; publish(); window.setTimeout(() => { notices = notices.filter((item) => item.id !== id); publish(); }, 4200); }
export const toast = { success: (message: string) => push("success", message), error: (message: string) => push("error", message), warning: (message: string) => push("warning", message), info: (message: string) => push("info", message) };

const styles: Record<Kind, string> = { success: "border-emerald-500/30 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-50", error: "border-red-500/30 bg-red-50 text-red-950 dark:bg-red-950/80 dark:text-red-50", warning: "border-amber-500/30 bg-amber-50 text-amber-950 dark:bg-amber-950/80 dark:text-amber-50", info: "border-brand/30 bg-bg-panel text-foreground" };
const icons = { success: CheckCircle2, error: XCircle, warning: TriangleAlert, info: Info };
export function JestyToastViewport() { const [items, setItems] = useState<Notice[]>([]); useEffect(() => { listeners.add(setItems); return () => { listeners.delete(setItems); }; }, []); return <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(calc(100vw-2rem),380px)] flex-col gap-2">{items.map((item) => { const Icon = icons[item.kind]; return <div key={item.id} role="status" className={cn("pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg animate-in slide-in-from-right-3", styles[item.kind])}><Icon className="mt-0.5 h-4 w-4 shrink-0" /><p className="flex-1 leading-5">{item.message}</p><button aria-label="Dismiss notification" onClick={() => { notices = notices.filter((n) => n.id !== item.id); publish(); }}><X className="h-4 w-4 opacity-60 hover:opacity-100" /></button></div>; })}</div>; }

"use client";

import { cn } from "@/lib/utils";

export function PanelResizer({
  onPointerDown,
  dragging,
  className,
}: {
  onPointerDown: (e: React.PointerEvent) => void;
  dragging: boolean;
  className?: string;
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      onPointerDown={onPointerDown}
      data-dragging={dragging}
      className={cn("jesty-resizer", className)}
    />
  );
}
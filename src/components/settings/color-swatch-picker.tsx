"use client";

import { cn } from "@/lib/utils";

const SWATCHES = [
  "#ff7a00",
  "#25d366",
  "#3fa4f4",
  "#d64545",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#0ea5e9",
  "#111111",
  "#6b6b6b",
];

export function ColorSwatchPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SWATCHES.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn("h-7 w-7 border-2", value === color ? "border-foreground" : "border-transparent")}
          style={{ backgroundColor: color }}
          aria-label={color}
        />
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// A small set of original, non-branded/non-copyrighted "reaction" stickers —
// each is just an emoji glyph over a solid brand-family color chip, the same
// pattern WhatsApp's own default sticker pack uses. Rendered client-side to
// a PNG so it can go through the existing image/sticker upload pipeline
// without needing any bundled asset files.
const STICKERS: { emoji: string; bg: string }[] = [
  { emoji: "🎉", bg: "#ff7a00" },
  { emoji: "😂", bg: "#ffd166" },
  { emoji: "🔥", bg: "#ef476f" },
  { emoji: "👍", bg: "#06d6a0" },
  { emoji: "❤️", bg: "#f72585" },
  { emoji: "😎", bg: "#118ab2" },
  { emoji: "🙌", bg: "#ff9e00" },
  { emoji: "🤝", bg: "#8338ec" },
  { emoji: "☕", bg: "#a86b3f" },
  { emoji: "🎯", bg: "#e63946" },
  { emoji: "✅", bg: "#2a9d8f" },
  { emoji: "⏰", bg: "#f4a261" },
];

async function rasterizeSticker(emoji: string, bg: string): Promise<Blob | null> {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Soft rounded chip background (transparent outside it, like a sticker).
  const radius = 96;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.arcTo(size, 0, size, size, radius);
  ctx.arcTo(size, size, 0, size, radius);
  ctx.arcTo(0, size, 0, 0, radius);
  ctx.arcTo(0, 0, size, 0, radius);
  ctx.closePath();
  ctx.fill();

  ctx.font = `${size * 0.55}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.04);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png", 0.95));
}

export function StickerPicker({ onSend, disabled }: { onSend: (file: File) => void; disabled?: boolean }) {
  const [sending, setSending] = useState<number | null>(null);

  const pick = async (index: number) => {
    if (disabled || sending !== null) return;
    const sticker = STICKERS[index];
    if (!sticker) return;
    setSending(index);
    try {
      const blob = await rasterizeSticker(sticker.emoji, sticker.bg);
      if (blob) {
        onSend(new File([blob], "sticker.png", { type: "image/png" }));
      }
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="grid w-64 grid-cols-4 gap-2 p-3">
      {STICKERS.map((s, i) => (
        <button
          key={s.emoji}
          onClick={() => pick(i)}
          disabled={disabled || sending !== null}
          className={cn(
            "flex aspect-square items-center justify-center text-2xl transition-transform hover:scale-105 disabled:opacity-50",
            "border border-border"
          )}
          style={{ backgroundColor: `${s.bg}22` }}
          title="Send sticker"
        >
          {s.emoji}
        </button>
      ))}
    </div>
  );
}
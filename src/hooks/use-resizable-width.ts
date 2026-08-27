"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Drag-to-resize width state, persisted to localStorage per `storageKey` so
 * a person's preferred panel widths (chat list, contact info sidebar)
 * survive reloads — mirrors WhatsApp Web's adjustable columns.
 */
export function useResizableWidth(storageKey: string, defaultWidth: number, min: number, max: number) {
  const [width, setWidth] = useState(defaultWidth);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(defaultWidth);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) setWidth(Math.min(max, Math.max(min, parsed)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const persist = useCallback(
    (value: number) => {
      if (typeof window !== "undefined") window.localStorage.setItem(storageKey, String(value));
    },
    [storageKey]
  );

  // direction: "right" means dragging the handle right grows the panel
  // (used for a left-side panel like the chat list); "left" means dragging
  // the handle left grows the panel (used for a right-side panel like the
  // contact info sidebar).
  const onPointerDown = useCallback(
    (e: React.PointerEvent, direction: "right" | "left" = "right") => {
      e.preventDefault();
      startX.current = e.clientX;
      startWidth.current = width;
      setDragging(true);

      const onMove = (ev: PointerEvent) => {
        const delta = ev.clientX - startX.current;
        const signedDelta = direction === "right" ? delta : -delta;
        const next = Math.min(max, Math.max(min, startWidth.current + signedDelta));
        setWidth(next);
      };
      const onUp = () => {
        setDragging(false);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        setWidth((current) => {
          persist(current);
          return current;
        });
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [width, min, max, persist]
  );

  return { width, dragging, onPointerDown };
}
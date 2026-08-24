"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import gsap from "gsap";

/**
 * Runs `setup` inside a gsap.context() scoped to the returned ref, and
 * reverts every tween/animation it created on unmount or dependency change.
 * Use this instead of ad-hoc gsap calls so animations never leak between
 * route changes (App Router keeps components mounted briefly during
 * transitions, which otherwise causes duplicate/stuck tweens).
 */
export function useGsapContext<T extends HTMLElement = HTMLDivElement>(
  setup: (ctx: gsap.Context, el: T) => void,
  deps: React.DependencyList = []
): RefObject<T | null> {
  const scope = useRef<T | null>(null);

  useLayoutEffect(() => {
    if (!scope.current) return;
    let ctx!: gsap.Context;
    ctx = gsap.context(() => setup(ctx, scope.current as T), scope);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scope;
}

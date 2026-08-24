"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const iconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => setMounted(true), []);

  const toggle = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    if (iconRef.current) {
      gsap
        .timeline()
        .to(iconRef.current, { rotate: 90, scale: 0.4, autoAlpha: 0, duration: 0.18, ease: "power1.in" })
        .call(() => setTheme(next))
        .set(iconRef.current, { rotate: -90 })
        .to(iconRef.current, { rotate: 0, scale: 1, autoAlpha: 1, duration: 0.28, ease: "back.out(2)" });
    } else {
      setTheme(next);
    }
  };

  if (!mounted) return <div className="h-9 w-9" />;

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
      <span ref={iconRef} className="inline-flex">
        {resolvedTheme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </span>
    </Button>
  );
}

import { cn } from "@/lib/utils";

/**
 * The Jesty logomark — a speech bubble with three signature dots, standing
 * in for the product's chat-first identity.
 *
 * `variant="brand"` (default): solid orange bubble — use on white/neutral
 * surfaces (browser tab icon, sidebars, light auth panels).
 * `variant="inverse"`: white bubble — use when the mark sits inside an
 * already-orange container (e.g. the left-rail badge, wordmark chip) so it
 * doesn't disappear against its own background.
 *
 * This is the single source of truth for the mark — reuse it instead of
 * re-drawing per screen.
 */
export function JestyMark({
  className,
  variant = "brand",
}: {
  className?: string;
  variant?: "brand" | "inverse";
}) {
  const bubble = variant === "inverse" ? "#ffffff" : "var(--brand, #ff7a00)";
  const dots = variant === "inverse" ? "var(--brand-strong, #e8690a)" : "var(--brand-foreground, #ffffff)";
  return (
    <svg viewBox="0 0 32 32" className={cn("shrink-0", className)} aria-hidden="true">
      <path
        d="M16 4C9.373 4 4 8.86 4 14.86c0 3.24 1.58 6.15 4.09 8.14-.1 1.55-.62 3.02-1.55 4.28a.7.7 0 0 0 .74 1.1c2.1-.5 4.03-1.5 5.6-2.86 1.01.24 2.07.36 3.12.36 6.627 0 12-4.86 12-10.86S22.627 4 16 4Z"
        fill={bubble}
      />
      <circle cx="11.3" cy="15.1" r="1.7" fill={dots} />
      <circle cx="16.3" cy="15.1" r="1.7" fill={dots} />
      <circle cx="21.3" cy="15.1" r="1.7" fill={dots} />
    </svg>
  );
}

/** Mark + "Jesty" wordmark, for the auth screen and other full headers. */
export function JestyWordmark({ className, textClassName }: { className?: string; textClassName?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-9 w-9 items-center justify-center bg-brand">
        <JestyMark variant="inverse" className="h-5 w-5" />
      </div>
      <span className={cn("text-xl font-semibold tracking-tight", textClassName)}>Jesty</span>
    </div>
  );
}
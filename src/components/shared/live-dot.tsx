import { cn } from "@/lib/utils";

/** A solid dot with an expanding, fading ring behind it — the app's one consistent
 * "this is live/in-progress" indicator, used anywhere a running/pending state needs
 * a pulse (sidebar running count, progress panels, pending row markers). */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span className="relative inline-flex h-1.5 w-1.5 shrink-0">
      <span className={cn("absolute inline-flex h-full w-full animate-pulse-ring rounded-full", className)} />
      <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", className)} />
    </span>
  );
}

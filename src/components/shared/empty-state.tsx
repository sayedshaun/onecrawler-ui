import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-dashed border-border px-6 py-16 text-center">
      {/* Faint copper glow so an empty view still feels part of the branded
          surface rather than a blank slate — matches the agent hero. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.08),hsl(var(--gradient-to)/0.05)_55%,transparent_75%)]"
      />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-copper-soft text-primary ring-1 ring-primary/20">
        <Icon className="h-5 w-5" />
      </div>
      <div className="relative space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="relative">{action}</div>}
    </div>
  );
}

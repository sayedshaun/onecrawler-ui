import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function SummarySection({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section className="border border-border bg-muted/40 rounded-lg p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h3>
      <dl className="space-y-2">{children}</dl>
    </section>
  );
}

export function Setting({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-foreground">{children}</dd>
    </div>
  );
}

export function PatternList({ patterns }: { patterns: string[] }) {
  if (!patterns.length) return <span className="text-muted-foreground">None</span>;

  return (
    <span className="flex flex-wrap justify-end gap-1">
      {patterns.map((pattern) => (
        <Badge key={pattern} variant="secondary" className="font-mono text-[11px]">
          {pattern}
        </Badge>
      ))}
    </span>
  );
}

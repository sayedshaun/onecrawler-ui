import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

/** Shared visual style for the "stacked row" card pattern used wherever a
 * table collapses to cards on narrow viewports (crawls table, results
 * table) or a list is card-shaped by default (templates). Keeping the
 * border/radius/hover treatment in one place avoids the three call sites
 * drifting apart. */
const ROW_CARD_CLASS = "rounded-lg border border-border bg-card p-3";
const ROW_CARD_INTERACTIVE_CLASS = cn(ROW_CARD_CLASS, "transition-colors duration-150 ease-out hover:bg-accent/40");

export function RowCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(ROW_CARD_CLASS, className)}>{children}</div>;
}

export function RowCardLink({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link to={to} className={cn("block", ROW_CARD_INTERACTIVE_CLASS, className)}>
      {children}
    </Link>
  );
}

export function RowCardButton({
  onClick,
  children,
  className,
}: {
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("block w-full text-left", ROW_CARD_INTERACTIVE_CLASS, className)}
    >
      {children}
    </button>
  );
}

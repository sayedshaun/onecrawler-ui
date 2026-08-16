import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  ListChecks,
  Search,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AgentTraceStep } from "@/lib/types";

function humanizeToolName(name: string): string {
  return name.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Best-effort, present-tense/past-tense phrasing keyed off common verbs in
// the tool's name — falls back to a generic "Calling X…" / "X done" for
// anything that doesn't match, since the exact tool set is defined server-side
// and can grow without this file knowing about it.
function describeStep(step: AgentTraceStep): { label: string; isSearch: boolean } {
  const running = step.kind === "call";
  if (step.isPlanning) return { label: running ? "Thinking…" : "Updated the plan", isSearch: false };

  const name = step.toolName.toLowerCase();
  const pretty = humanizeToolName(step.toolName);

  if (name.includes("search")) {
    return { label: running ? "Searching the web…" : "Searched the web", isSearch: true };
  }
  if (name.includes("status") || (name.includes("get") && name.includes("crawl"))) {
    return { label: running ? "Checking crawl status…" : "Checked crawl status", isSearch: false };
  }
  if (name.includes("list")) {
    return { label: running ? `Looking up ${pretty.toLowerCase()}…` : `Found ${pretty.toLowerCase()}`, isSearch: false };
  }
  if (name.includes("start") || name.includes("launch") || name.includes("run") || name.includes("crawl")) {
    return { label: running ? "Starting a crawl…" : "Crawl started", isSearch: false };
  }
  if (name.includes("cancel") || name.includes("stop")) {
    return { label: running ? "Cancelling…" : "Cancelled", isSearch: false };
  }
  return { label: running ? `Calling ${pretty}…` : `${pretty} done`, isSearch: false };
}

export function AgentTraceStepView({ step }: { step: AgentTraceStep }) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = !!step.detail;
  const running = step.kind === "call";
  const { label, isSearch } = describeStep(step);

  const Icon = running ? Loader2 : step.isPlanning ? ListChecks : isSearch ? Search : CheckCircle2;
  const colorClass = step.isPlanning
    ? "bg-violet-500/15 text-violet-600 dark:text-violet-400"
    : running
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  const borderClass = step.isPlanning
    ? "border-violet-500/25 bg-violet-500/5"
    : running
      ? "border-amber-500/25 bg-amber-500/5"
      : "border-emerald-500/25 bg-emerald-500/5";

  return (
    <div className={cn("rounded-lg border px-3 py-2 text-xs", borderClass)}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canExpand}
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left disabled:cursor-default"
        >
          <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full", colorClass)}>
            <Icon className={cn("h-3 w-3", running && "animate-spin")} />
          </span>
          <span className="font-medium text-foreground">{label}</span>
          {canExpand &&
            (expanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ))}
        </button>

        {step.jobId && (
          <Link
            to={`/dashboard/crawls/${step.jobId}`}
            className="inline-flex shrink-0 items-center gap-0.5 text-primary transition-opacity duration-150 hover:opacity-80"
          >
            View crawl
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {expanded && step.detail && (
        <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-background p-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
          {step.detail}
        </pre>
      )}
    </div>
  );
}

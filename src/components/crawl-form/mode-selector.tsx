import { FileSearch, Globe, Map, Waypoints } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CrawlMode } from "@/lib/types";

const MODES: {
  value: CrawlMode;
  icon: typeof Map;
  title: string;
  description: string;
}[] = [
  {
    value: "sitemap",
    icon: Map,
    title: "Sitemap Discovery",
    description: "Fastest way to collect URLs via robots.txt and XML sitemaps.",
  },
  {
    value: "link_extraction",
    icon: Waypoints,
    title: "Link Extraction",
    description: "Browser-backed discovery for JS-rendered or sitemap-poor sites.",
  },
  {
    value: "crawler",
    icon: Globe,
    title: "Full Crawler",
    description: "Discover links and extract content in a single orchestrated run.",
  },
  {
    value: "scraper",
    icon: FileSearch,
    title: "Direct Scraper",
    description: "Extract content straight from the target URL — no discovery step.",
  },
];

export function ModeSelector({
  value,
  onChange,
}: {
  value: CrawlMode;
  onChange: (mode: CrawlMode) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {MODES.map((mode) => {
        const active = value === mode.value;
        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            className={cn(
              "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-150 ease-out",
              active
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-primary/40 hover:bg-accent/50",
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              <mode.icon className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-foreground">{mode.title}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {mode.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

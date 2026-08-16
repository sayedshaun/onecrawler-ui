import { FileDown, Filter, Loader2, Map, Pencil, Radar, RotateCcw, Trash2, Waypoints } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import type { CrawlMode, CrawlSettings, CrawlTemplate, ScrapingOutputFormat, ScrapingStrategy } from "@/lib/types";

const MODE_META: Record<CrawlMode, { label: string; icon: LucideIcon }> = {
  sitemap: { label: "Sitemap", icon: Map },
  link_extraction: { label: "Link extraction", icon: Waypoints },
  crawler: { label: "Full crawler", icon: Radar },
  scraper: { label: "Direct scraper", icon: FileDown },
};

const STRATEGY_LABEL: Record<ScrapingStrategy, string> = {
  heuristic: "Heuristic",
  genai: "GenAI",
  markdownify: "Markdownify",
};

const FORMAT_LABEL: Record<ScrapingOutputFormat, string> = {
  markdown: "Markdown",
  json: "JSON",
  xml: "XML",
  xmltei: "TEI XML",
};

function Chip({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "primary" }) {
  const toneClass = tone === "primary" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${toneClass}`}>
      {children}
    </span>
  );
}

interface TemplateCardProps {
  template: CrawlTemplate;
  settings: CrawlSettings;
  updating: boolean;
  onEdit: () => void;
  onUpdateFromDefaults: () => void;
  onDelete: () => void;
}

export function TemplateCard({
  template,
  settings,
  updating,
  onEdit,
  onUpdateFromDefaults,
  onDelete,
}: TemplateCardProps) {
  const mode = MODE_META[settings.mode];
  const ModeIcon = mode.icon;
  const filterCount = settings.filterGroup.filters.length;

  return (
    <div className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors duration-150 ease-out hover:border-primary/40">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-copper-soft text-primary ring-1 ring-primary/20">
          <ModeIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{template.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            Updated {formatRelativeTime(new Date(template.updatedAt))}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label={`Delete ${template.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Chip tone="primary">
          <ModeIcon className="h-3 w-3" />
          {mode.label}
        </Chip>
        <Chip>{STRATEGY_LABEL[settings.scrapingStrategy]}</Chip>
        <Chip>{FORMAT_LABEL[settings.scrapingOutputFormat]}</Chip>
        <Chip>
          <Filter className="h-3 w-3" />
          {filterCount === 0 ? "No filters" : `${filterCount} filter${filterCount > 1 ? "s" : ""}`}
        </Chip>
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
        <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
          View &amp; edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          disabled={updating}
          onClick={onUpdateFromDefaults}
        >
          {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
          Sync defaults
        </Button>
      </div>
    </div>
  );
}

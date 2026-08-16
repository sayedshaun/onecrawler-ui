import { ChevronDown, Loader2, Rocket, Globe2, Gauge, ListFilter, Shield, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SettingsPreview } from "@/components/crawl-form/settings-preview";
import type { CrawlSettings } from "@/lib/types";

const MODE_LABEL: Record<CrawlSettings["mode"], string> = {
  sitemap: "Sitemap Discovery",
  link_extraction: "Link Extraction",
  crawler: "Full Crawler",
  scraper: "Direct Scraper",
};

export function LaunchSummary({
  targetUrl,
  settings,
  disabled,
  launching,
  error,
  onLaunch,
  previewOpen,
  onPreviewOpenChange,
  matchHeight,
}: {
  targetUrl: string;
  settings: CrawlSettings;
  disabled: boolean;
  launching?: boolean;
  error?: string | null;
  onLaunch: () => void;
  previewOpen: boolean;
  onPreviewOpenChange: (open: boolean) => void;
  /** Caps the card to this height (px) instead of growing past it — used so
   * the unfolded settings summary never extends below the left column. */
  matchHeight?: number | null;
}) {
  const capHeight = previewOpen && matchHeight ? matchHeight : undefined;
  const filterCount = settings.filterGroup.filters.length;

  const rows = [
    { icon: Globe2, label: "Mode", value: MODE_LABEL[settings.mode] },
    { icon: Gauge, label: "Concurrency", value: `${settings.concurrency} workers · limit ${settings.linkExtractionLimit}` },
    {
      icon: Sparkles,
      label: "Extraction",
      value:
        settings.scrapingStrategy === "genai"
          ? `GenAI · ${settings.genai?.modelName ?? ""}`
          : settings.scrapingStrategy === "markdownify"
            ? "Markdownify"
            : `Heuristic · ${settings.scrapingOutputFormat}`,
    },
    { icon: Shield, label: "Proxies", value: settings.proxies.length ? `${settings.proxies.length} configured` : "None (direct)" },
    { icon: ListFilter, label: "Filters", value: filterCount ? `${filterCount} active (${settings.filterGroup.mode})` : "None" },
  ];

  return (
    <Card
      className={capHeight ? "flex flex-col" : undefined}
      style={capHeight ? { height: capHeight } : undefined}
    >
      <CardHeader>
        <CardTitle>Launch</CardTitle>
      </CardHeader>
      <CardContent className={`space-y-4 ${capHeight ? "flex flex-1 flex-col overflow-hidden" : ""}`}>
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Target</p>
          <p className="truncate font-mono text-xs text-foreground">
            {targetUrl || "https://example.com"}
          </p>
        </div>

        <div className="space-y-2.5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <row.icon className="h-3.5 w-3.5" />
                {row.label}
              </span>
              <span className="font-medium text-foreground">{row.value}</span>
            </div>
          ))}
        </div>

        <Button className="w-full" size="lg" disabled={disabled || launching} onClick={onLaunch}>
          {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
          {launching ? "Starting…" : "Start Crawl"}
        </Button>
        {disabled && !launching && (
          <p className="text-center text-xs text-muted-foreground">
            Enter a target URL to continue.
          </p>
        )}
        {error && <p className="text-center text-xs text-destructive">{error}</p>}

        <Separator />

        <button
          type="button"
          onClick={() => onPreviewOpenChange(!previewOpen)}
          className="flex w-full items-center justify-between text-left text-xs font-medium text-foreground"
        >
          Full settings summary
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150 ease-out ${previewOpen ? "rotate-180" : ""}`}
          />
        </button>
        {previewOpen && (
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <SettingsPreview targetUrl={targetUrl} settings={settings} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

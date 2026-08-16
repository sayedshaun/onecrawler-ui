import { Filter, Globe2, Monitor, Network, Search, Settings2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PatternList, Setting, SummarySection } from "@/components/shared/settings-summary-ui";
import type { CrawlSettings, FilterKind } from "@/lib/types";

const MODE_LABEL: Record<CrawlSettings["mode"], string> = {
  sitemap: "Sitemap discovery",
  link_extraction: "Link extraction",
  crawler: "Full crawler",
  scraper: "Direct scraper",
};

const FILTER_LABEL: Record<FilterKind, string> = {
  by_date: "Date range",
  by_keywords: "Keywords",
  by_files: "File type",
  by_extension: "Extension",
  by_cosine_similarity: "Semantic similarity",
};

export function SettingsPreview({ targetUrl, settings }: { targetUrl: string; settings: CrawlSettings }) {
  const browser = settings.browserSettings;
  const human = settings.humanBehaviorSettings;
  const filters = settings.filterGroup.filters;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Target URL</p>
        <p className="mt-1 break-all font-mono text-xs text-foreground">{targetUrl || "https://example.com"}</p>
      </div>

      <div className="grid gap-4">
        <SummarySection icon={Search} title="Discovery">
          <Setting label="Mode"><Badge>{MODE_LABEL[settings.mode]}</Badge></Setting>
          <Setting label="Strategy">{settings.linkExtractionStrategy === "deep" ? "Deep (recursive)" : "Shallow"}</Setting>
          <Setting label="Link / URL limit">{settings.linkExtractionLimit || "Not set"}</Setting>
          <Setting label="Include patterns"><PatternList patterns={settings.includeLinkPatterns} /></Setting>
          <Setting label="Exclude patterns"><PatternList patterns={settings.excludeLinkPatterns} /></Setting>
        </SummarySection>

        <SummarySection icon={Settings2} title="Scraping">
          <Setting label="Strategy">
            {settings.scrapingStrategy === "genai"
              ? "GenAI"
              : settings.scrapingStrategy === "markdownify"
                ? "Markdownify"
                : "Heuristic"}
          </Setting>
          <Setting label="Output format">{settings.scrapingOutputFormat.toUpperCase()}</Setting>
          <Setting label="Concurrency">{settings.concurrency} workers</Setting>
          <Setting label="Request timeout">{settings.requestTimeout}s</Setting>
          <Setting label="Retries">{settings.maxRetries} · {settings.retryDelay}s delay</Setting>
          {settings.scrapingStrategy === "genai" && settings.genai && (
            <>
              <Setting label="Model">{settings.genai.provider} · {settings.genai.modelName}</Setting>
              <Setting label="Schema fields">{settings.genai.schemaFields.filter((field) => field.name).length || "None"}</Setting>
            </>
          )}
        </SummarySection>

        <SummarySection icon={Network} title="Network">
          <Setting label="Proxies">{settings.proxies.length ? `${settings.proxies.length} configured` : "Direct connection"}</Setting>
          <Setting label="Rotation">{settings.proxyRotationMethod === "round_robin" ? "Round robin" : "Random"}</Setting>
        </SummarySection>

        <SummarySection icon={Monitor} title="Browser">
          <Setting label="Viewport">{browser.viewport.width} × {browser.viewport.height}</Setting>
          <Setting label="Locale">{browser.locale}</Setting>
          <Setting label="Timezone">{browser.timezoneId}</Setting>
          <Setting label="Headless">{browser.headless ? "Enabled" : "Disabled"}</Setting>
          <Setting label="Wait until">{browser.waitUntil === "domcontentloaded" ? "DOM content loaded" : browser.waitUntil === "networkidle" ? "Network idle" : "Full load"}</Setting>
          <Setting label="Navigation timeout">{browser.timeout} ms</Setting>
          {browser.userAgent && <Setting label="Custom user agent">Configured</Setting>}
        </SummarySection>

        <SummarySection icon={Globe2} title="Human behavior">
          <Setting label="Simulation">{settings.enableHumanBehaviors ? "Enabled" : "Disabled"}</Setting>
          {settings.enableHumanBehaviors && (
            <>
              <Setting label="Delays">{human.minDelay}s–{human.maxDelay}s</Setting>
              <Setting label="Max scrolls">{human.maxScrolls}</Setting>
              <Setting label="Mouse moves">{human.minMouseMoves}–{human.maxMouseMoves}</Setting>
            </>
          )}
        </SummarySection>

        <SummarySection icon={Filter} title="Content filters">
          <Setting label="Combine filters">{filters.length ? settings.filterGroup.mode : "—"}</Setting>
          <Setting label="Active filters">
            {filters.length ? (
              <span className="flex flex-wrap justify-end gap-1">
                {filters.map((filter) => <Badge key={filter.id} variant="secondary">{FILTER_LABEL[filter.kind]}</Badge>)}
              </span>
            ) : "None"}
          </Setting>
        </SummarySection>
      </div>
    </div>
  );
}

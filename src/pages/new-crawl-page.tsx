import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Layers, Loader2, Save } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeSelector } from "@/components/crawl-form/mode-selector";
import { LinkExtractionSection } from "@/components/crawl-form/link-extraction-section";
import { ScrapingSection } from "@/components/crawl-form/scraping-section";
import { FilterChainBuilder } from "@/components/crawl-form/filter-chain-builder";
import { ProxySection } from "@/components/crawl-form/proxy-section";
import { BrowserSection } from "@/components/crawl-form/browser-section";
import { LaunchSummary } from "@/components/crawl-form/launch-summary";
import { PageHeader } from "@/components/shared/page-header";
import { usePolledResource } from "@/hooks/use-polled-resource";
import { ApiError } from "@/lib/api";
import { createCrawl, createCrawlFromPayload } from "@/lib/crawls-api";
import { createTemplate, listTemplates } from "@/lib/templates-api";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSettingsStore } from "@/store/settings-store";
import type { CrawlSettings } from "@/lib/types";

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export default function NewCrawlPage() {
  const navigate = useNavigate();
  const defaults = useSettingsStore((s) => s.defaults);

  const [targetUrl, setTargetUrl] = useState("");
  const [settings, setSettings] = useState<CrawlSettings>(() => JSON.parse(JSON.stringify(defaults)));
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("discovery");

  // Direct Scraper extracts content from exactly the target URL — there's no
  // discovery phase, so link extraction strategy/limit/patterns and the
  // discovered-link filter chain don't apply to it.
  const isDirectScraper = settings.mode === "scraper";
  // Sitemap discovery is plain HTTP (no browser is ever launched), so none of
  // the Browser & Behavior settings do anything for it.
  const isSitemap = settings.mode === "sitemap";
  // Only Crawler and Scraper modes actually extract page content; Sitemap and
  // Link Extraction only ever discover URLs/links.
  const showExtraction = settings.mode === "crawler" || settings.mode === "scraper";
  // Only Link Extraction branches on shallow/deep — Crawler always runs a
  // single orchestrated pass regardless of this setting.
  const showStrategy = settings.mode === "link_extraction";
  // Human-behavior simulation only drives the deep-link-extraction and
  // crawler worker loops; Sitemap has no browser and Scraper has no such loop.
  const showHumanBehavior = settings.mode === "link_extraction" || settings.mode === "crawler";
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const { data: templateData, refetch: refetchTemplates } = usePolledResource(() => listTemplates(), {
    cacheKey: "templates",
  });
  const templates = templateData?.items ?? [];
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [launchingTemplate, setLaunchingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);

  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Caps the Launch card's height to match the left column exactly (rather
  // than the reverse) — the left column only renders one Advanced Settings
  // tab at a time, so it's naturally shorter than the unfolded settings
  // summary, which lists every section at once.
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const [leftColumnHeight, setLeftColumnHeight] = useState<number | null>(null);
  const isDesktopLayout = useMediaQuery("(min-width: 1280px)");

  useEffect(() => {
    const el = leftColumnRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setLeftColumnHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function patchSettings(patch: Partial<CrawlSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  async function handleLaunch() {
    const url = normalizeUrl(targetUrl);
    if (!url) return;
    setLaunching(true);
    setLaunchError(null);
    try {
      const job = await createCrawl(url, settings);
      navigate(`/dashboard/crawls/${job.id}`);
    } catch (err) {
      setLaunchError(err instanceof ApiError ? err.message : "Failed to start crawl.");
      setLaunching(false);
    }
  }

  async function handleSaveTemplate() {
    if (!saveName.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await createTemplate(saveName.trim(), settings);
      setSaveOpen(false);
      setSaveName("");
      refetchTemplates();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save template.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLaunchFromTemplate() {
    const url = normalizeUrl(targetUrl);
    if (!url) {
      setTemplateError("Enter a target URL above first.");
      return;
    }
    const template = templates.find((t) => t.id === templateId);
    if (!template) {
      setTemplateError("Select a template first.");
      return;
    }
    setLaunchingTemplate(true);
    setTemplateError(null);
    try {
      const job = await createCrawlFromPayload({
        target_url: url,
        mode: settings.mode,
        settings: template.settings,
        filters: template.filters,
      });
      navigate(`/dashboard/crawls/${job.id}`);
    } catch (err) {
      setTemplateError(err instanceof ApiError ? err.message : "Failed to start crawl from template.");
      setLaunchingTemplate(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="xl:col-span-3">
        <PageHeader
          icon={Globe}
          title="New Crawl"
          description="Point the crawler at a site and choose how to discover and scrape it."
        />
      </div>
      <div ref={leftColumnRef} className="space-y-6 xl:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Target &amp; Strategy</CardTitle>
            <CardDescription>What to crawl and how to discover its URLs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="target-url">Target URL</Label>
              <div className="relative">
                <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="target-url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="example.com/blog"
                  className="pl-9"
                />
              </div>
            </div>

            <ModeSelector
              value={settings.mode}
              onChange={(mode) => {
                patchSettings({ mode });
                if (mode === "scraper" && (activeTab === "discovery" || activeTab === "filters")) {
                  setActiveTab("scraping");
                } else if (mode === "sitemap" && activeTab === "browser") {
                  setActiveTab("network");
                }
              }}
            />

            {templates.length > 0 && (
              <div className="space-y-1.5 rounded-lg border border-dashed border-border p-3">
                <Label>Start from a template</Label>
                <p className="text-xs text-muted-foreground">
                  Applies the template's saved settings instead of the Advanced Settings below. Mode is
                  still whatever's selected above.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Select value={templateId ?? undefined} onValueChange={setTemplateId}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!templateId || launchingTemplate}
                    onClick={handleLaunchFromTemplate}
                  >
                    {launchingTemplate ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Layers className="h-3.5 w-3.5" />
                    )}
                    Launch from template
                  </Button>
                </div>
                {templateError && <p className="text-xs font-medium text-destructive">{templateError}</p>}
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border border-dashed border-border p-3">
              <div className="space-y-0.5">
                <Label>Save these settings</Label>
                <p className="text-xs text-muted-foreground">
                  Snapshot the Advanced Settings below as a reusable template.
                </p>
              </div>
              <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Save className="h-3.5 w-3.5" /> Save as template…
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save as template</DialogTitle>
                    <DialogDescription>
                      Snapshots the current Advanced Settings under a name you can reuse later.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-1.5">
                    <Label htmlFor="save-template-name">Template name</Label>
                    <Input
                      id="save-template-name"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder="e.g. Fast JSON scrape"
                    />
                  </div>
                  {saveError && <p className="text-sm text-destructive">{saveError}</p>}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSaveOpen(false)} disabled={saving}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveTemplate} disabled={saving || !saveName.trim()}>
                      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save template
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>
              Shared configuration across discovery, scraping, and browser behavior.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                {!isDirectScraper && <TabsTrigger value="discovery">Discovery</TabsTrigger>}
                <TabsTrigger value="scraping">Scraping</TabsTrigger>
                {!isDirectScraper && <TabsTrigger value="filters">Filters</TabsTrigger>}
                <TabsTrigger value="network">Network</TabsTrigger>
                {!isSitemap && <TabsTrigger value="browser">Browser &amp; Behavior</TabsTrigger>}
              </TabsList>

              {!isDirectScraper && (
                <TabsContent value="discovery">
                  <LinkExtractionSection
                    settings={settings}
                    onChange={patchSettings}
                    showStrategy={showStrategy}
                    limitLabel={settings.mode === "crawler" ? "Page limit" : "Link / URL limit"}
                    limitDescription={
                      settings.mode === "crawler"
                        ? "Hard cap on pages scraped, not just discovered."
                        : "Hard cap on collected links. Always set this for broad sites."
                    }
                  />
                </TabsContent>
              )}
              <TabsContent value="scraping">
                <ScrapingSection settings={settings} onChange={patchSettings} showExtraction={showExtraction} />
              </TabsContent>
              {!isDirectScraper && (
                <TabsContent value="filters">
                  <FilterChainBuilder
                    group={settings.filterGroup}
                    onChange={(filterGroup) => patchSettings({ filterGroup })}
                  />
                </TabsContent>
              )}
              <TabsContent value="network">
                <ProxySection settings={settings} onChange={patchSettings} />
              </TabsContent>
              {!isSitemap && (
                <TabsContent value="browser">
                  <BrowserSection
                    settings={settings}
                    onChange={patchSettings}
                    showHumanBehavior={showHumanBehavior}
                  />
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div>
        <LaunchSummary
          targetUrl={normalizeUrl(targetUrl)}
          settings={settings}
          disabled={!targetUrl.trim()}
          launching={launching}
          error={launchError}
          onLaunch={handleLaunch}
          previewOpen={previewOpen}
          onPreviewOpenChange={setPreviewOpen}
          matchHeight={isDesktopLayout ? leftColumnHeight : null}
        />
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2, ScanSearch, SearchX, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { ProgressPanel } from "@/components/crawl-detail/progress-panel";
import { UsedSettingsPanel } from "@/components/crawl-detail/used-settings-panel";
import { ResultsTable } from "@/components/crawl-detail/results-table";
import { DiscoveredUrlsList } from "@/components/crawl-detail/discovered-urls-list";
import { LiveLogConsole } from "@/components/crawl-detail/live-log-console";
import { ScrapingSection } from "@/components/crawl-form/scraping-section";
import { ProxySection } from "@/components/crawl-form/proxy-section";
import { BrowserSection } from "@/components/crawl-form/browser-section";
import { usePolledResource } from "@/hooks/use-polled-resource";
import { ApiError } from "@/lib/api";
import {
  cancelCrawl,
  deleteCrawl,
  deleteDiscoveredUrl,
  downloadCrawlResults,
  getCrawl,
  listCrawlLogs,
  listData,
  listDiscoveredUrls,
  retryCrawl,
  scrapeDiscovered,
} from "@/lib/crawls-api";
import { useSettingsStore } from "@/store/settings-store";
import type { CrawlDetail, CrawlSettings } from "@/lib/types";

const ACTIVE_STATUSES = new Set(["queued", "running"]);
const PAGE_SIZE = 20;
// Reused across remounts (e.g. navigating away and back to the same crawl) so the
// detail view shows the last-known job instantly instead of blanking while it reloads.
const jobCache = new Map<string, CrawlDetail>();

function ResultsTabPanel({ jobId }: { jobId: string }) {
  const [page, setPage] = useState(0);
  const { data, error } = usePolledResource(
    () => listData({ jobId, limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
    { deps: [jobId, page], cacheKey: `crawl-results:${jobId}:${page}` },
  );
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <ResultsTable results={items} />
      {total > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />}
    </div>
  );
}

function DiscoveredTabPanel({ jobId }: { jobId: string }) {
  const navigate = useNavigate();
  const defaults = useSettingsStore((s) => s.defaults);

  const [page, setPage] = useState(0);
  const { data, error, refetch } = usePolledResource(
    () => listDiscoveredUrls(jobId, { limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
    { deps: [jobId, page], cacheKey: `crawl-discovered:${jobId}:${page}` },
  );
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const [scrapeOpen, setScrapeOpen] = useState(false);
  const [scrapeSettings, setScrapeSettings] = useState<CrawlSettings>(() => JSON.parse(JSON.stringify(defaults)));
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  function patchScrapeSettings(patch: Partial<CrawlSettings>) {
    setScrapeSettings((prev) => ({ ...prev, ...patch }));
  }

  async function handleDeleteRow(discoveredId: string) {
    setDeletingId(discoveredId);
    setRowError(null);
    try {
      await deleteDiscoveredUrl(jobId, discoveredId);
      refetch();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Failed to delete this URL.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleScrape() {
    setScraping(true);
    setScrapeError(null);
    try {
      const job = await scrapeDiscovered(jobId, scrapeSettings);
      navigate(`/dashboard/crawls/${job.id}`);
    } catch (err) {
      setScrapeError(err instanceof ApiError ? err.message : "Failed to start scraping.");
      setScraping(false);
    }
  }

  return (
    <div className="space-y-3">
      {(error || rowError) && <p className="text-sm text-destructive">{error ?? rowError}</p>}

      <div className="flex justify-end">
        <Dialog open={scrapeOpen} onOpenChange={setScrapeOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={total === 0}>
              <ScanSearch className="h-3.5 w-3.5" /> Scrape discovered URLs
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Scrape discovered URLs</DialogTitle>
              <DialogDescription>
                Starts a new job that extracts content from all of this crawl's discovered URLs using
                the settings below.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="scraping">
              <TabsList className="mb-4">
                <TabsTrigger value="scraping">Scraping</TabsTrigger>
                <TabsTrigger value="network">Network</TabsTrigger>
                <TabsTrigger value="browser">Browser &amp; Behavior</TabsTrigger>
              </TabsList>
              <TabsContent value="scraping">
                <ScrapingSection settings={scrapeSettings} onChange={patchScrapeSettings} />
              </TabsContent>
              <TabsContent value="network">
                <ProxySection settings={scrapeSettings} onChange={patchScrapeSettings} />
              </TabsContent>
              <TabsContent value="browser">
                <BrowserSection settings={scrapeSettings} onChange={patchScrapeSettings} showHumanBehavior={false} />
              </TabsContent>
            </Tabs>

            {scrapeError && <p className="text-sm text-destructive">{scrapeError}</p>}

            <DialogFooter>
              <Button variant="outline" onClick={() => setScrapeOpen(false)} disabled={scraping}>
                Cancel
              </Button>
              <Button onClick={handleScrape} disabled={scraping}>
                {scraping && <Loader2 className="h-4 w-4 animate-spin" />}
                Start scrape
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DiscoveredUrlsList urls={items} onDelete={handleDeleteRow} deletingId={deletingId} />
      {total > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />}
    </div>
  );
}

function LogsTabPanel({ jobId }: { jobId: string }) {
  const [page, setPage] = useState(0);
  const { data, error } = usePolledResource(
    () => listCrawlLogs(jobId, { limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
    { deps: [jobId, page], cacheKey: `crawl-logs:${jobId}:${page}` },
  );
  // Backend returns newest-first for pagination; reverse so each page still
  // reads top-to-bottom chronologically, like a normal log console.
  const items = [...(data?.items ?? [])].reverse();
  const total = data?.total ?? 0;

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <LiveLogConsole logs={items} />
      {total > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />}
    </div>
  );
}

export default function CrawlDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<CrawlDetail | null>(() => (jobId ? jobCache.get(jobId) ?? null : null));
  const [loading, setLoading] = useState(() => !(jobId && jobCache.has(jobId)));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    if (!jobId) return;
    try {
      const detail = await getCrawl(jobId);
      setJob(detail);
      setLoadError(null);
      jobCache.set(jobId, detail);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Failed to load crawl.");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    setJob(jobId ? jobCache.get(jobId) ?? null : null);
    setLoading(!(jobId && jobCache.has(jobId)));
    load();
  }, [load, jobId]);

  useEffect(() => {
    if (!job || !ACTIVE_STATUSES.has(job.status)) return;
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, [job, load]);

  async function handleCancel() {
    if (!job) return;
    try {
      await cancelCrawl(job.id);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to cancel crawl.");
    }
  }

  async function handleDownload() {
    if (!job) return;
    setDownloading(true);
    try {
      await downloadCrawlResults(job.id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to download results.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleDelete() {
    if (!job) return;
    setDeleting(true);
    try {
      await deleteCrawl(job.id);
      navigate("/dashboard/crawls", { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete crawl.");
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  async function handleRetry() {
    if (!job) return;
    setRetrying(true);
    try {
      const next = await retryCrawl(job.id);
      navigate(`/dashboard/crawls/${next.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to start a new crawl.");
      setRetrying(false);
    }
  }

  if (loading && !job) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading crawl…
      </div>
    );
  }

  if (!job) {
    return (
      <EmptyState
        icon={SearchX}
        title="Crawl not found"
        description={loadError ?? "This crawl may have been removed, or the link is incorrect."}
        action={
          <Button asChild size="sm">
            <Link to="/dashboard/crawls">Back to history</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/dashboard/crawls" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to history
        </Link>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={ACTIVE_STATUSES.has(job.status)}
              title={ACTIVE_STATUSES.has(job.status) ? "Cancel the crawl before deleting it" : undefined}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this crawl?</DialogTitle>
              <DialogDescription>
                This permanently removes <span className="break-all font-medium text-foreground">{job.targetUrl}</span> along
                with all of its discovered URLs, results, and logs. This can't be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete crawl
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ProgressPanel
        job={job}
        onCancel={handleCancel}
        onRetry={handleRetry}
        onDownload={handleDownload}
        downloading={downloading}
      />
      {retrying && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Starting new crawl…
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="results">
            <TabsList className="mb-4">
              <TabsTrigger value="results">Results ({job.urlsScraped})</TabsTrigger>
              <TabsTrigger value="discovered">Discovered URLs ({job.urlsDiscovered})</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="settings">Settings Used</TabsTrigger>
            </TabsList>

            <TabsContent value="results">
              <ResultsTabPanel jobId={job.id} />
            </TabsContent>
            <TabsContent value="discovered">
              <DiscoveredTabPanel jobId={job.id} />
            </TabsContent>
            <TabsContent value="logs">
              <LogsTabPanel jobId={job.id} />
            </TabsContent>
            <TabsContent value="settings">
              <UsedSettingsPanel settings={job.settings} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

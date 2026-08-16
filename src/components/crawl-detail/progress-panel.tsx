import { Ban, CheckCircle2, Clock3, Download, Gauge, Loader2, RotateCcw, XCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { ThroughputChart } from "@/components/crawl-detail/throughput-chart";
import { DiscoveryChart } from "@/components/crawl-detail/discovery-chart";
import { formatDuration, formatNumber } from "@/lib/utils";
import type { CrawlDetail } from "@/lib/types";

// Sitemap/link_extraction jobs only discover URLs — they never scrape, so
// urlsScraped/urlsFailed and throughputHistory stay at zero/empty for their
// entire run (confirmed against the live backend). Track discovery instead
// of extraction progress for these modes so the bar/graph aren't dead the
// whole time the job is actually working.
const DISCOVERY_ONLY_MODES = new Set(["sitemap", "link_extraction"]);

export function ProgressPanel({
  job,
  onCancel,
  onRetry,
  onDownload,
  downloading,
}: {
  job: CrawlDetail;
  onCancel: () => void;
  onRetry: () => void;
  onDownload: () => void;
  downloading: boolean;
}) {
  const discoveryOnly = DISCOVERY_ONLY_MODES.has(job.mode);
  const processed = discoveryOnly ? job.urlsDiscovered : job.urlsScraped + job.urlsFailed;
  const pct = job.urlLimit > 0 ? Math.min(100, Math.round((processed / job.urlLimit) * 100)) : 0;
  const elapsed = ((job.finishedAt ?? Date.now()) - (job.startedAt ?? job.createdAt)) / 1000;
  const currentRate = job.throughputHistory.at(-1)?.pagesPerSec ?? 0;

  const metrics = [
    { icon: Gauge, label: "Discovered", value: formatNumber(job.urlsDiscovered) },
    { icon: CheckCircle2, label: "Scraped", value: formatNumber(job.urlsScraped) },
    { icon: XCircle, label: "Failed", value: formatNumber(job.urlsFailed) },
    { icon: Clock3, label: "Elapsed", value: formatDuration(elapsed) },
  ];

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <a
              href={job.targetUrl}
              target="_blank"
              rel="noreferrer"
              className="truncate text-sm font-semibold text-foreground hover:text-primary hover:underline underline-offset-2"
            >
              {job.targetUrl}
            </a>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={job.status} />
              <span className="text-xs text-muted-foreground">
                {job.status === "running"
                  ? discoveryOnly
                    ? `${formatNumber(job.urlsDiscovered)} URLs discovered so far`
                    : `${currentRate.toFixed(1)} pages/s`
                  : discoveryOnly
                    ? `${formatNumber(processed)} URLs discovered`
                    : `${processed} pages processed`}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {job.urlsScraped > 0 && (
              <Button variant="outline" size="sm" disabled={downloading} onClick={onDownload}>
                {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Download results
              </Button>
            )}
            {job.status === "running" && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                <Ban className="h-3.5 w-3.5" /> Cancel
              </Button>
            )}
            {(job.status === "failed" || job.status === "cancelled") && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RotateCcw className="h-3.5 w-3.5" /> Run again
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {processed} / {job.urlLimit} URLs {discoveryOnly ? "discovered" : ""}
            </span>
            <span>{pct}%</span>
          </div>
          <Progress
            value={pct}
            indicatorClassName={
              job.status === "failed"
                ? "bg-destructive"
                : job.status === "cancelled"
                  ? "bg-warning"
                  : undefined
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-lg border border-border p-3">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <m.icon className="h-3 w-3" />
                {m.label}
              </span>
              <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{m.value}</p>
            </div>
          ))}
        </div>

        {discoveryOnly ? (
          <DiscoveryChart history={job.discoveryHistory} />
        ) : (
          <ThroughputChart history={job.throughputHistory} />
        )}
      </CardContent>
    </Card>
  );
}

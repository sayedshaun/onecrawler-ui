import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { formatNumber } from "@/lib/utils";
import type { CrawlSummary } from "@/lib/types";

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

interface Row {
  name: string;
  scraped: number;
  failed: number;
}

function ScatterTooltip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-foreground">{row.name}</p>
      <p className="mt-1 text-muted-foreground">
        <span className="text-foreground">{formatNumber(row.scraped)}</span> scraped
      </p>
      <p className="text-muted-foreground">
        <span className={row.failed > 0 ? "text-destructive" : "text-foreground"}>
          {formatNumber(row.failed)}
        </span>{" "}
        failed
      </p>
    </div>
  );
}

/** One point per unique website (crawls to the same site are summed
 * together first) plotted as scraped-vs-failed — a scatter reads the
 * relationship between volume and failure rate at a glance: sites in the
 * lower-right scrape a lot cleanly, ones drifting up are worth checking. */
export function ScrapedPerCrawlChart({ jobs }: { jobs: CrawlSummary[] }) {
  const totals = new Map<string, { scraped: number; failed: number }>();
  for (const j of jobs) {
    const name = domainOf(j.targetUrl);
    const entry = totals.get(name) ?? { scraped: 0, failed: 0 };
    entry.scraped += j.urlsScraped;
    entry.failed += j.urlsFailed;
    totals.set(name, entry);
  }

  const data: Row[] = Array.from(totals, ([name, v]) => ({ name, ...v }));

  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No crawls yet — extraction volume will appear here.
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="scraped"
            name="Scraped"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatNumber(v)}
          />
          <YAxis
            type="number"
            dataKey="failed"
            name="Failed"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(v: number) => formatNumber(v)}
          />
          <ZAxis type="number" dataKey="scraped" range={[64, 400]} />
          <Tooltip cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }} content={<ScatterTooltip />} />
          <Scatter data={data} fill="hsl(var(--primary) / 0.65)" stroke="hsl(var(--primary))" isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

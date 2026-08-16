import { Link } from "react-router-dom";
import { ArrowUpRight, FileSearch, Globe, Map, Waypoints } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { RowCardLink } from "@/components/shared/row-card";
import { formatNumber, formatRelativeTime, truncate } from "@/lib/utils";
import type { CrawlMode, CrawlSummary } from "@/lib/types";

const MODE_META: Record<CrawlMode, { label: string; icon: typeof Globe }> = {
  sitemap: { label: "Sitemap", icon: Map },
  link_extraction: { label: "Link Extraction", icon: Waypoints },
  crawler: { label: "Crawler", icon: Globe },
  scraper: { label: "Scraper", icon: FileSearch },
};

export function CrawlsTable({ jobs }: { jobs: CrawlSummary[] }) {
  return (
    <>
      {/* Below sm: a table can't fit this much data without cropping or blind
          horizontal scrolling, so render stacked cards instead. */}
      <div className="space-y-2 sm:hidden">
        {jobs.map((job) => {
          const Mode = MODE_META[job.mode];
          return (
            <RowCardLink key={job.id} to={`/dashboard/crawls/${job.id}`}>
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 truncate font-medium text-foreground">
                  {truncate(job.targetUrl.replace(/^https?:\/\//, ""), 30)}
                </span>
                <StatusBadge status={job.status} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Mode.icon className="h-3 w-3" /> {Mode.label}
                </span>
                <span>{formatNumber(job.urlsScraped)} scraped</span>
                {job.urlsFailed > 0 && (
                  <span className="text-destructive">{formatNumber(job.urlsFailed)} failed</span>
                )}
                {job.startedAt && <span>{formatRelativeTime(new Date(job.startedAt))}</span>}
              </div>
            </RowCardLink>
          );
        })}
      </div>

      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Target</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Scraped</TableHead>
              <TableHead className="hidden text-right md:table-cell">Failed</TableHead>
              <TableHead className="hidden md:table-cell">Started</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => {
              const Mode = MODE_META[job.mode];
              return (
                <TableRow key={job.id}>
                  <TableCell>
                    <Link
                      to={`/dashboard/crawls/${job.id}`}
                      className="font-medium text-foreground transition-colors duration-150 ease-out hover:text-primary hover:underline underline-offset-2"
                    >
                      {truncate(job.targetUrl.replace(/^https?:\/\//, ""), 42)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mode.icon className="h-3.5 w-3.5" />
                      {Mode.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={job.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(job.urlsScraped)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums text-muted-foreground md:table-cell">
                    {job.urlsFailed > 0 ? formatNumber(job.urlsFailed) : "—"}
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {job.startedAt ? formatRelativeTime(new Date(job.startedAt)) : "—"}
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/dashboard/crawls/${job.id}`}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 ease-out hover:bg-accent hover:text-foreground"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

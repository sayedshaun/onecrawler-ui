import { useEffect, useState } from "react";
import { Search, History as HistoryIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrawlsTable } from "@/components/shared/crawls-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePolledResource } from "@/hooks/use-polled-resource";
import { listCrawls } from "@/lib/crawls-api";
import type { CrawlStatus } from "@/lib/types";

const PAGE_SIZE = 20;

const FILTERS: { value: CrawlStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "running", label: "Running" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function HistoryPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [status, setStatus] = useState<CrawlStatus | "all">("all");
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, status]);

  const { data, loading, error } = usePolledResource(
    () =>
      listCrawls({
        q: debouncedQuery.trim() || undefined,
        status: status === "all" ? undefined : status,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
    {
      intervalMs: 4000,
      deps: [debouncedQuery, status, page],
      cacheKey: `history:${status}:${debouncedQuery.trim()}:${page}`,
    },
  );

  const jobs = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-4">
      <PageHeader
        icon={HistoryIcon}
        title="Crawl History"
        description="Every crawl you've run, with live status."
        actions={
          <Button asChild size="sm">
            <Link to="/dashboard/crawls/new">Start a new crawl</Link>
          </Button>
        }
      />
      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by target URL…"
                className="pl-9"
              />
            </div>
            <Tabs value={status} onValueChange={(v) => setStatus(v as CrawlStatus | "all")}>
              <TabsList>
                {FILTERS.map((f) => (
                  <TabsTrigger key={f.value} value={f.value}>
                    {f.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {!loading && jobs.length === 0 ? (
            <EmptyState
              icon={HistoryIcon}
              title="No crawls match"
              description="Try a different search term or status filter."
              action={
                <Button asChild size="sm" variant="outline">
                  <Link to="/dashboard/crawls/new">Start a new crawl</Link>
                </Button>
              }
            />
          ) : (
            <>
              <CrawlsTable jobs={jobs} />
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

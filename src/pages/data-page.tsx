import { useEffect, useState } from "react";
import { Database, Download, Eye, Loader2, Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { ResultDetailDrawer } from "@/components/shared/result-detail-drawer-lazy";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePolledResource } from "@/hooks/use-polled-resource";
import { ApiError } from "@/lib/api";
import { downloadDataItem, exportData, listData } from "@/lib/crawls-api";
import { formatRelativeTime, truncate } from "@/lib/utils";
import type { DataItem, ExportArchiveFormat, ScrapingOutputFormat } from "@/lib/types";

const PAGE_SIZE = 20;
const FORMATS: Array<{ value: ScrapingOutputFormat | "all"; label: string }> = [
  { value: "all", label: "All formats" },
  { value: "markdown", label: "Markdown" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
  { value: "xmltei", label: "TEI XML" },
];

const ARCHIVE_FORMATS: Array<{ value: ExportArchiveFormat; label: string }> = [
  { value: "zip", label: "ZIP (one file per result)" },
  { value: "ndjson", label: "NDJSON (single file)" },
];

export default function DataPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [format, setFormat] = useState<ScrapingOutputFormat | "all">("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<DataItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [archiveFormat, setArchiveFormat] = useState<ExportArchiveFormat>("zip");
  const [exportingSelected, setExportingSelected] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    setPage(0);
    setSelectedIds(new Set());
  }, [debouncedQuery, format]);

  async function handleDownload(id: string) {
    setDownloadingId(id);
    try {
      await downloadDataItem(id);
    } catch {
      // Best-effort — the drawer's own content view remains the fallback.
    } finally {
      setDownloadingId(null);
    }
  }

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSelectAllOnPage(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const item of items) {
        if (checked) next.add(item.id);
        else next.delete(item.id);
      }
      return next;
    });
  }

  async function handleExportSelected() {
    setExportingSelected(true);
    setExportError(null);
    try {
      await exportData({ ids: Array.from(selectedIds), archiveFormat });
      setSelectedIds(new Set());
    } catch (err) {
      setExportError(err instanceof ApiError ? err.message : "Failed to export selected items.");
    } finally {
      setExportingSelected(false);
    }
  }

  async function handleExportAllMatching() {
    setExportingAll(true);
    setExportError(null);
    try {
      await exportData({
        q: query.trim() || undefined,
        format: format === "all" ? undefined : format,
        archiveFormat,
      });
    } catch (err) {
      setExportError(err instanceof ApiError ? err.message : "Failed to export matching items.");
    } finally {
      setExportingAll(false);
    }
  }

  const { data, loading, error } = usePolledResource(
    () =>
      listData({
        q: debouncedQuery.trim() || undefined,
        format: format === "all" ? undefined : format,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
    {
      deps: [debouncedQuery, format, page],
      cacheKey: `data:${format}:${debouncedQuery.trim()}:${page}`,
    },
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const allOnPageSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Database}
        title="Extracted Data"
        description="Everything your crawls have scraped, ready to preview or export."
      />
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, URL, or content…"
                className="pl-9"
              />
            </div>
            <Select value={format} onValueChange={(v) => setFormat(v as ScrapingOutputFormat | "all")}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border border-border bg-muted/40 flex flex-col gap-3 rounded-lg p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {selectedIds.size > 0 ? (
                <span>
                  <span className="font-medium text-foreground">{selectedIds.size}</span> selected
                </span>
              ) : (
                <span>Export scraped results as a bulk file.</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={archiveFormat} onValueChange={(v) => setArchiveFormat(v as ExportArchiveFormat)}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ARCHIVE_FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedIds.size > 0 && (
                <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
                  Clear selection
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                disabled={selectedIds.size === 0 || exportingSelected}
                onClick={handleExportSelected}
              >
                {exportingSelected ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Download selected
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={total === 0 || exportingAll}
                onClick={handleExportAllMatching}
              >
                {exportingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Download all matching ({total})
              </Button>
            </div>
          </div>

          {exportError && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{exportError}</p>}

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          {!loading && items.length === 0 ? (
            <EmptyState
              icon={Database}
              title="No extracted data"
              description="Results from completed crawls will show up here once pages have been scraped."
            />
          ) : (
            <>
              {/* Below sm: a 6-column table can't fit this much data without
                  cropping or blind horizontal scrolling — stack cards instead. */}
              <div className="space-y-2 sm:hidden">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <Checkbox
                      aria-label={`Select ${item.title || item.url}`}
                      checked={selectedIds.has(item.id)}
                      onChange={(e) => toggleSelected(item.id, e.target.checked)}
                      className="mt-0.5 shrink-0"
                    />
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="min-w-0 flex-1 rounded-md text-left transition-colors duration-150 ease-out hover:bg-accent/50"
                    >
                      <p className="truncate font-medium text-foreground">{truncate(item.title || "(untitled)", 40)}</p>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{item.url}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="uppercase">
                          {item.format}
                        </Badge>
                        <span>{item.wordCount.toLocaleString()} words</span>
                        <span>{formatRelativeTime(new Date(item.extractedAt))}</span>
                      </div>
                    </button>
                  </div>
                ))}
              </div>

              <div className="hidden sm:block">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-9">
                        <Checkbox
                          aria-label="Select all on this page"
                          checked={allOnPageSelected}
                          onChange={(e) => toggleSelectAllOnPage(e.target.checked)}
                        />
                      </TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden w-48 lg:table-cell">Source Crawl</TableHead>
                      <TableHead className="w-28">Format</TableHead>
                      <TableHead className="w-24 text-right">Words</TableHead>
                      <TableHead className="hidden w-28 md:table-cell">Extracted</TableHead>
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox
                            aria-label={`Select ${item.title || item.url}`}
                            checked={selectedIds.has(item.id)}
                            onChange={(e) => toggleSelected(item.id, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell className="min-w-0">
                          <p className="truncate font-medium text-foreground">{truncate(item.title || "(untitled)", 60)}</p>
                          <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{item.url}</p>
                        </TableCell>
                        <TableCell className="hidden truncate text-xs text-muted-foreground lg:table-cell">
                          {item.targetUrl}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="uppercase">
                            {item.format}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {item.wordCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                          {formatRelativeTime(new Date(item.extractedAt))}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(item)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={downloadingId === item.id}
                              onClick={() => handleDownload(item.id)}
                            >
                              {downloadingId === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      <ResultDetailDrawer result={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}

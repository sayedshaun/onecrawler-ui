import { useState } from "react";
import { Download, Eye, FileSearch, Loader2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { RowCardButton } from "@/components/shared/row-card";
import { ResultDetailDrawer } from "@/components/shared/result-detail-drawer-lazy";
import { downloadDataItem } from "@/lib/crawls-api";
import { truncate } from "@/lib/utils";
import type { CrawlResultItem } from "@/lib/types";

export function ResultsTable({ results }: { results: CrawlResultItem[] }) {
  const [selected, setSelected] = useState<CrawlResultItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  if (results.length === 0) {
    return (
      <EmptyState
        icon={FileSearch}
        title="No results yet"
        description="Extracted pages will show up here once scraping begins."
      />
    );
  }

  return (
    <>
      {/* Below sm: stacked cards instead of a cramped 4-column table. */}
      <div className="space-y-2 sm:hidden">
        {results.map((result) => (
          <RowCardButton key={result.id} onClick={() => setSelected(result)}>
            <p className="truncate font-medium text-foreground">{truncate(result.title, 40)}</p>
            <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{result.url}</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="uppercase">
                {result.format}
              </Badge>
              <span>{result.wordCount.toLocaleString()} words</span>
            </div>
          </RowCardButton>
        ))}
      </div>

      <div className="hidden sm:block">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="w-28">Format</TableHead>
              <TableHead className="w-24 text-right">Words</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result) => (
              <TableRow key={result.id}>
                <TableCell className="min-w-0">
                  <p className="truncate font-medium text-foreground">{truncate(result.title, 60)}</p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{result.url}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="uppercase">
                    {result.format}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {result.wordCount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(result)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={downloadingId === result.id}
                      onClick={() => handleDownload(result.id)}
                    >
                      {downloadingId === result.id ? (
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

      <ResultDetailDrawer result={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  );
}

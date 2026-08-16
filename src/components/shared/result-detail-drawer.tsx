import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JsonCodeViewer } from "@/components/shared/json-code-viewer";
import { ApiError } from "@/lib/api";
import { downloadDataItem, getDataItem } from "@/lib/crawls-api";
import { cn, formatNumber } from "@/lib/utils";
import type { DataItemDetail, ScrapingOutputFormat } from "@/lib/types";

export interface ResultRef {
  id: string;
  title: string;
  url: string;
  format: ScrapingOutputFormat;
  wordCount: number;
  extractedAt: number;
}

const IMAGE_URL_PATTERN = /^https?:\/\/\S+\.(png|jpe?g|gif|webp|avif|svg)(\?\S*)?$/i;
const IMAGE_KEY_HINT = /image|photo|thumbnail|thumb|cover|picture|banner|avatar|logo/i;

function isImageUrl(value: unknown): value is string {
  return typeof value === "string" && IMAGE_URL_PATTERN.test(value);
}

function isUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function humanizeKey(key: string): string {
  return key.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** Collapses long text to a few lines by default; the reader expands it on demand. */
function ExpandableText({
  text,
  collapsedClassName = "line-clamp-4",
  threshold = 260,
  className,
}: {
  text: string;
  collapsedClassName?: string;
  threshold?: number;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > threshold;

  return (
    <div>
      <p className={cn(className, !expanded && isLong && collapsedClassName)}>{text}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

function ImageThumb({ src, size = "h-20 w-20" }: { src: string; size?: string }) {
  return (
    <a href={src} target="_blank" rel="noreferrer" className="shrink-0">
      <img
        src={src}
        alt=""
        loading="lazy"
        className={`${size} rounded-md border border-border object-cover transition-opacity duration-150 ease-out hover:opacity-90`}
      />
    </a>
  );
}

function FieldValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined || value === "") {
    return <p className="text-sm text-muted-foreground">—</p>;
  }

  if (isImageUrl(value)) {
    return <ImageThumb src={value} size="h-32 w-32" />;
  }

  if (isUrl(value)) {
    return (
      <a href={value} target="_blank" rel="noreferrer" className="break-all text-sm text-primary hover:underline">
        {value}
      </a>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <p className="text-sm text-muted-foreground">None</p>;

    if (value.every(isImageUrl)) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((src, i) => (
            <ImageThumb key={i} src={src} />
          ))}
        </div>
      );
    }

    if (value.every(isPlainObject)) {
      return (
        <div className="space-y-2">
          {value.map((item, i) => (
            <FieldGrid key={i} data={item as Record<string, unknown>} depth={depth + 1} />
          ))}
        </div>
      );
    }

    return (
      <ul className="list-disc space-y-1 pl-4 text-sm text-foreground">
        {value.map((item, i) => (
          <li key={i} className="break-words">
            {isPlainObject(item) ? JSON.stringify(item) : String(item)}
          </li>
        ))}
      </ul>
    );
  }

  if (isPlainObject(value)) {
    return <FieldGrid data={value} depth={depth + 1} />;
  }

  if (typeof value === "boolean") {
    return <Badge variant={value ? "success" : "secondary"}>{String(value)}</Badge>;
  }

  return (
    <ExpandableText
      text={String(value)}
      className="whitespace-pre-wrap break-words text-sm text-foreground"
    />
  );
}

function FieldGrid({ data, depth = 0 }: { data: Record<string, unknown>; depth?: number }) {
  const entries = Object.entries(data).filter(([, value]) => !isEmptyValue(value));
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No fields.</p>;
  }
  return (
    <div className={`space-y-3 rounded-lg border border-border p-3 ${depth > 0 ? "bg-muted/30" : "bg-muted/10"}`}>
      {entries.map(([key, value]) => (
        <div key={key}>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {humanizeKey(key)}
          </p>
          <FieldValue value={value} depth={depth} />
        </div>
      ))}
    </div>
  );
}

/** Top-level JSON view: pulls out a hero image and groups fields by shape
 * (short scalars → tile grid, long text → readable blocks, arrays/objects →
 * full-width sections) instead of dumping everything as one flat list. */
function StructuredDataView({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, value]) => !isEmptyValue(value));
  const heroEntry = entries.find(([key, value]) => isImageUrl(value) && IMAGE_KEY_HINT.test(key));

  const scalars: [string, unknown][] = [];
  const longText: [string, unknown][] = [];
  const complex: [string, unknown][] = [];

  for (const [key, value] of entries) {
    if (heroEntry && key === heroEntry[0]) continue;
    if (typeof value === "string" && value.length > 70 && !/^https?:\/\//i.test(value)) {
      longText.push([key, value]);
    } else if (Array.isArray(value) || isPlainObject(value)) {
      complex.push([key, value]);
    } else {
      scalars.push([key, value]);
    }
  }

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">This result has no fields.</p>;
  }

  return (
    <div className="space-y-5">
      {heroEntry && (
        <img
          src={heroEntry[1] as string}
          alt=""
          loading="lazy"
          className="max-h-72 w-full rounded-lg border border-border object-cover"
        />
      )}

      {scalars.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {scalars.map(([key, value]) => (
            <div key={key} className="rounded-lg border border-border p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{humanizeKey(key)}</p>
              <div className="mt-1">
                <FieldValue value={value} />
              </div>
            </div>
          ))}
        </div>
      )}

      {longText.map(([key, value]) => (
        <div key={key} className="rounded-lg border border-border p-4">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {humanizeKey(key)}
          </p>
          <ExpandableText
            text={value as string}
            className="whitespace-pre-wrap text-sm leading-relaxed text-foreground"
          />
        </div>
      ))}

      {complex.map(([key, value]) => (
        <div key={key}>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {humanizeKey(key)}
          </p>
          <FieldValue value={value} />
        </div>
      ))}
    </div>
  );
}

function ContentBody({ detail }: { detail: DataItemDetail }) {
  const content = detail.content;
  if (!content || Object.keys(content).length === 0) {
    return <p className="text-sm text-muted-foreground">This result has no content.</p>;
  }

  // JSON-mode scrapes store the full extracted field set as `content`. Default to
  // the raw tree (what the data actually is) with the humanized layout as a toggle.
  if (detail.format === "json") {
    return (
      <Tabs defaultValue="raw">
        <TabsList>
          <TabsTrigger value="raw">Raw JSON</TabsTrigger>
          <TabsTrigger value="structured">Structured</TabsTrigger>
        </TabsList>
        <TabsContent value="raw">
          <JsonCodeViewer data={content} />
        </TabsContent>
        <TabsContent value="structured">
          <StructuredDataView data={content} />
        </TabsContent>
      </Tabs>
    );
  }

  // markdown/xml/xmltei scrapes store their raw text under `text` (or `raw_text`).
  const text = typeof content.text === "string" ? content.text : typeof content.raw_text === "string" ? content.raw_text : null;

  if (text === null) {
    return <StructuredDataView data={content} />;
  }

  if (detail.format === "markdown") {
    return (
      <div className="border border-border bg-muted/40 rounded-lg p-5">
        <div className="prose prose-sm max-w-none sm:prose-base">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return <RawContentBlock content={text} />;
}

function RawContentBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = content.length > 800;

  return (
    <div className="border border-border bg-muted/40 rounded-lg">
      <pre
        className={cn(
          "whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed text-foreground/90",
          !expanded && isLong && "max-h-64 overflow-hidden",
        )}
      >
        {content}
      </pre>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full border-t border-border py-2 text-center text-xs font-medium text-primary hover:underline"
        >
          {expanded ? "Show less" : "Show full content"}
        </button>
      )}
    </div>
  );
}

export function ResultDetailDrawer({
  result,
  onOpenChange,
}: {
  result: ResultRef | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<DataItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!result) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getDataItem(result.id)
      .then((res) => {
        if (!cancelled) setDetail(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load result.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [result]);

  async function handleDownload() {
    if (!result) return;
    setDownloading(true);
    try {
      await downloadDataItem(result.id);
    } catch {
      // Best-effort — the content already visible in the drawer is the fallback.
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Dialog open={!!result} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl">
        {result && (
          <>
            <DialogHeader>
              <DialogTitle className="pr-6">{result.title || "(untitled)"}</DialogTitle>
              <DialogDescription className="break-all font-mono text-xs">{result.url}</DialogDescription>
            </DialogHeader>

            <Button
              variant="outline"
              size="sm"
              className="self-start"
              disabled={downloading}
              onClick={handleDownload}
            >
              {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Download
            </Button>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-border p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Format</p>
                <Badge variant="secondary" className="mt-1 uppercase">{result.format}</Badge>
              </div>
              <div className="rounded-lg border border-border p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Words</p>
                <p className="mt-1 text-sm font-medium tabular-nums text-foreground">{formatNumber(result.wordCount)}</p>
              </div>
              <div className="rounded-lg border border-border p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Extracted</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {new Date(result.extractedAt).toLocaleString()}
                </p>
              </div>
              {detail?.jobId && (
                <div className="rounded-lg border border-border p-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Source Crawl</p>
                  <Link
                    to={`/dashboard/crawls/${detail.jobId}`}
                    className="mt-1 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>

            <Separator />

            <div className="min-h-0">
              {loading && (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading content…
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              {detail && !loading && <ContentBody detail={detail} />}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

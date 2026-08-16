import { apiDownload, apiFetch } from "@/lib/api";
import { buildSettingsPayload, toApiPayload } from "@/lib/api-mapper";
import type {
  CrawlDetail,
  CrawlSettings,
  CrawlSummary,
  DashboardOverview,
  DataItem,
  DataItemDetail,
  DiscoveredUrl,
  ExportArchiveFormat,
  LogLine,
  PaginatedResponse,
} from "@/lib/types";

export interface PageParams {
  limit?: number;
  offset?: number;
}

export interface ListCrawlsParams extends PageParams {
  status?: string;
  q?: string;
}

export function listCrawls(params: ListCrawlsParams = {}): Promise<PaginatedResponse<CrawlSummary>> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.q) qs.set("q", params.q);
  qs.set("limit", String(params.limit ?? 20));
  qs.set("offset", String(params.offset ?? 0));
  return apiFetch(`/api/v1/crawls?${qs.toString()}`);
}

export function getCrawl(id: string): Promise<CrawlDetail> {
  return apiFetch(`/api/v1/crawls/${id}`);
}

export function listDiscoveredUrls(
  id: string,
  params: PageParams = {},
): Promise<PaginatedResponse<DiscoveredUrl>> {
  const qs = new URLSearchParams();
  qs.set("limit", String(params.limit ?? 50));
  qs.set("offset", String(params.offset ?? 0));
  return apiFetch(`/api/v1/crawls/${id}/discovered?${qs.toString()}`);
}

export function listCrawlLogs(id: string, params: PageParams = {}): Promise<PaginatedResponse<LogLine>> {
  const qs = new URLSearchParams();
  qs.set("limit", String(params.limit ?? 50));
  qs.set("offset", String(params.offset ?? 0));
  return apiFetch(`/api/v1/crawls/${id}/logs?${qs.toString()}`);
}

export function cancelCrawl(id: string): Promise<CrawlSummary> {
  return apiFetch(`/api/v1/crawls/${id}/cancel`, { method: "POST" });
}

export function retryCrawl(id: string): Promise<CrawlSummary> {
  return apiFetch(`/api/v1/crawls/${id}/retry`, { method: "POST" });
}

export function downloadCrawlResults(id: string): Promise<void> {
  return apiDownload(`/api/v1/crawls/${id}/download`, `crawl-${id}.json`);
}

export function scrapeDiscovered(jobId: string, settings: CrawlSettings): Promise<CrawlSummary> {
  const { settings: settingsPayload } = buildSettingsPayload(settings);
  return apiFetch(`/api/v1/crawls/${jobId}/scrape`, {
    method: "POST",
    body: JSON.stringify({ settings: settingsPayload }),
  });
}

export function deleteDiscoveredUrl(jobId: string, discoveredId: string): Promise<void> {
  return apiFetch(`/api/v1/crawls/${jobId}/discovered/${discoveredId}`, { method: "DELETE" });
}

export function deleteCrawl(id: string): Promise<void> {
  return apiFetch(`/api/v1/crawls/${id}`, { method: "DELETE" });
}

export function createCrawlFromPayload(payload: unknown): Promise<CrawlSummary> {
  return apiFetch("/api/v1/crawls", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createCrawl(targetUrl: string, settings: CrawlSettings): Promise<CrawlSummary> {
  return createCrawlFromPayload(toApiPayload(targetUrl, settings));
}

export function getDashboardOverview(): Promise<DashboardOverview> {
  return apiFetch("/api/v1/dashboard/overview");
}

export interface ListDataParams extends PageParams {
  jobId?: string;
  format?: string;
  q?: string;
}

export function listData(params: ListDataParams = {}): Promise<PaginatedResponse<DataItem>> {
  const qs = new URLSearchParams();
  if (params.jobId) qs.set("job_id", params.jobId);
  if (params.format) qs.set("format", params.format);
  if (params.q) qs.set("q", params.q);
  qs.set("limit", String(params.limit ?? 50));
  qs.set("offset", String(params.offset ?? 0));
  return apiFetch(`/api/v1/data?${qs.toString()}`);
}

export function getDataItem(id: string): Promise<DataItemDetail> {
  return apiFetch(`/api/v1/data/${id}`);
}

export function downloadDataItem(id: string): Promise<void> {
  return apiDownload(`/api/v1/data/${id}/download`, `result-${id}.json`);
}

export interface DataExportRequest {
  ids?: string[];
  jobId?: string;
  format?: string;
  q?: string;
  archiveFormat: ExportArchiveFormat;
}

export function exportData(params: DataExportRequest): Promise<void> {
  const { ids, jobId, format, q, archiveFormat } = params;
  const fallback = `data-export.${archiveFormat === "zip" ? "zip" : "ndjson"}`;
  return apiDownload("/api/v1/data/export", fallback, {
    method: "POST",
    body: JSON.stringify({
      ids: ids?.length ? ids : undefined,
      job_id: jobId || undefined,
      format: format || undefined,
      q: q || undefined,
      archive_format: archiveFormat,
    }),
  });
}

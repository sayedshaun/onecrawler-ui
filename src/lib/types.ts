// Mirrors the onecrawler Python `Settings` object shape (onecrawler/settings/*.py)
// so the future FastAPI backend can accept this payload close to as-is.

export type LinkExtractionStrategy = "shallow" | "deep";
export type ScrapingStrategy = "heuristic" | "genai" | "markdownify";
export type ScrapingOutputFormat = "markdown" | "json" | "xml" | "xmltei";
export type ProxyRotationMethod = "round_robin" | "random";
export type GenAIProvider = "openai" | "google" | "ollama";
export type CrawlMode = "sitemap" | "link_extraction" | "crawler" | "scraper";
export type ExportArchiveFormat = "zip" | "ndjson";

export interface ProxySettings {
  server: string;
  username?: string;
  password?: string;
}

export interface BrowserSettings {
  viewport: { width: number; height: number };
  locale: string;
  timezoneId: string;
  userAgent?: string;
  headless: boolean;
  waitUntil: "load" | "domcontentloaded" | "networkidle";
  timeout: number;
}

export interface HumanBehaviorSettings {
  minDelay: number;
  maxDelay: number;
  maxScrolls: number;
  minMouseMoves: number;
  maxMouseMoves: number;
}

export interface GenAISchemaField {
  id: string;
  name: string;
  type: "str" | "int" | "float" | "bool" | "list[str]";
  optional: boolean;
}

export interface GenerativeAISettings {
  provider: GenAIProvider;
  modelName: string;
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  schemaFields: GenAISchemaField[];
}

export type FilterKind =
  | "by_date"
  | "by_keywords"
  | "by_files"
  | "by_extension"
  | "by_cosine_similarity";

export interface FilterNode {
  id: string;
  kind: FilterKind;
  params: Record<string, string>;
}

export type FilterGroupMode = "AND" | "OR";

export interface FilterGroup {
  mode: FilterGroupMode;
  filters: FilterNode[];
}

export interface CrawlSettings {
  mode: CrawlMode;

  linkExtractionStrategy: LinkExtractionStrategy;
  linkExtractionLimit: number;
  includeLinkPatterns: string[];
  excludeLinkPatterns: string[];

  scrapingStrategy: ScrapingStrategy;
  scrapingOutputFormat: ScrapingOutputFormat;
  genai?: GenerativeAISettings;

  concurrency: number;
  maxRetries: number;
  requestTimeout: number;
  retryDelay: number;

  proxies: ProxySettings[];
  proxyRotationMethod: ProxyRotationMethod;

  browserSettings: BrowserSettings;

  enableHumanBehaviors: boolean;
  humanBehaviorSettings: HumanBehaviorSettings;

  filterGroup: FilterGroup;
}

export type CrawlStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface DiscoveredUrl {
  id: string;
  url: string;
  discoveredAt: number;
  status: "pending" | "extracted" | "filtered" | "failed";
}

export interface CrawlResultItem {
  id: string;
  url: string;
  title: string;
  wordCount: number;
  format: ScrapingOutputFormat;
  extractedAt: number;
  preview: string;
}

export interface LogLine {
  id: string;
  timestamp: number;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}

export interface ThroughputPoint {
  t: number;
  pagesPerSec: number;
}

export interface DiscoveryPoint {
  t: number;
  count: number;
}

// Mirrors backend CrawlJobSummaryOut (src/api/v1/crawler/*/schema.py)
export interface CrawlSummary {
  id: string;
  targetUrl: string;
  status: CrawlStatus;
  mode: CrawlMode;
  createdAt: number;
  startedAt?: number | null;
  finishedAt?: number | null;
  urlsDiscovered: number;
  urlsScraped: number;
  urlsFailed: number;
  urlLimit: number;
  error?: string | null;
}

// Mirrors backend CrawlJobDetailOut — `settings` is the raw create-request
// payload (snake_case) as stored, not the UI's CrawlSettings shape.
// Discovered URLs, results, and logs are fetched separately (paginated) —
// see listDiscoveredUrls / listData / listCrawlLogs in crawls-api.ts.
export interface CrawlDetail extends CrawlSummary {
  settings: Record<string, unknown>;
  throughputHistory: ThroughputPoint[];
  discoveryHistory: DiscoveryPoint[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface DashboardOverview {
  totalJobs: number;
  jobCounts: Record<CrawlStatus, number>;
  urlsDiscovered: number;
  urlsScraped: number;
  urlsFailed: number;
  recentJobs: Array<
    Pick<CrawlSummary, "id" | "targetUrl" | "status" | "mode" | "createdAt" | "urlsDiscovered" | "urlsScraped">
  >;
}

// Mirrors backend DataItemOut / DataItemDetailOut (src/api/v1/data/*/schema.py)
export interface DataItem {
  id: string;
  jobId: string;
  targetUrl: string;
  url: string;
  title: string;
  wordCount: number;
  format: ScrapingOutputFormat;
  extractedAt: number;
  preview: string;
}

export interface DataItemDetail extends DataItem {
  // Always a JSON object — heuristic/genai extraction produce structured fields;
  // plain-text scrapes (markdown/xml) are wrapped as { text: "..." } server-side.
  content: Record<string, unknown>;
}

// Mirrors backend CrawlTemplateOut. `settings`/`filters` are the raw snake_case
// create-request payload as stored, not the UI's CrawlSettings shape (see
// buildSettingsPayload in api-mapper.ts — templates snapshot its output).
export interface CrawlTemplate {
  id: string;
  name: string;
  settings: Record<string, unknown>;
  filters: Record<string, unknown> | null;
  createdAt: number;
  updatedAt: number;
}

// Mirrors backend ApiKeyOut.
export interface ApiKeyStatus {
  provider: GenAIProvider;
  hasKey: boolean;
  updatedAt: number | null;
}

// Mirrors backend SessionOut.
export interface UserSession {
  id: string;
  createdAt: number;
  expiresAt: number;
}

// Mirrors backend UsageOut.
export interface UsageStats {
  totalJobs: number;
  jobCounts: Record<CrawlStatus, number>;
  urlsDiscovered: number;
  urlsScraped: number;
  urlsFailed: number;
  jobsThisMonth: number;
  urlsScrapedThisMonth: number;
}

// Agent chat — mirrors onecrawler-backend's streamed chat events.
export type AgentMessageRole = "user" | "assistant";

// Mirrors onecrawler-backend AgentSettingsOut/AgentSettingsIn (per-user
// agent config): which LLM provider/model powers the agent, and an optional
// web-search provider (currently only Tavily) that backs its web_search tool.
// Only `hasKey` is ever read back — the raw keys are write-only.
export type AgentLLMProvider = "openai" | "anthropic" | "google" | "openrouter";

export interface AgentLLMConfig {
  provider: AgentLLMProvider | null;
  model: string | null;
  hasKey: boolean;
}

export interface AgentSearchConfig {
  provider: string | null;
  hasKey: boolean;
}

export interface AgentSettings {
  llm: AgentLLMConfig;
  search: AgentSearchConfig;
  updatedAt: string | null;
}

// A step in the agent's visible trace mid-turn — a tool it decided to call
// ("call") or that tool's outcome ("result"). `id` is the backend's tool-call
// id, shared by a call and its eventual result, so the UI can update one
// in-place chip (spinner -> checkmark) instead of rendering two separate
// entries. `write_todos` calls/results are the agent's own planning tool and
// are flagged via `isPlanning` so the UI can render them as "planning" rather
// than a generic "action". `jobId` links a result back into the existing
// crawl detail route when one is found in it.
export type AgentTraceStepKind = "call" | "result";

export interface AgentTraceStep {
  id: string;
  kind: AgentTraceStepKind;
  toolName: string;
  isPlanning: boolean;
  detail?: string;
  jobId?: string;
}

// A message renders as an ordered sequence of parts — streamed text
// interleaved with trace steps in the exact order the agent produced them
// (a tool call can happen mid-reply, before the model resumes talking).
export type AgentMessagePart =
  | { kind: "text"; id: string; text: string }
  | { kind: "step"; id: string; step: AgentTraceStep };

export interface AgentMessage {
  id: string;
  role: AgentMessageRole;
  parts: AgentMessagePart[];
  createdAt: number;
  pending?: boolean;
  error?: string;
}

// Mirrors onecrawler-backend's ConversationOut — a ChatGPT-style
// history entry. `id` is the conversation_id used as the chat's thread id.
export interface AgentConversationSummary {
  id: string;
  title: string;
  updatedAt: number;
}

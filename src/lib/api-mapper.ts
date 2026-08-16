// Maps the UI's CrawlSettings shape to the snake_case payload that mirrors
// onecrawler's Python `Settings` kwargs (onecrawler/settings/*.py). This is the
// contract the future FastAPI backend is expected to accept.

import { uid } from "@/lib/id";
import type { CrawlSettings, FilterNode, GenAISchemaField, GenerativeAISettings } from "@/lib/types";

function parseListField(value: string): string[] | undefined {
  const items = value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)) : [];
}

export function buildSettingsPayload(settings: CrawlSettings): {
  settings: Record<string, unknown>;
  filters: Record<string, unknown> | null;
} {
  const filters = settings.filterGroup.filters.map((f) => {
    switch (f.kind) {
      case "by_date":
        return { kind: f.kind, start: f.params.start || undefined, end: f.params.end || undefined };
      case "by_keywords":
        return { kind: f.kind, keywords: parseListField(f.params.keywords ?? "") };
      case "by_files":
        return { kind: f.kind, types: parseListField(f.params.types ?? "") };
      case "by_extension":
        return { kind: f.kind, extensions: parseListField(f.params.extensions ?? "") };
      case "by_cosine_similarity":
        return {
          kind: f.kind,
          query: f.params.query,
          threshold: Number(f.params.threshold) || 0,
        };
    }
  });

  return {
    settings: {
      link_extraction_strategy: settings.linkExtractionStrategy,
      link_extraction_limit: settings.linkExtractionLimit,
      include_link_patterns: settings.includeLinkPatterns.length ? settings.includeLinkPatterns : null,
      exclude_link_patterns: settings.excludeLinkPatterns.length ? settings.excludeLinkPatterns : null,

      scraping_strategy: settings.scrapingStrategy,
      scraping_output_format: settings.scrapingOutputFormat,
      genai: settings.genai
        ? {
            provider: settings.genai.provider,
            model_name: settings.genai.modelName,
            api_key: settings.genai.apiKey || undefined,
            base_url: settings.genai.baseUrl || undefined,
            timeout: settings.genai.timeout,
            output_schema: Object.fromEntries(
              settings.genai.schemaFields
                .filter((f) => f.name)
                .map((f) => [f.name, f.optional ? `Optional[${f.type}]` : f.type]),
            ),
          }
        : null,

      concurrency: settings.concurrency,
      max_retries: settings.maxRetries,
      request_timeout: settings.requestTimeout,
      retry_delay: settings.retryDelay,

      proxies: settings.proxies.length ? settings.proxies : null,
      proxy_rotation_method: settings.proxyRotationMethod,

      browser_settings: {
        viewport: settings.browserSettings.viewport,
        locale: settings.browserSettings.locale,
        timezone_id: settings.browserSettings.timezoneId,
        user_agent: settings.browserSettings.userAgent || undefined,
        headless: settings.browserSettings.headless,
        wait_until: settings.browserSettings.waitUntil,
        timeout: settings.browserSettings.timeout,
      },

      enable_human_behaviors: settings.enableHumanBehaviors,
      human_behavior_settings: settings.enableHumanBehaviors
        ? {
            min_delay: settings.humanBehaviorSettings.minDelay,
            max_delay: settings.humanBehaviorSettings.maxDelay,
            max_scrolls: settings.humanBehaviorSettings.maxScrolls,
            min_mouse_moves: settings.humanBehaviorSettings.minMouseMoves,
            max_mouse_moves: settings.humanBehaviorSettings.maxMouseMoves,
          }
        : undefined,
    },
    filters: filters.length ? { mode: settings.filterGroup.mode, chain: filters } : null,
  };
}

// Inverse of buildSettingsPayload — reconstitutes a saved template's raw
// snake_case payload back into the UI's CrawlSettings shape so it can be
// edited with the same form components. `base` supplies fallbacks for
// anything the payload omits (notably `mode`, which templates never store —
// see handleLaunchFromTemplate in new-crawl-page.tsx).
export function parseSettingsPayload(
  settings: Record<string, unknown>,
  filters: Record<string, unknown> | null,
  base: CrawlSettings,
): CrawlSettings {
  const genaiRaw = isRecord(settings.genai) ? settings.genai : null;
  const outputSchema = genaiRaw && isRecord(genaiRaw.output_schema) ? genaiRaw.output_schema : {};

  const browserRaw = isRecord(settings.browser_settings) ? settings.browser_settings : null;
  const viewportRaw = browserRaw && isRecord(browserRaw.viewport) ? browserRaw.viewport : null;

  const humanRaw = isRecord(settings.human_behavior_settings) ? settings.human_behavior_settings : null;

  const chainRaw = isRecord(filters) && Array.isArray(filters.chain) ? filters.chain : [];
  const filterNodes: FilterNode[] = chainRaw
    .filter(isRecord)
    .map((f): FilterNode | null => {
      switch (f.kind) {
        case "by_date":
          return { id: uid("filter"), kind: "by_date", params: { start: String(f.start ?? ""), end: String(f.end ?? "") } };
        case "by_keywords":
          return { id: uid("filter"), kind: "by_keywords", params: { keywords: asStringArray(f.keywords).join(", ") } };
        case "by_files":
          return { id: uid("filter"), kind: "by_files", params: { types: asStringArray(f.types).join(", ") } };
        case "by_extension":
          return { id: uid("filter"), kind: "by_extension", params: { extensions: asStringArray(f.extensions).join(", ") } };
        case "by_cosine_similarity":
          return {
            id: uid("filter"),
            kind: "by_cosine_similarity",
            params: { query: String(f.query ?? ""), threshold: String(f.threshold ?? "0.3") },
          };
        default:
          return null;
      }
    })
    .filter((f): f is FilterNode => f !== null);

  return {
    mode: base.mode,

    linkExtractionStrategy: (settings.link_extraction_strategy as CrawlSettings["linkExtractionStrategy"]) ?? base.linkExtractionStrategy,
    linkExtractionLimit: Number(settings.link_extraction_limit ?? base.linkExtractionLimit),
    includeLinkPatterns: asStringArray(settings.include_link_patterns ?? base.includeLinkPatterns),
    excludeLinkPatterns: asStringArray(settings.exclude_link_patterns ?? base.excludeLinkPatterns),

    scrapingStrategy: (settings.scraping_strategy as CrawlSettings["scrapingStrategy"]) ?? base.scrapingStrategy,
    scrapingOutputFormat: (settings.scraping_output_format as CrawlSettings["scrapingOutputFormat"]) ?? base.scrapingOutputFormat,
    genai: genaiRaw
      ? ({
          provider: genaiRaw.provider as GenerativeAISettings["provider"],
          modelName: String(genaiRaw.model_name ?? ""),
          apiKey: genaiRaw.api_key ? String(genaiRaw.api_key) : undefined,
          baseUrl: genaiRaw.base_url ? String(genaiRaw.base_url) : undefined,
          timeout: genaiRaw.timeout != null ? Number(genaiRaw.timeout) : undefined,
          schemaFields: Object.entries(outputSchema).map(([name, type]): GenAISchemaField => {
            const typeStr = String(type);
            const optional = typeStr.startsWith("Optional[");
            const bareType = optional ? typeStr.slice("Optional[".length, -1) : typeStr;
            return {
              id: uid("field"),
              name,
              type: bareType as GenAISchemaField["type"],
              optional,
            };
          }),
        } satisfies GenerativeAISettings)
      : base.genai,

    concurrency: Number(settings.concurrency ?? base.concurrency),
    maxRetries: Number(settings.max_retries ?? base.maxRetries),
    requestTimeout: Number(settings.request_timeout ?? base.requestTimeout),
    retryDelay: Number(settings.retry_delay ?? base.retryDelay),

    proxies: Array.isArray(settings.proxies) ? (settings.proxies as CrawlSettings["proxies"]) : [],
    proxyRotationMethod: (settings.proxy_rotation_method as CrawlSettings["proxyRotationMethod"]) ?? base.proxyRotationMethod,

    browserSettings: browserRaw
      ? {
          viewport: {
            width: Number(viewportRaw?.width ?? base.browserSettings.viewport.width),
            height: Number(viewportRaw?.height ?? base.browserSettings.viewport.height),
          },
          locale: String(browserRaw.locale ?? base.browserSettings.locale),
          timezoneId: String(browserRaw.timezone_id ?? base.browserSettings.timezoneId),
          userAgent: browserRaw.user_agent ? String(browserRaw.user_agent) : undefined,
          headless: Boolean(browserRaw.headless ?? base.browserSettings.headless),
          waitUntil: (browserRaw.wait_until as CrawlSettings["browserSettings"]["waitUntil"]) ?? base.browserSettings.waitUntil,
          timeout: Number(browserRaw.timeout ?? base.browserSettings.timeout),
        }
      : base.browserSettings,

    enableHumanBehaviors: Boolean(settings.enable_human_behaviors ?? base.enableHumanBehaviors),
    humanBehaviorSettings: humanRaw
      ? {
          minDelay: Number(humanRaw.min_delay ?? base.humanBehaviorSettings.minDelay),
          maxDelay: Number(humanRaw.max_delay ?? base.humanBehaviorSettings.maxDelay),
          maxScrolls: Number(humanRaw.max_scrolls ?? base.humanBehaviorSettings.maxScrolls),
          minMouseMoves: Number(humanRaw.min_mouse_moves ?? base.humanBehaviorSettings.minMouseMoves),
          maxMouseMoves: Number(humanRaw.max_mouse_moves ?? base.humanBehaviorSettings.maxMouseMoves),
        }
      : base.humanBehaviorSettings,

    filterGroup: {
      mode: (isRecord(filters) && (filters.mode as CrawlSettings["filterGroup"]["mode"])) || "AND",
      filters: filterNodes,
    },
  };
}

export function toApiPayload(targetUrl: string, settings: CrawlSettings) {
  const { settings: settingsPayload, filters } = buildSettingsPayload(settings);
  return {
    target_url: targetUrl,
    mode: settings.mode,
    settings: settingsPayload,
    filters,
  };
}

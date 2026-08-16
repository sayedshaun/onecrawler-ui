import type { ReactNode } from "react";
import { Bot, Monitor, MousePointer2, Network, Search, Settings2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PatternList, Setting, SummarySection } from "@/components/shared/settings-summary-ui";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function labelFor(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const SENSITIVE_KEY = /(?:api[_-]?key|password|secret|token)/i;

function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [key, SENSITIVE_KEY.test(key) ? (v ? "***" : v) : redactSensitive(v)]),
    );
  }
  return value;
}

function fallbackValue(key: string, value: unknown): ReactNode {
  if (SENSITIVE_KEY.test(key)) {
    return value ? <Badge variant="secondary">Configured</Badge> : <span className="text-muted-foreground">Not configured</span>;
  }
  if (value === null || value === undefined || value === "") return <span className="text-muted-foreground">Not set</span>;
  if (typeof value === "boolean") return <Badge variant={value ? "success" : "secondary"}>{value ? "Enabled" : "Disabled"}</Badge>;
  if (Array.isArray(value)) return <PatternList patterns={value.map(String)} />;
  if (isRecord(value)) return <span className="break-all font-mono text-xs text-muted-foreground">{JSON.stringify(redactSensitive(value))}</span>;
  return <span className="break-all font-medium text-foreground">{String(value)}</span>;
}

export function UsedSettingsPanel({ settings }: { settings: Record<string, unknown> }) {
  const KNOWN_KEYS = [
    "link_extraction_strategy",
    "link_extraction_limit",
    "include_link_patterns",
    "exclude_link_patterns",
    "scraping_strategy",
    "scraping_output_format",
    "genai",
    "concurrency",
    "max_retries",
    "request_timeout",
    "retry_delay",
    "proxies",
    "proxy_rotation_method",
    "browser_settings",
    "enable_human_behaviors",
    "human_behavior_settings",
  ];

  const genai = isRecord(settings.genai) ? settings.genai : null;
  const browser = isRecord(settings.browser_settings) ? settings.browser_settings : null;
  const viewport = browser && isRecord(browser.viewport) ? browser.viewport : null;
  const humanBehavior = isRecord(settings.human_behavior_settings) ? settings.human_behavior_settings : null;
  const proxies = Array.isArray(settings.proxies) ? settings.proxies : [];
  const enableHumanBehaviors = Boolean(settings.enable_human_behaviors);

  const additional = Object.fromEntries(Object.entries(settings).filter(([key]) => !KNOWN_KEYS.includes(key)));
  const hasAdditional = Object.keys(additional).length > 0;

  if (!Object.keys(settings).length) {
    return <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No settings were recorded for this crawl.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SummarySection icon={Search} title="Discovery">
        <Setting label="Strategy">{settings.link_extraction_strategy === "deep" ? "Deep (recursive)" : "Shallow"}</Setting>
        <Setting label="Link / URL limit">{Number(settings.link_extraction_limit) || "Not set"}</Setting>
        <Setting label="Include patterns"><PatternList patterns={asStringArray(settings.include_link_patterns)} /></Setting>
        <Setting label="Exclude patterns"><PatternList patterns={asStringArray(settings.exclude_link_patterns)} /></Setting>
      </SummarySection>

      <SummarySection icon={Settings2} title="Scraping">
        <Setting label="Strategy">
          {settings.scraping_strategy === "genai"
            ? "GenAI"
            : settings.scraping_strategy === "markdownify"
              ? "Markdownify"
              : "Heuristic"}
        </Setting>
        <Setting label="Output format">{String(settings.scraping_output_format ?? "—").toUpperCase()}</Setting>
        <Setting label="Concurrency">{String(settings.concurrency ?? "—")} workers</Setting>
        <Setting label="Request timeout">{String(settings.request_timeout ?? "—")}s</Setting>
        <Setting label="Retries">{String(settings.max_retries ?? "—")} · {String(settings.retry_delay ?? "—")}s delay</Setting>
        {genai && (
          <>
            <Setting label="Model">{String(genai.provider ?? "—")} · {String(genai.model_name ?? "—")}</Setting>
            <Setting label="Schema fields">{isRecord(genai.output_schema) ? Object.keys(genai.output_schema).length : "None"}</Setting>
          </>
        )}
      </SummarySection>

      <SummarySection icon={Network} title="Network">
        <Setting label="Proxies">{proxies.length ? `${proxies.length} configured` : "Direct connection"}</Setting>
        <Setting label="Rotation">{settings.proxy_rotation_method === "round_robin" ? "Round robin" : "Random"}</Setting>
      </SummarySection>

      {browser && (
        <SummarySection icon={Monitor} title="Browser">
          {viewport && <Setting label="Viewport">{String(viewport.width)} × {String(viewport.height)}</Setting>}
          {browser.locale != null && <Setting label="Locale">{String(browser.locale)}</Setting>}
          {browser.timezone_id != null && <Setting label="Timezone">{String(browser.timezone_id)}</Setting>}
          <Setting label="Headless">{browser.headless ? "Enabled" : "Disabled"}</Setting>
          <Setting label="Wait until">
            {browser.wait_until === "domcontentloaded" ? "DOM content loaded" : browser.wait_until === "networkidle" ? "Network idle" : "Full load"}
          </Setting>
          {browser.timeout != null && <Setting label="Navigation timeout">{String(browser.timeout)} ms</Setting>}
          {browser.user_agent ? <Setting label="Custom user agent">Configured</Setting> : null}
        </SummarySection>
      )}

      <SummarySection icon={MousePointer2} title="Human behavior">
        <Setting label="Simulation">{enableHumanBehaviors ? "Enabled" : "Disabled"}</Setting>
        {enableHumanBehaviors && humanBehavior && (
          <>
            <Setting label="Delays">{String(humanBehavior.min_delay)}s–{String(humanBehavior.max_delay)}s</Setting>
            <Setting label="Max scrolls">{String(humanBehavior.max_scrolls)}</Setting>
            <Setting label="Mouse moves">{String(humanBehavior.min_mouse_moves)}–{String(humanBehavior.max_mouse_moves)}</Setting>
          </>
        )}
      </SummarySection>

      {hasAdditional && (
        <SummarySection icon={Bot} title="Additional settings">
          {Object.entries(additional).map(([key, value]) => (
            <Setting key={key} label={labelFor(key)}>{fallbackValue(key, value)}</Setting>
          ))}
        </SummarySection>
      )}
    </div>
  );
}

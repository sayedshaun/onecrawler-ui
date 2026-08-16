import { Field, FieldRow } from "@/components/crawl-form/field";
import { GenAISection } from "@/components/crawl-form/genai-section";
import { NumericInput } from "@/components/ui/numeric-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CrawlSettings, GenerativeAISettings } from "@/lib/types";

const DEFAULT_GENAI: GenerativeAISettings = {
  provider: "openai",
  modelName: "gpt-4o-mini",
  apiKey: "",
  schemaFields: [],
};

export function ScrapingSection({
  settings,
  onChange,
  showExtraction = true,
}: {
  settings: CrawlSettings;
  onChange: (patch: Partial<CrawlSettings>) => void;
  /** Sitemap and Link Extraction modes never extract page content — they only
   * discover URLs/links — so scraping strategy/output format/GenAI don't apply. */
  showExtraction?: boolean;
}) {
  const isGenAI = settings.scrapingStrategy === "genai";

  function setStrategy(strategy: CrawlSettings["scrapingStrategy"]) {
    if (strategy === "genai") {
      onChange({
        scrapingStrategy: strategy,
        scrapingOutputFormat: "json",
        genai: settings.genai ?? DEFAULT_GENAI,
      });
    } else {
      onChange({ scrapingStrategy: strategy });
    }
  }

  return (
    <div className="space-y-5">
      {showExtraction ? (
        <FieldRow>
          <Field label="Extraction strategy" description="Heuristic is fast and deterministic; GenAI produces typed output; Markdownify converts the whole page to Markdown.">
            <Select value={settings.scrapingStrategy} onValueChange={(v) => setStrategy(v as CrawlSettings["scrapingStrategy"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="heuristic">Heuristic</SelectItem>
                <SelectItem value="genai">GenAI</SelectItem>
                <SelectItem value="markdownify">Markdownify</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field
            label="Output format"
            description={isGenAI ? "GenAI extraction only supports JSON output." : undefined}
          >
            <Select
              value={settings.scrapingOutputFormat}
              disabled={isGenAI}
              onValueChange={(v) => onChange({ scrapingOutputFormat: v as CrawlSettings["scrapingOutputFormat"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="xml">XML</SelectItem>
                <SelectItem value="xmltei">XML-TEI</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FieldRow>
      ) : (
        <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          This mode only discovers URLs — it doesn't extract page content, so extraction strategy and
          output format don't apply here.
        </p>
      )}

      <FieldRow>
        <Field label="Concurrency" description="Number of async workers.">
          <NumericInput
            min={1}
            value={settings.concurrency}
            emptyValue={1}
            onValueChange={(concurrency) => onChange({ concurrency })}
          />
        </Field>
        <Field label="Request timeout (s)">
          <NumericInput
            min={1}
            value={settings.requestTimeout}
            emptyValue={1}
            onValueChange={(requestTimeout) => onChange({ requestTimeout })}
          />
        </Field>
      </FieldRow>

      <FieldRow>
        <Field label="Max retries">
          <NumericInput
            min={0}
            value={settings.maxRetries}
            emptyValue={0}
            onValueChange={(maxRetries) => onChange({ maxRetries })}
          />
        </Field>
        <Field label="Retry delay (s)">
          <NumericInput
            min={0}
            value={settings.retryDelay}
            emptyValue={0}
            onValueChange={(retryDelay) => onChange({ retryDelay })}
          />
        </Field>
      </FieldRow>

      {showExtraction && isGenAI && settings.genai && (
        <GenAISection
          genai={settings.genai}
          onChange={(patch) => onChange({ genai: { ...settings.genai!, ...patch } })}
        />
      )}
    </div>
  );
}

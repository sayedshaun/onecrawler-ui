import { Field, FieldRow } from "@/components/crawl-form/field";
import { PatternListInput } from "@/components/crawl-form/pattern-list-input";
import { NumericInput } from "@/components/ui/numeric-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CrawlSettings } from "@/lib/types";

export function LinkExtractionSection({
  settings,
  onChange,
  showStrategy = true,
  limitLabel = "Link / URL limit",
  limitDescription = "Hard cap on collected links. Always set this for broad sites.",
}: {
  settings: CrawlSettings;
  onChange: (patch: Partial<CrawlSettings>) => void;
  /** Crawler mode never reads link_extraction_strategy (it always runs a single
   * orchestrated pass) — only Link Extraction mode branches on shallow/deep. */
  showStrategy?: boolean;
  limitLabel?: string;
  limitDescription?: string;
}) {
  const limitField = (
    <Field label={limitLabel} description={limitDescription}>
      <NumericInput
        min={1}
        value={settings.linkExtractionLimit}
        emptyValue={0}
        onValueChange={(linkExtractionLimit) => onChange({ linkExtractionLimit })}
      />
    </Field>
  );

  return (
    <div className="space-y-5">
      {showStrategy ? (
        <FieldRow>
          <Field
            label="Discovery strategy"
            description="Deep follows internal links recursively; shallow reads only the starting page."
          >
            <Select
              value={settings.linkExtractionStrategy}
              onValueChange={(v) => onChange({ linkExtractionStrategy: v as CrawlSettings["linkExtractionStrategy"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deep">Deep</SelectItem>
                <SelectItem value="shallow">Shallow</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {limitField}
        </FieldRow>
      ) : (
        limitField
      )}

      <Field
        label="Include patterns"
        description={'Allow-list paths — a plain keyword like "blog" matches any path containing it. Wildcards like "/blog/*" still work. Leave empty to include everything.'}
      >
        <PatternListInput
          values={settings.includeLinkPatterns}
          onChange={(next) => onChange({ includeLinkPatterns: next })}
          placeholder="news"
        />
      </Field>

      <Field label="Exclude patterns" description={'Deny-list paths — a plain keyword like "admin" matches any path containing it. Wildcards like "/admin/*" still work.'}>
        <PatternListInput
          values={settings.excludeLinkPatterns}
          onChange={(next) => onChange({ excludeLinkPatterns: next })}
          placeholder="admin"
        />
      </Field>
    </div>
  );
}

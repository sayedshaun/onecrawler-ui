import { Field, FieldRow, SwitchField } from "@/components/crawl-form/field";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CrawlSettings } from "@/lib/types";

export function BrowserSection({
  settings,
  onChange,
  showHumanBehavior = true,
}: {
  settings: CrawlSettings;
  onChange: (patch: Partial<CrawlSettings>) => void;
  /** Direct Scraper never drives the behavior-simulation worker loop, so this
   * toggle has no effect there. */
  showHumanBehavior?: boolean;
}) {
  const browser = settings.browserSettings;
  const human = settings.humanBehaviorSettings;

  function updateBrowser(patch: Partial<CrawlSettings["browserSettings"]>) {
    onChange({ browserSettings: { ...browser, ...patch } });
  }

  function updateHuman(patch: Partial<CrawlSettings["humanBehaviorSettings"]>) {
    onChange({ humanBehaviorSettings: { ...human, ...patch } });
  }

  return (
    <div className="space-y-5">
      <FieldRow>
        <Field label="Viewport width">
          <NumericInput
            value={browser.viewport.width}
            emptyValue={0}
            onValueChange={(width) => updateBrowser({ viewport: { ...browser.viewport, width } })}
          />
        </Field>
        <Field label="Viewport height">
          <NumericInput
            value={browser.viewport.height}
            emptyValue={0}
            onValueChange={(height) => updateBrowser({ viewport: { ...browser.viewport, height } })}
          />
        </Field>
      </FieldRow>

      <FieldRow>
        <Field label="Locale">
          <Input value={browser.locale} onChange={(e) => updateBrowser({ locale: e.target.value })} />
        </Field>
        <Field label="Timezone">
          <Input value={browser.timezoneId} onChange={(e) => updateBrowser({ timezoneId: e.target.value })} />
        </Field>
      </FieldRow>

      <Field label="Custom user agent" description="Leave empty to use the default OneCrawler user agent.">
        <Input
          value={browser.userAgent}
          onChange={(e) => updateBrowser({ userAgent: e.target.value })}
          placeholder="Mozilla/5.0 ..."
          className="font-mono text-xs"
        />
      </Field>

      <FieldRow>
        <Field label="Wait until">
          <Select
            value={browser.waitUntil}
            onValueChange={(v) => updateBrowser({ waitUntil: v as CrawlSettings["browserSettings"]["waitUntil"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="domcontentloaded">DOM content loaded</SelectItem>
              <SelectItem value="load">Full load</SelectItem>
              <SelectItem value="networkidle">Network idle</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Navigation timeout (ms)">
          <NumericInput
            min={0}
            value={browser.timeout}
            emptyValue={0}
            onValueChange={(timeout) => updateBrowser({ timeout })}
          />
        </Field>
      </FieldRow>

      {showHumanBehavior && (
        <SwitchField
          label="Simulate human behavior"
          description="Adds scroll, delay, and mouse-move simulation during deep link extraction. Reveals lazy-loaded links but slows crawls."
          checked={settings.enableHumanBehaviors}
          onCheckedChange={(checked) => onChange({ enableHumanBehaviors: checked })}
        />
      )}

      {showHumanBehavior && settings.enableHumanBehaviors && (
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
          <Field label="Min delay (s)">
            <NumericInput
              step="0.1"
              min={0}
              value={human.minDelay}
              emptyValue={0}
              onValueChange={(minDelay) => updateHuman({ minDelay })}
            />
          </Field>
          <Field label="Max delay (s)">
            <NumericInput
              step="0.1"
              min={0}
              value={human.maxDelay}
              emptyValue={0}
              onValueChange={(maxDelay) => updateHuman({ maxDelay })}
            />
          </Field>
          <Field label="Max scrolls">
            <NumericInput
              min={0}
              value={human.maxScrolls}
              emptyValue={0}
              onValueChange={(maxScrolls) => updateHuman({ maxScrolls })}
            />
          </Field>
          <Field label="Mouse moves (min–max)">
            <div className="flex items-center gap-2">
              <NumericInput
                min={0}
                value={human.minMouseMoves}
                emptyValue={0}
                onValueChange={(minMouseMoves) => updateHuman({ minMouseMoves })}
              />
              <span className="text-muted-foreground">–</span>
              <NumericInput
                min={0}
                value={human.maxMouseMoves}
                emptyValue={0}
                onValueChange={(maxMouseMoves) => updateHuman({ maxMouseMoves })}
              />
            </div>
          </Field>
        </div>
      )}
    </div>
  );
}

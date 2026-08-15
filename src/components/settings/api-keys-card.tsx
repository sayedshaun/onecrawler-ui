import { useEffect, useState } from "react";
import { Bot, Check, KeyRound, Loader2, Search, Sparkles, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePolledResource } from "@/hooks/use-polled-resource";
import { ApiError } from "@/lib/api";
import { clearAgentConfig, getAgentSettings, setAgentLLMConfig, setAgentSearchConfig } from "@/lib/agents-api";
import { clearApiKey, listApiKeys, setApiKey } from "@/lib/settings-api";
import { formatRelativeTime } from "@/lib/utils";
import type { AgentLLMProvider, GenAIProvider } from "@/lib/types";
import { useSettingsStore } from "@/store/settings-store";
import { Field, FieldRow } from "@/components/crawl-form/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROVIDER_MODELS } from "@/components/crawl-form/genai-section";

const SCRAPER_PROVIDERS: { value: GenAIProvider; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "google", label: "Google" },
  { value: "ollama", label: "Ollama" },
];

const AGENT_PROVIDERS: { value: AgentLLMProvider; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google" },
  { value: "openrouter", label: "OpenRouter" },
];

const AGENT_MODEL_SUGGESTIONS: Record<AgentLLMProvider, string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
  anthropic: ["claude-sonnet-5", "claude-opus-4-8", "claude-haiku-4-5"],
  google: ["gemini-2.0-flash", "gemini-1.5-pro"],
  openrouter: ["openai/gpt-4o-mini", "anthropic/claude-sonnet-5"],
};

function ScraperLLMSection() {
  const { data, error, refetch } = usePolledResource(() => listApiKeys(), { cacheKey: "settings:api-keys" });
  const defaults = useSettingsStore((s) => s.defaults);
  const setDefaults = useSettingsStore((s) => s.setDefaults);

  const [provider, setProvider] = useState<GenAIProvider>("openai");
  const [apiKey, setApiKeyValue] = useState("");
  const [modelName, setModelName] = useState(PROVIDER_MODELS.openai[0]);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  function statusFor(p: GenAIProvider) {
    return data?.find((k) => k.provider === p) ?? { provider: p, hasKey: false, updatedAt: null };
  }

  const status = statusFor(provider);

  function handleProviderChange(next: GenAIProvider) {
    setProvider(next);
    setApiKeyValue("");
    setModelName(defaults.genai?.provider === next ? defaults.genai.modelName : PROVIDER_MODELS[next][0]);
  }

  async function handleSave() {
    const value = apiKey.trim();
    if (!value) return;
    setSaving(true);
    setRowError(null);
    try {
      await setApiKey(provider, value);
      // Remembers the model alongside the key so New Crawl's GenAI section
      // defaults to it whenever this provider is selected.
      setDefaults({
        genai: {
          schemaFields: [],
          ...defaults.genai,
          provider,
          modelName: modelName.trim() || PROVIDER_MODELS[provider][0],
        },
      });
      setApiKeyValue("");
      refetch();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Failed to save API key.");
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    setClearing(true);
    setRowError(null);
    try {
      await clearApiKey(provider);
      refetch();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Failed to clear API key.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Sparkles className="h-4 w-4" />
        Scraper LLM
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {rowError && <p className="text-sm text-destructive">{rowError}</p>}

      <FieldRow>
        <Field label="Provider">
          <Select value={provider} onValueChange={(v) => handleProviderChange(v as GenAIProvider)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCRAPER_PROVIDERS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Model name">
          <Input
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder={PROVIDER_MODELS[provider][0]}
            list="settings-model-suggestions"
            className="font-mono text-xs"
          />
          <datalist id="settings-model-suggestions">
            {PROVIDER_MODELS[provider].map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </Field>
      </FieldRow>

      <Field label="API key">
        <div className="flex items-center gap-2">
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKeyValue(e.target.value)}
            placeholder="sk-..."
          />
          <Button variant="outline" size="sm" disabled={saving || !apiKey.trim()} onClick={handleSave}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
            Save
          </Button>
        </div>
      </Field>

      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {status.hasKey ? (
            <Badge variant="success">
              <Check className="h-3 w-3" /> Set
            </Badge>
          ) : (
            <Badge variant="outline">Not set</Badge>
          )}
          {status.hasKey && status.updatedAt && (
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(new Date(status.updatedAt))}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" disabled={!status.hasKey || clearing} onClick={handleClear}>
          {clearing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Clear
        </Button>
      </div>
    </div>
  );
}

/** The agent's own brain config — a separate LLM provider/key from the
 * Scraper LLM above, plus an optional web-search key that backs its
 * web_search tool. Mirrors onecrawler-backend's nested
 * `/api/v1/settings/agent` schema ({ llm, search }, each with its own has_key). */
function AgentLLMSection() {
  const { data: settings, error: loadError, refetch } = usePolledResource(getAgentSettings, {
    cacheKey: "agents:settings",
  });

  const [provider, setProvider] = useState<AgentLLMProvider>("openai");
  const [model, setModel] = useState(AGENT_MODEL_SUGGESTIONS.openai[0]);
  const [llmKey, setLlmKey] = useState("");
  const [savingLlm, setSavingLlm] = useState(false);
  const [clearingLlm, setClearingLlm] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);

  const [searchKey, setSearchKey] = useState("");
  const [savingSearch, setSavingSearch] = useState(false);
  const [clearingSearch, setClearingSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Reseed the provider/model fields once the saved settings load in.
  useEffect(() => {
    if (settings?.llm.provider) {
      setProvider(settings.llm.provider);
      setModel(settings.llm.model || AGENT_MODEL_SUGGESTIONS[settings.llm.provider][0]);
    }
  }, [settings]);

  function handleProviderChange(next: AgentLLMProvider) {
    setProvider(next);
    setModel(AGENT_MODEL_SUGGESTIONS[next][0]);
  }

  async function handleSaveLlm() {
    const trimmedModel = model.trim() || AGENT_MODEL_SUGGESTIONS[provider][0];
    const trimmedKey = llmKey.trim();
    if (!trimmedKey) return;
    setSavingLlm(true);
    setLlmError(null);
    try {
      await setAgentLLMConfig({ provider, model: trimmedModel, apiKey: trimmedKey });
      setLlmKey("");
      refetch();
    } catch (err) {
      setLlmError(err instanceof ApiError ? err.message : "Failed to save agent LLM settings.");
    } finally {
      setSavingLlm(false);
    }
  }

  async function handleClearLlm() {
    setClearingLlm(true);
    setLlmError(null);
    try {
      await clearAgentConfig("llm");
      refetch();
    } catch (err) {
      setLlmError(err instanceof ApiError ? err.message : "Failed to clear agent LLM settings.");
    } finally {
      setClearingLlm(false);
    }
  }

  async function handleSaveSearch() {
    const trimmedKey = searchKey.trim();
    if (!trimmedKey) return;
    setSavingSearch(true);
    setSearchError(null);
    try {
      await setAgentSearchConfig({ apiKey: trimmedKey });
      setSearchKey("");
      refetch();
    } catch (err) {
      setSearchError(err instanceof ApiError ? err.message : "Failed to save the search key.");
    } finally {
      setSavingSearch(false);
    }
  }

  async function handleClearSearch() {
    setClearingSearch(true);
    setSearchError(null);
    try {
      await clearAgentConfig("search");
      refetch();
    } catch (err) {
      setSearchError(err instanceof ApiError ? err.message : "Failed to clear the search key.");
    } finally {
      setClearingSearch(false);
    }
  }

  return (
    <>
      <div className="space-y-3 rounded-lg border border-border p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Bot className="h-4 w-4" />
          Agent LLM
        </div>

        {loadError && <p className="text-sm text-destructive">{loadError}</p>}
        {llmError && <p className="text-sm text-destructive">{llmError}</p>}

        <FieldRow>
          <Field label="Provider">
            <Select value={provider} onValueChange={(v) => handleProviderChange(v as AgentLLMProvider)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENT_PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Model">
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={AGENT_MODEL_SUGGESTIONS[provider][0]}
              list="agent-model-suggestions"
              className="font-mono text-xs"
            />
            <datalist id="agent-model-suggestions">
              {AGENT_MODEL_SUGGESTIONS[provider].map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </Field>
        </FieldRow>

        <Field label="API key">
          <div className="flex items-center gap-2">
            <Input
              type="password"
              value={llmKey}
              onChange={(e) => setLlmKey(e.target.value)}
              placeholder={settings?.llm.hasKey ? "Enter a new key to replace the saved one" : "sk-..."}
            />
            <Button variant="outline" size="sm" disabled={savingLlm || !llmKey.trim()} onClick={handleSaveLlm}>
              {savingLlm ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        </Field>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            {settings?.llm.hasKey ? (
              <Badge variant="success">
                <Check className="h-3 w-3" /> Configured
              </Badge>
            ) : (
              <Badge variant="outline">Not configured</Badge>
            )}
            {settings?.llm.hasKey && settings.updatedAt && (
              <span className="text-xs text-muted-foreground">
                {settings.llm.provider} · {formatRelativeTime(new Date(settings.updatedAt))}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" disabled={!settings?.llm.hasKey || clearingLlm} onClick={handleClearLlm}>
            {clearingLlm ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Clear
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-3 rounded-lg border border-border p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Search className="h-4 w-4" />
          Web Search <span className="font-normal text-muted-foreground">(optional, Tavily)</span>
        </div>

        {searchError && <p className="text-sm text-destructive">{searchError}</p>}

        <Field label="API key">
          <div className="flex items-center gap-2">
            <Input
              type="password"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              placeholder={settings?.search.hasKey ? "Enter a new key to replace the saved one" : "tvly-..."}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={savingSearch || !searchKey.trim()}
              onClick={handleSaveSearch}
            >
              {savingSearch ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <KeyRound className="h-3.5 w-3.5" />
              )}
              Save
            </Button>
          </div>
        </Field>

        <div className="flex items-center justify-between gap-3 pt-1">
          {settings?.search.hasKey ? (
            <Badge variant="success">
              <Check className="h-3 w-3" /> Configured
            </Badge>
          ) : (
            <Badge variant="outline">Not configured</Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            disabled={!settings?.search.hasKey || clearingSearch}
            onClick={handleClearSearch}
          >
            {clearingSearch ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Clear
          </Button>
        </div>
      </div>
    </>
  );
}

/** Every stored key in one place: the Scraper LLM (GenAI extraction), the
 * Agent's own LLM, and its optional web-search key — previously split
 * across a separate "API Keys" and "Agent" section for no real reason,
 * since all three are just credentials the backend stores server-side. */
export function ApiKeysCard() {
  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle>API Keys</CardTitle>
        <CardDescription>
          Stored server-side and never shown again once saved. The Scraper LLM powers GenAI-based
          extraction in New Crawl; the Agent LLM and web-search key are separate credentials for the
          Agent tab.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScraperLLMSection />
        <Separator />
        <AgentLLMSection />
      </CardContent>
    </Card>
  );
}

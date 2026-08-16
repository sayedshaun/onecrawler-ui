import { Plus, Trash2 } from "lucide-react";

import { Field, FieldRow } from "@/components/crawl-form/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uid } from "@/lib/id";
import type { GenAISchemaField, GenerativeAISettings } from "@/lib/types";

const FIELD_TYPES: GenAISchemaField["type"][] = ["str", "int", "float", "bool", "list[str]"];

export const PROVIDER_MODELS: Record<GenerativeAISettings["provider"], string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
  google: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"],
  ollama: ["llama3:8b", "mistral", "qwen2.5:7b"],
};

export function GenAISection({
  genai,
  onChange,
}: {
  genai: GenerativeAISettings;
  onChange: (patch: Partial<GenerativeAISettings>) => void;
}) {
  function updateField(id: string, patch: Partial<GenAISchemaField>) {
    onChange({
      schemaFields: genai.schemaFields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });
  }

  function addField() {
    const field: GenAISchemaField = {
      id: uid("field"),
      name: "",
      type: "str",
      optional: false,
    };
    onChange({ schemaFields: [...genai.schemaFields, field] });
  }

  function removeField(id: string) {
    onChange({ schemaFields: genai.schemaFields.filter((f) => f.id !== id) });
  }

  return (
    <div className="space-y-5 rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
      <FieldRow>
        <Field label="Provider">
          <Select
            value={genai.provider}
            onValueChange={(v) =>
              onChange({
                provider: v as GenerativeAISettings["provider"],
                modelName: PROVIDER_MODELS[v as GenerativeAISettings["provider"]][0],
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="ollama">Ollama</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Model">
          <Input
            value={genai.modelName}
            onChange={(e) => onChange({ modelName: e.target.value })}
            placeholder={PROVIDER_MODELS[genai.provider][0]}
            list="genai-model-suggestions"
            className="font-mono text-xs"
          />
          <datalist id="genai-model-suggestions">
            {PROVIDER_MODELS[genai.provider].map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </Field>
      </FieldRow>

      {genai.provider === "ollama" ? (
        <Field label="Base URL" description="Your running Ollama instance.">
          <Input
            value={genai.baseUrl ?? ""}
            onChange={(e) => onChange({ baseUrl: e.target.value })}
            placeholder="http://localhost:11434/"
          />
        </Field>
      ) : genai.provider === "openai" ? (
        <>
          <Field
            label="Base URL"
            description="Leave empty to use OpenAI's API, or point this at any OpenAI-compatible endpoint — llama.cpp, vLLM, LM Studio, OpenRouter, etc."
          >
            <Input
              value={genai.baseUrl ?? ""}
              onChange={(e) => onChange({ baseUrl: e.target.value })}
              placeholder="https://your-server.example.com/v1"
            />
          </Field>
          <Field
            label="API key"
            description="Required for OpenAI itself; self-hosted servers often ignore this — put any placeholder value if yours doesn't check it. Never hardcode this in source."
          >
            <Input
              type="password"
              value={genai.apiKey ?? ""}
              onChange={(e) => onChange({ apiKey: e.target.value })}
              placeholder="sk-..."
            />
          </Field>
        </>
      ) : (
        <Field label="API key" description="Never hardcode this in source — use an environment variable.">
          <Input
            type="password"
            value={genai.apiKey ?? ""}
            onChange={(e) => onChange({ apiKey: e.target.value })}
            placeholder="sk-..."
          />
        </Field>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Output schema</p>
          <Button type="button" variant="outline" size="sm" onClick={addField}>
            <Plus className="h-3.5 w-3.5" /> Add field
          </Button>
        </div>

        {genai.schemaFields.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            No fields yet — add at least one field for the Pydantic output schema.
          </p>
        ) : (
          <div className="space-y-2">
            {genai.schemaFields.map((field) => (
              <div key={field.id} className="flex items-center gap-2 rounded-md border border-border bg-background p-2">
                <Input
                  value={field.name}
                  onChange={(e) => updateField(field.id, { name: e.target.value })}
                  placeholder="field_name"
                  className="h-8 flex-1 font-mono text-xs"
                />
                <Select
                  value={field.type}
                  onValueChange={(v) => updateField(field.id, { type: v as GenAISchemaField["type"] })}
                >
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="font-mono text-xs">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1.5 pl-1">
                  <Switch
                    checked={field.optional}
                    onCheckedChange={(checked) => updateField(field.id, { optional: checked })}
                  />
                  <span className="text-[11px] text-muted-foreground">optional</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeField(field.id)}
                  aria-label="Remove field"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

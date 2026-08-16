import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uid } from "@/lib/id";
import type { FilterGroup, FilterKind, FilterNode } from "@/lib/types";

const FILTER_META: Record<FilterKind, { label: string; defaultParams: Record<string, string> }> = {
  by_date: { label: "By date", defaultParams: { start: "", end: "" } },
  by_keywords: { label: "By keywords", defaultParams: { keywords: "" } },
  by_files: { label: "By file type", defaultParams: { types: "pdf" } },
  by_extension: { label: "By extension", defaultParams: { extensions: ".pdf" } },
  by_cosine_similarity: {
    label: "By semantic similarity",
    defaultParams: { query: "", threshold: "0.3" },
  },
};

function FilterParamInputs({
  filter,
  onChange,
}: {
  filter: FilterNode;
  onChange: (params: Record<string, string>) => void;
}) {
  const set = (key: string) => (value: string) => onChange({ ...filter.params, [key]: value });

  switch (filter.kind) {
    case "by_date":
      return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Input type="date" value={filter.params.start} onChange={(e) => set("start")(e.target.value)} />
          <Input type="date" value={filter.params.end} onChange={(e) => set("end")(e.target.value)} />
        </div>
      );
    case "by_keywords":
      return (
        <Input
          value={filter.params.keywords}
          onChange={(e) => set("keywords")(e.target.value)}
          placeholder="python, async, crawler"
        />
      );
    case "by_files":
      return (
        <Input
          value={filter.params.types}
          onChange={(e) => set("types")(e.target.value)}
          placeholder="pdf, image, docx, text"
        />
      );
    case "by_extension":
      return (
        <Input
          value={filter.params.extensions}
          onChange={(e) => set("extensions")(e.target.value)}
          placeholder=".pdf, .jpg"
        />
      );
    case "by_cosine_similarity":
      return (
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Input
            value={filter.params.query}
            onChange={(e) => set("query")(e.target.value)}
            placeholder="climate policy"
          />
          <Input
            type="number"
            step="0.05"
            min={0}
            max={1}
            className="w-24"
            value={filter.params.threshold}
            onChange={(e) => set("threshold")(e.target.value)}
          />
        </div>
      );
  }
}

export function FilterChainBuilder({
  group,
  onChange,
}: {
  group: FilterGroup;
  onChange: (group: FilterGroup) => void;
}) {
  function addFilter(kind: FilterKind) {
    const node: FilterNode = { id: uid("filter"), kind, params: { ...FILTER_META[kind].defaultParams } };
    onChange({ ...group, filters: [...group.filters, node] });
  }

  function updateFilter(id: string, params: Record<string, string>) {
    onChange({ ...group, filters: group.filters.map((f) => (f.id === id ? { ...f, params } : f)) });
  }

  function removeFilter(id: string) {
    onChange({ ...group, filters: group.filters.filter((f) => f.id !== id) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Combine with</span>
          <Tabs value={group.mode} onValueChange={(v) => onChange({ ...group, mode: v as FilterGroup["mode"] })}>
            <TabsList>
              <TabsTrigger value="AND">AND</TabsTrigger>
              <TabsTrigger value="OR">OR</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(FILTER_META) as FilterKind[]).map((kind) => (
              <DropdownMenuItem key={kind} onClick={() => addFilter(kind)}>
                {FILTER_META[kind].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {group.filters.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
          No filters — every extracted page will be kept. Add a filter to narrow results by date,
          keywords, file type, or semantic similarity.
        </p>
      ) : (
        <div className="space-y-2">
          {group.filters.map((filter, i) => (
            <div key={filter.id}>
              {i > 0 && (
                <div className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.mode}
                </div>
              )}
              <div className="border border-border bg-muted/40 flex items-start gap-3 rounded-lg p-3">
                <span className="mt-1.5 shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                  {FILTER_META[filter.kind].label}
                </span>
                <div className="flex-1">
                  <FilterParamInputs filter={filter} onChange={(params) => updateFilter(filter.id, params)} />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeFilter(filter.id)}
                  aria-label="Remove filter"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

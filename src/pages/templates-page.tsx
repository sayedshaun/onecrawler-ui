import { useState } from "react";
import { Layers, Loader2, Save, Search, Trash2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { TemplateCard } from "@/components/templates/template-card";
import { LinkExtractionSection } from "@/components/crawl-form/link-extraction-section";
import { ScrapingSection } from "@/components/crawl-form/scraping-section";
import { FilterChainBuilder } from "@/components/crawl-form/filter-chain-builder";
import { ProxySection } from "@/components/crawl-form/proxy-section";
import { BrowserSection } from "@/components/crawl-form/browser-section";
import { usePolledResource } from "@/hooks/use-polled-resource";
import { ApiError } from "@/lib/api";
import { parseSettingsPayload } from "@/lib/api-mapper";
import { createTemplate, deleteTemplate, listTemplates, updateTemplate } from "@/lib/templates-api";
import { useSettingsStore } from "@/store/settings-store";
import type { CrawlSettings, CrawlTemplate } from "@/lib/types";

export default function TemplatesPage() {
  const defaults = useSettingsStore((s) => s.defaults);
  const { data, error, refetch } = usePolledResource(() => listTemplates(), { cacheKey: "templates" });
  const templates = data?.items ?? [];

  const [query, setQuery] = useState("");
  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CrawlTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<CrawlTemplate | null>(null);
  const [editName, setEditName] = useState("");
  const [editSettings, setEditSettings] = useState<CrawlSettings | null>(null);
  const [editTab, setEditTab] = useState("discovery");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await createTemplate(name.trim(), defaults);
      setSaveOpen(false);
      setName("");
      refetch();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save template.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(template: CrawlTemplate) {
    setUpdatingId(template.id);
    setRowError(null);
    try {
      await updateTemplate(template.id, template.name, defaults);
      refetch();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Failed to update template.");
    } finally {
      setUpdatingId(null);
    }
  }

  function openEdit(template: CrawlTemplate) {
    setEditTarget(template);
    setEditName(template.name);
    setEditSettings(parseSettingsPayload(template.settings, template.filters, defaults));
    setEditTab("discovery");
    setEditError(null);
  }

  function patchEditSettings(patch: Partial<CrawlSettings>) {
    setEditSettings((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function handleSaveEdit() {
    if (!editTarget || !editSettings || !editName.trim()) return;
    setEditSaving(true);
    setEditError(null);
    try {
      await updateTemplate(editTarget.id, editName.trim(), editSettings);
      setEditTarget(null);
      refetch();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "Failed to save template.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setRowError(null);
    try {
      await deleteTemplate(deleteTarget.id);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Failed to delete template.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Layers}
        title="Crawl Templates"
        description="Reusable snapshots of your default crawl settings."
        actions={
          <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="h-3.5 w-3.5" /> Save current defaults…
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save as template</DialogTitle>
                <DialogDescription>
                  Snapshots your current default crawl settings under a name you can reuse later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="template-name">Template name</Label>
                <Input
                  id="template-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fast JSON scrape"
                />
              </div>
              {saveError && <p className="text-sm text-destructive">{saveError}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaveOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving || !name.trim()}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <CardContent className="space-y-3 p-5">
          {(error || rowError) && <p className="text-sm text-destructive">{error ?? rowError}</p>}

          {templates.length > 0 && (
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates…"
                className="pl-9"
              />
            </div>
          )}

          {templates.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No templates yet"
              description="Save your default settings above to create your first template."
            />
          ) : filteredTemplates.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No templates match"
              description="Try a different search term."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredTemplates.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  settings={parseSettingsPayload(t.settings, t.filters, defaults)}
                  updating={updatingId === t.id}
                  onEdit={() => openEdit(t)}
                  onUpdateFromDefaults={() => handleUpdate(t)}
                  onDelete={() => setDeleteTarget(t)}
                />
              ))}
            </div>
          )}
        </CardContent>

        <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this template?</DialogTitle>
              <DialogDescription>
                This permanently removes{" "}
                <span className="font-medium text-foreground">{deleteTarget?.name}</span>. This can't be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit template</DialogTitle>
              <DialogDescription>
                Changes save back to this template only — your defaults and other templates are
                unaffected.
              </DialogDescription>
            </DialogHeader>

            {editSettings && (
              <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-template-name">Template name</Label>
                  <Input
                    id="edit-template-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                <Tabs value={editTab} onValueChange={setEditTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="discovery">Discovery</TabsTrigger>
                    <TabsTrigger value="scraping">Scraping</TabsTrigger>
                    <TabsTrigger value="filters">Filters</TabsTrigger>
                    <TabsTrigger value="network">Network</TabsTrigger>
                    <TabsTrigger value="browser">Browser &amp; Behavior</TabsTrigger>
                  </TabsList>

                  <TabsContent value="discovery">
                    <LinkExtractionSection settings={editSettings} onChange={patchEditSettings} />
                  </TabsContent>
                  <TabsContent value="scraping">
                    <ScrapingSection settings={editSettings} onChange={patchEditSettings} />
                  </TabsContent>
                  <TabsContent value="filters">
                    <FilterChainBuilder
                      group={editSettings.filterGroup}
                      onChange={(filterGroup) => patchEditSettings({ filterGroup })}
                    />
                  </TabsContent>
                  <TabsContent value="network">
                    <ProxySection settings={editSettings} onChange={patchEditSettings} />
                  </TabsContent>
                  <TabsContent value="browser">
                    <BrowserSection settings={editSettings} onChange={patchEditSettings} />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {editError && <p className="text-sm text-destructive">{editError}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditTarget(null)} disabled={editSaving}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={editSaving || !editName.trim()}>
                {editSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
}

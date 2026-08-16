import { Plus, ShieldOff, Trash2 } from "lucide-react";

import { Field } from "@/components/crawl-form/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CrawlSettings, ProxySettings } from "@/lib/types";

export function ProxySection({
  settings,
  onChange,
}: {
  settings: CrawlSettings;
  onChange: (patch: Partial<CrawlSettings>) => void;
}) {
  function updateProxy(index: number, patch: Partial<ProxySettings>) {
    onChange({
      proxies: settings.proxies.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    });
  }

  function addProxy() {
    onChange({ proxies: [...settings.proxies, { server: "" }] });
  }

  function removeProxy(index: number) {
    onChange({ proxies: settings.proxies.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Proxy pool</p>
          <p className="text-xs text-muted-foreground">
            Optional. Leave empty to crawl directly without a proxy.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addProxy}>
          <Plus className="h-3.5 w-3.5" /> Add proxy
        </Button>
      </div>

      {settings.proxies.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-3 py-8 text-center">
          <ShieldOff className="h-5 w-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">No proxies configured — requests go out directly.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {settings.proxies.map((proxy, i) => (
            <div key={i} className="grid grid-cols-1 items-center gap-2 rounded-md border border-border p-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
              <Input
                value={proxy.server}
                onChange={(e) => updateProxy(i, { server: e.target.value })}
                placeholder="http://proxy.example:8080"
                className="font-mono text-xs"
              />
              <Input
                value={proxy.username ?? ""}
                onChange={(e) => updateProxy(i, { username: e.target.value })}
                placeholder="username"
              />
              <Input
                type="password"
                value={proxy.password ?? ""}
                onChange={(e) => updateProxy(i, { password: e.target.value })}
                placeholder="password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => removeProxy(i)}
                aria-label="Remove proxy"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {settings.proxies.length > 1 && (
        <Field label="Rotation method">
          <Select
            value={settings.proxyRotationMethod}
            onValueChange={(v) => onChange({ proxyRotationMethod: v as CrawlSettings["proxyRotationMethod"] })}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="round_robin">Round robin</SelectItem>
              <SelectItem value="random">Random</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      )}
    </div>
  );
}

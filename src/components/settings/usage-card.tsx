import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { usePolledResource } from "@/hooks/use-polled-resource";
import { getUsage } from "@/lib/account-api";
import { formatNumber } from "@/lib/utils";

export function UsageCard() {
  const { data: usage, error } = usePolledResource(() => getUsage(), { cacheKey: "settings:usage" });

  const stats = [
    { label: "Total crawls", value: usage?.totalJobs ?? 0 },
    { label: "Crawls this month", value: usage?.jobsThisMonth ?? 0 },
    { label: "Pages scraped", value: usage?.urlsScraped ?? 0 },
    { label: "Pages scraped this month", value: usage?.urlsScrapedThisMonth ?? 0 },
    { label: "URLs discovered", value: usage?.urlsDiscovered ?? 0 },
    { label: "Failed URLs", value: usage?.urlsFailed ?? 0 },
  ];

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle>Usage</CardTitle>
        <CardDescription>Your activity across all crawls.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-base font-semibold tabular-nums text-foreground">
                {formatNumber(s.value)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

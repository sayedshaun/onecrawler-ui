import { formatNumber } from "@/lib/utils";

/** Proportional breakdown of every discovered URL by outcome — scraped, failed,
 * or still pending — as a single segmented bar plus a legend. A lightweight,
 * chart-free complement to the status donut. */
export function ExtractionOutcome({
  discovered,
  scraped,
  failed,
}: {
  discovered: number;
  scraped: number;
  failed: number;
}) {
  const pending = Math.max(0, discovered - scraped - failed);
  const total = Math.max(1, scraped + failed + pending);

  const segments = [
    { label: "Scraped", value: scraped, color: "hsl(var(--success))" },
    { label: "Failed", value: failed, color: "hsl(var(--destructive))" },
    { label: "Pending", value: pending, color: "hsl(var(--muted-foreground) / 0.35)" },
  ];

  if (discovered === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No URLs discovered yet.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-semibold tabular-nums text-foreground">{formatNumber(discovered)}</p>
        <p className="text-xs text-muted-foreground">URLs discovered</p>
      </div>

      <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {segments.map(
          (s) =>
            s.value > 0 && (
              <div
                key={s.label}
                style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
              />
            ),
        )}
      </div>

      <div className="mt-4 space-y-2.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto font-medium tabular-nums text-foreground">
              {formatNumber(s.value)}
            </span>
            <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
              {Math.round((s.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

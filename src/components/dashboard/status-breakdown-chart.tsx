import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatNumber } from "@/lib/utils";
import type { CrawlStatus } from "@/lib/types";

const STATUS_ORDER: CrawlStatus[] = ["queued", "running", "completed", "failed", "cancelled"];

const STATUS_META: Record<CrawlStatus, { label: string; color: string }> = {
  queued: { label: "Queued", color: "hsl(var(--muted-foreground))" },
  running: { label: "Running", color: "hsl(var(--primary))" },
  completed: { label: "Completed", color: "hsl(var(--success))" },
  failed: { label: "Failed", color: "hsl(var(--destructive))" },
  cancelled: { label: "Cancelled", color: "hsl(var(--warning))" },
};

export function StatusBreakdownChart({ jobCounts }: { jobCounts: Record<CrawlStatus, number> }) {
  const data = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_META[status].label,
    count: jobCounts[status] ?? 0,
  })).filter((d) => d.count > 0);

  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
        No crawls yet — status breakdown will appear here.
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius="62%"
              outerRadius="90%"
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="hsl(var(--card))"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.status} fill={STATUS_META[d.status].color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 500 }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
              wrapperStyle={{ zIndex: 50, outline: "none" }}
              allowEscapeViewBox={{ x: true, y: true }}
              formatter={(value: number, _name, entry) => [
                `${formatNumber(value)} (${Math.round((value / total) * 100)}%)`,
                entry.payload.label,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xl font-semibold tracking-tight text-foreground">{formatNumber(total)}</p>
          <p className="text-[11px] text-muted-foreground">Total</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {data.map((d) => (
          <div key={d.status} className="flex items-center gap-1.5 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: STATUS_META[d.status].color }}
            />
            <span className="truncate text-muted-foreground">{d.label}</span>
            <span className="ml-auto font-medium tabular-nums text-foreground">{formatNumber(d.count)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { CheckCircle2, CircleDashed, FilterX, Loader2, Trash2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import type { DiscoveredUrl } from "@/lib/types";

const STATUS_ICON: Record<DiscoveredUrl["status"], typeof CheckCircle2> = {
  pending: CircleDashed,
  extracted: CheckCircle2,
  filtered: FilterX,
  failed: XCircle,
};

const STATUS_CLASS: Record<DiscoveredUrl["status"], string> = {
  pending: "text-muted-foreground",
  extracted: "text-success",
  filtered: "text-warning",
  failed: "text-destructive",
};

export function DiscoveredUrlsList({
  urls,
  onDelete,
  deletingId,
}: {
  urls: DiscoveredUrl[];
  onDelete?: (id: string) => void;
  deletingId?: string | null;
}) {
  if (urls.length === 0) {
    return (
      <EmptyState
        icon={CircleDashed}
        title="No URLs discovered yet"
        description="Discovered links will appear here as the crawl progresses."
      />
    );
  }

  const ordered = [...urls].reverse();

  return (
    <div className="scrollbar-thin max-h-96 space-y-1 overflow-y-auto">
      {ordered.map((item) => {
        const Icon = STATUS_ICON[item.status];
        const deleting = deletingId === item.id;
        return (
          <div
            key={item.id}
            className="group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs hover:bg-accent/50"
          >
            <Icon className={cn("h-3.5 w-3.5 shrink-0", STATUS_CLASS[item.status], item.status === "pending" && "animate-pulse")} />
            <span className="min-w-0 flex-1 truncate font-mono text-foreground/80">{item.url}</span>
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto h-8 w-8 shrink-0 text-muted-foreground opacity-100 transition-opacity duration-150 ease-out hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                disabled={deleting}
                onClick={() => onDelete(item.id)}
                aria-label="Delete discovered URL"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

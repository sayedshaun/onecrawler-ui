import { MessagesSquare } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { AgentConversationSummary } from "@/lib/types";

interface ConversationHistoryProps {
  conversations: AgentConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
}

// Shown while the (sometimes slow) backend fetch is in flight, so the sidebar
// reads as "loading" instead of flashing the empty state and then popping the
// real list in. Widths vary to hint at differing conversation titles.
function HistorySkeleton() {
  const widths = ["w-4/5", "w-3/5", "w-11/12", "w-2/3", "w-3/4"];
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="h-3 w-16 rounded bg-muted" />
      <div className="flex flex-col gap-1">
        {widths.map((w, i) => (
          <div key={i} className="flex flex-col gap-1.5 px-2.5 py-2">
            <div className={cn("h-3.5 rounded bg-muted", w)} />
            <div className="h-2.5 w-10 rounded bg-muted/60" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Buckets conversations into human recency bands (Today / Yesterday / …) the
// way every modern chat history does — a flat time-sorted list gets hard to
// scan once there are more than a handful. Order of the returned groups is the
// display order; empty bands are dropped.
function groupByRecency(conversations: AgentConversationSummary[]) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const dayMs = 86_400_000;
  const todayStart = startOfToday.getTime();

  const bands: { label: string; items: AgentConversationSummary[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const c of [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)) {
    if (c.updatedAt >= todayStart) bands[0].items.push(c);
    else if (c.updatedAt >= todayStart - dayMs) bands[1].items.push(c);
    else if (c.updatedAt >= todayStart - 7 * dayMs) bands[2].items.push(c);
    else bands[3].items.push(c);
  }

  return bands.filter((b) => b.items.length > 0);
}

// No delete action here — onecrawler-backend only exposes GET /api/v1/chats
// and GET /api/v1/chats/{id}, with no endpoint to remove a conversation.
export function ConversationHistory({ conversations, activeId, onSelect, loading }: ConversationHistoryProps) {
  const groups = groupByRecency(conversations);
  const showSkeleton = loading && conversations.length === 0;

  return (
    <div className="flex h-full flex-col gap-3">
      <ScrollArea className="-mx-1 flex-1 px-1">
        {showSkeleton ? (
          <div className="animate-pulse">
            <HistorySkeleton />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
            <MessagesSquare className="h-5 w-5 text-muted-foreground/60" />
            <p className="text-xs text-muted-foreground">Your conversations will show up here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {groups.map((group) => (
              <div key={group.label} className="flex flex-col gap-0.5">
                <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  {group.label}
                </p>
                {group.items.map((c) => {
                  const active = c.id === activeId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onSelect(c.id)}
                      className={cn(
                        "group relative rounded-lg px-2.5 py-2 text-left transition-colors duration-150 ease-out hover:bg-accent",
                        active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                      )}
                    >
                      {active && (
                        <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" />
                      )}
                      <p className="truncate text-sm">{c.title}</p>
                      <p
                        className={cn(
                          "truncate text-[11px] transition-colors",
                          active ? "text-muted-foreground" : "text-muted-foreground/60",
                        )}
                      >
                        {formatRelativeTime(new Date(c.updatedAt))}
                      </p>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

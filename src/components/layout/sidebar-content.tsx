import { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Radar } from "lucide-react";

import { ConversationHistory } from "@/components/agents/conversation-history";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { SettingsMenu } from "@/components/layout/settings-menu";
import { LiveDot } from "@/components/shared/live-dot";
import { usePolledResource } from "@/hooks/use-polled-resource";
import { listAgentConversations } from "@/lib/agents-api";
import { getDashboardOverview } from "@/lib/crawls-api";
import { useAgentChatStore } from "@/store/agent-chat-store";
import { cn } from "@/lib/utils";

/** Logo, nav, Agent history, and account menu — the actual content of the
 * app's one nav surface. Rendered directly inside the persistent lg+
 * Sidebar, and identically inside a Sheet for narrower screens (triggered
 * from the top bar's logo), so both are the same bar, just shown two ways. */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();

  const { data: overview } = usePolledResource(getDashboardOverview, {
    intervalMs: 20000,
    cacheKey: "dashboard:overview",
  });
  const runningCount = overview?.jobCounts.running ?? 0;

  const conversations = useAgentChatStore((s) => s.conversations);
  const activeId = useAgentChatStore((s) => s.activeId);
  const conversationsLoading = useAgentChatStore((s) => s.loading);
  const onSelect = useAgentChatStore((s) => s.onSelect);

  // Populates the history list from wherever the app happens to mount first —
  // AgentsPage refetches its own copy once it's actually open, but this shows
  // history on every page, so it can't wait for that visit.
  useEffect(() => {
    listAgentConversations()
      .then((list) => useAgentChatStore.getState().setConversations(list))
      .catch(() => {})
      .finally(() => useAgentChatStore.getState().setLoading(false));
  }, []);

  // Off the Agent page, AgentsPage isn't mounted to handle selection itself —
  // stash the target and navigate there; its own mount effect picks it up
  // (see agent-chat-store.ts).
  function handleSelect(id: string) {
    onNavigate?.();
    if (onSelect) {
      onSelect(id);
    } else {
      useAgentChatStore.getState().setPendingSelectId(id);
      navigate("/dashboard/agents");
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center border-b border-border px-5">
        <NavLink to="/dashboard" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-copper text-primary-foreground">
            <Radar className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">OneCrawler</span>
        </NavLink>
      </div>

      {/* Nav options stay on top, like ChatGPT's own sidebar chrome — the
          Agent conversation history fills the rest of the same bar
          underneath, on every page, rather than living in a page-level panel. */}
      <nav className="flex shrink-0 flex-col gap-1 p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-out hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-accent text-accent-foreground",
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {label === "Crawl History" && runningCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                <LiveDot className="bg-success" />
                {runningCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col border-t border-border p-3 pt-2.5">
        <ConversationHistory
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelect}
          loading={conversationsLoading}
        />
      </div>

      {/* Account entry anchored to the bottom, like ChatGPT/Claude — the
          same menu the top bar used to open via its own gear icon, just with
          identity visible up front instead of hidden behind an icon. Tutorial
          lives inside that menu now, between Settings and Log out. */}
      <div className="shrink-0 border-t border-border p-3">
        <SettingsMenu variant="row" onNavigate={onNavigate} />
      </div>
    </div>
  );
}

import type { LucideIcon } from "lucide-react";
import { Bot, Database, History, Layers, LayoutDashboard } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

// Tutorial isn't here — it lives inside the account menu (SettingsMenu),
// between Settings and Log out, rather than the primary nav.
export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/agents", label: "Agent", icon: Bot },
  { to: "/dashboard/crawls", label: "Crawl History", icon: History },
  { to: "/dashboard/data", label: "Extracted Data", icon: Database },
  { to: "/dashboard/templates", label: "Templates", icon: Layers },
];

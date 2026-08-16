import { useState } from "react";
import { Activity, KeyRound, Laptop, Palette, UserRound } from "lucide-react";

import { AccountCard } from "@/components/settings/account-card";
import { AppearanceCard } from "@/components/settings/appearance-card";
import { UsageCard } from "@/components/settings/usage-card";
import { SessionsCard } from "@/components/settings/sessions-card";
import { ApiKeysCard } from "@/components/settings/api-keys-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "account", label: "Account", icon: UserRound, content: AccountCard },
  { key: "appearance", label: "Appearance", icon: Palette, content: AppearanceCard },
  { key: "usage", label: "Usage", icon: Activity, content: UsageCard },
  { key: "sessions", label: "Sessions", icon: Laptop, content: SessionsCard },
  { key: "api-keys", label: "API Keys", icon: KeyRound, content: ApiKeysCard },
] as const;

/** The only Settings surface in the app — a bounded popup (like ChatGPT/
 * Claude's own settings modal), opened from the gear/account menu or via
 * settings-dialog-store.ts from anywhere else, instead of a full page. */
export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [active, setActive] = useState<(typeof CATEGORIES)[number]["key"]>("account");
  const ActiveContent = CATEGORIES.find((c) => c.key === active)?.content ?? AccountCard;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[42rem] max-h-[calc(100dvh-4rem)] w-[calc(100%-2rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto border-b border-border p-2 sm:w-48 sm:flex-col sm:overflow-y-auto sm:border-b-0 sm:border-r sm:p-3">
            {CATEGORIES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActive(key)}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-150 ease-out hover:bg-accent hover:text-accent-foreground",
                  active === key ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          <div className="min-w-0 flex-1 overflow-y-auto p-5">
            <ActiveContent />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

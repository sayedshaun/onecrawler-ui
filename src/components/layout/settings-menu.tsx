import { NavLink, useNavigate } from "react-router-dom";
import { ChevronsUpDown, GraduationCap, LogOut, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth-store";
import { useSettingsDialogStore } from "@/store/settings-dialog-store";

interface SettingsMenuProps {
  /** "icon" — bare gear button (top bar, mobile). "row" — full-width
   * avatar + name row anchored to the bottom of the Sidebar, like
   * ChatGPT/Claude's account entry. */
  variant?: "icon" | "row";
  /** Closes the mobile nav Sheet this menu lives in, if any, once Tutorial
   * (an actual navigation) is clicked — Settings/Log out don't need it since
   * neither navigates away from the current page. */
  onNavigate?: () => void;
}

/** The single settings entry point — user identity, the Settings dialog
 * (which now owns the theme switcher, under Appearance), Tutorial, and
 * logout, all under one trigger instead of scattered controls. */
export function SettingsMenu({ variant = "icon", onNavigate }: SettingsMenuProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const openSettings = useSettingsDialogStore((s) => s.openSettings);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const initial = (user?.name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "row" ? (
          <button
            type="button"
            aria-label="Account menu"
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors duration-150 ease-out hover:bg-accent"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user?.name || user?.email || "Account"}</p>
              {user?.name && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
            </div>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Settings"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align={variant === "row" ? "start" : "end"} side={variant === "row" ? "top" : "bottom"} className="w-56">
        {variant === "icon" && (
          <>
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{user?.name || user?.email}</p>
                {user?.name && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
              </div>
            </div>

            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={openSettings}>
          <Settings className="h-4 w-4" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <NavLink to="/dashboard/tutorial" onClick={onNavigate} className="cursor-pointer">
            <GraduationCap className="h-4 w-4" />
            Tutorial
          </NavLink>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { useState } from "react";
import { Menu } from "lucide-react";

import { SidebarContent } from "@/components/layout/sidebar-content";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function TopBar() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3 sm:px-4 lg:hidden">
      {/* Below lg, the Sidebar (nav, Agent history, account menu) lives behind
          this hamburger button instead of being flattened into the bar
          itself — tapping it opens the identical content in a Sheet. */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setNavOpen(true)}
        aria-label="Open navigation"
        className="shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <span className="text-sm font-semibold tracking-tight text-foreground">OneCrawler</span>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="w-72 max-w-[85%] gap-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onNavigate={() => setNavOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}

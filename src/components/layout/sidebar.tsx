import { SidebarContent } from "@/components/layout/sidebar-content";

// Persistent left nav for lg+ screens — reclaims the wide-monitor margin the
// centered content column leaves bare. Below lg, the same content shows in a
// Sheet instead, opened from the top bar's logo (see mobile-nav-sheet.tsx).
export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-background lg:flex">
      <SidebarContent />
    </aside>
  );
}

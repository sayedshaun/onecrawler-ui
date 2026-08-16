import { lazy, Suspense, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";

import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { useMediaQuery } from "@/hooks/use-media-query";
import { transitionPage } from "@/lib/motion";
import { useSettingsDialogStore } from "@/store/settings-dialog-store";

// Lazy, same reasoning as in settings-menu.tsx: this pulls in every settings
// card, and mounting it here means it's loaded once for the whole app rather
// than per-trigger.
const SettingsDialog = lazy(() =>
  import("@/components/settings/settings-dialog").then((m) => ({ default: m.SettingsDialog })),
);

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  // Touch devices (phones/tablets) get no page-enter animation — animating
  // opacity/transform is more likely to visibly stutter on a mobile GPU.
  // Desktop pointers keep the subtle transition.
  const coarsePointer = useMediaQuery("(pointer: coarse)");
  const animatePages = !reduceMotion && !coarsePointer;

  // Full-bleed, full-height routes (the Agent chat) pin to the viewport with
  // hard borders, so the shared y:6 slide makes the whole bordered panel
  // visibly "hop" (a gap flashes at the bottom, the top clips under the fixed
  // topbar) instead of the gentle content-settle every normal-flow page gets.
  // Crossfade those with opacity only so the entrance still matches in feel
  // without the hop.
  const fullBleed = location.pathname === "/dashboard/agents";
  const enterOffset = fullBleed ? 0 : 6;

  const settingsOpen = useSettingsDialogStore((s) => s.open);
  const setSettingsOpen = useSettingsDialogStore((s) => s.setOpen);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar />
        {/* overflow-x-hidden is load-bearing, not decorative: with only
            overflow-y set, the browser forces overflow-x to compute as "auto"
            too (per spec, a non-visible axis makes the other axis non-visible
            as well) — which turns full-bleed pages that cancel this padding via
            negative margins (e.g. the Agent page) into horizontally scrollable
            content that can visibly shift during the page-enter transition. */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 lg:px-8 lg:py-8">
          {/*
            No AnimatePresence/exit animation here on purpose: an exit animation makes
            AnimatePresence delay mounting the next page until the old one finishes
            leaving, which added real navigation latency (compounding on rapid clicks).
            The old page unmounts instantly; only the new one animates in.
          */}
          <motion.div
            key={location.pathname}
            initial={animatePages ? { opacity: 0, y: enterOffset } : false}
            animate={animatePages ? { opacity: 1, y: 0 } : undefined}
            transition={transitionPage}
            className="mx-auto min-h-full w-full max-w-screen-2xl"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {settingsOpen && (
        <Suspense fallback={null}>
          <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </Suspense>
      )}
    </div>
  );
}

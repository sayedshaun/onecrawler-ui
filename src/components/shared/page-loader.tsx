import { Loader2 } from "lucide-react";

/** Suspense fallback for lazy-loaded routes. `fullScreen` covers the whole
 * viewport (public/auth routes, loaded before any shell exists); otherwise it
 * fills the dashboard content area while the sidebar/topbar stay mounted. */
export function PageLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      className={
        fullScreen
          ? "flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground"
          : "flex items-center justify-center py-24 text-sm text-muted-foreground"
      }
    >
      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
    </div>
  );
}

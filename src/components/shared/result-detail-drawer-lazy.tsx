import { lazy, Suspense, useEffect, useState } from "react";

import type { ResultRef } from "@/components/shared/result-detail-drawer";

const RealResultDetailDrawer = lazy(() =>
  import("@/components/shared/result-detail-drawer").then((m) => ({ default: m.ResultDetailDrawer })),
);

/** Defers the react-markdown / react-syntax-highlighter-heavy drawer bundle
 * until a result is actually opened, instead of it loading the moment the
 * results table or data page mounts. Stays mounted once opened so later
 * open/close cycles keep their exit animation — unmounting on every close
 * would skip it. Same props as the real component, so call sites are
 * unaffected beyond the import path. */
export function ResultDetailDrawer(props: {
  result: ResultRef | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [hasOpened, setHasOpened] = useState(false);
  useEffect(() => {
    if (props.result && !hasOpened) setHasOpened(true);
  }, [props.result, hasOpened]);

  if (!hasOpened) return null;
  return (
    <Suspense fallback={null}>
      <RealResultDetailDrawer {...props} />
    </Suspense>
  );
}

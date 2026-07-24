import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/api";

interface UsePolledResourceOptions {
  /** Re-fetch on this interval. Pass null/undefined to fetch once. */
  intervalMs?: number | null;
  /** Effect re-runs (and state resets) when any of these change. */
  deps?: unknown[];
  /**
   * Stable key identifying this resource (e.g. "history:all:0"). When set, the last
   * successful result for that key is reused as the initial state on remount, so
   * navigating away and back doesn't blank the UI while it refetches in the background.
   */
  cacheKey?: string;
}

interface UsePolledResource<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const resourceCache = new Map<string, unknown>();

export function usePolledResource<T>(
  fetcher: () => Promise<T>,
  { intervalMs = null, deps = [], cacheKey }: UsePolledResourceOptions = {},
): UsePolledResource<T> {
  const cached = cacheKey !== undefined ? (resourceCache.get(cacheKey) as T | undefined) : undefined;
  const [data, setData] = useState<T | null>(cached ?? null);
  const [loading, setLoading] = useState(cached === undefined);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  // Bumped whenever the resource changes (deps change / unmount) so a slow, superseded
  // request can't overwrite state with stale data after a newer request has resolved.
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      const result = await fetcherRef.current();
      if (requestId !== requestIdRef.current) return;
      setData(result);
      setError(null);
      if (cacheKey !== undefined) resourceCache.set(cacheKey, result);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof ApiError ? err.message : "Failed to load data.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => {
    const cachedForKey = cacheKey !== undefined ? (resourceCache.get(cacheKey) as T | undefined) : undefined;
    setData(cachedForKey ?? null);
    setError(null);
    setLoading(cachedForKey === undefined);
    load();
    if (!intervalMs) return;

    // Pause the interval while the tab/app is backgrounded — a phone browser
    // left open (or switched away from) would otherwise keep polling forever
    // for no visible benefit, burning battery and data. Refetch immediately
    // on return so the view isn't stale the moment it's looked at again.
    let id: ReturnType<typeof setInterval> | null = setInterval(load, intervalMs);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        if (!id) {
          load();
          id = setInterval(load, intervalMs);
        }
      } else if (id) {
        clearInterval(id);
        id = null;
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (id) clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibility);
      requestIdRef.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: load };
}

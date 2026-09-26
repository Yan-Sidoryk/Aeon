"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { ApiError, errorMessage } from "@/lib/api";

export type Loaded<T> = {
  /** undefined until the first load for this key finishes. */
  data: T | undefined;
  error: string | null;
  /** HTTP status of the last failure (0 when the API couldn't be reached). */
  status: number | null;
  /** Fetch again, keeping the current data on screen meanwhile. */
  reload: () => void;
};

type State<T> = { key: string; data?: T; error?: string; status?: number };

/**
 * Loads data in the browser: the dashboard API identifies the caller by a header only the browser has, so these
 * pages can't fetch on the server. A null key skips the load. Changing the key drops the old data.
 */
export function useApi<T>(key: string | null, load: () => Promise<T>): Loaded<T> {
  const [state, setState] = useState<State<T> | null>(null);
  const [nonce, setNonce] = useState(0);
  const run = useEffectEvent(load);

  useEffect(() => {
    if (key === null) return;
    let cancelled = false;
    run().then(
      (data) => {
        if (!cancelled) setState({ key, data });
      },
      (err: unknown) => {
        if (cancelled) return;
        setState((prev) => ({
          key,
          data: prev?.key === key ? prev.data : undefined,
          error: errorMessage(err),
          status: err instanceof ApiError ? err.status : 0,
        }));
      }
    );
    return () => {
      cancelled = true;
    };
  }, [key, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const mine = key !== null && state?.key === key ? state : null;
  return { data: mine?.data, error: mine?.error ?? null, status: mine?.status ?? null, reload };
}

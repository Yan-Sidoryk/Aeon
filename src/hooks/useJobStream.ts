"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { streamUrl } from "@/lib/api";

/**
 * - connecting: waiting for the first byte (the browser also retries here on its own after a network blip)
 * - done / error: the job finished; the stream is closed
 * - lost: the server doesn't know the job (404 after a restart); poll the resource instead
 */
export type StreamStatus = "idle" | "connecting" | "open" | "done" | "error" | "lost";

type Handlers<E> = { [K in keyof E]?: (data: E[K]) => void };

const PROGRESS_EVENTS = ["step", "answer", "counters"] as const;

/**
 * Follows one backend job over SSE (docs/architecture.md, "Live progress"). The server replays the whole
 * history on connect, so opening the stream late, twice, or after a page refresh is safe; handlers must be
 * idempotent. The stream closes itself on `done` or a server-sent `error`, so EventSource doesn't reconnect
 * and replay everything again.
 */
export function useJobStream<E extends { done: unknown; error: { message: string } }>(
  path: string | null,
  handlers: Handlers<E>
): StreamStatus {
  const [status, setStatus] = useState<StreamStatus>("connecting");

  const dispatch = useEffectEvent((event: string, raw: string) => {
    const handler = handlers[event as keyof E] as ((data: unknown) => void) | undefined;
    handler?.(JSON.parse(raw));
  });

  useEffect(() => {
    if (!path) return;
    const es = new EventSource(streamUrl(path));

    es.onopen = () => setStatus("open");
    for (const event of PROGRESS_EVENTS) {
      es.addEventListener(event, (e) => dispatch(event, (e as MessageEvent<string>).data));
    }
    es.addEventListener("done", (e) => {
      es.close();
      setStatus("done");
      dispatch("done", (e as MessageEvent<string>).data);
    });
    es.addEventListener("error", (e) => {
      // A server-sent `error` event carries data; the browser's own connection error doesn't.
      const data = (e as MessageEvent<string>).data;
      if (typeof data === "string") {
        es.close();
        setStatus("error");
        dispatch("error", data);
      } else if (es.readyState === EventSource.CLOSED) {
        setStatus("lost"); // non-200 (404): the browser gave up
      }
    });
    return () => es.close();
  }, [path]);

  return path ? status : "idle";
}

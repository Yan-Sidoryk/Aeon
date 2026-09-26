"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { streamUrl } from "@/lib/api";

/**
 * - connecting: waiting for the first byte (the browser also retries here on its own after a network blip)
 * - done / error: the job finished; the stream is closed
 * - lost: the server doesn't know the job (404); poll the resource instead
 */
export type StreamStatus = "idle" | "connecting" | "open" | "done" | "error" | "lost";

type Handlers<E> = { [K in keyof E]?: (data: E[K]) => void };

const PROGRESS_EVENTS = ["step", "answer", "counters", "round"] as const;

/**
 * Follows one backend job over SSE (docs/architecture.md, "Live progress"). Jobs and their events live in the
 * database, so the server replays the whole history on connect: opening the stream late, twice, or after a page
 * refresh (or a server restart) is safe, and handlers must be idempotent. The stream closes itself on `done` or a
 * server-sent `error`, so EventSource doesn't reconnect and replay everything again.
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
    let es: EventSource | null = null;
    let closed = false;

    streamUrl(path).then((url) => {
      if (closed) return;
      const source = new EventSource(url);
      es = source;
      source.onopen = () => setStatus("open");
      for (const event of PROGRESS_EVENTS) {
        source.addEventListener(event, (e) => dispatch(event, (e as MessageEvent<string>).data));
      }
      source.addEventListener("done", (e) => {
        source.close();
        setStatus("done");
        dispatch("done", (e as MessageEvent<string>).data);
      });
      source.addEventListener("error", (e) => {
        // A server-sent `error` event carries data; the browser's own connection error doesn't.
        const data = (e as MessageEvent<string>).data;
        if (typeof data === "string") {
          source.close();
          setStatus("error");
          dispatch("error", data);
        } else if (source.readyState === EventSource.CLOSED) {
          setStatus("lost"); // non-200 (404): the browser gave up
        }
      });
    });
    return () => {
      closed = true;
      es?.close();
    };
  }, [path]);

  return path ? status : "idle";
}

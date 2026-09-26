import type { SetupView, StepEvent } from "@/types/api";
import { api, streamUrl } from "./api";

// The setup agent (competitors + 10 questions) takes ~45s live. The hero screen starts it as soon as a drug is
// picked; the setup screen joins the same run and shows the agent's steps instead of starting a second one.

type Listener = (steps: StepEvent[]) => void;

type Run = { promise: Promise<SetupView>; steps: StepEvent[]; listeners: Set<Listener> };

const runs = new Map<number, Run>();

export function loadSetup(productId: number, onSteps?: Listener): Promise<SetupView> {
  let run = runs.get(productId);
  if (!run) {
    const created: Run = { steps: [], listeners: new Set(), promise: Promise.resolve(null as unknown as SetupView) };
    created.promise = start(productId, created);
    created.promise.catch(() => runs.delete(productId)); // let a retry start fresh
    runs.set(productId, created);
    run = created;
  }
  if (onSteps) {
    run.listeners.add(onSteps);
    onSteps(run.steps);
  }
  return run.promise;
}

export function stopListening(productId: number, onSteps: Listener): void {
  runs.get(productId)?.listeners.delete(onSteps);
}

async function start(productId: number, run: Run): Promise<SetupView> {
  const started = await api.startSetup(productId);
  if (started.setup) return started.setup;
  await follow(`/api/setup/${started.job_id}/events`, (step) => {
    run.steps = [...run.steps.filter((s) => s.key !== step.key), step];
    run.listeners.forEach((l) => l(run.steps));
  });
  return api.setup(productId);
}

/** Resolves on the job's `done`, rejects on its `error`. */
async function follow(path: string, onStep: (step: StepEvent) => void): Promise<void> {
  const url = await streamUrl(path);
  await new Promise<void>((resolve, reject) => {
    const es = new EventSource(url);
    es.addEventListener("step", (e) => onStep(JSON.parse((e as MessageEvent<string>).data)));
    es.addEventListener("done", () => {
      es.close();
      resolve();
    });
    es.addEventListener("error", (e) => {
      const data = (e as MessageEvent<string>).data;
      if (typeof data === "string") {
        es.close();
        reject(new Error((JSON.parse(data) as { message: string }).message));
      } else if (es.readyState === EventSource.CLOSED) {
        reject(new Error("Lost the connection to the setup agent. Try again."));
      }
    });
  });
}

import type { SetupView } from "@/types/api";
import { api } from "./api";

// Setup takes ~15s live. The hero screen starts it in the background as soon as a drug is picked, and the
// setup screen joins the same request instead of starting a second (costly) build.
const pending = new Map<number, Promise<SetupView>>();

export function loadSetup(productId: number): Promise<SetupView> {
  let promise = pending.get(productId);
  if (!promise) {
    promise = api.buildSetup(productId);
    pending.set(productId, promise);
    promise.catch(() => pending.delete(productId)); // let a retry start fresh
  }
  return promise;
}

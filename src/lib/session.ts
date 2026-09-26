// Anonymous-first session: one UUID per browser, sent as X-Session-Id. An email is attached at the save step.
const KEY = "aeon.session";

let memoryId: string | null = null;

export function getSessionId(): string {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    // Storage blocked (private mode, embedded browser): keep one id for this tab.
    memoryId ??= crypto.randomUUID();
    return memoryId;
  }
}

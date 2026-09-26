"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionKey = "headline" | "accuracy" | "lost" | "sources" | "fixes";
type Role = "brand" | "medical" | "regulatory" | "agency";

const ROLES: { id: Role; label: string }[] = [
  { id: "brand", label: "Brand or marketing" },
  { id: "medical", label: "Medical affairs" },
  { id: "regulatory", label: "Regulatory or MLR" },
  { id: "agency", label: "Agency" },
];

// The journey doc: the role question changes what the report leads with. Medical and regulatory readers care
// about label accuracy first; brand and agency readers about visibility.
const ORDER: Record<Role, SectionKey[]> = {
  brand: ["headline", "accuracy", "lost", "sources", "fixes"],
  agency: ["headline", "lost", "sources", "fixes", "accuracy"],
  medical: ["accuracy", "fixes", "headline", "lost", "sources"],
  regulatory: ["accuracy", "fixes", "headline", "lost", "sources"],
};

// The role is a per-browser preference, kept in localStorage (memory if storage is blocked).
const KEY = "aeon.role";
const listeners = new Set<() => void>();
let memoryRole: Role | null = null;

function isRole(value: unknown): value is Role {
  return ROLES.some((r) => r.id === value);
}

function readRole(): Role | null {
  try {
    const stored = localStorage.getItem(KEY);
    if (isRole(stored)) return stored;
  } catch {
    // storage blocked
  }
  return memoryRole;
}

function writeRole(role: Role) {
  memoryRole = role;
  try {
    localStorage.setItem(KEY, role);
  } catch {
    // storage blocked
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  window.addEventListener("storage", notify);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", notify);
  };
}

export function ReportSections({ sections }: { sections: Record<SectionKey, ReactNode> }) {
  const role = useSyncExternalStore(subscribe, readRole, () => null);

  return (
    <>
      <div className="mt-8 flex flex-col gap-3 rounded-2xl bg-sand/70 px-5 py-4 md:flex-row md:items-center md:gap-5">
        <p className="shrink-0 text-[14px] font-medium">What&apos;s your role?</p>
        <div role="radiogroup" aria-label="Your role" className="flex flex-wrap gap-2">
          {ROLES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={role === id}
              onClick={() => writeRole(id)}
              className={cn(
                "h-9 cursor-pointer rounded-full px-4 text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal",
                role === id ? "bg-black text-white" : "bg-white text-black hover:bg-oat"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {role === null && <p className="text-[13px] text-stone md:ml-auto">We&apos;ll put what matters to you first.</p>}
      </div>

      <div className="mt-8 flex flex-col gap-14">
        {ORDER[role ?? "brand"].map((key) => (
          <div key={key}>{sections[key]}</div>
        ))}
      </div>
    </>
  );
}

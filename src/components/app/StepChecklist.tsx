import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "./ui";

export type ChecklistRow = { key: string; label: string; status: "pending" | "active" | "done" };

/** Live checklist for a background job: a spinner while a step runs, a lime tick when it's done. */
export function StepChecklist({ rows, className }: { rows: ChecklistRow[]; className?: string }) {
  return (
    <ol className={cn("flex flex-col gap-2", className)} aria-live="polite">
      {rows.map((row) => (
        <li
          key={row.key}
          className={cn(
            "flex h-12 items-center gap-3 rounded-xl px-4 text-[15px] leading-none transition-colors",
            row.status === "pending" ? "bg-offwhite text-taupe" : "bg-offwhite text-black",
            row.status === "active" && "font-medium"
          )}
        >
          <span className="grid size-6 shrink-0 place-items-center">
            {row.status === "done" && (
              <span className="grid size-6 animate-[fade-up_0.3s_ease-out_both] place-items-center rounded-full bg-lime text-forest">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            )}
            {row.status === "active" && <Spinner />}
            {row.status === "pending" && <span className="size-2 rounded-full bg-oat" />}
          </span>
          {row.label}
        </li>
      ))}
    </ol>
  );
}

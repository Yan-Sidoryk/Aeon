"use client";

import { useId, useState } from "react";
import { PlusIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export type FaqItem = {
  question: string;
  answer: string;
};

type FaqAccordionProps = {
  items: readonly FaqItem[];
};

/**
 * 7shifts' FAQ accordion: rows toggle independently (several can be open), the plus turns 45° into an ×,
 * the open question fills with oat, and the answer grows via max-height 0 -> 384px plus padding 0 -> 15px
 * (150ms ease-in). Rows only get the hover fill from the md breakpoint (810px) and on hover-capable devices.
 * Semantics follow the WAI-ARIA accordion pattern (heading > button, panel region labelled by its question).
 */
export function FaqAccordion({ items }: FaqAccordionProps) {
  const baseId = useId();
  const [openRows, setOpenRows] = useState<ReadonlySet<number>>(() => new Set());

  const toggle = (index: number) => {
    setOpenRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <ul className="flex flex-col gap-2 min-[810px]:w-2/3 lg:mt-16">
      {items.map((item, index) => {
        const isOpen = openRows.has(index);
        const buttonId = `${baseId}-question-${index}`;
        const panelId = `${baseId}-answer-${index}`;
        return (
          <li key={item.question} className="relative flex flex-col">
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                className={cn(
                  "relative block w-full cursor-pointer rounded-[20px] bg-offwhite py-5 pr-14 pl-5 text-left font-display text-lg font-medium text-black transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] lg:leading-[18px]",
                  "min-[810px]:hover:bg-sand",
                  "focus-visible:ring-2 focus-visible:ring-royal focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none",
                  isOpen && "bg-oat!",
                )}
              >
                {item.question}
                <PlusIcon
                  className={cn(
                    "absolute top-1/2 right-5 z-20 -translate-y-1/2 transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    isOpen ? "rotate-45" : "rotate-0",
                  )}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!isOpen}
              className={cn(
                "flex flex-col gap-5 overflow-y-hidden px-[15px] tracking-[-0.32px] antialiased transition-all duration-150 ease-in",
                isOpen ? "max-h-96 p-[15px]" : "max-h-0",
              )}
            >
              <p className="text-base leading-6">{item.answer}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

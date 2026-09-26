import Image from "next/image";
import type { CSSProperties } from "react";

export type TherapeuticArea = { label: string; icon: string };

type TaMarqueeProps = {
  label: string;
  areas: readonly TherapeuticArea[];
  /** Seconds per loop (half the track). Chosen so the band moves at 7shifts' 44.68 px/s. */
  duration: number;
};

/**
 * 7shifts' lime "built for" band: handwritten labels + 40px doodles scrolling left forever (translateX 0 → -50%,
 * linear, no pause on hover). The list is rendered twice; the copy is hidden from assistive tech. The band clips the
 * track so the page never gets wider than the viewport.
 */
export function TaMarquee({ label, areas, duration }: TaMarqueeProps) {
  const items = [...areas, ...areas];
  return (
    <div className="relative z-20 w-full overflow-hidden bg-lime py-[10px]">
      <ul
        aria-label={label}
        className="flex w-max animate-marquee-x gap-[56px] pr-[56px]"
        style={{ "--marquee-duration": `${duration}s` } as CSSProperties}
      >
        {items.map((area, i) => (
          <li
            key={`${area.label}-${i}`}
            aria-hidden={i >= areas.length || undefined}
            className="flex shrink-0 items-center gap-[10px]"
          >
            <Image src={area.icon} alt="" width={40} height={40} className="size-10 shrink-0" />
            <span className="font-hand text-[28px] leading-none font-normal whitespace-nowrap text-ink [text-box:trim-both_cap_alphabetic]">
              {area.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

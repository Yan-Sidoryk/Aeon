"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import styles from "./social.module.css";

export type PolaroidPhoto = {
  src: string;
  /** Empty for the decorative back prints. */
  alt: string;
  /** Tailwind object-position class for the crop inside the print's photo window. */
  position: string;
};

type PolaroidStackProps = {
  /** Back to front: the front print is the one that stays fully visible. */
  photos: readonly [back: PolaroidPhoto, middle: PolaroidPhoto, front: PolaroidPhoto];
  sticker: string;
};

// Geometry of 7shifts' three pre-rotated polaroid PNGs (w-80 = 320px, i.e. 0.8333× their 384px canvas), refitted as
// unrotated frames inside the 384×384 stack: position/size of the white card, its tilt, border widths and the soft
// shadow the two back prints carry. Drop-in delays follow 7shifts' stagger (back first). See the spec for the numbers.
const PRINTS = [
  {
    frame:
      "left-[61.03px] top-[59.51px] h-[227.04px] w-[252.75px] -rotate-[7.04deg] pt-[6px] pr-[6.4px] pb-[29.2px] pl-[6.25px] shadow-[0_2px_17px_rgb(0_0_0/0.18)] [--drop-delay:0ms]",
    sizes: "240px",
  },
  {
    frame:
      "left-[93.39px] top-[45.77px] h-[229.96px] w-[255.88px] rotate-[4.51deg] pt-[5.3px] px-[6.1px] pb-[27.5px] shadow-[0_2px_17px_rgb(0_0_0/0.18)] [--drop-delay:200ms]",
    sizes: "244px",
  },
  {
    frame:
      "left-[44.08px] top-[34.38px] h-[279.92px] w-[286.67px] -rotate-[7.04deg] pt-[6.7px] px-[6.9px] pb-[27.9px] [--drop-delay:400ms]",
    sizes: "273px",
  },
] as const;

// White fill traced from the doodle's own phone silhouette (240×240 canvas, eroded 2px so it hides under the ink).
// The PNG's phone body is transparent and would vanish on black; 7shifts' sticker is white-filled.
const STICKER_FILL =
  "M102 2L82 5L64 11L60 15L51 32L43 79L44 91L41 107L39 179L42 210L47 221L52 226L70 235L99 237L110 237L144 232L152 228L157 223L162 204L163 187L167 170L168 99L171 96L183 94L192 88L198 79L199 63L195 51L186 40L168 32L167 24L160 14L146 7L110 2Z";

/** Three tilted polaroids with a doodle sticker; they drop in (staggered spring) once half the stack is on screen. */
export function PolaroidStack({ photos, sticker }: PolaroidStackProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // framer-motion `whileInView` with amount 0.5 and once on 7shifts: the stack reveals when half of it is visible.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.49) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} data-inview={inView ? "" : undefined} className={cn(styles.stack, "relative h-96 w-96")}>
      {PRINTS.map((print, i) => {
        const photo = photos[i];
        const decorative = photo.alt === "";
        return (
          <div
            key={photo.src}
            aria-hidden={decorative || undefined}
            className={cn(styles.drop, "absolute rounded-[2.5px] bg-paper", print.frame)}
          >
            <div className="relative h-full w-full overflow-hidden">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes={print.sizes}
                className={cn("object-cover", photo.position)}
              />
            </div>
          </div>
        );
      })}

      {/* Sticker box: same anchor and shrink-to-fit width as 7shifts (min(144px, stack − 273.1px): 111px on desktop,
          37px on a 390px phone). The doodle's ink is sized and centered like the bento box's ink inside that box. */}
      <div
        aria-hidden
        className={cn(
          styles.drop,
          "absolute top-[202.82px] left-[273.1px] aspect-square w-36 max-w-[calc(100%-273.1px)] [--drop-delay:600ms]",
        )}
      >
        <div className="absolute top-[17.13%] left-[19.02%] aspect-square w-[63.67%]">
          <svg viewBox="0 0 240 240" className="absolute inset-0 h-full w-full" aria-hidden>
            <path d={STICKER_FILL} fill="#fff" />
          </svg>
          <Image src={sticker} alt="" fill sizes="71px" className="object-contain" />
        </div>
      </div>
    </div>
  );
}

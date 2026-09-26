import type { SVGProps } from "react";

// Icons extracted from the 7shifts reference page (inline SVGs), normalised to currentColor.
type IconProps = SVGProps<SVGSVGElement>;

/** Thin arrow used in the announcement bar (16x16, stroke 1.5). */
export function ArrowThinIcon(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Bold chevron used next to nav items with dropdowns (rendered at 12x12). */
export function ChevronDownIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 448 512" width="12" height="12" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z" />
    </svg>
  );
}

/** Thin chevron used in the mobile menu accordions. */
export function ChevronDownThinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 1024 1024" width="22" height="22" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M8.2 275.4c0-8.6 3.4-17.401 10-24.001 13.2-13.2 34.8-13.2 48 0l451.8 451.8 445.2-445.2c13.2-13.2 34.8-13.2 48 0s13.2 34.8 0 48L542 775.399c-13.2 13.2-34.8 13.2-48 0l-475.8-475.8c-6.8-6.8-10-15.4-10-24.199z" />
    </svg>
  );
}

/** Bold arrow used on "Explore …" links (phosphor bold, 256 grid). */
export function ArrowRightBoldIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 256 256" width="16" height="16" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z" />
    </svg>
  );
}

/** Regular arrow used on "View more" style links (phosphor regular, 256 grid). */
export function ArrowRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 256 256" width="16" height="16" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" />
    </svg>
  );
}

/** Bold check (phosphor bold). */
export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 256 256" width="20" height="20" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z" />
    </svg>
  );
}

/** Bold X (phosphor bold). */
export function XIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 256 256" width="20" height="20" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z" />
    </svg>
  );
}

/** Filled circle with a check cut out (timeline cards, 27x27 grid). Circle uses currentColor, check uses `checkColor`. */
export function CheckCircleIcon({ checkColor = "#fff", ...props }: IconProps & { checkColor?: string }) {
  return (
    <svg viewBox="0 0 27 27" width="20" height="20" fill="none" aria-hidden="true" {...props}>
      <circle cx="13.5" cy="13.5" r="13" fill="currentColor" />
      <path d="M7.5 14.2l3.6 3.5 7.5-7.5" stroke={checkColor} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Filled circle with an X cut out ("the old way" list). */
export function XCircleIcon({ xColor = "#fff", ...props }: IconProps & { xColor?: string }) {
  return (
    <svg viewBox="0 0 27 27" width="20" height="20" fill="none" aria-hidden="true" {...props}>
      <circle cx="13.5" cy="13.5" r="13" fill="currentColor" />
      <path d="M9.3 9.3l8.4 8.4M17.7 9.3l-8.4 8.4" stroke={xColor} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/** Plus used on FAQ rows (antd, 1024 grid). */
export function PlusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 1024 1024" width="21" height="21" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8Z" />
      <path d="M192 474h672q8 0 8 8v60q0 8-8 8H160q-8 0-8-8v-60q0-8 8-8Z" />
    </svg>
  );
}

/** Hamburger used in the mobile header (radix, 15 grid). */
export function MenuIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 15 15" width="30" height="30" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.6006 11.0098C13.8286 11.0563 14 11.2583 14 11.5C14 11.7417 13.8286 11.9437 13.6006 11.9902L13.5 12H1.5C1.22386 12 1 11.7761 1 11.5C1 11.2239 1.22386 11 1.5 11H13.5L13.6006 11.0098ZM13.6006 7.00977C13.8286 7.05629 14 7.25829 14 7.5C14 7.74171 13.8286 7.94371 13.6006 7.99023L13.5 8H1.5C1.22386 8 1 7.77614 1 7.5C1 7.22386 1.22386 7 1.5 7H13.5L13.6006 7.00977ZM13.6006 3.00977C13.8286 3.05629 14 3.25829 14 3.5C14 3.74171 13.8286 3.94371 13.6006 3.99023L13.5 4H1.5C1.22386 4 1 3.77614 1 3.5C1 3.22386 1.22386 3 1.5 3H13.5L13.6006 3.00977Z" />
    </svg>
  );
}

/** Hand-drawn orange swoosh drawn under the hero headline (stretches to its container). */
export function UnderlineSwoosh(props: IconProps) {
  return (
    <svg viewBox="0 0 391 22" fill="none" preserveAspectRatio="none" aria-hidden="true" {...props}>
      <path
        d="M280.02 7.95265C234.021 10.9089 187.176 14.3952 140.289 16.7601C96.4998 18.962 52.6482 19.9814 8.81726 21.5105C8.13595 21.5309 7.434 21.5105 6.75268 21.5105C3.44936 21.5512 0.063418 21.1639 0.00148073 17.0659C-0.0811023 12.9069 3.30483 12.5399 6.60815 12.4991C18.8098 12.3768 31.0527 12.601 43.2337 11.9894C92.8661 9.54288 142.54 7.42256 192.131 4.05859C256.071 -0.283999 319.949 -1.62959 383.93 2.44795C387.337 2.67222 390.495 3.32462 390.124 7.46333C389.752 11.602 386.346 11.5613 383.063 11.4389C349.039 10.2768 314.994 9.13512 280.02 7.97302V7.95265Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Five-point star used in rating rows. */
export function StarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8L12 2.5z" />
    </svg>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FocusEvent, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { AeonLogo } from "@/components/AeonLogo";
import { ChevronDownIcon, ChevronDownThinIcon, MenuIcon } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { cn } from "@/lib/utils";
import { CloseIcon } from "./icons";
import { HEADER_CTA, HEADER_SIGN_IN, NAV_ITEMS, PANEL_FOOTER, type NavMenuId } from "./nav-content";

type Panels = Record<NavMenuId, ReactNode>;

// 7shifts scales the desktop pill between 1200px and 1920px viewports:
// value = min + (max@1920 - min) * (100vw - 1200px) / 720px, clamped. Values at 1440: 14.667px text,
// 8.667px item padding, 42.667px buttons, 13.333px / 20px button padding.
const FLUID_TEXT = "text-[length:clamp(14px,calc(14px_+_(100vw_-_1200px)_/_360),18px)] leading-[1.5]";
const FLUID_ITEM_PX = "px-[clamp(8px,calc(8px_+_(100vw_-_1200px)_/_360),12px)]";
const FLUID_BUTTON_H = "h-[clamp(40px,calc(40px_+_(100vw_-_1200px)_/_90),56px)]";
const FLUID_CTA_PX = "px-[clamp(12px,calc(12px_+_(100vw_-_1200px)_/_180),20px)]";
const FLUID_SIGN_IN_PX = "px-[clamp(18px,calc(18px_+_(100vw_-_1200px)_/_120),30px)]";
// Same height as the 7shifts wordmark (64px -> 80px wide at 99:28) for the 1176:325 Aeon logo.
const FLUID_LOGO_W = "w-[clamp(65.5px,calc(65.5px_+_(100vw_-_1200px)_/_44),82px)]";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal focus-visible:ring-offset-2 focus-visible:ring-offset-white";
const DESKTOP_ITEM = cn(
  "flex items-center gap-2.5 rounded-full py-1 font-display font-medium whitespace-nowrap text-black transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-sand",
  FLUID_TEXT,
  FLUID_ITEM_PX,
  FOCUS_RING,
);
const MOBILE_ROW =
  "flex w-full items-center justify-between gap-2.5 py-5 pr-6 pl-4 text-left font-display text-[20px] leading-7 font-medium text-black transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-royal";

const triggerId = (id: NavMenuId) => `nav-trigger-${id}`;
const panelId = (id: NavMenuId) => `nav-panel-${id}`;
const accordionId = (id: NavMenuId) => `mobile-nav-${id}`;

function MobileRowLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-10 shrink-0 items-center justify-center">
        <Image src={icon} alt="" width={40} height={40} className="size-[34px] object-contain" />
      </span>
      <span className="leading-none tracking-[-0.2px] [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
        {label}
      </span>
    </span>
  );
}

export function HeaderShell({ desktopPanels, mobilePanels }: { desktopPanels: Panels; mobilePanels: Panels }) {
  // Desktop mega menu (hover / click), mobile full-height menu and its single-open accordion.
  const [activePanel, setActivePanel] = useState<NavMenuId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<NavMenuId | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Mouse-only hover handling so a tap on a touch screen doesn't open and immediately toggle closed.
  const openOnHover = (id: NavMenuId) => (event: PointerEvent) => {
    if (event.pointerType === "mouse") setActivePanel(id);
  };
  const closeOnHover = (event: PointerEvent) => {
    if (event.pointerType === "mouse") setActivePanel(null);
  };
  const closeOnLinkClick = (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest("a")) setActivePanel(null);
  };
  const closeWhenFocusLeaves = (id: NavMenuId) => (event: FocusEvent<HTMLLIElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setActivePanel((current) => (current === id ? null : current));
    }
  };
  const closeMenu = () => {
    setMenuOpen(false);
    setOpenAccordion(null);
  };
  const closeMenuOnLinkClick = (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest("a")) closeMenu();
  };

  // Escape closes whichever menu is open and returns focus to its trigger.
  useEffect(() => {
    if (!activePanel && !menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (activePanel) {
        document.getElementById(triggerId(activePanel))?.focus();
        setActivePanel(null);
      }
      if (menuOpen) {
        setMenuOpen(false);
        setOpenAccordion(null);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activePanel, menuOpen]);

  // The open mobile menu covers the viewport: lock page scroll behind it (7shifts adds overflow-hidden to body).
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  // Crossing the 1200px breakpoint resets both menus.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1200px)");
    const reset = () => {
      setActivePanel(null);
      setMenuOpen(false);
      setOpenAccordion(null);
    };
    query.addEventListener("change", reset);
    return () => query.removeEventListener("change", reset);
  }, []);

  const raised = activePanel !== null || menuOpen;

  return (
    <>
      <header
        data-section="header"
        onPointerLeave={closeOnHover}
        className={cn(
          "fixed inset-x-0 top-[37px] flex",
          raised ? "z-[104]" : "z-[102]",
          // < 1200px: full-width white bar that grows to the full viewport height when the menu opens.
          "max-xl:overflow-hidden max-xl:rounded-b-[20px] max-xl:shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] max-xl:transition-all max-xl:duration-200 max-xl:ease-[cubic-bezier(0.4,0,1,1)]",
          menuOpen ? "max-xl:max-h-dvh max-xl:min-h-dvh" : "max-xl:max-h-14",
          // >= 1200px: floating pill inset 64px, 16px under the announcement bar.
          "xl:mx-16 xl:mt-4 xl:max-h-20 xl:items-start",
        )}
      >
        <nav aria-label="Main" className="w-full bg-white max-xl:rounded-b-2xl xl:bg-transparent">
          {/* Desktop pill */}
          <div className="hidden h-20 items-center gap-6 rounded-[40px] bg-white px-6 shadow-[0_4px_15px_0_rgba(0,0,0,0.10)] xl:flex">
            <Link
              href="/"
              aria-label="Aeon home"
              onPointerEnter={closeOnHover}
              className={cn("flex h-20 shrink-0 items-center rounded-md", FOCUS_RING)}
            >
              <AeonLogo className={FLUID_LOGO_W} />
            </Link>
            <ul className="flex h-20 items-center">
              {NAV_ITEMS.map((item) => {
                if (item.kind === "link") {
                  return (
                    <li key={item.label} onPointerEnter={closeOnHover} className="flex h-full items-center">
                      <Link href={item.href} className={DESKTOP_ITEM}>
                        {item.label}
                      </Link>
                    </li>
                  );
                }
                const open = activePanel === item.id;
                return (
                  <li
                    key={item.id}
                    onPointerEnter={openOnHover(item.id)}
                    onBlur={closeWhenFocusLeaves(item.id)}
                    className="flex h-full items-center"
                  >
                    <button
                      type="button"
                      id={triggerId(item.id)}
                      aria-expanded={open}
                      aria-controls={panelId(item.id)}
                      onClick={() => setActivePanel((current) => (current === item.id ? null : item.id))}
                      className={cn("group cursor-pointer", DESKTOP_ITEM, open && "bg-sand")}
                    >
                      {item.label}
                      <ChevronDownIcon
                        className={cn(
                          "size-3 shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:rotate-180",
                          open && "rotate-180",
                        )}
                      />
                    </button>
                    <div
                      id={panelId(item.id)}
                      role="region"
                      aria-labelledby={triggerId(item.id)}
                      onClick={closeOnLinkClick}
                      className={cn(
                        "absolute inset-x-0 top-full px-16 pt-2.5 transition-opacity duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
                        open ? "visible opacity-100" : "pointer-events-none invisible opacity-0",
                      )}
                    >
                      {desktopPanels[item.id]}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div onPointerEnter={closeOnHover} className="flex h-full flex-1 items-center justify-end gap-2">
              <PillButton href={HEADER_CTA.href} className={cn(FLUID_BUTTON_H, FLUID_CTA_PX, FLUID_TEXT)}>
                {HEADER_CTA.label}
              </PillButton>
              <PillButton
                href={HEADER_SIGN_IN.href}
                variant="secondary"
                className={cn(FLUID_BUTTON_H, FLUID_SIGN_IN_PX, FLUID_TEXT)}
              >
                {HEADER_SIGN_IN.label}
              </PillButton>
            </div>
          </div>

          {/* Mobile / tablet bar + full-height menu */}
          <div className="grid grid-cols-2 items-center xl:hidden">
            <Link href="/" aria-label="Aeon home" className={cn("justify-self-start rounded-md py-[0.85rem] pl-4", FOCUS_RING)}>
              <AeonLogo className="w-[101px]" />
            </Link>
            <div className="flex gap-3 justify-self-end py-[0.85rem] pr-6">
              {/* Aeon's CTA label is longer than 7shifts'; below 375px it swaps to the short label so it never hits the logo.
                  The two breakpoints are complementary (width < 375 / width >= 375), so exactly one label renders. */}
              <PillButton href={HEADER_CTA.href} className="h-auto px-4 py-1 text-[14px] leading-5">
                <span className="max-[375px]:hidden">{HEADER_CTA.label}</span>
                <span className="min-[375px]:hidden">{HEADER_CTA.shortLabel}</span>
              </PillButton>
              <button
                ref={menuButtonRef}
                type="button"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                aria-label={menuOpen ? "Close main menu" : "Open main menu"}
                onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
                className="cursor-pointer rounded-md p-1 text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-royal"
              >
                {menuOpen ? <CloseIcon className="size-[30px]" /> : <MenuIcon className="size-[30px]" />}
              </button>
            </div>
            <div className="col-span-2 w-full">
              <ul
                id="mobile-menu"
                onClick={closeMenuOnLinkClick}
                className={cn(
                  "flex max-h-[calc(100dvh_-_93px)] w-full flex-col items-center gap-2 overflow-y-auto",
                  !menuOpen && "invisible",
                )}
              >
                {NAV_ITEMS.map((item) => {
                  if (item.kind === "link") {
                    return (
                      <li key={item.label} className="w-full">
                        <Link href={item.href} className={cn(MOBILE_ROW, "bg-white")}>
                          <MobileRowLabel icon={item.icon} label={item.label} />
                        </Link>
                      </li>
                    );
                  }
                  const expanded = openAccordion === item.id;
                  return (
                    <li key={item.id} className="w-full">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={accordionId(item.id)}
                        onClick={() => setOpenAccordion(expanded ? null : item.id)}
                        className={cn(MOBILE_ROW, "cursor-pointer", expanded ? "bg-sand" : "bg-white")}
                      >
                        <MobileRowLabel icon={item.icon} label={item.label} />
                        <ChevronDownThinIcon
                          className={cn(
                            "size-[22px] shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                            expanded && "rotate-180",
                          )}
                        />
                      </button>
                      <div id={accordionId(item.id)} className={cn("w-full", !expanded && "hidden")}>
                        {mobilePanels[item.id]}
                      </div>
                    </li>
                  );
                })}
                <li className="mt-10 mb-36 flex w-full flex-col items-center gap-2 px-10">
                  <PillButton href={HEADER_CTA.href} className="w-full">
                    {HEADER_CTA.label}
                  </PillButton>
                  <PillButton href={HEADER_SIGN_IN.href} variant="secondary" className="w-full">
                    {HEADER_SIGN_IN.label}
                  </PillButton>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </header>

      {/* 7shifts pins an enterprise link to the bottom of the viewport while the mobile menu is open. */}
      {menuOpen && (
        <div className="fixed inset-x-0 bottom-0 z-[105] bg-black py-2.5 text-center xl:hidden">
          <Link
            href={PANEL_FOOTER.href}
            onClick={closeMenu}
            className="font-display text-[16px] leading-6 font-medium text-white focus-visible:underline focus-visible:outline-none"
          >
            {PANEL_FOOTER.lead}
            <br />
            <span className="text-mint">{PANEL_FOOTER.link}</span> {PANEL_FOOTER.tail}
          </Link>
        </div>
      )}
    </>
  );
}

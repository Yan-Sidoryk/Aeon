"use client";

import {
  CalendarClock,
  Check,
  ChevronsUpDown,
  FileText,
  Globe,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  Plus,
  Swords,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PillButton } from "@/components/ui/pill-button";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DashboardContext, useDashboard, type Dashboard } from "./context";
import { ArrowLink } from "./parts";
import { loadPortfolio } from "./portfolio";
import { RunScanButton } from "./RunScan";
import { useApi } from "./useApi";
import { ErrorNote, Panel, Skeleton } from "../ui";

type NavItem = { slug: string; label: string; icon: LucideIcon };

// The seven pages from docs/user-journey-pharma-onboarding.md, "After onboarding: the dashboard".
const NAV: NavItem[] = [
  { slug: "", label: "Overview", icon: LayoutDashboard },
  { slug: "questions", label: "Questions", icon: MessagesSquare },
  { slug: "competitors", label: "Competitors", icon: Swords },
  { slug: "sources", label: "Sources", icon: Globe },
  { slug: "opportunities", label: "Opportunities", icon: Megaphone },
  { slug: "content", label: "Content", icon: FileText },
  { slug: "tracking", label: "Tracking", icon: CalendarClock },
];

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal";

/** The first path segment after /app/[productId] ("" on the overview). */
function sectionOf(pathname: string, base: string): string {
  return pathname.startsWith(base) ? (pathname.slice(base.length).split("/")[1] ?? "") : "";
}

/**
 * Shell for one drug's dashboard: sidebar (tab bar on small screens), brand switcher, and a header with the drug and
 * "Run scan now". It loads what every page shares (the drug, its scan history, the latest report) once per drug.
 * productId is null when the URL segment isn't an id.
 */
export function DashboardShell({ productId, children }: { productId: number | null; children: ReactNode }) {
  if (productId === null) return <NotFoundPanel />;
  return <Shell productId={productId}>{children}</Shell>;
}

function Shell({ productId, children }: { productId: number; children: ReactNode }) {
  const portfolio = useApi("portfolio", loadPortfolio);
  const history = useApi(`history:${productId}`, () => api.history(productId));
  const scans = useApi(`scans:${productId}`, () => api.scans(productId));
  const latestId = history.data?.[0]?.report_id ?? null;
  const report = useApi(latestId && `report:${latestId}`, () => api.report(latestId ?? ""));
  // A drug with scans has questions; one without might never have been set up, so ask.
  const unscanned = history.data?.length === 0;
  const setup = useApi(unscanned ? `setup:${productId}` : null, () => api.setup(productId));

  const value = useMemo<Dashboard>(() => {
    const companies = portfolio.data?.companies;
    const company = companies?.find((c) => c.products.some((p) => p.id === productId));
    // Both are unknown while loading; when a check fails, "Run scan now" isn't blocked on it.
    const runningScan = scans.data ? (scans.data.find((s) => s.status === "running") ?? null) : scans.error ? null : undefined;
    let needsSetup: boolean | undefined = false;
    if (history.data === undefined) needsSetup = undefined;
    else if (unscanned) needsSetup = setup.data ? setup.data.prompts.length === 0 : setup.error ? false : undefined;
    return {
      productId,
      base: `/app/${productId}`,
      product: company?.products.find((p) => p.id === productId),
      company,
      history: history.data,
      report: unscanned ? null : report.data,
      runningScan,
      needsSetup,
      drugs: portfolio.data?.drugs,
    };
  }, [productId, portfolio.data, history.data, report.data, scans.data, scans.error, unscanned, setup.data, setup.error]);

  const notFound = history.status === 404 || (portfolio.data !== undefined && value.product === undefined);
  if (notFound) return <NotFoundPanel />;
  const error = portfolio.error ?? history.error ?? report.error;

  return (
    <DashboardContext value={value}>
      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-8 lg:grid lg:grid-cols-[212px_minmax(0,1fr)] lg:gap-10">
        <aside aria-label="Dashboard" className="hidden lg:block">
          <div className="sticky top-16 flex flex-col gap-6 pt-8 pb-8">
            <BrandSwitcher variant="card" />
            <SideNav />
            <SidebarFooter />
          </div>
        </aside>

        <div className="min-w-0 pb-28">
          <DashboardHeader />
          <MobileTabs />
          {error ? (
            <ErrorNote
              className="mt-8"
              action={
                <PillButton
                  variant="secondary"
                  className="h-10 bg-white px-5 text-[14px]"
                  onClick={() => {
                    portfolio.reload();
                    history.reload();
                    report.reload();
                  }}
                >
                  Try again
                </PillButton>
              }
            >
              {error}
            </ErrorNote>
          ) : (
            <div className="pt-6 md:pt-8">{children}</div>
          )}
        </div>
      </div>
    </DashboardContext>
  );
}

// ---- Header ------------------------------------------------------------------------------------------------------

function DashboardHeader() {
  const { product, company, history } = useDashboard();
  const latest = history?.[0];
  const molecule =
    product?.molecule && product.molecule.toLowerCase() !== product.brand.toLowerCase() ? product.molecule : "";

  return (
    <header className="flex flex-col gap-4 border-b border-oat/70 pt-6 pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-5 sm:pb-6 md:pt-10">
      <div className="min-w-0">
        {product && company ? (
          <>
            <p className="text-[13px] font-medium text-stone">
              {company.name || company.domain}
              {product.tier && <span className="text-taupe"> · {product.tier}</span>}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <h1 className="min-w-0 font-display text-[34px] leading-[1.05] font-medium tracking-[-0.03em] break-words md:text-[42px]">
                {product.brand}
                {molecule && (
                  <span className="ml-2.5 align-baseline text-[15px] font-normal tracking-normal text-stone md:text-[17px]">
                    {molecule}
                  </span>
                )}
              </h1>
              <BrandSwitcher variant="icon" className="lg:hidden" />
            </div>
            {product.indication && <p className="mt-2 text-[14px] leading-[1.45] text-graphite">{product.indication}</p>}
          </>
        ) : (
          <div aria-busy="true">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-10 w-60" />
            <Skeleton className="mt-3 h-4 w-72 max-w-full" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
        <RunScanButton />
        <p className="text-[13px] text-stone">
          {latest ? `Last scan ${formatDate(latest.finished_at)}` : history ? "No finished scan yet" : " "}
        </p>
      </div>
    </header>
  );
}

// ---- Navigation ----------------------------------------------------------------------------------------------------

function useSection(): { base: string; section: string } {
  const { base } = useDashboard();
  const pathname = usePathname();
  return { base, section: sectionOf(pathname, base) };
}

function SideNav() {
  const { base, section } = useSection();
  return (
    <nav aria-label="Dashboard pages">
      <ul className="flex flex-col gap-0.5">
        {NAV.map(({ slug, label, icon: Icon }) => {
          const active = slug === section;
          return (
            <li key={label}>
              <Link
                href={slug ? `${base}/${slug}` : base}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-xl px-3 text-[15px] transition-colors",
                  FOCUS,
                  active
                    ? "bg-white font-medium text-black shadow-[0_0_0_1px_var(--color-oat)]"
                    : "text-graphite hover:bg-white/70 hover:text-black"
                )}
              >
                <Icon className={cn("size-[18px] shrink-0", active ? "text-royal" : "text-taupe")} strokeWidth={2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function MobileTabs() {
  const { base, section } = useSection();
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Keep the current tab in view when the bar scrolls sideways.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [section]);

  return (
    <nav
      aria-label="Dashboard pages"
      className="sticky top-16 z-30 -mx-4 border-b border-oat/70 bg-offwhite/92 backdrop-blur-md md:-mx-8 lg:hidden"
    >
      <ul className="flex gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] md:px-8 [&::-webkit-scrollbar]:hidden">
        {NAV.map(({ slug, label, icon: Icon }) => {
          const active = slug === section;
          return (
            <li key={label} className="shrink-0">
              <Link
                ref={active ? activeRef : undefined}
                href={slug ? `${base}/${slug}` : base}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-medium whitespace-nowrap transition-colors",
                  FOCUS,
                  active ? "bg-black text-white" : "text-graphite hover:bg-white"
                )}
              >
                <Icon className={cn("size-4", active ? "text-white" : "text-taupe")} strokeWidth={2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SidebarFooter() {
  const { history } = useDashboard();
  const latest = history?.[0];
  return (
    <div className="mt-auto flex flex-col gap-2.5 border-t border-oat/70 pt-5">
      {latest && (
        <ArrowLink href={`/report/${latest.report_id}`} external>
          Full report
        </ArrowLink>
      )}
      <Link href="/app" className="text-[14px] font-medium text-stone transition-colors hover:text-black">
        All drugs
      </Link>
    </div>
  );
}

// ---- Brand switcher ------------------------------------------------------------------------------------------------

function BrandSwitcher({ variant, className }: { variant: "card" | "icon"; className?: string }) {
  const { product, company, drugs, productId } = useDashboard();
  const { section } = useSection();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const list = drugs ?? [];
  const others = list.filter((d) => d.product.id !== productId);
  const current = list.find((d) => d.product.id === productId);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {variant === "card" ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-oat/70 bg-white p-3 text-left transition-colors hover:border-oat",
            FOCUS
          )}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-periwinkle font-display text-[16px] font-semibold text-navy">
            {product?.brand.charAt(0) ?? ""}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] leading-tight font-medium">{product?.brand ?? " "}</span>
            <span className="mt-0.5 block truncate text-[12px] text-stone">{company?.name || company?.domain || " "}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-taupe" />
          <span className="sr-only">Switch drug</span>
        </button>
      ) : (
        <button
          type="button"
          aria-expanded={open}
          aria-label="Switch drug"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-oat/70 bg-white transition-colors hover:bg-sand",
            FOCUS
          )}
        >
          <ChevronsUpDown className="size-4 text-graphite" />
        </button>
      )}

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-2 rounded-2xl border border-oat/70 bg-white p-2 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.25)]",
            variant === "card" ? "inset-x-0" : "right-0 w-[280px] max-w-[calc(100vw-2rem)]"
          )}
        >
          <p className="px-3 pt-2 pb-1.5 text-[12px] font-medium text-taupe">Your drugs</p>
          <ul className="flex flex-col">
            {[...(current ? [current] : []), ...others].map((d) => {
              const active = d.product.id === productId;
              return (
                <li key={d.product.id}>
                  <Link
                    href={`/app/${d.product.id}${section ? `/${section}` : ""}`}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-offwhite",
                      FOCUS,
                      active && "bg-offwhite"
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">{d.product.brand}</span>
                      <span className="block truncate text-[12px] text-stone">
                        {d.latest ? `Last scan ${formatDate(d.latest.finished_at)}` : "No scan yet"}
                      </span>
                    </span>
                    {active && <Check className="size-4 shrink-0 text-royal" strokeWidth={2.5} />}
                  </Link>
                </li>
              );
            })}
            {!drugs && <li className="px-3 py-2.5 text-[14px] text-stone">Loading…</li>}
          </ul>
          <div className="mt-1 flex flex-col border-t border-oat/60 pt-1">
            <Link
              href="/app"
              onClick={() => setOpen(false)}
              className={cn("rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors hover:bg-offwhite", FOCUS)}
            >
              All drugs
            </Link>
            {company && (
              <Link
                href={`/start/hero?company=${company.id}`}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-[14px] font-medium text-royal-dark transition-colors hover:bg-offwhite",
                  FOCUS
                )}
              >
                <Plus className="size-4" strokeWidth={2.25} />
                Set up another drug
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Not found -----------------------------------------------------------------------------------------------------

function NotFoundPanel() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-28 md:px-8">
      <Panel className="mt-10 flex flex-col items-start gap-4 p-6 md:p-10">
        <p className="font-display text-[26px] leading-[1.15] font-medium tracking-[-0.02em]">
          We can&apos;t find this drug in your account
        </p>
        <p className="max-w-[520px] text-[16px] leading-[1.55] text-stone">
          It may belong to another account, or the link is wrong. Your dashboards are listed under your drugs.
        </p>
        <PillButton href="/app" className="mt-2">
          See your drugs
        </PillButton>
      </Panel>
    </div>
  );
}

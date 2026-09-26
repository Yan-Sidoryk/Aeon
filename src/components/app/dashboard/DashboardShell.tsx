"use client";

import {
  ArrowUpRight,
  Check,
  ChevronsUpDown,
  FileText,
  Globe,
  LayoutDashboard,
  MessagesSquare,
  Plus,
  Swords,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AeonLogo } from "@/components/AeonLogo";
import { PillButton, START_HREF } from "@/components/ui/pill-button";
import { api, errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DashboardContext, useDashboard, type Dashboard } from "./context";
import { EngineMark } from "./engines";
import { loadPortfolio } from "./portfolio";
import { RunScanButton } from "./RunScan";
import { useApi } from "./useApi";
import { ErrorNote, Panel, Skeleton } from "../ui";

type NavItem = { slug: string; label: string; icon: LucideIcon };

// What a brand team checks each week. Promo opportunities and the tracking page stay reachable by URL; weekly
// tracking is a switch at the bottom of the sidebar.
const NAV: NavItem[] = [
  { slug: "", label: "Overview", icon: LayoutDashboard },
  { slug: "questions", label: "Questions", icon: MessagesSquare },
  { slug: "competitors", label: "Competitors", icon: Swords },
  { slug: "sources", label: "Sources", icon: Globe },
  { slug: "content", label: "Fixes", icon: FileText },
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
    const runningScan = scans.data
      ? (scans.data.find((s) => s.status === "running") ?? null)
      : scans.error
        ? null
        : undefined;
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
  }, [
    productId,
    portfolio.data,
    history.data,
    report.data,
    scans.data,
    scans.error,
    unscanned,
    setup.data,
    setup.error,
  ]);

  const notFound = history.status === 404 || (portfolio.data !== undefined && value.product === undefined);
  if (notFound) return <NotFoundPanel />;
  const error = portfolio.error ?? history.error ?? report.error;

  return (
    <DashboardContext value={value}>
      <div className="lg:flex">
        <aside
          aria-label="Dashboard"
          className="sticky top-0 hidden h-dvh w-[252px] shrink-0 flex-col border-r border-oat/70 bg-white lg:flex"
        >
          <div className="flex h-16 shrink-0 items-center px-6">
            <Link href="/app" aria-label="Your drugs" className={cn("rounded-md", FOCUS)}>
              <AeonLogo className="w-[80px]" />
            </Link>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 pb-4">
            <BrandSwitcher variant="card" />
            <SideNav />
            <SidebarFooter />
          </div>
        </aside>

        <div className="mx-auto w-full max-w-[1180px] min-w-0 px-4 pb-24 md:px-8 lg:px-10">
          <MobileTopBar />
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
  const { product, company, history, report } = useDashboard();
  const latest = history?.[0];
  const molecule =
    product?.molecule && product.molecule.toLowerCase() !== product.brand.toLowerCase() ? product.molecule : "";

  return (
    <header className="flex flex-col gap-4 border-b border-oat/70 pt-5 pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-5 md:pt-8">
      <div className="min-w-0">
        {product && company ? (
          <>
            <p className="text-[13px] font-medium text-stone">
              {company.name || company.domain}
              {product.tier && <span className="text-taupe"> · {product.tier}</span>}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="min-w-0 font-display text-[30px] leading-[1.05] font-medium tracking-[-0.03em] break-words md:text-[36px]">
                {product.brand}
                {molecule && (
                  <span className="ml-2.5 align-baseline text-[15px] font-normal tracking-normal text-stone md:text-[17px]">
                    {molecule}
                  </span>
                )}
              </h1>
              <BrandSwitcher variant="icon" className="lg:hidden" />
            </div>
            {product.indication && <p className="mt-1.5 text-[14px] leading-[1.45] text-stone">{product.indication}</p>}
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
        <p className="flex items-center gap-2 text-[13px] text-stone">
          {report && (
            <span
              className="flex items-center gap-1"
              aria-label={`Engines: ${report.engines.map((e) => e.label).join(", ")}`}
            >
              {report.engines.map((e) => (
                <EngineMark key={e.name} engine={e.name} size={14} />
              ))}
            </span>
          )}
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
                  active ? "bg-offwhite font-medium text-black" : "text-graphite hover:bg-offwhite/70 hover:text-black",
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
      className="sticky top-0 z-30 -mx-4 border-b border-oat/70 bg-offwhite/92 backdrop-blur-md md:-mx-8 lg:hidden"
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
                  active ? "bg-black text-white" : "text-graphite hover:bg-white",
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
  const item = cn(
    "flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] text-graphite hover:bg-offwhite hover:text-black",
    FOCUS,
  );
  return (
    <div className="mt-auto flex flex-col gap-1 border-t border-oat/70 pt-4">
      <WeeklySwitch />
      {latest && (
        <a href={`/report/${latest.report_id}`} target="_blank" rel="noopener noreferrer" className={item}>
          <ArrowUpRight className="size-[18px] text-taupe" strokeWidth={2} />
          Shareable report
        </a>
      )}
      <Link href={START_HREF} className={item}>
        <Plus className="size-[18px] text-taupe" strokeWidth={2} />
        New report
      </Link>
    </div>
  );
}

/** Weekly tracking: re-asks the same questions every week, so the trend fills in. */
function WeeklySwitch() {
  const { productId } = useDashboard();
  const tracking = useApi(`tracking:${productId}`, () => api.tracking(productId));
  const [saving, setSaving] = useState(false);
  const [override, setOverride] = useState<{
    productId: number;
    weekly: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const on = (override?.productId === productId ? override.weekly : undefined) ?? tracking.data?.weekly ?? false;

  async function toggle() {
    setSaving(true);
    setError(null);
    try {
      setOverride({
        productId,
        weekly: (await api.setTracking(productId, !on)).weekly,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-3 py-2">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={saving || tracking.data === undefined}
        onClick={toggle}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg text-[14px] text-graphite disabled:cursor-default",
          FOCUS,
        )}
      >
        Weekly scans
        <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", on ? "bg-royal" : "bg-oat")}>
          <span
            className={cn(
              "absolute top-0.5 size-4 rounded-full bg-white shadow transition-[left]",
              on ? "left-[18px]" : "left-0.5",
            )}
          />
        </span>
      </button>
      {error && <p className="mt-1.5 text-[12px] leading-[1.4] text-alert-ink">{error}</p>}
    </div>
  );
}

/** Phones and tablets: the logo and "New report" above the tabs. */
function MobileTopBar() {
  return (
    <div className="flex h-14 items-center justify-between lg:hidden">
      <Link href="/app" aria-label="Your drugs" className={cn("rounded-md", FOCUS)}>
        <AeonLogo className="w-[72px]" />
      </Link>
      <PillButton href={START_HREF} variant="secondary" className="h-9 px-4 text-[13px]">
        New report
      </PillButton>
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
            FOCUS,
          )}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-periwinkle font-display text-[16px] font-semibold text-navy">
            {product?.brand.charAt(0) ?? ""}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] leading-tight font-medium">{product?.brand ?? " "}</span>
            <span className="mt-0.5 block truncate text-[12px] text-stone">
              {company?.name || company?.domain || " "}
            </span>
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
            FOCUS,
          )}
        >
          <ChevronsUpDown className="size-4 text-graphite" />
        </button>
      )}

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-2 rounded-2xl border border-oat/70 bg-white p-2 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.25)]",
            variant === "card" ? "inset-x-0" : "right-0 w-[280px] max-w-[calc(100vw-2rem)]",
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
                      active && "bg-offwhite",
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
              className={cn(
                "rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors hover:bg-offwhite",
                FOCUS,
              )}
            >
              All drugs
            </Link>
            {company && (
              <Link
                href={`/start/hero?company=${company.id}`}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-[14px] font-medium text-royal-dark transition-colors hover:bg-offwhite",
                  FOCUS,
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

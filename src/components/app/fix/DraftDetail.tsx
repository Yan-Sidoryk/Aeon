"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PillButton } from "@/components/ui/pill-button";
import { ApiError, api, errorMessage } from "@/lib/api";
import type { Draft } from "@/types/api";
import { ErrorNote, Skeleton } from "../ui";
import { DraftView } from "./DraftView";

type Loaded = { draft: Draft; brand: string };
type Failure = { message: string; missing: boolean };

/** Dashboard → Content → one draft. Drafts are the owner's, so this loads in the browser with its session. */
export function DraftDetail({ productId, draftId }: { productId: number; draftId: number }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.draft(draftId), api.product(productId).catch(() => null)])
      .then(([draft, product]) => {
        if (!cancelled) setLoaded({ draft, brand: product?.brand ?? "" });
      })
      .catch((err) => {
        if (!cancelled) setFailure({ message: errorMessage(err), missing: err instanceof ApiError && err.status === 404 });
      });
    return () => {
      cancelled = true;
    };
  }, [productId, draftId, attempt]);

  if (failure) {
    return (
      <ErrorNote
        action={
          !failure.missing && (
            <PillButton
              variant="secondary"
              className="h-10 shrink-0 px-5 text-[14px]"
              onClick={() => {
                setFailure(null);
                setAttempt((n) => n + 1);
              }}
            >
              Try again
            </PillButton>
          )
        }
      >
        {failure.missing ? "We can't find this draft. It may have been made from another account." : failure.message}
      </ErrorNote>
    );
  }

  if (!loaded) {
    return (
      <div aria-busy="true" className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <span className="sr-only" role="status">
          Loading the draft…
        </span>
        <Skeleton className="h-[560px] rounded-3xl" />
        <Skeleton className="h-[420px] rounded-3xl max-lg:hidden" />
      </div>
    );
  }

  const { draft, brand } = loaded;
  return (
    <div className="flex flex-col gap-4">
      {draft.report_id && (
        <Link
          href={`/report/${draft.report_id}`}
          className="inline-flex w-fit items-center gap-1 text-[14px] font-medium text-stone transition-colors hover:text-black"
        >
          Open the report this draft fixes <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      )}
      <DraftView draft={draft} brand={brand} />
    </div>
  );
}

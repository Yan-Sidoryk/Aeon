"use client";

import { Lead, PageTitle, Screen } from "@/components/app/ui";
import { PillButton } from "@/components/ui/pill-button";

// Server errors reach the browser without their message in production, so this stays generic. unstable_retry
// re-fetches the segment (reset would only re-render it), which is what a failed API call needs.
export default function ReportError({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return (
    <Screen>
      <PageTitle>We couldn&apos;t load this report</PageTitle>
      <Lead>The Aeon API didn&apos;t answer. Try again in a moment.</Lead>
      <PillButton onClick={() => unstable_retry()} className="mt-8">
        Try again
      </PillButton>
    </Screen>
  );
}

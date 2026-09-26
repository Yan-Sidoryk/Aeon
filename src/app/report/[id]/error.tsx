"use client";

import { Lead, PageTitle, Screen } from "@/components/app/ui";
import { PillButton } from "@/components/ui/pill-button";

// Server errors reach the browser without their message in production, so this stays generic.
export default function ReportError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Screen>
      <PageTitle>We couldn&apos;t load this report</PageTitle>
      <Lead>The Aeon API didn&apos;t answer. Try again in a moment.</Lead>
      <PillButton onClick={reset} className="mt-8">
        Try again
      </PillButton>
    </Screen>
  );
}

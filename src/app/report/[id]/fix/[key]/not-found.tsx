"use client";

import { useParams } from "next/navigation";
import { Lead, PageTitle, Screen } from "@/components/app/ui";
import { PillButton } from "@/components/ui/pill-button";

export default function FixNotFound() {
  const { id } = useParams<{ id: string }>();
  return (
    <Screen>
      <PageTitle>We can&apos;t find that fix</PageTitle>
      <Lead>This report doesn&apos;t have a fix at that link. Its top fixes are on the report.</Lead>
      <PillButton href={`/report/${id}`} className="mt-8">
        Back to the report
      </PillButton>
    </Screen>
  );
}

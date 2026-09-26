import { Screen, PageTitle, Lead } from "@/components/app/ui";
import { PillButton, START_HREF } from "@/components/ui/pill-button";

export default function ReportNotFound() {
  return (
    <Screen>
      <PageTitle>We can&apos;t find that report</PageTitle>
      <Lead>Check the link, or start a new report for your brand.</Lead>
      <PillButton href={START_HREF} className="mt-8">
        Start a free report
      </PillButton>
    </Screen>
  );
}

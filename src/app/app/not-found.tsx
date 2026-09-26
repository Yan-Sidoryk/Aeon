import { Lead, PageTitle, Screen } from "@/components/app/ui";
import { PillButton } from "@/components/ui/pill-button";

export default function DashboardNotFound() {
  return (
    <Screen>
      <PageTitle>We can&apos;t find that dashboard</PageTitle>
      <Lead>Check the link, or open one of your drugs.</Lead>
      <PillButton href="/app" className="mt-8">
        See your drugs
      </PillButton>
    </Screen>
  );
}

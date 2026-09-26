import { AppHeader } from "@/components/app/AppHeader";
import { DrugList } from "@/components/app/dashboard/DrugList";

export default function DashboardHomePage() {
  return (
    <>
      <AppHeader />
      <DrugList />
    </>
  );
}

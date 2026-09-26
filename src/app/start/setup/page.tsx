import { redirect } from "next/navigation";
import { SetupScreen } from "@/components/app/SetupScreen";
import { idParam, type SearchParams } from "@/lib/params";

export default async function SetupPage({ searchParams }: { searchParams: SearchParams }) {
  const companyId = idParam((await searchParams).company);
  if (companyId === null) redirect("/start");
  return <SetupScreen companyId={companyId} />;
}

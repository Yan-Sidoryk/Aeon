import { redirect } from "next/navigation";
import { PortfolioScreen } from "@/components/app/PortfolioScreen";
import { idParam, type SearchParams } from "@/lib/params";

export default async function PortfolioPage({ searchParams }: { searchParams: SearchParams }) {
  const companyId = idParam((await searchParams).company);
  if (companyId === null) redirect("/start");
  return <PortfolioScreen companyId={companyId} />;
}

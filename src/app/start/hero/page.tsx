import { redirect } from "next/navigation";
import { HeroScreen } from "@/components/app/HeroScreen";
import { api } from "@/lib/api";
import { idParam, type SearchParams } from "@/lib/params";

export default async function HeroPage({ searchParams }: { searchParams: SearchParams }) {
  const companyId = idParam((await searchParams).company);
  if (companyId === null) redirect("/start");
  const demo = await api.health().then((h) => h.demo_mode, () => false);
  return <HeroScreen companyId={companyId} demo={demo} />;
}

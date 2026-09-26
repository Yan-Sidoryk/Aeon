import { redirect } from "next/navigation";
import { ScanScreen } from "@/components/app/ScanScreen";
import { idParam, type SearchParams } from "@/lib/params";

export default async function ScanPage({ searchParams }: { searchParams: SearchParams }) {
  const scanId = idParam((await searchParams).scan);
  if (scanId === null) redirect("/start");
  return <ScanScreen scanId={scanId} />;
}

import { StartScreen } from "@/components/app/StartScreen";
import type { SearchParams } from "@/lib/params";

export default async function StartPage({ searchParams }: { searchParams: SearchParams }) {
  const { url } = await searchParams;
  return <StartScreen initialUrl={typeof url === "string" ? url : ""} />;
}

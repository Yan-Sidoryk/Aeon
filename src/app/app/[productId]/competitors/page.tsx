import type { Metadata } from "next";
import { CompetitorsView } from "@/components/app/dashboard/CompetitorsView";

export const metadata: Metadata = { title: "Competitors · Dashboard · Aeon" };

export default function CompetitorsPage() {
  return <CompetitorsView />;
}

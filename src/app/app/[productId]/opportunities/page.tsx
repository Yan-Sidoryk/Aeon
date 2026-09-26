import type { Metadata } from "next";
import { OpportunitiesView } from "@/components/app/dashboard/OpportunitiesView";

export const metadata: Metadata = { title: "Opportunities · Dashboard · Aeon" };

export default function OpportunitiesPage() {
  return <OpportunitiesView />;
}

import type { Metadata } from "next";
import { Overview } from "@/components/app/dashboard/Overview";

export const metadata: Metadata = { title: "Overview · Dashboard · Aeon" };

export default function OverviewPage() {
  return <Overview />;
}

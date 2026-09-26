import type { Metadata } from "next";
import { SourcesView } from "@/components/app/dashboard/SourcesView";

export const metadata: Metadata = { title: "Sources · Dashboard · Aeon" };

export default function SourcesPage() {
  return <SourcesView />;
}

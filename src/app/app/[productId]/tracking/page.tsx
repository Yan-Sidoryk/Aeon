import type { Metadata } from "next";
import { TrackingView } from "@/components/app/dashboard/TrackingView";

export const metadata: Metadata = { title: "Tracking · Dashboard · Aeon" };

export default function TrackingPage() {
  return <TrackingView />;
}

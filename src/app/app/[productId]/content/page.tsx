import type { Metadata } from "next";
import { ContentView } from "@/components/app/dashboard/ContentView";

export const metadata: Metadata = { title: "Content · Dashboard · Aeon" };

export default function ContentPage() {
  return <ContentView />;
}

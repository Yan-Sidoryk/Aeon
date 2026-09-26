import type { Metadata } from "next";
import { QuestionsView } from "@/components/app/dashboard/QuestionsView";

export const metadata: Metadata = { title: "Questions · Dashboard · Aeon" };

export default function QuestionsPage() {
  return <QuestionsView />;
}

import type { Metadata } from "next";
import { AppFrame } from "@/components/app/AppFrame";

export const metadata: Metadata = {
  title: "Dashboard · Aeon",
  robots: { index: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppFrame>{children}</AppFrame>;
}

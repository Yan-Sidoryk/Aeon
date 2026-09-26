import type { Metadata } from "next";
import { AppFrame } from "@/components/app/AppFrame";

export const metadata: Metadata = {
  title: "Start your free report · Aeon",
  robots: { index: false },
};

export default function StartLayout({ children }: { children: React.ReactNode }) {
  return <AppFrame>{children}</AppFrame>;
}

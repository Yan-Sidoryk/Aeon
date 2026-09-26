import type { Metadata } from "next";
import { StatusBanners } from "@/components/app/AppFrame";

export const metadata: Metadata = {
  title: "Dashboard · Aeon",
  robots: { index: false },
};

/** The dashboard draws its own app chrome (a full-height sidebar), so only the status banners sit above it. */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-offwhite">
      <StatusBanners />
      {children}
    </div>
  );
}

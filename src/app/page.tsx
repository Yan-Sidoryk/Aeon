import Image from "next/image";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { CoverageSection } from "@/components/CoverageSection";
import { FaqSection } from "@/components/FaqSection";
import { FinalCtaSection } from "@/components/FinalCtaSection";
import { GetStartedSection } from "@/components/GetStartedSection";
import { Hero } from "@/components/Hero";
import { PlatformSection } from "@/components/platform/PlatformSection";
import { ResourcesSection } from "@/components/ResourcesSection";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SocialProofSection } from "@/components/SocialProofSection";
import { WhySection } from "@/components/WhySection";

export default function Home() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <div className="pt-[37px]">
        {/* Fixed full-bleed photo behind the page; only visible through the coverage section gap. */}
        <div className="fixed inset-0 -z-20 h-full w-full max-md:min-h-screen">
          <Image
            src="/images/photos/pharmacy-night.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <main className="relative z-10">
          <Hero />
          <PlatformSection />
          <WhySection />
          <CoverageSection />
          <SocialProofSection />
          <GetStartedSection />
          <FaqSection />
          <FinalCtaSection />
          <ResourcesSection />
        </main>
        <SiteFooter />
      </div>
    </>
  );
}

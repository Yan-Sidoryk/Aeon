import { AnnouncementBar } from "@/components/AnnouncementBar";
import { CoverageSection } from "@/components/CoverageSection";
import { FaqSection } from "@/components/FaqSection";
import { FinalCtaSection } from "@/components/FinalCtaSection";
import { GetStartedSection } from "@/components/GetStartedSection";
import { Hero } from "@/components/Hero";
import { PlatformSection } from "@/components/platform/PlatformSection";
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
        <main className="relative z-10">
          <Hero />
          <PlatformSection />
          <WhySection />
          <CoverageSection />
          <SocialProofSection />
          <GetStartedSection />
          <FaqSection />
          <FinalCtaSection />
        </main>
        <SiteFooter />
      </div>
    </>
  );
}

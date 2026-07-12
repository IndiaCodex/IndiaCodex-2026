import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { ProcessScrolly } from "@/components/landing/ProcessScrolly";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { TiersSection } from "@/components/landing/TiersSection";
import { BuiltOnSection } from "@/components/landing/BuiltOnSection";
import { FinalCta } from "@/components/landing/FinalCta";
import { LandingFooter } from "@/components/landing/LandingFooter";

/**
 * Marketing landing. The borrow app lives at /app — this page's one job is
 * to explain the self-repaying loan lifecycle and hand visitors off to it.
 */
export default function LandingPage() {
  return (
    <>
      <LandingNav />
      <main>
        <Hero />
        <ProcessScrolly />
        <ComparisonSection />
        <TiersSection />
        <BuiltOnSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </>
  );
}

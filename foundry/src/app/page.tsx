import "@/styles/landing.css";
import Hero from "@/components/landing/hero";
import Features from "@/components/landing/features";
import HowItWorks from "@/components/landing/how-it-works";
import CTA from "@/components/landing/cta";

export default function Home() {
  return (
    <div className="foundry-landing page-gradient">
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
    </div>
  );
}
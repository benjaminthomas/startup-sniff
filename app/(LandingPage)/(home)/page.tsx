"use client";

import { useRouter } from "next/navigation";
import { Navigation } from "@/components/features/landing/navigation";
import { HeroSection } from "@/components/features/landing/hero-section";
import { FeaturesSection } from "@/components/features/landing/features-section";
import { PricingSection } from "@/components/features/landing/pricing-section";
import { CTASection } from "@/components/features/landing/cta-section";
import { Footer } from "@/components/features/landing/footer";
import { redirectToAuth } from "@/lib/utils/navigation";

export default function HomePage() {
  const router = useRouter();

  const handlePlanSelect = (planId: string, isFree: boolean) => {
    redirectToAuth(router, planId, isFree);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* Spacer for fixed nav */}
      <div className="h-16"></div>

      <HeroSection />
      <FeaturesSection />
      <PricingSection onPlanSelect={handlePlanSelect} />
      <CTASection />
      <Footer />
    </div>
  );
}
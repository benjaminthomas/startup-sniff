"use client";

import { useRouter } from "next/navigation";
import { Navigation, HeroSection, FeaturesSection, PricingSection, CTASection, Footer } from "@/modules/marketing";
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

"use client";

import { useRouter } from "next/navigation";
import {
  Navigation,
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  BenefitsSection,
  UseCasesSection,
  SocialProofSection,
  PricingSection,
  CTASection,
  Footer
} from "@/modules/marketing";
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

      {/* Hero - First impression */}
      <HeroSection />

      {/* Features - What we offer */}
      <FeaturesSection />

      {/* How It Works - Step-by-step process */}
      <HowItWorksSection />

      {/* Benefits - Why choose us */}
      <BenefitsSection />

      {/* Use Cases - Who it's for */}
      <UseCasesSection />

      {/* Social Proof - Trust signals */}
      <SocialProofSection />

      {/* Pricing - Plans and pricing */}
      <PricingSection onPlanSelect={handlePlanSelect} />

      {/* Final CTA - Last chance to convert */}
      <CTASection />

      {/* Footer - Additional info */}
      <Footer />
    </div>
  );
}

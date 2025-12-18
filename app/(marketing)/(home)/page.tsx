"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
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
} from "@/components/marketing";
import { redirectToAuth } from "@/lib/utils/navigation";

export default function HomePage() {
  const router = useRouter();

  const handlePlanSelect = (planId: string, isFree: boolean) => {
    redirectToAuth(router, planId, isFree);
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://startupsniff.com";

  // JSON-LD structured data for better SEO
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "StartupSniff",
    "url": appUrl,
    "logo": `${appUrl}/icon`,
    "description": "AI-powered platform for discovering and validating startup ideas using market research and Reddit trend analysis",
    "sameAs": [
      "https://twitter.com/startupsniff",
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Support",
      "email": "support@startupsniff.com"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "StartupSniff",
    "url": appUrl,
    "description": "Discover trending startup opportunities and validate ideas using AI-powered market research and Reddit trend analysis",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${appUrl}/dashboard/ideas?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "StartupSniff",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": [
      {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "INR",
        "name": "Free Plan",
        "description": "3 AI-generated ideas, 1 validation, 2 content generations per month"
      },
      {
        "@type": "Offer",
        "price": "2900",
        "priceCurrency": "INR",
        "name": "Pro Monthly",
        "description": "Unlimited AI-generated ideas, validations, and content generations"
      },
      {
        "@type": "Offer",
        "price": "29000",
        "priceCurrency": "INR",
        "name": "Pro Yearly",
        "description": "Unlimited AI-generated ideas, validations, and content generations - Save 17%"
      }
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "127",
      "bestRating": "5",
      "worstRating": "1"
    },
    "description": "AI-powered platform for generating startup ideas, validating market opportunities, and creating content using Reddit trend analysis"
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Script
        id="software-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />

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
    </>
  );
}

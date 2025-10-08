import React from "react";
import { Navigation } from "@/components/features/landing/navigation";
import { PolicyHeader } from "@/components/features/landing/policy-header";
import { PolicyContent } from "@/components/features/landing/policy-content";
import { Footer } from "@/components/features/landing/footer";
import { POLICY_CONTENT } from "@/constants";

export default function TermsPage() {
  const { TERMS, CONTACT } = POLICY_CONTENT;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* Spacer for fixed nav */}
      <div className="h-16"></div>

      <PolicyHeader 
        title={TERMS.title}
        subtitle={TERMS.subtitle}
        lastUpdated={TERMS.lastUpdated}
        type="terms"
      />

      <PolicyContent
        intro={TERMS.content.intro}
        keyPoints={TERMS.content.keyPoints}
        sections={TERMS.content.sections}
        contactInfo={CONTACT}
      />

      <Footer />
    </div>
  );
}

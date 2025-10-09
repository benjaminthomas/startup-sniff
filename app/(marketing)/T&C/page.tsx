import React from "react";
import { Navigation, PolicyHeader, PolicyContent, Footer } from "@/modules/marketing";
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

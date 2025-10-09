import React from "react";
import { Navigation, PolicyHeader, PolicyContent, Footer } from "@/modules/marketing";
import { POLICY_CONTENT } from "@/constants";

export default function PrivacyPage() {
  const { PRIVACY, CONTACT } = POLICY_CONTENT;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* Spacer for fixed nav */}
      <div className="h-16"></div>

      <PolicyHeader 
        title={PRIVACY.title}
        subtitle={PRIVACY.subtitle}
        lastUpdated={PRIVACY.lastUpdated}
        type="privacy"
      />

      <PolicyContent
        intro={PRIVACY.content.intro}
        highlights={PRIVACY.content.highlights}
        sections={PRIVACY.content.sections}
        contactInfo={CONTACT}
      />

      <Footer />
    </div>
  );
}

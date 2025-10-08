"use client";

import React from "react";
import { Navigation } from "@/components/features/landing/navigation";
import { PageHero } from "@/components/ui/page-hero";
import { ContactInfo } from "@/components/features/contact/contact-info";
import { ContactForm } from "@/components/features/contact/contact-form";
import { ContactFAQ } from "@/components/features/contact/contact-faq";
import { Footer } from "@/components/features/landing/footer";
import { CONTACT_CONTENT } from "@/constants/contact";
import { MessageCircle } from "lucide-react";

export default function ContactPage() {
  const { CONTACT_PAGE } = CONTACT_CONTENT;

  const scrollToForm = () => {
    const formElement = document.getElementById('contact-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* Spacer for fixed nav */}
      <div className="h-16"></div>

      <PageHero
        badge={{
          icon: MessageCircle,
          text: "Get Support"
        }}
        title={CONTACT_PAGE.title}
        subtitle={CONTACT_PAGE.subtitle}
        description={CONTACT_PAGE.description}
        actions={[
          {
            label: "Start Conversation",
            href: "#contact-form",
            onClick: scrollToForm
          }
        ]}
        stats={[
          { value: 24, suffix: "h", label: "Response Time" },
          { value: 99, suffix: "%", label: "Satisfaction" },
          { value: 24, suffix: "/7", label: "Available" }
        ]}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div className="space-y-6">
            <ContactForm
              title={CONTACT_PAGE.form.title}
              subtitle={CONTACT_PAGE.form.subtitle}
            />
          </div>
          
          <ContactInfo
            methods={CONTACT_PAGE.methods}
          />
        </div>
      </div>

      {CONTACT_PAGE.faq && <ContactFAQ faqs={CONTACT_PAGE.faq.items} />}

      <Footer />
    </div>
  );
}
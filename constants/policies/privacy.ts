import type { PolicyPage } from '@/types/policy';

export const PRIVACY_POLICY: PolicyPage = {
  title: "Privacy Policy",
  subtitle: "How we collect, use, and protect your information",
  lastUpdated: "October 8, 2024",
  content: {
    intro: [
      "We at StartupSniff respect your privacy. This policy explains how we collect, use, and protect your information when you use our AI-powered startup discovery platform and related services.",
      "Your trust is fundamental to our mission of helping entrepreneurs discover and validate their next business opportunity."
    ],
    highlights: [
      {
        title: "Information Collected",
        description: [
          "Personal information: Name, email, and account preferences",
          "Usage data: Platform interactions and feature usage patterns",
          "Content data: Startup ideas and validations you create through our platform"
        ]
      },
      {
        title: "Use of Information",
        description: [
          "Deliver personalized AI services and recommendations",
          "Process payments and manage your subscription",
          "Improve our platform and develop new features",
          "Provide customer support and communicate updates"
        ]
      },
      {
        title: "Sharing Information",
        description: "We only share your information with essential service providers, payment processors, or as legally required. We never sell your personal data."
      },
      {
        title: "Data Security",
        description: [
          "Enterprise-grade encryption for data in transit and at rest",
          "Regular security audits and penetration testing",
          "Strict access controls and employee training",
          "SOC 2 Type II compliance standards"
        ]
      },
      {
        title: "Data Retention",
        description: "We retain your data only as long as necessary for service delivery, legal compliance, or as specified in your account settings."
      },
      {
        title: "Your Rights",
        description: [
          "Access and download your personal data",
          "Correct inaccurate information",
          "Delete your account and associated data",
          "Withdraw consent for data processing",
          "File complaints with data protection authorities"
        ]
      }
    ],
    sections: [
      {
        title: "Information We Collect",
        content: [
          "We collect information you provide directly when you create an account, use our AI services, or contact our support team. This includes your name, email address, and account preferences.",
          "We also collect usage data to understand how you interact with our platform, including the startup ideas you generate, validations you request, and features you use most frequently.",
          "This data helps us provide personalized AI recommendations and improve our service quality."
        ]
      },
      {
        title: "How We Use Your Information",
        content: [
          "Your information enables us to provide personalized AI-generated startup ideas based on your interests and market trends.",
          "We use your data to validate market opportunities, analyze industry trends, and process subscription payments securely.",
          "Aggregated, anonymized data helps us enhance our AI models and develop new features that benefit all users."
        ]
      },
      {
        title: "Data Security & Protection",
        content: [
          "We implement industry-leading security measures including end-to-end encryption, secure data centers, and regular security audits.",
          "Your startup ideas and business data are treated with the highest level of confidentiality and are never shared with third parties.",
          "Our security team continuously monitors for threats and maintains compliance with international data protection standards."
        ]
      },
      {
        title: "International Data Transfers",
        content: "If you're located outside our primary data centers, your information may be transferred internationally. We ensure all transfers comply with applicable data protection laws and use appropriate safeguards."
      },
      {
        title: "Changes to This Policy",
        content: [
          "We may update this privacy policy to reflect changes in our practices or legal requirements.",
          "We'll notify you of significant changes via email or platform notifications.",
          "Continued use of our services after changes constitutes acceptance of the updated policy."
        ]
      }
    ]
  }
};
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://startupsniff.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "StartupSniff - AI-Powered Startup Ideas & Validation",
    template: "%s | StartupSniff",
  },
  description: "Discover trending startup opportunities and validate ideas using AI-powered market research and Reddit trend analysis. Generate unlimited startup ideas, validate markets, and create content with AI.",
  keywords: [
    "startup ideas",
    "business ideas",
    "AI startup validation",
    "market research",
    "reddit trends",
    "startup opportunity",
    "idea validation",
    "AI market analysis",
    "startup generator",
    "business validation",
    "trend analysis",
    "startup tools",
    "entrepreneur tools",
    "AI content generation",
  ],
  authors: [{ name: "StartupSniff Team", url: appUrl }],
  creator: "StartupSniff",
  publisher: "StartupSniff",
  applicationName: "StartupSniff",
  category: "Business Tools",
  classification: "SaaS Platform",

  // Robots and Indexing
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Open Graph
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    title: "StartupSniff - AI-Powered Startup Ideas & Validation",
    description: "Discover trending startup opportunities and validate ideas using AI-powered market research and Reddit trend analysis. Generate unlimited startup ideas, validate markets, and create content with AI.",
    siteName: "StartupSniff",
    images: [
      {
        url: `${appUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "StartupSniff - AI-Powered Startup Ideas & Validation",
      },
    ],
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    site: "@startupsniff",
    creator: "@startupsniff",
    title: "StartupSniff - AI-Powered Startup Ideas & Validation",
    description: "Discover trending startup opportunities and validate ideas using AI-powered market research and Reddit trend analysis.",
    images: [`${appUrl}/twitter-image`],
  },

  // Verification
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    // Add other verification codes as needed
  },

  // Alternate URLs
  alternates: {
    canonical: appUrl,
  },

  // Icons
  icons: {
    icon: [
      { url: "/icon", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/icon", sizes: "32x32", type: "image/png" },
    ],
  },

  // Manifest
  manifest: "/manifest.json",

  // Additional metadata
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'StartupSniff',
  },
};

import { Toaster } from '@/components/ui/sonner';
import { ProgressBar } from '@/components/ui/progress-bar';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background text-foreground" suppressHydrationWarning>
        <ProgressBar />
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}

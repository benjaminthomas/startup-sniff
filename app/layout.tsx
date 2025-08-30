import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StartupSniff - AI-Powered Startup Ideas & Validation",
  description: "Discover trending startup opportunities and validate ideas using AI-powered market research and Reddit trend analysis.",
  keywords: ["startup", "ideas", "validation", "AI", "reddit", "trends", "market research"],
  authors: [{ name: "StartupSniff Team" }],
  creator: "StartupSniff",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    title: "StartupSniff - AI-Powered Startup Ideas & Validation",
    description: "Discover trending startup opportunities and validate ideas using AI-powered market research and Reddit trend analysis.",
    siteName: "StartupSniff",
  },
  twitter: {
    card: "summary_large_image",
    title: "StartupSniff - AI-Powered Startup Ideas & Validation",
    description: "Discover trending startup opportunities and validate ideas using AI-powered market research and Reddit trend analysis.",
    creator: "@startupsniff",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ProgressBar />
        {children}
        <Toaster />
      </body>
    </html>
  );
}

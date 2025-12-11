"use client";

import Link from "next/link";
import { Twitter, Github, Linkedin, Mail, ArrowRight, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-lg glow-purple">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-2xl text-gradient">
                StartupSniff
              </span>
            </div>
            <p className="text-muted-foreground max-w-md leading-relaxed">
              Empowering entrepreneurs with AI-driven insights to discover and
              validate the next generation of business opportunities. Transform
              your ideas into successful ventures with data-backed market research.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center hover:bg-primary/20 hover:scale-110 transition-all duration-200 cursor-pointer group">
                <Twitter className="w-5 h-5 text-primary group-hover:text-primary" />
              </Link>
              <Link href="#" className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center hover:bg-primary/20 hover:scale-110 transition-all duration-200 cursor-pointer group">
                <Github className="w-5 h-5 text-primary group-hover:text-primary" />
              </Link>
              <Link href="#" className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center hover:bg-primary/20 hover:scale-110 transition-all duration-200 cursor-pointer group">
                <Linkedin className="w-5 h-5 text-primary group-hover:text-primary" />
              </Link>
              <Link href="mailto:hello@startupsniff.com" className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center hover:bg-primary/20 hover:scale-110 transition-all duration-200 cursor-pointer group">
                <Mail className="w-5 h-5 text-primary group-hover:text-primary" />
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Product</h3>
            <div className="space-y-3">
              <Link href="#features" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
                Features
                <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link href="#pricing" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
                Pricing
                <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link href="/dashboard" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
                Dashboard
                <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Legal</h3>
            <div className="space-y-3">
              <Link href="/privacy_policy" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
                Privacy Policy
                <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link href="/T&C" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
                Terms of Service
                <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link href="/refund_policy" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
                Refund Policy
                <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border/40">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground">
              © 2024 StartupSniff. All rights reserved. Built with ❤️ for entrepreneurs.
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <div className="text-xs text-muted-foreground">
                Made with AI-powered insights
              </div>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
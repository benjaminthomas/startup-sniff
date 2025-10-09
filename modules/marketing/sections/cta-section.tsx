"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { redirectToAuth } from "@/lib/utils/navigation";

interface CTASectionProps {
  title?: string;
  subtitle?: string;
  primaryActionText?: string;
  secondaryActionText?: string;
}

export function CTASection({
  title = "Ready to validate your next startup idea?",
  subtitle = "Get AI-powered insights, market validation, and content generation tools in one platform.",
  primaryActionText = "Start for free",
  secondaryActionText = "View pricing",
}: CTASectionProps) {
  const router = useRouter();

  const handlePrimaryAction = () => {
    redirectToAuth(router, "free", true);
  };

  const handleSecondaryAction = () => {
    router.push("/#pricing");
  };

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3 w-3" />
            Startup-ready toolkit
          </span>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {subtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-3"
        >
          <Button size="lg" onClick={handlePrimaryAction}>
            {primaryActionText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg" onClick={handleSecondaryAction}>
            {secondaryActionText}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 text-primary" />
            Trusted by 1,200+ founders
          </div>
          <div className="hidden h-4 w-px bg-border sm:block" />
          <div className="text-sm text-muted-foreground">
            Free forever plan &bull; No credit card required
          </div>
        </motion.div>
      </div>

      <div className="absolute inset-0 bg-primary/5 blur-3xl" />
    </section>
  );
}

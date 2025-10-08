"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="bg-gradient-to-b from-secondary/30 to-accent/20 border-t border-border/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Ready to Find Your Next Big Idea?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of entrepreneurs using AI to discover and validate
            startup opportunities from Reddit trends
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              asChild
              className="text-lg px-8 py-4 gradient-primary glow-purple"
            >
              <Link href="/auth/signup">
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="text-lg px-8 py-4 border-primary/30 hover:bg-primary/10"
            >
              <Link href="#demo">Schedule Demo</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground/80 mt-6">
            No credit card required • 3 free ideas • Start in 2 minutes
          </p>
        </motion.div>
      </div>
    </section>
  );
}
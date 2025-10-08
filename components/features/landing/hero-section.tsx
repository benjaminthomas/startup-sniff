"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HeroHighlight,
  Highlight,
} from "@/components/ui/aceternity/hero-highlight";
import { TextGenerateEffect } from "@/components/ui/aceternity/text-generate-effect";
import { AnimatedCounter } from "@/components/ui/aceternity/animated-counter";
import { STATS } from "@/lib/data/landing";

export function HeroSection() {
  return (
    <HeroHighlight>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Badge
              variant="outline"
              className="mb-8 bg-secondary border-primary/30 text-primary"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              AI-Powered Startup Discovery
            </Badge>
          </motion.div>

          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <TextGenerateEffect
                words="Discover Your Next Million-Dollar Startup Idea"
                className="text-5xl md:text-7xl font-bold text-foreground"
              />
            </h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed"
          >
            Use AI to{" "}
            <Highlight className="text-foreground bg-gradient-to-r from-secondary to-accent">
              analyze Reddit trends
            </Highlight>
            , validate market opportunities, and generate startup ideas that
            actually solve real problems.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
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
              <Link href="#demo">Watch Demo</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
          >
            {STATS.map((stat, index) => (
              <div key={index} className="space-y-2">
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  className="text-4xl md:text-5xl font-bold text-foreground"
                />
                <div className="text-muted-foreground text-lg">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </HeroHighlight>
  );
}
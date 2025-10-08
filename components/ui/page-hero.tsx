"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HeroHighlight,
  Highlight,
} from "@/components/ui/aceternity/hero-highlight";
import { TextGenerateEffect } from "@/components/ui/aceternity/text-generate-effect";
import { AnimatedCounter } from "@/components/ui/aceternity/animated-counter";

interface HeroAction {
  label: string;
  href: string;
  variant?: "default" | "outline";
  onClick?: () => void;
}

interface HeroStat {
  value: number;
  suffix?: string;
  label: string;
}

interface PageHeroProps {
  badge?: {
    icon?: LucideIcon;
    text: string;
  };
  title: string;
  useTextGenerate?: boolean;
  subtitle: string | React.ReactNode;
  description?: string | string[];
  actions?: HeroAction[];
  stats?: HeroStat[];
  className?: string;
}

// Helper component to render content that can be string or array
function DescriptionRenderer({ description }: { description: string | string[] }) {
  if (Array.isArray(description)) {
    return (
      <div className="space-y-4">
        {description.map((paragraph, index) => (
          <p key={index} className="text-lg text-muted-foreground leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    );
  }
  return (
    <p className="text-lg text-muted-foreground leading-relaxed">
      {description}
    </p>
  );
}

export function PageHero({
  badge,
  title,
  useTextGenerate = false,
  subtitle,
  description,
  actions = [],
  stats = [],
  className = "",
}: PageHeroProps) {
  return (
    <HeroHighlight className={className}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          {badge && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <Badge
                variant="outline"
                className="mb-8 bg-secondary border-primary/30 text-primary"
              >
                {badge.icon && <badge.icon className="w-3 h-3 mr-1" />}
                {badge.text}
              </Badge>
            </motion.div>
          )}

          {/* Title */}
          <div className="mb-8">
            {useTextGenerate ? (
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                <TextGenerateEffect
                  words={title}
                  className="text-5xl md:text-7xl font-bold text-foreground"
                />
              </h1>
            ) : (
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-foreground"
              >
                {title}
              </motion.h1>
            )}
          </div>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: useTextGenerate ? 1 : 0.9 }}
            className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed"
          >
            {subtitle}
          </motion.div>

          {/* Description */}
          {description && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: useTextGenerate ? 1.1 : 1 }}
              className="max-w-3xl mx-auto mb-8"
            >
              <DescriptionRenderer description={description} />
            </motion.div>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: useTextGenerate ? 1.2 : 1.1 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              {actions.map((action, index) => (
                <Button
                  key={index}
                  size="lg"
                  variant={action.variant || "default"}
                  asChild={!action.onClick}
                  onClick={action.onClick}
                  className={`text-lg px-8 py-4 ${
                    action.variant === "outline"
                      ? "border-primary/30 hover:bg-primary/10"
                      : "gradient-primary glow-purple"
                  }`}
                >
                  {action.onClick ? (
                    <span className="flex items-center">
                      {action.label}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </span>
                  ) : (
                    <Link href={action.href} className="flex items-center">
                      {action.label}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  )}
                </Button>
              ))}
            </motion.div>
          )}

          {/* Stats */}
          {stats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: useTextGenerate ? 1.4 : 1.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
            >
              {stats.map((stat, index) => (
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
          )}
        </div>
      </motion.div>
    </HeroHighlight>
  );
}
"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, RefreshCw } from "lucide-react";

interface PolicyHeaderProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  type: "privacy" | "refund" | "terms";
}

const iconMap = {
  privacy: Shield,
  refund: RefreshCw,
  terms: FileText,
};

export function PolicyHeader({ title, subtitle, lastUpdated, type }: PolicyHeaderProps) {
  const Icon = iconMap[type];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 relative"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <div className="w-16 h-16 mx-auto gradient-primary rounded-2xl flex items-center justify-center shadow-lg glow-purple mb-6">
              <Icon className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Badge
              variant="outline"
              className="mb-6 bg-secondary/80 border-primary/30 text-primary"
            >
              Legal Information
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-gradient"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            {subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-sm text-muted-foreground"
          >
            Last updated: {lastUpdated}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
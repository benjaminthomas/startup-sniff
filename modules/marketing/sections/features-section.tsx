"use client";

import { motion } from "framer-motion";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { FEATURES, FEATURE_DEMOS } from "@/lib/data/landing";

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="bg-gradient-to-b from-background to-muted/20"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
            Everything You Need to Launch Smart
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            From Reddit trend analysis to market validation, we&apos;ve got
            your startup journey covered
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <BentoGrid className="max-w-6xl mx-auto">
            {FEATURES.map((feature, index) => {
              // Define the layout pattern:
              // Row 1: [Item 1 - 2 rows] [Item 2 - spans 3 columns]
              // Row 2: [Item 1 continues] [Item 3 - 1 column] [Item 4 - spans 2 columns]
              // Row 3: [Item 5 - spans 2 columns] [Item 6 - spans 2 columns]
              let className = "";
              if (index === 0) {
                className = "lg:row-span-2 lg:col-span-2"; // Item 1 spans 2 rows and 2 columns
              } else if (index === 1) {
                className = "lg:col-span-4"; // Item 2 spans 4 columns
              } else if (index === 2 || index === 3) {
                className = "lg:col-span-2"; // Items 3 and 4 span 2 columns each (Market Validation & Content Generation) - now equal
              } else if (index === 4 || index === 5) {
                className = "lg:col-span-3"; // Items 5 and 6 span 3 columns each
              }

              return (
                <BentoGridItem
                  key={feature.title}
                  title={feature.title}
                  description={feature.description}
                  header={
                    <div className={`w-full bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-3 text-xs overflow-hidden border border-border/20 ${
                      index === 0 || index === 2 ? "h-32" : "h-20"
                    }`}>
                      {FEATURE_DEMOS[feature.title as keyof typeof FEATURE_DEMOS]}
                    </div>
                  }
                  icon={
                    <div
                      className={`w-8 h-8 bg-gradient-to-r ${feature.gradient} rounded-lg flex items-center justify-center glow-purple flex-shrink-0`}
                    >
                      <feature.icon className="h-4 w-4 text-white" />
                    </div>
                  }
                  className={className}
                />
              );
            })}
          </BentoGrid>
        </motion.div>
      </div>
    </section>
  );
}
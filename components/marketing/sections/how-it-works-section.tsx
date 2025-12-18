"use client";

import { motion } from "framer-motion";
import {
  Search,
  Sparkles,
  BarChart3,
  Rocket,
  ArrowRight,
  TrendingUp,
  Target,
  CheckCircle
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Discover Opportunities",
    description: "Our AI scans thousands of Reddit posts daily across 15+ entrepreneurial subreddits to find real problems people are discussing.",
    details: [
      "Automated Reddit monitoring",
      "Pain point extraction",
      "Trend detection algorithms"
    ],
    color: "from-blue-500 to-cyan-500",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "AI-Powered Analysis",
    description: "Advanced AI evaluates market demand, competition level, and commercial viability to score each opportunity.",
    details: [
      "GPT-4 powered insights",
      "Market sizing analysis",
      "Competition assessment"
    ],
    color: "from-purple-500 to-pink-500",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Validate & Research",
    description: "Deep-dive into each opportunity with detailed market analysis, target audience insights, and competitive landscape.",
    details: [
      "ICP identification",
      "Revenue model suggestions",
      "Go-to-market strategies"
    ],
    color: "from-green-500 to-emerald-500",
  },
  {
    number: "04",
    icon: Rocket,
    title: "Launch with Confidence",
    description: "Generate content, export research, and start building your startup with validated ideas backed by real data.",
    details: [
      "Content generation",
      "PDF/Notion export",
      "Implementation roadmap"
    ],
    color: "from-orange-500 to-red-500",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-primary mb-4">
            <TrendingUp className="h-4 w-4" />
            Simple Process
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
            From Problem to Startup in 4 Steps
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Our AI-powered platform transforms Reddit insights into validated startup ideas you can build with confidence
          </p>
        </motion.div>

        {/* Steps */}
        <div className="max-w-6xl mx-auto space-y-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute left-1/2 top-full h-12 w-0.5 bg-gradient-to-b from-primary/50 to-transparent -translate-x-1/2 z-0" />
              )}

              <div className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-12 items-center`}>
                {/* Icon & Number */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    {/* Glow Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${step.color} rounded-2xl blur-xl opacity-30`} />

                    {/* Main Icon Container */}
                    <div className={`relative w-32 h-32 bg-gradient-to-br ${step.color} rounded-2xl flex flex-col items-center justify-center shadow-xl`}>
                      <step.icon className="h-12 w-12 text-white mb-2" />
                      <span className="text-white/60 font-bold text-sm">{step.number}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-2xl md:text-3xl font-bold mb-3 flex items-center gap-3 justify-center lg:justify-start">
                    {step.title}
                    <ArrowRight className="h-6 w-6 text-primary hidden lg:block" />
                  </h3>
                  <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Details */}
                  <div className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-start gap-2 justify-center lg:justify-start">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual Preview */}
                <div className={`flex-shrink-0 w-full lg:w-80 ${index % 2 === 0 ? 'lg:order-last' : 'lg:order-first'}`}>
                  <div className="relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-lg">
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg">
                      <Target className="h-4 w-4 text-white" />
                    </div>

                    {/* Step-specific preview content */}
                    {index === 0 && (
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Opportunities</div>
                        <div className="space-y-2">
                          {["r/entrepreneur • Remote team management", "r/startups • API integration tools", "r/SaaS • Customer onboarding"].map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg p-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span className="text-foreground/80">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {index === 1 && (
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AI Analysis</div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Commercial Viability</span>
                            <span className="text-sm font-bold text-green-500">87/100</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Market Demand</span>
                            <span className="text-sm font-bold text-green-500">High</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Competition</span>
                            <span className="text-sm font-bold text-yellow-500">Medium</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {index === 2 && (
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Market Insights</div>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <div className="font-semibold mb-1">Target Audience</div>
                            <div className="text-muted-foreground">Tech professionals, 25-40, $75k+</div>
                          </div>
                          <div className="text-sm">
                            <div className="font-semibold mb-1">Market Size (TAM)</div>
                            <div className="text-muted-foreground">$2.3B • Growing 23% YoY</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {index === 3 && (
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ready to Export</div>
                        <div className="space-y-2">
                          {[
                            { name: "Business Plan PDF", status: "Ready" },
                            { name: "Notion Template", status: "Ready" },
                            { name: "Content Calendar", status: "Ready" }
                          ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm bg-muted/50 rounded-lg p-2">
                              <span>{item.name}</span>
                              <span className="text-green-500 font-semibold">{item.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Average time from discovery to validated idea: <strong className="text-foreground">48 hours</strong></span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

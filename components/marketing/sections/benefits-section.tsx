"use client";

import { motion } from "framer-motion";
import {
  Clock,
  DollarSign,
  Shield,
  Zap,
  TrendingUp,
  Users,
  Brain,
  Target,
  LineChart
} from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Save 100+ Hours of Research",
    description: "Skip months of manual Reddit browsing and market research. Our AI does the heavy lifting, analyzing thousands of posts daily.",
    metric: "100+ hrs",
    metricLabel: "Time Saved",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: DollarSign,
    title: "Avoid Costly Mistakes",
    description: "Build what people actually need. Validate demand before investing time and money into the wrong idea.",
    metric: "$50K+",
    metricLabel: "Average Saved",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Brain,
    title: "Data-Driven Decisions",
    description: "Stop guessing. Make informed choices backed by real conversations, trending pain points, and market signals.",
    metric: "87%",
    metricLabel: "Accuracy",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Zap,
    title: "First-Mover Advantage",
    description: "Spot emerging opportunities before they become crowded. Be among the first to solve trending problems.",
    metric: "10K+",
    metricLabel: "Daily Insights",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Target,
    title: "Find Product-Market Fit Faster",
    description: "Start with validated demand. Know exactly who your customers are and what problems they're desperate to solve.",
    metric: "3x",
    metricLabel: "Faster PMF",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: LineChart,
    title: "Built-in Competitive Advantage",
    description: "Access insights your competitors don't have. Our AI uncovers hidden opportunities in niche communities.",
    metric: "15+",
    metricLabel: "Subreddits",
    gradient: "from-teal-500 to-blue-500",
  },
];

const comparisonData = {
  traditional: {
    title: "Traditional Approach",
    icon: Users,
    items: [
      { label: "Time to validate idea", value: "3-6 months", negative: true },
      { label: "Research cost", value: "$10K-$50K", negative: true },
      { label: "Success rate", value: "~10%", negative: true },
      { label: "Market insights", value: "Limited", negative: true },
    ],
  },
  startupSniff: {
    title: "With StartupSniff",
    icon: TrendingUp,
    items: [
      { label: "Time to validate idea", value: "48 hours", negative: false },
      { label: "Research cost", value: "$29/month", negative: false },
      { label: "Success rate", value: "~40%", negative: false },
      { label: "Market insights", value: "Real-time", negative: false },
    ],
  },
};

export function BenefitsSection() {
  return (
    <section id="benefits" className="py-24 bg-gradient-to-b from-muted/20 via-background to-muted/20">
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
            <Shield className="h-4 w-4" />
            Why StartupSniff?
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
            Build Smarter, Not Harder
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Join hundreds of founders who are using AI-powered insights to build startups that actually solve real problems
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              {/* Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />

              {/* Card */}
              <div className="relative h-full bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300">
                {/* Icon */}
                <div className={`w-14 h-14 bg-gradient-to-br ${benefit.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                  <benefit.icon className="h-7 w-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {benefit.description}
                </p>

                {/* Metric */}
                <div className="flex items-baseline gap-2 mt-auto pt-4 border-t border-border/50">
                  <span className={`text-3xl font-bold bg-gradient-to-r ${benefit.gradient} bg-clip-text text-transparent`}>
                    {benefit.metric}
                  </span>
                  <span className="text-sm text-muted-foreground">{benefit.metricLabel}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comparison Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              The Smart Way to Validate Ideas
            </h3>
            <p className="text-lg text-muted-foreground">
              See how StartupSniff compares to traditional market research methods
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Traditional Approach */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl blur-xl opacity-10" />
              <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                    <comparisonData.traditional.icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-xl font-bold">{comparisonData.traditional.title}</h4>
                </div>

                <div className="space-y-4">
                  {comparisonData.traditional.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center pb-3 border-b border-border/50 last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="font-semibold text-red-500">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* With StartupSniff */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl blur-xl opacity-20" />
              <div className="relative bg-card/80 backdrop-blur-sm border-2 border-primary/50 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                    <comparisonData.startupSniff.icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-xl font-bold">{comparisonData.startupSniff.title}</h4>
                </div>

                <div className="space-y-4">
                  {comparisonData.startupSniff.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center pb-3 border-b border-border/50 last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="font-semibold text-green-500">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Badge */}
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/20 px-4 py-2 text-sm font-semibold text-green-500">
                    <Zap className="h-4 w-4" />
                    4x Faster • 10x Cheaper
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

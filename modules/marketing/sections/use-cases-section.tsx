"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  Code,
  Rocket,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const useCases = [
  {
    icon: Rocket,
    persona: "First-Time Founders",
    title: "Find Your First Winning Idea",
    problem: "Not sure where to start or what problem to solve",
    solution: "Discover validated problems with built-in demand from real Reddit conversations",
    results: [
      "Skip idea validation paralysis",
      "Start with proven demand",
      "Understand your target customers"
    ],
    example: {
      before: "\"I want to start a startup but don't know what to build\"",
      after: "\"Found 3 validated ideas in SaaS tools niche with $2M+ TAM each\""
    },
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Code,
    persona: "Solo Developers",
    title: "Build What People Actually Need",
    problem: "Built products nobody wanted because you didn't validate first",
    solution: "Validate demand before writing a single line of code using real user feedback",
    results: [
      "Validate before you build",
      "Real problem discovery",
      "Technical feasibility insights"
    ],
    example: {
      before: "\"Spent 6 months building an app with zero users\"",
      after: "\"Validated demand in 48 hours, pre-sold before launch\""
    },
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Briefcase,
    persona: "Serial Entrepreneurs",
    title: "Scale Your Idea Generation",
    problem: "Need to evaluate multiple opportunities quickly to find the next big thing",
    solution: "Analyze hundreds of opportunities simultaneously with AI-powered scoring",
    results: [
      "Evaluate 10x more ideas",
      "Data-driven prioritization",
      "Faster decision making"
    ],
    example: {
      before: "\"Can only evaluate 2-3 ideas per month manually\"",
      after: "\"Now analyzing 50+ opportunities monthly, found 2 winners\""
    },
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Users,
    persona: "Product Managers",
    title: "Discover Feature Ideas & Pain Points",
    problem: "Struggling to prioritize roadmap based on real user needs",
    solution: "Find recurring pain points and feature requests from your target audience",
    results: [
      "Evidence-based roadmap",
      "User voice insights",
      "Competitive intelligence"
    ],
    example: {
      before: "\"Guessing what features users want most\"",
      after: "\"Built top 3 requested features, 40% increase in engagement\""
    },
    gradient: "from-green-500 to-emerald-500",
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="py-24 bg-gradient-to-b from-background to-muted/20">
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
            <Briefcase className="h-4 w-4" />
            Real Use Cases
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
            Built for Every Stage of Your Journey
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Whether you're just starting out or scaling your next venture, StartupSniff adapts to your needs
          </p>
        </motion.div>

        {/* Use Cases Grid */}
        <div className="max-w-7xl mx-auto space-y-12">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.persona}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              {/* Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${useCase.gradient} rounded-3xl blur-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

              <div className={`relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl overflow-hidden hover:border-primary/30 transition-all duration-300 ${
                index % 2 === 0 ? 'lg:pr-80' : 'lg:pl-80'
              }`}>
                <div className="p-8 lg:p-12">
                  {/* Persona Badge */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${useCase.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <useCase.icon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground font-medium">{useCase.persona}</div>
                      <h3 className="text-2xl font-bold">{useCase.title}</h3>
                    </div>
                  </div>

                  {/* Problem & Solution */}
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="text-sm font-semibold text-red-500 mb-2 uppercase tracking-wide">Challenge</div>
                      <p className="text-muted-foreground">{useCase.problem}</p>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-green-500 mb-2 uppercase tracking-wide">Solution</div>
                      <p className="text-muted-foreground">{useCase.solution}</p>
                    </div>
                  </div>

                  {/* Results */}
                  <div className="mb-6">
                    <div className="text-sm font-semibold mb-3 text-foreground uppercase tracking-wide">Key Results</div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {useCase.results.map((result, resultIndex) => (
                        <div key={resultIndex} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{result}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Before/After */}
                  <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-xs font-semibold text-red-500 mb-2 uppercase tracking-wide">Before</div>
                        <p className="text-sm italic text-muted-foreground">
                          {useCase.example.before}
                        </p>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-green-500 mb-2 uppercase tracking-wide flex items-center gap-2">
                          After <ArrowRight className="h-3 w-3" />
                        </div>
                        <p className="text-sm italic font-medium">
                          {useCase.example.after}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Side Image/Visual - Positioned Absolutely */}
                <div className={`hidden lg:block absolute top-0 ${index % 2 === 0 ? 'right-0' : 'left-0'} w-80 h-full`}>
                  <div className="relative w-full h-full">
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-${index % 2 === 0 ? 'l' : 'r'} from-card/0 via-card/50 to-card z-10`} />

                    {/* Visual Content */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${useCase.gradient} opacity-10`} />
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                      <div className="text-center">
                        <TrendingUp className="h-20 w-20 text-primary/30 mx-auto mb-4" />
                        <div className={`text-4xl font-bold bg-gradient-to-br ${useCase.gradient} bg-clip-text text-transparent`}>
                          {index === 0 && "3 Days"}
                          {index === 1 && "48 Hours"}
                          {index === 2 && "50+ Ideas"}
                          {index === 3 && "40% Growth"}
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          {index === 0 && "Average Time to First Idea"}
                          {index === 1 && "Validation Speed"}
                          {index === 2 && "Monthly Analysis"}
                          {index === 3 && "Engagement Increase"}
                        </div>
                      </div>
                    </div>
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
          <p className="text-lg text-muted-foreground mb-6">
            Ready to see which use case fits you best?
          </p>
          <Button size="lg" asChild className="gradient-primary">
            <Link href="/auth/signup">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

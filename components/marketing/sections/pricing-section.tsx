"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PRICING_PLANS } from "@/constants";

interface PricingSectionProps {
  onPlanSelect: (planId: string, isFree: boolean) => void;
}

export function PricingSection({ onPlanSelect }: PricingSectionProps) {
  return (
    <section
      className="bg-gradient-to-b from-muted/20 to-background"
      id="pricing"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-[#2D6EF7] to-[#1E5EE8] bg-clip-text text-transparent">
            Choose Your Startup Discovery Plan
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get unlimited access to AI-powered startup idea generation and
            market validation
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PRICING_PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card
                className={`relative h-full ${
                  plan.popular
                    ? "border-[#2D6EF7] shadow-[0_4px_12px_rgba(45,110,247,0.2)]"
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-[#2D6EF7] to-[#1E5EE8] text-white px-3 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold">
                    {plan.name}
                  </CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold bg-gradient-to-r from-[#2D6EF7] to-[#1E5EE8] bg-clip-text text-transparent">
                      {plan.price === 0 ? "Free" : `₹${plan.price}`}
                    </span>
                    <span className="text-muted-foreground">
                      /
                      {plan.billingCycle ??
                        (plan.price === 0 ? "free" : "month")}
                    </span>
                  </div>
                </CardHeader>
                <CardHeader className="pt-0">
                  <Button
                    size="lg"
                    className={`w-full ${
                      plan.popular ? "bg-gradient-to-r from-[#2D6EF7] to-[#1E5EE8] hover:from-[#1E5EE8] hover:to-[#1A4FC4] text-white shadow-lg hover:shadow-[0_4px_12px_rgba(45,110,247,0.3)] transition-all" : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => onPlanSelect(plan.id, plan.price === 0)}
                  >
                    {plan.price === 0 ? "Get Started (Free)" : "Get Started"}
                  </Button>

                  <div className="mt-8 space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center">
                        <Check className="h-5 w-5 text-[#2D6EF7] mr-3 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
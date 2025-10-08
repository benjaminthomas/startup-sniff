"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, Zap, Users } from "lucide-react";

interface ContactInfoProps {
  methods: any[];
}

const features = [
  {
    icon: Clock,
    title: "Quick Response",
    description: "Average response time under 24 hours during business days"
  },
  {
    icon: Shield,
    title: "Secure & Private", 
    description: "Your data is protected with enterprise-grade security"
  },
  {
    icon: Zap,
    title: "Expert Support",
    description: "Get help from our knowledgeable support team"
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Join thousands of satisfied customers"
  }
];

const stats = [
  { label: "Response Time", value: "< 24h" },
  { label: "Satisfaction", value: "99%" },
  { label: "Users Helped", value: "10K+" }
];

export function ContactInfo({ methods }: ContactInfoProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-4"
      >
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
          Support Information
        </Badge>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">We're Here to Help</h2>
          <p className="text-xl text-muted-foreground">
            Our dedicated support team is committed to providing you with the best experience possible.
          </p>
        </div>
      </motion.div>

      {/* Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Support Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center space-y-1">
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="space-y-3"
      >
        <h3 className="text-lg font-semibold">Why Choose Our Support</h3>
        <div className="space-y-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-md flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
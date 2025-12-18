"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowRight } from "lucide-react";

interface ContactHeaderProps {
  title: string;
  subtitle: string;
  description: string | string[];
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

export function ContactHeader({ title, subtitle, description }: ContactHeaderProps) {
  const scrollToForm = () => {
    const formElement = document.getElementById('contact-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center space-y-8"
        >
          {/* Icon and Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="w-16 h-16 mx-auto bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-8 h-8 text-primary-foreground" />
            </div>
            
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              Get Support
            </Badge>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              {title}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium">
              {subtitle}
            </p>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <DescriptionRenderer description={description} />
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <Button
              onClick={scrollToForm}
              size="lg"
              className="group"
            >
              Start Conversation
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Support Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-3 gap-8 pt-8 border-t border-border/50"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">24h</div>
              <div className="text-sm text-muted-foreground">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">99%</div>
              <div className="text-sm text-muted-foreground">Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">24/7</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string | string[];
}

interface ContactFAQProps {
  faqs: FAQItem[];
}

// Helper component to render content that can be string or array
function AnswerRenderer({ answer }: { answer: string | string[] }) {
  if (Array.isArray(answer)) {
    return (
      <div className="space-y-3">
        {answer.map((paragraph, index) => (
          <p key={index} className="text-muted-foreground leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    );
  }
  return <p className="text-muted-foreground leading-relaxed">{answer}</p>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export function ContactFAQ({ faqs }: ContactFAQProps) {
  return (
    <section className="py-16 bg-gradient-to-br from-secondary/20 via-background to-accent/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-primary-foreground" />
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                Frequently Asked Questions
              </Badge>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-4xl font-bold tracking-tight">
                Frequently Asked Questions
              </h2>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Find quick answers to common questions. Can&apos;t find what you&apos;re looking for? 
                <span className="text-primary font-medium"> Reach out to us directly.</span>
              </p>
            </div>
          </motion.div>

          {/* FAQ Accordion */}
          <motion.div variants={itemVariants} className="space-y-4">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border rounded-lg px-6 bg-card shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <AccordionTrigger className="text-left font-medium hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 pt-0">
                    <AnswerRenderer answer={faq.answer} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          {/* CTA */}
          <motion.div
            variants={itemVariants}
            className="p-6 bg-muted rounded-lg border"
          >
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">Still have questions?</h3>
              <p className="text-muted-foreground">
                Our support team is here to help you get the answers you need.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="#contact-form"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Send us a message
                </a>
                <a
                  href="mailto:support@startup-sniff.com"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-input bg-background hover:bg-accent transition-colors"
                >
                  Email directly
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
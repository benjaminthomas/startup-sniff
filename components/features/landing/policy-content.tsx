"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

interface PolicySection {
  title: string;
  content: string | string[];
}

interface PolicyHighlight {
  title: string;
  description: string | string[];
}

interface PolicyKeyPoint {
  title: string;
  description: string | string[];
}

interface PolicyContentProps {
  intro: string | string[];
  highlights?: PolicyHighlight[];
  keyPoints?: PolicyKeyPoint[];
  sections: PolicySection[];
  contactInfo: {
    company: string;
    email: string;
    address: string;
    description: string;
  };
}

// Helper component to render content that can be string or array
function ContentRenderer({ content }: { content: string | string[] }) {
  if (Array.isArray(content)) {
    return (
      <div className="space-y-3">
        {content.map((paragraph, index) => (
          <p key={index} className="text-muted-foreground leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    );
  }
  return <p className="text-muted-foreground leading-relaxed">{content}</p>;
}

// Helper component for description rendering
function DescriptionRenderer({ description, className = "text-muted-foreground text-sm leading-relaxed" }: { 
  description: string | string[]; 
  className?: string; 
}) {
  if (Array.isArray(description)) {
    return (
      <div className="space-y-2">
        {description.map((item, index) => (
          <p key={index} className={className}>
            {item}
          </p>
        ))}
      </div>
    );
  }
  return <p className={className}>{description}</p>;
}

export function PolicyContent({ 
  intro, 
  highlights, 
  keyPoints, 
  sections, 
  contactInfo 
}: PolicyContentProps) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <Card className="border-primary/20 bg-secondary/20">
            <CardContent className="p-8">
              <ContentRenderer content={intro} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Highlights Section */}
        {highlights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold mb-8 text-gradient">Key Highlights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {highlights.map((highlight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                >
                  <Card className="h-full border-primary/10 hover:border-primary/30 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary mt-1 shrink-0" />
                        <div>
                          <h3 className="font-semibold text-foreground mb-2">
                            {highlight.title}
                          </h3>
                          <DescriptionRenderer description={highlight.description} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Key Points Section */}
        {keyPoints && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold mb-8 text-gradient">Key Points</h2>
            <div className="space-y-4">
              {keyPoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="flex items-start gap-4 p-4 rounded-lg border border-primary/10 bg-secondary/10"
                >
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 shrink-0">
                    {index + 1}
                  </Badge>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {point.title}
                    </h3>
                    <DescriptionRenderer description={point.description} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Detailed Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold mb-8 text-gradient">Detailed Information</h2>
          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card>
                  <CardContent className="p-8">
                    <h3 className="text-xl font-semibold text-foreground mb-4">
                      {section.title}
                    </h3>
                    <ContentRenderer content={section.content} />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <Card className="border-primary/20 bg-gradient-to-br from-secondary/20 to-accent/10">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold text-foreground mb-6">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Company</h4>
                  <p className="text-muted-foreground">{contactInfo.company}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {contactInfo.description}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Contact</h4>
                  <p className="text-muted-foreground">
                    <strong>Email:</strong> {contactInfo.email}
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Platform:</strong> {contactInfo.address}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, Phone, ExternalLink } from "lucide-react";
import { Mail as MailIcon, Users, MessageSquare } from "lucide-react";
import type { ContactMethod } from "@/types/contact";

interface ContactInfoProps {
  methods: ContactMethod[];
}

// Icon mapping for contact methods
const iconMap: { [key: string]: any } = {
  Mail: MailIcon,
  Users: Users,
  MessageSquare: MessageSquare,
};

// Helper component to render descriptions
function DescriptionRenderer({ description }: { description: string | string[] }) {
  if (Array.isArray(description)) {
    return (
      <div className="space-y-2">
        {description.map((item, index) => (
          <p key={index} className="text-muted-foreground text-sm leading-relaxed">
            {item}
          </p>
        ))}
      </div>
    );
  }
  return <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>;
}

export function ContactInfo({ methods }: ContactInfoProps) {
  const handleContactAction = (method: ContactMethod) => {
    switch (method.action.type) {
      case 'email':
        window.location.href = `mailto:${method.action.value}`;
        break;
      case 'phone':
        window.location.href = `tel:${method.action.value}`;
        break;
      case 'link':
        window.open(method.action.value, '_blank', 'noopener,noreferrer');
        break;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'email':
        return Mail;
      case 'phone':
        return Phone;
      case 'link':
        return ExternalLink;
      default:
        return ArrowRight;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center lg:text-left">
        <h2 className="text-2xl font-bold text-gradient mb-4">
          Other Ways to Reach Us
        </h2>
        <p className="text-muted-foreground">
          Choose the best way to reach out based on your needs
        </p>
      </div>

      {/* Contact Methods */}
      <div className="space-y-4">
        {methods.map((method, index) => {
          const Icon = iconMap[method.icon] || MailIcon;
          const ActionIcon = getActionIcon(method.action.type);
          
          return (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              <Card className="border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-lg group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center shadow-md shrink-0">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {method.title}
                      </h3>
                      <DescriptionRenderer description={method.description} />
                      <Button
                        onClick={() => handleContactAction(method)}
                        variant="outline"
                        size="sm"
                        className="mt-3 border-primary/30 hover:bg-primary/10 group-hover:border-primary/50"
                      >
                        <ActionIcon className="w-4 h-4 mr-2" />
                        {method.action.label}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
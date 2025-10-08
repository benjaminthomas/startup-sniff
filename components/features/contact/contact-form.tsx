"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Send, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const contactSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name is too long")
    .trim(),
  email: z.string()
    .email("Please enter a valid email address")
    .max(255, "Email is too long")
    .toLowerCase()
    .trim(),
  subject: z.string()
    .min(1, "Please select a subject"),
  company: z.string()
    .max(100, "Company name is too long")
    .optional(),
  message: z.string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message is too long")
    .trim(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  title: string;
  subtitle: string;
}

const subjectOptions = [
  { value: "technical_support", label: "Technical Support" },
  { value: "billing", label: "Billing & Subscriptions" },
  { value: "feature_request", label: "Feature Request" },
  { value: "partnership", label: "Partnership Inquiry" },
  { value: "bug_report", label: "Bug Report" },
  { value: "general", label: "General Question" },
];

export function ContactForm({ title, subtitle }: ContactFormProps) {
  const [isPending, startTransition] = useTransition();
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      company: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to send message");
        }

        setSubmitStatus("success");
        form.reset();
        toast.success("Message sent successfully!", {
          description: "We'll get back to you within 24 hours.",
        });
      } catch (error) {
        setSubmitStatus("error");
        toast.error("Failed to send message", {
          description: error instanceof Error ? error.message : "Please try again or email us directly.",
        });
      }
    });
  };

  return (
    <Card className="h-fit">
      <CardHeader className="space-y-4">
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 w-fit">
          Send Message
        </Badge>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          <p className="text-xl text-muted-foreground">{subtitle}</p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Success Message */}
        {submitStatus === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                Message sent successfully!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                We&apos;ll get back to you within 24 hours. Check your email for confirmation.
              </p>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name and Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your full name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Subject and Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjectOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company/Organization <span className="text-muted-foreground">(Optional)</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your company name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us how we can help you..."
                      rows={6}
                      {...field}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full"
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Message...
                </>
              ) : (
                <>
                  Send Message
                  <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            {/* Help Text */}
            <p className="text-sm text-muted-foreground text-center">
              By submitting this form, you agree to our{" "}
              <a href="/privacy_policy" className="text-primary hover:underline">
                Privacy Policy
              </a>
              . We&apos;ll never share your information.
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
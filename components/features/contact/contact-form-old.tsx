"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ContactFormField } from "@/types/contact";

interface ContactFormProps {
  title: string;
  subtitle: string;
  fields: ContactFormField[];
  submitText: string;
  successMessage: string;
  errorMessage: string;
}

interface FormData {
  [key: string]: string;
}

interface FormErrors {
  [key: string]: string;
}

export function ContactForm({ 
  title, 
  subtitle, 
  fields, 
  submitText, 
  successMessage, 
  errorMessage 
}: ContactFormProps) {
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const validateField = (field: ContactFormField, value: string): string => {
    if (field.required && !value.trim()) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      const { minLength, maxLength, pattern } = field.validation;
      
      if (minLength && value.length < minLength) {
        return `${field.label} must be at least ${minLength} characters`;
      }
      
      if (maxLength && value.length > maxLength) {
        return `${field.label} must be no more than ${maxLength} characters`;
      }
      
      if (pattern && !new RegExp(pattern).test(value)) {
        if (field.type === 'email') {
          return 'Please enter a valid email address';
        }
        return `${field.label} format is invalid`;
      }
    }

    return '';
  };

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: FormErrors = {};
    fields.forEach(field => {
      const value = formData[field.name] || '';
      const error = validateField(field, value);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          // Handle validation errors from server
          const serverErrors: FormErrors = {};
          result.errors.forEach((error: string) => {
            // Try to map errors to fields or show as general error
            if (error.toLowerCase().includes('name')) {
              serverErrors.name = error;
            } else if (error.toLowerCase().includes('email')) {
              serverErrors.email = error;
            } else if (error.toLowerCase().includes('message')) {
              serverErrors.message = error;
            } else if (error.toLowerCase().includes('subject')) {
              serverErrors.subject = error;
            }
          });
          setErrors(serverErrors);
        }
        throw new Error(result.error || 'Failed to send message');
      }

      setSubmitStatus('success');
      setFormData({});
      
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: ContactFormField) => {
    const value = formData[field.name] || '';
    const error = errors[field.name];

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            id={field.name}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={`min-h-[120px] ${error ? 'border-destructive' : ''}`}
            rows={4}
          />
        );
      
      case 'select':
        return (
          <select
            id={field.name}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-destructive' : ''}`}
          >
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <Input
            id={field.name}
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={error ? 'border-destructive' : ''}
          />
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-16"
    >
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gradient mb-2">
              {title}
            </CardTitle>
            <p className="text-muted-foreground">{subtitle}</p>
          </CardHeader>
          <CardContent>
            {submitStatus === 'success' && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            {submitStatus === 'error' && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {fields.map((field, index) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="space-y-2"
                >
                  <Label htmlFor={field.name} className="font-medium">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {renderField(field)}
                  {errors[field.name] && (
                    <p className="text-sm text-destructive">{errors[field.name]}</p>
                  )}
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * fields.length }}
              >
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-lg px-8 py-4 gradient-primary glow-purple"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {submitText}
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
import { NextRequest, NextResponse } from 'next/server';
import { sendContactFormEmail, type ContactFormData } from '@/modules/contact';

// Rate limiting storage (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 3; // Max 3 contact form submissions per 15 minutes

function getRateLimitKey(ip: string, email: string): string {
  return `${ip}:${email}`;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  entry.count += 1;
  return false;
}

interface ContactFormInput {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  company?: unknown;
}

function validateContactForm(data: ContactFormInput): { isValid: boolean; errors: string[]; formData?: ContactFormData } {
  const errors: string[] = [];

  // Validate required fields
  if (!data?.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push('Name is required');
  } else if (data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  } else if (data.name.trim().length > 50) {
    errors.push('Name must be no more than 50 characters');
  }

  if (!data.email || typeof data.email !== 'string' || !data.email.trim()) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.push('Please enter a valid email address');
    }
  }

  if (!data.subject || typeof data.subject !== 'string' || !data.subject.trim()) {
    errors.push('Subject is required');
  } else {
    const validSubjects = ['technical_support', 'billing', 'feature_request', 'partnership', 'bug_report', 'general'];
    if (!validSubjects.includes(data.subject)) {
      errors.push('Please select a valid subject');
    }
  }

  if (!data.message || typeof data.message !== 'string' || !data.message.trim()) {
    errors.push('Message is required');
  } else if (data.message.trim().length < 10) {
    errors.push('Message must be at least 10 characters');
  } else if (data.message.trim().length > 1000) {
    errors.push('Message must be no more than 1000 characters');
  }

  // Optional company field validation
  if (data.company && typeof data.company === 'string' && data.company.trim().length > 100) {
    errors.push('Company name must be no more than 100 characters');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const formData: ContactFormData = {
    name: (data.name as string).trim(),
    email: (data.email as string).trim().toLowerCase(),
    subject: data.subject as string,
    message: (data.message as string).trim(),
  };

  // Add optional company field if provided
  if (data.company && typeof data.company === 'string') {
    formData.company = data.company.trim();
  }

  return { isValid: true, errors: [], formData };
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    const body = await request.json();

    // Validate form data
    const validation = validateContactForm(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, errors: validation.errors },
        { status: 400 }
      );
    }

    const { formData } = validation;

    // Check rate limiting
    const rateLimitKey = getRateLimitKey(clientIP, formData!.email);
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many contact form submissions. Please wait 15 minutes before trying again.' 
        },
        { status: 429 }
      );
    }

    // Basic spam detection
    const spamKeywords = ['viagra', 'casino', 'lottery', 'winner', 'congratulations', 'click here', 'make money'];
    const messageText = formData!.message.toLowerCase();
    const hasSpamKeywords = spamKeywords.some(keyword => messageText.includes(keyword));
    
    if (hasSpamKeywords) {
      console.warn('Potential spam detected in contact form:', {
        email: formData!.email,
        message: formData!.message.substring(0, 100)
      });
      // Still process but flag for review
    }

    // Send email via Mailgun
    await sendContactFormEmail(formData!);

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message! We\'ll get back to you within 24 hours.'
    });

  } catch (error) {
    console.error('Contact form API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Sorry, there was an error sending your message. Please try again or email us directly at support@startupsniff.com.' 
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

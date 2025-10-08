import type { ContactPageContent } from '@/types/contact';

export const CONTACT_PAGE_CONTENT: ContactPageContent = {
  title: "Contact Us",
  subtitle: "Get in touch with our team",
  description: "Have questions about StartupSniff? Need help with your startup idea discovery journey? Our team is here to help you succeed. Reach out through any of the methods below.",
  methods: [
    {
      id: 'email',
      title: 'Email Support',
      description: [
        'Get help with technical issues, billing questions, or general inquiries.',
        'We typically respond within 24 hours during business days.'
      ],
      icon: 'Mail',
      action: {
        type: 'email',
        value: 'support@startupsniff.com',
        label: 'Send Email'
      }
    },
    {
      id: 'feedback',
      title: 'Product Feedback',
      description: [
        'Have ideas for new features or improvements?',
        'We love hearing from our users about how we can make StartupSniff better.'
      ],
      icon: 'MessageSquare',
      action: {
        type: 'email',
        value: 'feedback@startupsniff.com',
        label: 'Share Feedback'
      }
    }
  ],
  form: {
    title: 'Send us a Message',
    subtitle: 'Fill out the form below and we\'ll get back to you as soon as possible.',
    fields: [
      {
        name: 'name',
        label: 'Full Name',
        type: 'text',
        placeholder: 'Enter your full name',
        required: true,
        validation: {
          minLength: 2,
          maxLength: 50
        }
      },
      {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        placeholder: 'Enter your email address',
        required: true,
        validation: {
          pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
        }
      },
      {
        name: 'subject',
        label: 'Subject',
        type: 'select',
        required: true,
        options: [
          { value: '', label: 'Select a subject' },
          { value: 'technical_support', label: 'Technical Support' },
          { value: 'billing', label: 'Billing & Subscriptions' },
          { value: 'feature_request', label: 'Feature Request' },
          { value: 'partnership', label: 'Partnership Inquiry' },
          { value: 'bug_report', label: 'Bug Report' },
          { value: 'general', label: 'General Question' }
        ]
      },
      {
        name: 'company',
        label: 'Company/Organization (Optional)',
        type: 'text',
        placeholder: 'Enter your company name',
        required: false,
        validation: {
          maxLength: 100
        }
      },
      {
        name: 'message',
        label: 'Message',
        type: 'textarea',
        placeholder: 'Tell us how we can help you...',
        required: true,
        validation: {
          minLength: 10,
          maxLength: 1000
        }
      }
    ],
    submitText: 'Send Message',
    successMessage: 'Thank you for your message! We\'ll get back to you within 24 hours. Check your email for a confirmation.',
    errorMessage: 'Sorry, there was an error sending your message. Please try again or email us directly at support@startupsniff.com.'
  },
  faq: {
    title: 'Frequently Asked Questions',
    subtitle: 'Quick answers to common questions about StartupSniff',
    items: [
      {
        question: 'How quickly will I get a response?',
        answer: [
          'We typically respond to support emails within 24 hours during business days (Monday-Friday).',
          'For urgent issues, please mark your email as high priority or contact us directly.'
        ],
        category: 'support'
      },
      {
        question: 'What information should I include in my support request?',
        answer: [
          'Please include your account email, a description of the issue, and any relevant screenshots.',
          'For billing issues, include your subscription details or transaction ID.',
          'The more details you provide, the faster we can help resolve your issue.'
        ],
        category: 'support'
      },
      {
        question: 'Do you offer phone support?',
        answer: 'Currently, we provide support primarily through email and our contact form. This allows us to better track and resolve issues while maintaining detailed records of our conversations.',
        category: 'support'
      },
      {
        question: 'Can I schedule a demo or consultation?',
        answer: [
          'Yes! Enterprise customers and potential partners can schedule a personalized demo.',
          'Contact our sales team at sales@startupsniff.com to arrange a meeting.',
          'We also offer onboarding sessions for new enterprise accounts.'
        ],
        category: 'sales'
      },
      {
        question: 'How do I report a bug or technical issue?',
        answer: [
          'Please use the contact form above and select "Bug Report" as the subject.',
          'Include steps to reproduce the issue, what you expected to happen, and what actually happened.',
          'Screenshots or screen recordings are very helpful for diagnosing technical issues.'
        ],
        category: 'technical'
      },
      {
        question: 'Where can I find your API documentation?',
        answer: 'Our API documentation is available in the dashboard under the "Developers" section. Enterprise customers have access to extended API features and dedicated developer support.',
        category: 'technical'
      },
      {
        question: 'Will I receive a confirmation email?',
        answer: [
          'Yes! You\'ll receive an automated confirmation email immediately after submitting the contact form.',
          'This confirms we\'ve received your message and includes a summary of your inquiry.',
          'If you don\'t see the confirmation email, please check your spam folder.'
        ],
        category: 'support'
      },
      {
        question: 'Can I attach files to my support request?',
        answer: 'Currently, file attachments aren\'t supported through the contact form. If you need to share files, please email us directly at support@startupsniff.com with your attachments.',
        category: 'support'
      }
    ]
  }
};
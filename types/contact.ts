// Contact Types
export interface ContactMethod {
  id: string;
  title: string;
  description: string | string[];
  icon: string; // Icon name from lucide-react
  action: {
    type: 'email' | 'link' | 'phone';
    value: string;
    label: string;
  };
}

export interface ContactFormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'select';
  placeholder?: string;
  required: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface ContactFAQ {
  question: string;
  answer: string | string[];
  category?: string;
}

export interface ContactPageContent {
  title: string;
  subtitle: string;
  description: string | string[];
  methods: ContactMethod[];
  form: {
    title: string;
    subtitle: string;
    fields: ContactFormField[];
    submitText: string;
    successMessage: string;
    errorMessage: string;
  };
  faq?: {
    title: string;
    subtitle: string;
    items: ContactFAQ[];
  };
}

export interface ContactConfig {
  CONTACT_PAGE: ContactPageContent;
}
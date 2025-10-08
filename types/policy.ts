// Policy Types
export interface PolicyHighlight {
  title: string;
  description: string | string[];
}

export interface PolicyKeyPoint {
  title: string;
  description: string | string[];
}

export interface PolicySection {
  title: string;
  content: string | string[];
}

export interface PolicyContent {
  intro: string | string[];
  highlights?: PolicyHighlight[];
  keyPoints?: PolicyKeyPoint[];
  sections: PolicySection[];
}

export interface PolicyPage {
  title: string;
  subtitle: string;
  lastUpdated: string;
  content: PolicyContent;
}

export interface ContactInfo {
  company: string;
  email: string;
  address: string;
  description: string;
}

export interface PolicyConfig {
  PRIVACY: PolicyPage;
  REFUND: PolicyPage;
  TERMS: PolicyPage;
  CONTACT: ContactInfo;
}
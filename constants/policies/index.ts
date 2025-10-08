import type { PolicyConfig } from '@/types/policy';
import { PRIVACY_POLICY } from './privacy';
import { REFUND_POLICY } from './refund';
import { TERMS_CONDITIONS } from './terms';
import { CONTACT_INFO } from './contact';

export const POLICY_CONTENT: PolicyConfig = {
  PRIVACY: PRIVACY_POLICY,
  REFUND: REFUND_POLICY,
  TERMS: TERMS_CONDITIONS,
  CONTACT: CONTACT_INFO
};

// Re-export individual policies for direct import
export { PRIVACY_POLICY, REFUND_POLICY, TERMS_CONDITIONS, CONTACT_INFO };
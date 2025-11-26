/**
 * Template Variant Constants
 * Story 2.10: Template A/B Testing and Optimization
 *
 * Defines template variant types and configurations for A/B testing
 */

export const TEMPLATE_VARIANTS = {
  PROFESSIONAL: 'professional',
  CASUAL: 'casual',
  CONCISE: 'concise',
  VALUE_FIRST: 'value_first',
} as const

export type TemplateVariant = typeof TEMPLATE_VARIANTS[keyof typeof TEMPLATE_VARIANTS]

export interface TemplateVariantConfig {
  name: TemplateVariant
  label: string
  description: string
  promptStyle: string
  systemPrompt: string
}

/**
 * Template variant configurations with system prompts for AI generation
 */
export const TEMPLATE_VARIANT_CONFIGS: Record<TemplateVariant, TemplateVariantConfig> = {
  [TEMPLATE_VARIANTS.PROFESSIONAL]: {
    name: 'professional',
    label: 'Professional',
    description: 'Formal, business-focused tone with clear value proposition',
    promptStyle: 'professional and business-focused',
    systemPrompt: `Generate a professional, business-focused message template.

Characteristics:
- Formal but friendly tone
- Clear value proposition upfront
- Structured with proper introduction and call-to-action
- Reference specific Reddit post details
- Length: 150-250 words
- Professional language, no slang
- Include your background/expertise briefly
- End with clear next step (e.g., "Would you be open to a 15-minute call?")`,
  },

  [TEMPLATE_VARIANTS.CASUAL]: {
    name: 'casual',
    label: 'Casual',
    description: 'Friendly, conversational tone that builds rapport',
    promptStyle: 'casual and conversational',
    systemPrompt: `Generate a casual, conversational message template that builds rapport.

Characteristics:
- Warm, friendly tone like talking to a peer
- Use first names and conversational language
- Share personal connection or similar experience
- Reference specific Reddit post naturally
- Length: 120-200 words
- Use contractions (you're, I'm, etc.)
- Show genuine interest in their problem
- End with low-pressure invitation to chat`,
  },

  [TEMPLATE_VARIANTS.CONCISE]: {
    name: 'concise',
    label: 'Concise',
    description: 'Brief, direct message that respects their time',
    promptStyle: 'concise and direct',
    systemPrompt: `Generate a concise, direct message template that respects their time.

Characteristics:
- Get to the point quickly
- Maximum 100 words
- One sentence per paragraph
- Reference Reddit post briefly
- No unnecessary pleasantries
- Clear, specific call-to-action
- Bullet points if listing multiple items
- Easy to skim and respond to`,
  },

  [TEMPLATE_VARIANTS.VALUE_FIRST]: {
    name: 'value_first',
    label: 'Value-First',
    description: 'Leads with specific value or insight for recipient',
    promptStyle: 'value-first and insight-driven',
    systemPrompt: `Generate a value-first message template that leads with insight.

Characteristics:
- Start with specific insight, tip, or resource relevant to their problem
- Give value before asking for anything
- Reference Reddit post and offer helpful perspective
- Length: 150-220 words
- Share relevant experience or data point
- Position yourself as helpful peer, not salesperson
- Soft call-to-action after providing value
- Make them think "this person gets it"`,
  },
}

/**
 * Minimum sample sizes for statistical significance testing
 */
export const SIGNIFICANCE_THRESHOLDS = {
  MIN_SAMPLE_SIZE: 50, // Minimum messages sent per variant
  HIGH_CONFIDENCE_SIZE: 100, // Sample size for 95% confidence
  MIN_DIFFERENCE: 5.0, // Minimum 5% difference in response rate
} as const

/**
 * Get a random template variant for assignment
 * Uses weighted random selection (can be adjusted for multi-armed bandit later)
 */
export function getRandomTemplateVariant(): TemplateVariant {
  const variants = Object.values(TEMPLATE_VARIANTS)
  const randomIndex = Math.floor(Math.random() * variants.length)
  return variants[randomIndex]
}

/**
 * Get the default template variant
 */
export function getDefaultTemplateVariant(): TemplateVariant {
  return TEMPLATE_VARIANTS.PROFESSIONAL
}

/**
 * Get template variant configuration by name
 */
export function getTemplateVariantConfig(variant: TemplateVariant): TemplateVariantConfig {
  return TEMPLATE_VARIANT_CONFIGS[variant]
}

/**
 * Check if a variant name is valid
 */
export function isValidTemplateVariant(variant: string): variant is TemplateVariant {
  return Object.values(TEMPLATE_VARIANTS).includes(variant as TemplateVariant)
}

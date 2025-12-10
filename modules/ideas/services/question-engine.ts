import { nanoid } from 'nanoid';
import { openai } from '@/modules/ai/openai';
import { log } from '@/lib/logger'

export type DynamicQuestionType = 'insight' | 'constraint' | 'differentiator';

export interface DynamicIdeaQuestion {
  id: string;
  prompt: string;
  helper: string;
  type: DynamicQuestionType;
  suggestions?: string[];
}

export interface QuestionContext {
  industry?: string;
  problemArea?: string;
  targetAudience?: string;
}

const FALLBACK_LIBRARY: Record<
  string,
  (context: QuestionContext) => DynamicIdeaQuestion[]
> = {
  technology: (context) => {
    const focus = context.problemArea
      ? context.problemArea.toLowerCase()
      : 'the workflow you want to reinvent';
    const audience = context.targetAudience
      ? context.targetAudience.toLowerCase()
      : 'your target teams';

    return [
      {
        id: 'tech-ecosystem',
        prompt: `Within ${focus}, which daily workflows create the loudest complaints for ${audience}?`,
        helper:
          'Point to the exact handoff, integration, or manual task people hack together with spreadsheets or scripts today.',
        type: 'insight',
        suggestions: [
          'Handoff between engineering and customer success',
          'Security review bottlenecks for AI-generated code',
          'Deploying analytics across multiple cloud vendors'
        ]
      },
      {
        id: 'tech-regulation',
        prompt: `What privacy, compliance, or procurement gatekeepers will say “no” to a ${focus} solution in ${context.industry}?`,
        helper:
          'List the certifications, policy reviews, or risk committees you must satisfy so pilots do not stall.',
        type: 'constraint',
        suggestions: [
          'SOC 2 readiness playbook',
          'AI transparency and audit trail requirements',
          'Data residency for EU enterprise buyers'
        ]
      },
      {
        id: 'tech-edge',
        prompt: `Which proprietary dataset or workflow signal do you alone have to give ${audience} a 10x leap?`,
        helper:
          'Think about telemetry, community knowledge, or partnerships you can combine into a moat.',
        type: 'differentiator',
        suggestions: [
          'Historic incident response data across clients',
          'Exclusive integration with legacy ERPs',
          'Behaviour data from niche professional networks'
        ]
      }
    ];
  },
  healthcare: (context) => {
    const metric = context.problemArea
      ? context.problemArea.toLowerCase()
      : 'clinical outcomes';
    const audience = context.targetAudience
      ? context.targetAudience.toLowerCase()
      : 'care teams';

    return [
      {
        id: 'health-outcomes',
        prompt: `Which measurable ${metric} indicator will convince ${audience} that your solution improves patient journeys?`,
        helper:
          'Pick a KPI clinicians already track (e.g., readmission rate, triage time, adherence) so improvement is provable.',
        type: 'insight',
        suggestions: [
          '30-day readmission for chronic conditions',
          'Time-to-triage in emergency departments',
          'Medication adherence for at-risk seniors'
        ]
      },
      {
        id: 'health-regulation',
        prompt: `What clinical validation or regulatory evidence do administrators need before adopting this ${context.industry} tool?`,
        helper:
          'Outline trials, IRB approvals, or billing codes required to move past pilots.',
        type: 'constraint',
        suggestions: [
          'Pilot study with 2 health system partners',
          'HIPAA-compliant data pipeline architecture',
          'Pathway to CPT code reimbursement'
        ]
      },
      {
        id: 'health-adoption',
        prompt: `How will you embed into existing EHR or care routines so ${audience} avoid extra clicks?`,
        helper:
          'Clarify integrations, alert thresholds, and workflow automations that remove—not add—administrative burden.',
        type: 'differentiator',
        suggestions: [
          'Smart note templates triggered by vitals',
          'Voice-assisted chart updates',
          'Automated care plans handed to caregivers'
        ]
      }
    ];
  },
  ecommerce: (context) => {
    const segment = context.targetAudience
      ? context.targetAudience.toLowerCase()
      : 'priority customers';
    const problem = context.problemArea
      ? context.problemArea.toLowerCase()
      : 'growth challenges';

    return [
      {
        id: 'ecom-metric',
        prompt: `Which ${problem} metric do you want to move first for ${segment}, and how will you prove it in month one?`,
        helper:
          'Decide on a metric (AOV, repeat rate, conversion) and the cohort where lift will be obvious.',
        type: 'insight',
        suggestions: [
          'Recover abandoned carts for high-margin SKUs',
          'Upsell loyal subscribers with personalised bundles',
          'Increase first-purchase conversion in new regions'
        ]
      },
      {
        id: 'ecom-logistics',
        prompt: `What bottleneck in fulfillment or supplier ops currently blocks scaling this ${context.industry} idea?`,
        helper:
          'Map the hand-off that causes delays—inventory syncing, cross-border shipping, returns triage, or supplier onboarding.',
        type: 'constraint',
        suggestions: [
          'Real-time inventory sync across marketplaces',
          'Predictive restocking for fast-moving items',
          'Automated reverse logistics workflow'
        ]
      },
      {
        id: 'ecom-brand',
        prompt: `What branded experience will make ${segment} switch from incumbents and stay loyal?`,
        helper:
          'Describe the community, personalisation, or sustainability promise that competitors cannot mirror.',
        type: 'differentiator',
        suggestions: [
          'Creator-led drops tied to micro-communities',
          'Hyper-personalised bundles from behavioural data',
          'Transparent supply chain with sustainability scores'
        ]
      }
    ];
  }
};

function buildFallbackQuestions(context: QuestionContext): DynamicIdeaQuestion[] {
  const normalizedIndustry = context.industry?.toLowerCase();
  if (!normalizedIndustry) {
    const focus = context.problemArea
      ? context.problemArea.toLowerCase()
      : 'the problem you selected';
    const audience = context.targetAudience
      ? context.targetAudience.toLowerCase()
      : 'your target users';

    return [
      {
        id: 'general-traction',
        prompt: `What tangible proof-of-demand can you capture in the first 30 days to prove ${audience} want help with ${focus}?`,
        helper:
          'Decide on a fast validation asset—landing page signups, design partners, or paid pilots—to demonstrate real pull.',
        type: 'insight',
        suggestions: [
          '10+ discovery calls with target users',
          'A waitlist segmented by industry role',
          'Pilot commitment from lighthouse customer'
        ]
      },
      {
        id: 'general-constraint',
        prompt: `What regulatory, technical, or resource constraints could block your first MVP for ${audience}?`,
        helper:
          'List the dependencies (data access, integrations, approvals, capital) that must be secured before launch.',
        type: 'constraint',
        suggestions: [
          'Data residency or privacy requirements',
          'Specialized skills you must contract',
          'Supplier or platform dependencies'
        ]
      },
      {
        id: 'general-edge',
        prompt: `Why will ${audience} abandon today’s workaround for your approach to ${focus}?`,
        helper:
          'Describe the killer promise—10x faster workflow, radical simplicity, or outcome-based pricing—that forces a switch.',
        type: 'differentiator',
        suggestions: [
          '10x faster workflow',
          'Unified view replacing 3+ tools',
          'Outcome-based pricing'
        ]
      }
    ];
  }

  const libraryMatch =
    FALLBACK_LIBRARY[normalizedIndustry as keyof typeof FALLBACK_LIBRARY];

  if (libraryMatch) {
    return libraryMatch(context).map((item) => ({
      ...item,
      id: `${item.id}-${nanoid(6)}`
    }));
  }

  return buildFallbackQuestions({});
}

export async function generateDynamicIdeaQuestions(
  context: QuestionContext
): Promise<DynamicIdeaQuestion[]> {
  const fallback = buildFallbackQuestions(context);

  if (!openai) {
    return fallback;
  }

  try {
    const systemPrompt = `You are an entrepreneurial coach helping founders sharpen their idea.
Return three focused follow-up questions as JSON. Each question should include:
- id (string)
- prompt (string)
- helper (string explaining why it matters)
- type (one of "insight", "constraint", "differentiator")
- suggestions (array of 2-4 short example answers)

Questions must be practical, non-generic and grounded in the provided context.`;

    const userContext = [
      context.industry && `Industry: ${context.industry}`,
      context.problemArea && `Problem Area: ${context.problemArea}`,
      context.targetAudience && `Target Audience: ${context.targetAudience}`
    ]
      .filter(Boolean)
      .join('\n');

    const userPrompt = `Context for the startup idea:
${userContext || 'General founder exploring opportunities.'}

Return JSON with the shape:
{
  "questions": [
    {
      "id": "string",
      "prompt": "string",
      "helper": "string",
      "type": "insight" | "constraint" | "differentiator",
      "suggestions": ["string", ...]
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.6,
      max_tokens: 700,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      return fallback;
    }

    const parsed = JSON.parse(response) as {
      questions?: Array<DynamicIdeaQuestion>;
    };

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      return fallback;
    }

    return parsed.questions.map((question) => ({
      ...question,
      id: question.id || nanoid(8),
      helper: question.helper || 'Clarify why this matters to execution.',
      type: (['insight', 'constraint', 'differentiator'] as const).includes(
        question.type as DynamicQuestionType
      )
        ? question.type
        : 'insight',
      suggestions:
        question.suggestions && question.suggestions.length > 0
          ? question.suggestions
          : undefined
    }));
  } catch (error) {
    log.error('Failed to generate dynamic questions', error);
    return fallback;
  }
}

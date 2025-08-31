import OpenAI from 'openai';

// Check if we have a real OpenAI API key (not placeholder)
const hasValidApiKey = process.env.OPENAI_API_KEY && 
  process.env.OPENAI_API_KEY !== 'your_openai_api_key' && 
  process.env.OPENAI_API_KEY.startsWith('sk-');

export const openai = hasValidApiKey ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export interface IdeaGenerationParams {
  industry?: string;
  problemArea?: string;
  targetAudience?: string;
  budget?: 'low' | 'medium' | 'high';
  timeframe?: 'short' | 'medium' | 'long';
  trends?: string[];
  userPrompt?: string;
}

export interface GeneratedIdea {
  title: string;
  description: string;
  problemStatement: string;
  solution: string;
  targetMarket: string;
  revenueModel: string[];
  estimatedCost: string;
  timeToMarket: string;
  marketSize: string;
  competition: string;
  uniqueValue: string;
  nextSteps: string[];
  risks: string[];
  opportunities: string[];
}

// Mock data generator for development/demo purposes
function generateMockIdea(params: IdeaGenerationParams): GeneratedIdea {
  const industries = {
    technology: {
      title: 'CodeMentor AI',
      description: 'AI-powered personalized coding tutor that adapts to individual learning styles and provides real-time feedback on code quality.',
      problem: 'New developers struggle with personalized guidance and lack immediate feedback',
      solution: 'AI tutor that provides instant code reviews, suggests improvements, and adapts teaching methods to individual learning patterns',
      market: 'Aspiring software developers, coding bootcamp students, and junior developers',
      revenue: ['Monthly subscription ($29/month)', 'Corporate training licenses'],
      cost: '$15K for MVP development and initial AI training',
      timeline: '4-6 months to beta launch',
      marketSize: '$2.3B coding education market',
      competition: 'CodeAcademy, FreeCodeCamp - but less personalized',
      uniqueValue: 'Real-time AI feedback with personalized learning paths'
    },
    healthcare: {
      title: 'MoodTrack',
      description: 'Mental health tracking app that uses smartphone sensors to detect mood patterns and provides personalized wellness recommendations.',
      problem: 'Mental health monitoring is reactive rather than proactive',
      solution: 'Passive mood tracking through phone usage patterns combined with simple daily check-ins for early intervention',
      market: 'Health-conscious adults aged 25-45 concerned about mental wellness',
      revenue: ['Premium app subscription ($9.99/month)', 'Corporate wellness partnerships'],
      cost: '$8K for app development and regulatory compliance',
      timeline: '3-4 months to launch',
      marketSize: '$4.2B mental health apps market',
      competition: 'Headspace, Calm - but focused on meditation rather than tracking',
      uniqueValue: 'Passive tracking without manual journaling burden'
    }
  };

  const industryKey = params.industry?.toLowerCase() as keyof typeof industries;
  const template = industries[industryKey] || industries.technology;

  return {
    title: template.title,
    description: template.description,
    problemStatement: template.problem,
    solution: template.solution,
    targetMarket: template.market,
    revenueModel: template.revenue,
    estimatedCost: template.cost,
    timeToMarket: template.timeline,
    marketSize: template.marketSize,
    competition: template.competition,
    uniqueValue: template.uniqueValue,
    nextSteps: [
      'Validate the problem with potential users through surveys',
      'Create a minimal viable product (MVP) prototype',
      'Build landing page and collect email signups'
    ],
    risks: [
      'Market saturation in the chosen space',
      'Technical challenges in implementation'
    ],
    opportunities: [
      'Growing demand in the target market',
      'Potential for viral growth through word-of-mouth'
    ]
  };
}

export async function generateStartupIdea(params: IdeaGenerationParams): Promise<GeneratedIdea> {
  const systemPrompt = `You are an expert startup advisor with deep knowledge of market trends, business models, and entrepreneurship. Your task is to generate detailed, actionable startup ideas based on the user's preferences and current market conditions.

Generate ideas that are:
- Realistic and achievable based on the specified budget and timeframe
- Based on real market problems with validated demand
- Financially viable with clear revenue models
- Technically feasible for solo entrepreneurs or small teams
- Aligned with current market trends and opportunities

IMPORTANT: You must return a valid JSON object with ALL the required fields. Do not include any other text or formatting.`;

  // Build parameter context
  const parameterContext = [
    params.industry && `Industry Focus: ${params.industry}`,
    params.problemArea && `Problem Area: ${params.problemArea}`,
    params.targetAudience && `Target Audience: ${params.targetAudience}`,
    params.budget && `Budget Range: ${params.budget === 'low' ? 'Low ($0 - $10K)' : params.budget === 'medium' ? 'Medium ($10K - $100K)' : 'High ($100K+)'}`,
    params.timeframe && `Time to Market: ${params.timeframe === 'short' ? 'Quick (0-6 months)' : params.timeframe === 'medium' ? 'Medium (6-18 months)' : 'Long-term (18+ months)'}`,
    params.trends?.length && `Current Trends: ${params.trends.join(', ')}`,
    params.userPrompt && `Additional Context: ${params.userPrompt}`
  ].filter(Boolean).join('\n');

  const userPrompt = `Generate a startup idea based on these parameters:

${parameterContext || 'No specific parameters provided - generate a general startup idea'}

Return a JSON object with these exact fields:
{
  "title": "Brief, catchy startup name",
  "description": "2-3 sentence overview",
  "problemStatement": "Clear problem being solved",
  "solution": "How your startup solves this problem",
  "targetMarket": "Specific target market description",
  "revenueModel": ["Primary revenue model", "Secondary revenue model"],
  "estimatedCost": "Realistic cost estimate to launch",
  "timeToMarket": "Realistic timeline to launch",
  "marketSize": "Market opportunity size",
  "competition": "Current competition analysis",
  "uniqueValue": "What makes this unique",
  "nextSteps": ["First step", "Second step", "Third step"],
  "risks": ["Main risk 1", "Main risk 2"],
  "opportunities": ["Key opportunity 1", "Key opportunity 2"]
}`;

  try {
    // Use mock data if OpenAI API key is not configured
    if (!openai) {
      console.log('Using mock data - OpenAI API key not configured');
      // Add small delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      return generateMockIdea(params);
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 2500,
      response_format: { type: 'json_object' } // Force JSON output
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse and validate the JSON response
    let parsedIdea: GeneratedIdea;
    try {
      parsedIdea = JSON.parse(response) as GeneratedIdea;
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', response);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate required fields
    const requiredFields: (keyof GeneratedIdea)[] = ['title', 'description', 'problemStatement', 'solution', 'targetMarket', 'revenueModel'];
    for (const field of requiredFields) {
      if (!parsedIdea[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return parsedIdea;
  } catch (error) {
    console.error('Error generating startup idea:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        // Fallback to mock data if API key issues
        console.log('Falling back to mock data due to API key issues');
        return generateMockIdea(params);
      }
      if (error.message.includes('quota')) {
        throw new Error('OpenAI API quota exceeded. Please try again later or upgrade your OpenAI plan.');
      }
      throw error;
    }
    
    throw new Error('Failed to generate startup idea. Please try again.');
  }
}

export async function validateIdeaWithAI(idea: string): Promise<{
  feasibilityScore: number;
  marketPotential: number;
  competitionLevel: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}> {
  const systemPrompt = `You are a seasoned startup mentor and market analyst. Evaluate the given startup idea and provide comprehensive feedback including scores (1-10), strengths, weaknesses, and actionable recommendations.

Return your response as a valid JSON object.`;

  const userPrompt = `Please analyze this startup idea and provide detailed validation:

Startup Idea: ${idea}

Provide:
- feasibilityScore (1-10): How technically and operationally feasible is this idea?
- marketPotential (1-10): What's the market size and growth potential?
- competitionLevel (1-10): How saturated is the market? (10 = highly competitive)
- feedback: Overall assessment (2-3 paragraphs)
- strengths: Array of 3-5 key strengths
- weaknesses: Array of 3-5 potential challenges
- recommendations: Array of 3-5 actionable next steps`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(response);
  } catch (error) {
    console.error('Error validating idea:', error);
    throw new Error('Failed to validate startup idea');
  }
}
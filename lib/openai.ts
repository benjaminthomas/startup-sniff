import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function generateStartupIdea(params: IdeaGenerationParams): Promise<GeneratedIdea> {
  const systemPrompt = `You are an expert startup advisor with deep knowledge of market trends, business models, and entrepreneurship. Your task is to generate detailed, actionable startup ideas based on the user's preferences and current market conditions.

Generate ideas that are:
- Realistic and achievable
- Based on real market problems
- Financially viable
- Technically feasible
- Aligned with current trends

Return your response as a valid JSON object matching the GeneratedIdea interface.`;

  const userPrompt = `Generate a startup idea based on these parameters:
${params.industry ? `Industry: ${params.industry}` : ''}
${params.problemArea ? `Problem Area: ${params.problemArea}` : ''}
${params.targetAudience ? `Target Audience: ${params.targetAudience}` : ''}
${params.budget ? `Budget: ${params.budget}` : ''}
${params.timeframe ? `Timeframe: ${params.timeframe}` : ''}
${params.trends?.length ? `Current Trends: ${params.trends.join(', ')}` : ''}
${params.userPrompt ? `Additional Context: ${params.userPrompt}` : ''}

Please provide a comprehensive startup idea with all the required fields.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const idea = JSON.parse(response) as GeneratedIdea;
    return idea;
  } catch (error) {
    console.error('Error generating startup idea:', error);
    throw new Error('Failed to generate startup idea');
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
      model: 'gpt-4',
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
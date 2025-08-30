import OpenAI from 'openai';
import { StartupIdea, MarketValidation } from '@/types/global';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const IDEA_GENERATION_PROMPT = `You are StartupSniff's AI strategist. Given Reddit post clusters and user preferences, generate the top 3 ranked startup ideas.

For each idea provide a JSON response with this exact structure:

{
  "ideas": [
    {
      "title": "Concise startup name/concept",
      "problem_statement": "Clear problem description (2-3 sentences)",
      "target_market": {
        "demographic": "Target audience description",
        "size": "Market size estimate (e.g., '$50B market')",
        "pain_level": 8
      },
      "solution": {
        "value_proposition": "Core value proposition",
        "features": ["Feature 1", "Feature 2", "Feature 3"],
        "business_model": "Revenue model (e.g., SaaS subscription)"
      },
      "market_analysis": {
        "competition_level": "Low/Medium/High",
        "timing": "Market timing assessment",
        "barriers": ["Barrier 1", "Barrier 2"]
      },
      "implementation": {
        "complexity": 3,
        "mvp": "MVP description",
        "time_to_market": "6-12 months"
      },
      "success_metrics": {
        "probability_score": 75,
        "risk_factors": ["Risk 1", "Risk 2"]
      }
    }
  ]
}

Rank by market opportunity × implementation feasibility × timing factors.`;

export const MARKET_VALIDATION_PROMPT = `You are a senior startup market analyst. Given an idea & market data, output:

- TAM/SAM market estimates
- Growth rates & seasonal trends
- Key competitors & gaps
- Ideal Customer Profile (ICP), CAC, CLV
- Pricing & go-to-market channel suggestions
- Risk assessment (market, technical, competitive)
- Validation confidence score (0-100%) with justification

Format the response in structured JSON for easy UI display.`;

export async function generateStartupIdeas(
  redditData: string,
  userPreferences?: string
): Promise<{ ideas: Partial<StartupIdea>[]; usage: number }> {
  try {
    const prompt = `${IDEA_GENERATION_PROMPT}

Reddit Trending Data:
${redditData}

User Preferences: ${userPreferences || 'No specific preferences'}

Generate 3 innovative startup ideas based on this data.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert startup advisor and market analyst. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    const parsed = JSON.parse(response);
    const ideas = parsed.ideas || [];

    // Calculate token usage (approximate)
    const usage = completion.usage?.total_tokens || 0;

    return {
      ideas: ideas.map((idea: any) => ({
        ...idea,
        ai_confidence_score: idea.success_metrics?.probability_score || 50,
        source_data: { reddit_data: redditData, user_preferences: userPreferences },
        is_validated: false,
        is_favorite: false,
      })),
      usage,
    };
  } catch (error) {
    console.error('Error generating startup ideas:', error);
    throw new Error('Failed to generate startup ideas');
  }
}

export async function validateMarketIdea(idea: Partial<StartupIdea>): Promise<{
  validation: MarketValidation;
  usage: number;
}> {
  try {
    const prompt = `${MARKET_VALIDATION_PROMPT}

Startup Idea to Validate:
Title: ${idea.title}
Problem: ${idea.problem_statement}
Target Market: ${JSON.stringify(idea.target_market)}
Solution: ${JSON.stringify(idea.solution)}

Provide comprehensive market validation analysis in JSON format.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a senior market analyst. Always respond with valid JSON containing market validation data."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const validation = JSON.parse(response);
    const usage = completion.usage?.total_tokens || 0;

    return { validation, usage };
  } catch (error) {
    console.error('Error validating market idea:', error);
    throw new Error('Failed to validate market idea');
  }
}

export async function generateContent(
  idea: Partial<StartupIdea>,
  contentType: string,
  brandVoice?: string,
  additionalInstructions?: string
): Promise<{ title: string; content: string; seoKeywords: string[]; usage: number }> {
  try {
    const contentPrompts = {
      blog_post: 'Write a comprehensive blog post (800-1200 words) about this startup idea. Include SEO-optimized headings, compelling introduction, detailed explanation of the problem and solution, and a strong call-to-action.',
      tweet: 'Create a Twitter thread (5-7 tweets) about this startup idea. Make it engaging, use relevant hashtags, and include a clear call-to-action in the final tweet.',
      email: 'Write a marketing email campaign (subject line + body) promoting this startup idea. Focus on benefits, social proof, and conversion.',
      landing_page: 'Create compelling landing page copy including headline, subheadline, key benefits, features, testimonials section, and multiple CTAs.',
    };

    const basePrompt = contentPrompts[contentType as keyof typeof contentPrompts] || contentPrompts.blog_post;
    
    const prompt = `${basePrompt}

Startup Idea Details:
Title: ${idea.title}
Problem: ${idea.problem_statement}
Solution: ${JSON.stringify(idea.solution)}
Target Market: ${JSON.stringify(idea.target_market)}

Brand Voice: ${brandVoice || 'Professional and engaging'}
Additional Instructions: ${additionalInstructions || 'None'}

Respond with JSON containing:
{
  "title": "Content title",
  "content": "Full content text",
  "seoKeywords": ["keyword1", "keyword2", "keyword3"]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert content marketer. Create high-quality, engaging content that converts. Always respond with valid JSON.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(response);
    const usage = completion.usage?.total_tokens || 0;

    return {
      title: parsed.title,
      content: parsed.content,
      seoKeywords: parsed.seoKeywords || [],
      usage,
    };
  } catch (error) {
    console.error('Error generating content:', error);
    throw new Error('Failed to generate content');
  }
}
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/modules/auth/services/jwt';
import {
  generateDynamicIdeaQuestions,
  type QuestionContext
} from '@/modules/ideas/services/question-engine';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as QuestionContext | null;

    const questions = await generateDynamicIdeaQuestions({
      industry: body?.industry,
      problemArea: body?.problemArea,
      targetAudience: body?.targetAudience
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Dynamic prompt route error', error);
    return NextResponse.json(
      { error: 'Failed to generate dynamic prompts' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateJSON, trimArticle } from '@/lib/openai';
import { getCachedStudioResponse, setCachedStudioResponse } from '@/lib/db/cache';

export interface Flashcard {
  term: string; definition: string; example: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  category: 'concept' | 'person' | 'organization' | 'metric' | 'event';
}
export interface FlashcardsResult { cards: Flashcard[]; articleSummary: string; keyTakeaway: string }

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { articleTitle?: string; articleText?: string; sector?: string; experienceLevel?: string };
  const { articleTitle = '', articleText = '', sector = 'Finance', experienceLevel = 'Intermediate' } = body;
  const article = trimArticle(articleText, 2500);

  try {
    const cached = await getCachedStudioResponse('flashcards', articleText);
    if (cached) return NextResponse.json(cached);

    const result = await generateJSON<FlashcardsResult>(
      `You are a financial educator creating study flashcards for ${sector} professionals at ${experienceLevel} level.`,
      `Create study flashcards for this article. Return a JSON object with EXACTLY these fields:
{
  "articleSummary": "One sentence capturing the core message",
  "keyTakeaway": "The single most important point for a ${sector} professional",
  "cards": [
    {
      "term": "Term or concept name",
      "definition": "Clear 1-2 sentence definition",
      "example": "Concrete example from the article or real world",
      "difficulty": "basic",
      "category": "concept"
    }
  ]
}

Include 5-6 cards covering different aspects.
difficulty: basic | intermediate | advanced
category: concept | person | organization | metric | event

ARTICLE TITLE: ${articleTitle}
ARTICLE: ${article}`,
      'gpt-4o-mini',
      1400
    );
    await setCachedStudioResponse('flashcards', articleText, body.articleTitle || '', result);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/studio/flashcards]', msg);
    return NextResponse.json({ error: 'Flashcards generation failed' }, { status: 500 });
  }
}

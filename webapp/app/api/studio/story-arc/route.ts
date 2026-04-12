import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateJSON, trimArticle } from '@/lib/openai';
import { getCachedStudioResponse, setCachedStudioResponse } from '@/lib/db/cache';

export interface StoryArcEvent {
  date: string; headline: string; significance: string;
  type: 'origin' | 'escalation' | 'turning_point' | 'current' | 'projection';
}
export interface StoryArcResult {
  topic: string; summary: string; events: StoryArcEvent[]; whatToWatch: string[];
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { articleTitle?: string; articleText?: string };
  const { articleTitle = '', articleText = '' } = body;
  const article = trimArticle(articleText, 2500);

  try {
    const cached = await getCachedStudioResponse('story-arc', articleText);
    if (cached) return NextResponse.json(cached);

    const result = await generateJSON<StoryArcResult>(
      `You are a senior financial journalist at The Economic Times specializing in narrative storytelling of market events.`,
      `Create a Story Arc timeline for this financial news story. Return a JSON object with EXACTLY these fields:
{
  "topic": "Core topic in 5 words or less",
  "summary": "2-sentence narrative arc — where did this story start and where is it heading?",
  "events": [
    {
      "date": "Month Year or 'Q1 2025' format",
      "headline": "What happened (10 words max)",
      "significance": "Why this moment mattered for investors or the broader economy (1-2 sentences)",
      "type": "origin"
    }
  ],
  "whatToWatch": [
    "Specific signal or indicator to monitor",
    "Second signal",
    "Third signal"
  ]
}

Include 5-7 events spanning the story's history and future.
Event types: origin | escalation | turning_point | current | projection
Include 1-2 projection events (future outlook).
whatToWatch: exactly 3 forward-looking signals.

ARTICLE TITLE: ${articleTitle}
ARTICLE: ${article}`,
      'gpt-4o-mini',
      1200
    );

    if (!Array.isArray(result.events)) throw new Error('Invalid response structure');
    await setCachedStudioResponse('story-arc', articleText, body.articleTitle || '', result);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/studio/story-arc]', msg);
    return NextResponse.json({ error: 'Story arc generation failed' }, { status: 500 });
  }
}

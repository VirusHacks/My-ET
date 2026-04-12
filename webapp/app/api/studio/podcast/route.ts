import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateText, trimArticle } from '@/lib/openai';
import { getCachedStudioResponse, setCachedStudioResponse } from '@/lib/db/cache';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { articleTitle?: string; articleText?: string; sector?: string };
  const { articleTitle = '', articleText = '', sector = 'Finance' } = body;
  const article = trimArticle(articleText, 2500);

  try {
    const cached = await getCachedStudioResponse('podcast', articleText);
    if (cached) return NextResponse.json(cached);

    const script = await generateText(
      `You are a charismatic podcast host for "ET Markets Daily", a 5-minute financial podcast for Indian ${sector} professionals. 
Your style: conversational, sharp, authoritative — like a smarter friend who works in finance.
Never say "In today's episode" — just dive straight in.`,
      `Write a ~3-minute podcast script (around 450 words) about this news story. Structure:

[HOST] (intro hook — a surprising stat or provocative question, 1-2 sentences)
[HOST] (context: what happened and why it matters, 2-3 sentences)
[ANALYSIS] (the bull case — why optimists like this, 2 sentences)
[ANALYSIS] (the bear case — the risks, 2 sentences)
[HOST] (the so-what for ${sector} professionals — practical implication, 2-3 sentences)
[HOST] (closing: one thing to watch for, 1-2 sentences)

Use natural spoken language. Contractions are good. Short sentences. No jargon without explanation.

ARTICLE TITLE: ${articleTitle}
ARTICLE: ${article}`,
      'gpt-4o-mini',
      700
    );

    await setCachedStudioResponse('podcast', articleText, body.articleTitle || '', { script });
    return NextResponse.json({ script });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/studio/podcast]', msg);
    return NextResponse.json({ error: 'Podcast script generation failed' }, { status: 500 });
  }
}

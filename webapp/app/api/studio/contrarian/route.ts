import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateJSON, trimArticle } from '@/lib/openai';
import { getCachedStudioResponse, setCachedStudioResponse } from '@/lib/db/cache';

export interface ContraryView {
  headline: string; mainArgument: string; whoBelieves: string;
  counterToMainNarrative: string;
  supportingPoints: { point: string; reasoning: string }[];
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { articleTitle?: string; articleText?: string; sector?: string };
  const { articleTitle = '', articleText = '', sector = 'Finance' } = body;
  const article = trimArticle(articleText, 2500);

  try {
    const cached = await getCachedStudioResponse('contrarian', articleText);
    if (cached) return NextResponse.json(cached);

    const result = await generateJSON<ContraryView>(
      `You are a contrarian financial analyst for ${sector} professionals. Challenge mainstream narratives with credible, data-backed alternative views.`,
      `Present a compelling contrarian case against the main narrative of this article. Return a JSON object with EXACTLY these fields:
{
  "headline": "Contrarian take as a punchy, provocative headline (max 12 words)",
  "mainArgument": "The core contrarian thesis in 2 clear sentences",
  "whoBelieves": "Which credible investors or analysts hold this contrarian view and why",
  "counterToMainNarrative": "The single most powerful factual counterpoint to the article's main claim",
  "supportingPoints": [
    { "point": "Short title (3-5 words)", "reasoning": "Specific reasoning with data, precedent, or logic" },
    { "point": "Second point", "reasoning": "..." },
    { "point": "Third point", "reasoning": "..." }
  ]
}

Include exactly 3 supporting points. Be analytical, not cynical.

ARTICLE TITLE: ${articleTitle}
ARTICLE: ${article}`,
      'gpt-4o-mini',
      900
    );
    await setCachedStudioResponse('contrarian', articleText, body.articleTitle || '', result);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/studio/contrarian]', msg);
    return NextResponse.json({ error: 'Contrarian view generation failed' }, { status: 500 });
  }
}

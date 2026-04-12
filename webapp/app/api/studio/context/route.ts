import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateJSON, trimArticle } from '@/lib/openai';
import { getCachedStudioResponse, setCachedStudioResponse } from '@/lib/db/cache';

export interface ContextTerm {
  term: string; shortDef: string; deeperExplanation: string;
  indianContext: string; relatedTerms: string[];
}
export interface ContextResult {
  backgroundContext: string; keyTerms: ContextTerm[];
  whyItMatters: string; historicalAnalogy: string;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { articleTitle?: string; articleText?: string; sector?: string };
  const { articleTitle = '', articleText = '', sector = 'Finance' } = body;
  const article = trimArticle(articleText, 2500);

  try {
    const cached = await getCachedStudioResponse('context', articleText);
    if (cached) return NextResponse.json(cached);

    const result = await generateJSON<ContextResult>(
      `You are a financial educator for ${sector} professionals in India. Return structured JSON context for news articles.`,
      `Analyze this article and return a JSON object with EXACTLY these fields:
{
  "backgroundContext": "2-3 sentences of essential background a reader needs",
  "whyItMatters": "Why this matters specifically for ${sector} professionals in India (2 sentences)",
  "historicalAnalogy": "A historical parallel starting with 'This echoes...' or 'Similar to when...' (1-2 sentences)",
  "keyTerms": [
    {
      "term": "Technical term from the article",
      "shortDef": "Plain English definition in one line",
      "deeperExplanation": "2 sentences explaining nuance and implications",
      "indianContext": "How this specifically applies in the Indian market",
      "relatedTerms": ["related1", "related2", "related3"]
    }
  ]
}

Include 3-4 key terms. Focus on terms that a ${sector} professional would find most useful.

ARTICLE TITLE: ${articleTitle}
ARTICLE: ${article}`,
      'gpt-4o-mini',
      1200
    );
    
    await setCachedStudioResponse('context', articleText, body.articleTitle || '', result);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/studio/context]', msg);
    return NextResponse.json({ error: 'Context generation failed' }, { status: 500 });
  }
}

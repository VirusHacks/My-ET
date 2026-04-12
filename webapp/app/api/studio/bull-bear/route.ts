import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateJSON, trimArticle } from '@/lib/openai';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getCachedStudioResponse, setCachedStudioResponse } from '@/lib/db/cache';

export interface AnalysisPoint {
  point: string; explanation: string; confidence: 'high' | 'medium' | 'low';
}
export interface BullBearResult {
  bullish: AnalysisPoint[]; bearish: AnalysisPoint[]; orchestratorVerdict: string; bullishPercentage: number;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { articleText?: string; articleTitle?: string; sector?: string };
  const { articleText = '', articleTitle = '' } = body;
  if (!articleText) return NextResponse.json({ error: 'articleText is required' }, { status: 400 });

  let sector = body.sector ?? 'Finance';
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user) sector = user.sector;
  } catch { /* use default */ }

  const article = trimArticle(articleText, 2500);

  try {
    const cached = await getCachedStudioResponse('bull-bear', articleText);
    if (cached) return NextResponse.json(cached);

    const result = await generateJSON<BullBearResult>(
      `You are a dual financial analyst system for ${sector} professionals in India. You run two agents (Bull and Bear) and then synthesize a verdict.`,
      `Analyze this article from both bullish and bearish perspectives. Return a JSON object with EXACTLY these fields:
{
  "bullish": [
    { "point": "Short title (3-5 words)", "explanation": "Specific evidence from the article supporting a positive view, with data if available", "confidence": "high" },
    { "point": "Second bullish signal", "explanation": "...", "confidence": "medium" },
    { "point": "Third bullish signal", "explanation": "...", "confidence": "low" }
  ],
  "bearish": [
    { "point": "Short title (3-5 words)", "explanation": "Specific risk or negative signal from the article, with data if available", "confidence": "high" },
    { "point": "Second risk", "explanation": "...", "confidence": "medium" },
    { "point": "Third risk", "explanation": "...", "confidence": "low" }
  ],
  "orchestratorVerdict": "Direct 2-sentence verdict for a ${sector} professional. What is the net signal? What should they do? No hedging.",
  "bullishPercentage": 65
}

confidence must be one of: high, medium, low
Include exactly 3 bullish and 3 bearish points.
bullishPercentage must be an integer from 0 to 100 representing the net weight of the bullish vs bearish arguments.

ARTICLE TITLE: ${articleTitle}
ARTICLE: ${article}`,
      'gpt-4o-mini',
      1000
    );

    const finalData = {
      bullish: Array.isArray(result.bullish) ? result.bullish : [],
      bearish: Array.isArray(result.bearish) ? result.bearish : [],
      orchestratorVerdict: result.orchestratorVerdict ?? 'Weigh the signals above for your portfolio decision.',
      bullishPercentage: result.bullishPercentage || 50,
    };

    await setCachedStudioResponse('bull-bear', articleText, articleTitle, finalData);
    return NextResponse.json(finalData);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/studio/bull-bear]', msg);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}

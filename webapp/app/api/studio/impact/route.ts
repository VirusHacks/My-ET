import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateJSON, trimArticle } from '@/lib/openai';
import { getCachedStudioResponse, setCachedStudioResponse } from '@/lib/db/cache';

export interface ImpactCategory {
  label: string;
  score: number;        // 0-100
  direction: 'positive' | 'negative' | 'neutral';
  reasoning: string;
}
export interface ImpactResult {
  overallScore: number;         // 0-100
  overallSentiment: 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish';
  headline: string;             // one-line verdict
  categories: ImpactCategory[];
  affectedStocks: { ticker: string; exchange: string; impact: 'positive' | 'negative' | 'neutral'; reason: string }[];
  timeHorizon: 'short_term' | 'medium_term' | 'long_term';
  confidence: number;           // 0-100
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { articleTitle?: string; articleText?: string; sector?: string };
  const { articleTitle = '', articleText = '', sector = 'Finance' } = body;
  const article = trimArticle(articleText, 2500);

  try {
    const cached = await getCachedStudioResponse('impact', articleText);
    if (cached) return NextResponse.json(cached);

    const result = await generateJSON<ImpactResult>(
      `You are a quantitative analyst scoring the market impact of financial news for ${sector} professionals in India. Be precise with scores.`,
      `Score the market impact of this news article. Return a JSON object with EXACTLY these fields:
{
  "overallScore": 73,
  "overallSentiment": "bullish",
  "headline": "One punchy sentence verdict on the net market impact",
  "timeHorizon": "medium_term",
  "confidence": 78,
  "categories": [
    { "label": "Market Sentiment",    "score": 72, "direction": "positive", "reasoning": "Why and how much impact on sentiment" },
    { "label": "Sector Fundamentals", "score": 65, "direction": "positive", "reasoning": "Impact on underlying business fundamentals" },
    { "label": "Regulatory Risk",     "score": 30, "direction": "negative", "reasoning": "Regulatory or policy risk assessment" },
    { "label": "Investor Confidence", "score": 80, "direction": "positive", "reasoning": "Effect on institutional and retail investor confidence" }
  ],
  "affectedStocks": [
    { "ticker": "RELIANCE", "exchange": "NSE", "impact": "positive", "reason": "1 sentence why" },
    { "ticker": "ONGC",     "exchange": "NSE", "impact": "negative", "reason": "1 sentence why" }
  ]
}

Score rules: 0=very negative, 50=neutral, 100=very positive.
overallSentiment: very_bullish | bullish | neutral | bearish | very_bearish
timeHorizon: short_term (< 1 month) | medium_term (1-6 months) | long_term (> 6 months)
confidence: how confident you are in this assessment (0-100)
Include 2-4 affected stocks/companies mentioned or closely related to the article. Use real NSE/BSE tickers.

ARTICLE TITLE: ${articleTitle}
ARTICLE: ${article}`,
      'gpt-4o-mini',
      1000
    );

    await setCachedStudioResponse('impact', articleText, body.articleTitle || '', result);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/studio/impact]', msg);
    return NextResponse.json({ error: 'Impact analysis failed' }, { status: 500 });
  }
}

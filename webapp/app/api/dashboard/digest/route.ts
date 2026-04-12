/**
 * GET /api/dashboard/digest
 *
 * Uses Tavily search (include_answer) to produce:
 *  - A pre-synthesized "Your 5 Things" answer
 *  - Source articles with titles + urls
 *
 * NO Gemini call — Tavily does the synthesis via include_answer.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

interface TavilyResponse {
  answer?: string;
  results?: TavilyResult[];
}

async function tavilySearch(query: string, domains?: string[]): Promise<TavilyResponse> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return {};

  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      topic: 'news',
      search_depth: 'basic',       // basic = faster, still gets answer
      include_answer: true,
      max_results: 6,
      days: 1,                     // only today's news
      ...(domains ? { include_domains: domains } : {}),
    }),
  });

  if (!res.ok) throw new Error(`Tavily ${res.status}`);
  return res.json() as Promise<TavilyResponse>;
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sector = req.nextUrl.searchParams.get('sector') ?? 'Finance';

  try {
    // One Tavily call: today's top news for this sector in India
    const query = `${sector} India market news today top stories 2026`;
    const data = await tavilySearch(query, [
      'economictimes.indiatimes.com',
      'livemint.com',
      'business-standard.com',
      'financialexpress.com',
      'moneycontrol.com',
    ]);

    // Tavily's `answer` is already a synthesized summary
    const digest = data.answer ?? null;

    // Top sourced articles (high-score only)
    const sources = (data.results ?? [])
      .filter(r => r.score > 0.3)
      .slice(0, 5)
      .map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.content.slice(0, 160),
        publishedDate: r.published_date,
      }));

    return NextResponse.json({ digest, sources, sector, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[/api/dashboard/digest]', err);
    return NextResponse.json({ error: 'Digest unavailable' }, { status: 500 });
  }
}

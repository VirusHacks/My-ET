/**
 * GET /api/dashboard/category-ai
 *
 * Generates AI-powered category fallback data when RSS feed is empty.
 * Uses Tavily for fresh data + GPT-4o-mini for structuring.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateJSON } from '@/lib/openai';

interface TavilyResult {
  title: string; url: string; content: string; score: number;
}

async function tavilySearch(query: string): Promise<{ results: TavilyResult[]; answer?: string }> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return { results: [] };
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      topic: 'news',
      search_depth: 'basic',
      include_answer: true,
      max_results: 5,
      days: 3,
      include_domains: ['economictimes.indiatimes.com', 'moneycontrol.com', 'livemint.com'],
    }),
  });
  if (!res.ok) return { results: [] };
  return res.json() as Promise<{ results: TavilyResult[]; answer?: string }>;
}

export interface CategoryAIData {
  summary: string;
  bullets: string[];
  chartData: Array<{ name: string; value: number }>;
  chartType: 'bar' | 'line' | 'area';
  headline: string;
  sources: { title: string; url: string }[];
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const category = req.nextUrl.searchParams.get('category') ?? 'Markets';
  const sector = req.nextUrl.searchParams.get('sector') ?? 'Finance';

  const query = `Top 5 news stories for ${category} in ${sector} sector India today`;
  const tavilyData = await tavilySearch(query);

  const systemPrompt = `You are a financial analyst. Based on the news provided, generate a summary and structured data for a dashboard.
For the chartData, create 5-6 data points representing a relevant trend (e.g., if category is 'Markets', show a mock index trend; if 'Startups', show recent mock funding volumes). 
Ensure 'value' is a number. 
Return ONLY JSON.`;

  const userPrompt = `Category: ${category}
Sector: ${sector}
News: ${tavilyData.answer ?? ''}
${tavilyData.results.map(r => `[${r.title}]: ${r.content.slice(0, 200)}`).join('\n')}

{
  "summary": "2-3 sentence overview of the current state",
  "bullets": ["Bullet 1", "Bullet 2", "Bullet 3"],
  "chartData": [{"name": "Jan", "value": 100}, ...],
  "chartType": "bar" | "line" | "area",
  "headline": "One catchy summary headline",
  "sources": [{"title": "...", "url": "..."}]
}`;

  try {
    const aiData = await generateJSON<CategoryAIData>(systemPrompt, userPrompt);
    return NextResponse.json(aiData);
  } catch (err) {
    console.error('[/api/dashboard/category-ai]', err);
    return NextResponse.json({ error: 'Failed to generate category AI' }, { status: 500 });
  }
}

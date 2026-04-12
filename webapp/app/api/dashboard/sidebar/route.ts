/**
 * GET /api/dashboard/sidebar
 * 
 * Fetches AI-driven sidebar intelligence:
 * 1. Market Sentiment (Fear/Greed 0-100)
 * 2. Trending Topics (Extracted from headlines)
 * 3. Daily AI Pick (Recommendation)
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
      max_results: 8,
      days: 1,
      include_domains: ['economictimes.indiatimes.com', 'moneycontrol.com', 'livemint.com'],
    }),
  });
  if (!res.ok) return { results: [] };
  return res.json() as Promise<{ results: TavilyResult[]; answer?: string }>;
}

export interface SidebarAIData {
  sentiment: number;       // 0-100 (Fear to Greed)
  sentimentLabel: string;  // e.g. "Extreme Greed"
  trending: string[];      // ["Adani", "RBI Repo", "Nifty ATH"]
  recommendation: {
    title: string;
    reason: string;        // 1-sentence "Why it matters"
    url: string;
  };
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sector = req.nextUrl.searchParams.get('sector') ?? 'Finance';

  // Fetch today's top finance/market news for sentiment
  const query = `Top 8 India market news stories today for ${sector}`;
  const tavilyData = await tavilySearch(query);

  const headlines = tavilyData.results.map(r => r.title).join('\n');

  const systemPrompt = `You are a financial news intelligence analyst. Analyze today's top headlines and return a structured JSON object for a dashboard sidebar.
1. sentiment: A number from 0 to 100 where 0 is Extreme Fear (market crash vibes) and 100 is Extreme Greed (strong rally vibes). 
2. trending: 5-6 short, punchy trending terms from the news (e.g., "RBI Repo Rate", "Zomato Q4").
3. recommendation: Pick ONE standout story from the news and give a 1-sentence reason why a ${sector} professional must read it.
Return ONLY JSON.`;

  const userPrompt = `Sector: ${sector}
Headlines:
${headlines}

{
  "sentiment": 72,
  "sentimentLabel": "Greed",
  "trending": ["Term 1", "Term 2"],
  "recommendation": {
    "title": "Headline",
    "reason": "Why it matters",
    "url": "..."
  }
}`;

  try {
    const aiData = await generateJSON<SidebarAIData>(systemPrompt, userPrompt);
    return NextResponse.json(aiData);
  } catch (err) {
    console.error('[/api/dashboard/sidebar]', err);
    // Safe fallback
    return NextResponse.json({
      sentiment: 50,
      sentimentLabel: 'Neutral',
      trending: ['Indian Markets', 'Economy', 'Global Outlook'],
      recommendation: {
        title: 'Market Overview',
        reason: 'Stay updated with today\'s key movements.',
        url: 'https://economictimes.indiatimes.com'
      }
    } as SidebarAIData);
  }
}

/**
 * GET /api/globe/hotspots
 *
 * Fetches trending geopolitical business news via Tavily,
 * then uses GPT-4o-mini to extract structured hotspot data
 * with coordinates for map rendering.
 *
 * Cached via SHA-256 hashing in NeonDB.
 */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getCachedStudioResponse, setCachedStudioResponse } from '@/lib/db/cache';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

async function tavilySearch(query: string): Promise<{ answer?: string; results?: TavilyResult[] }> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return {};

  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      topic: 'news',
      search_depth: 'advanced',
      include_answer: true,
      max_results: 10,
      days: 2,
    }),
  });
  if (!res.ok) throw new Error(`Tavily ${res.status}`);
  return res.json();
}

export interface Hotspot {
  id: string;
  title: string;
  summary: string;
  lat: number;
  lng: number;
  region: string;
  country: string;
  category: 'conflict' | 'trade' | 'policy' | 'markets' | 'energy' | 'diplomacy';
  severity: number;
  sourceUrl?: string;
}

export interface HotspotsResponse {
  hotspots: Hotspot[];
  marketContext: string | null;
  generatedAt: string;
}

const SYSTEM_PROMPT = `You are a geopolitical intelligence analyst. Given raw news snippets, extract the top 8-12 most important geopolitical business hotspots happening RIGHT NOW around the world.

For each hotspot, provide:
- id: a short kebab-case identifier (e.g. "us-china-tariffs")
- title: a concise headline (max 12 words)
- summary: a 2-sentence explanation of the situation and its business/market impact
- lat: latitude of the primary location (precise decimal)
- lng: longitude of the primary location (precise decimal)
- region: the broader region (e.g. "South Asia", "Middle East", "Europe", "North America", "East Asia", "Southeast Asia", "Africa", "Latin America")
- country: the primary country involved
- category: one of "conflict", "trade", "policy", "markets", "energy", "diplomacy"
- severity: 1-5 (1=minor, 5=critical global impact)
- sourceUrl: the URL of the most relevant source (if available)

Also provide a "marketContext" field: a 1-sentence summary of how global markets are being affected overall.

IMPORTANT: Ensure hotspots are geographically diverse (at least 4 different regions). Include a mix of categories. Use ACCURATE coordinates for the cities/countries mentioned.

Return valid JSON only: { "hotspots": [...], "marketContext": "..." }`;

export async function GET(_req: NextRequest) {
  try {
    const hourKey = new Date().toISOString().slice(0, 13); // cache per hour

    const cached = await getCachedStudioResponse('globe-hotspots', hourKey);
    if (cached) {
      return NextResponse.json({
        ...(cached as object),
        generatedAt: new Date().toISOString(),
      });
    }

    // Fetch diverse geopolitical news
    const [geopolitical, markets, energy] = await Promise.all([
      tavilySearch('top geopolitical news affecting global business today 2026'),
      tavilySearch('global stock market news trade wars sanctions today'),
      tavilySearch('energy oil gas supply chain disruptions geopolitics today'),
    ]);

    const allSnippets = [
      geopolitical.answer ?? '',
      ...(geopolitical.results ?? []).map(r => `${r.title}: ${r.content.slice(0, 400)}\nSource: ${r.url}`),
      ...(markets.results ?? []).slice(0, 3).map(r => `${r.title}: ${r.content.slice(0, 300)}\nSource: ${r.url}`),
      ...(energy.results ?? []).slice(0, 3).map(r => `${r.title}: ${r.content.slice(0, 300)}\nSource: ${r.url}`),
    ].join('\n\n---\n\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Raw news intelligence:\n\n${allSnippets}` },
      ],
      temperature: 0.3,
    });

    const parsed = JSON.parse(completion.choices[0].message.content ?? '{}') as {
      hotspots?: Hotspot[];
      marketContext?: string;
    };

    const result: HotspotsResponse = {
      hotspots: parsed.hotspots ?? [],
      marketContext: parsed.marketContext ?? null,
      generatedAt: new Date().toISOString(),
    };

    // Cache the result
    setCachedStudioResponse('globe-hotspots', hourKey, 'globe', result).catch(() => {});

    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/globe/hotspots]', err);
    return NextResponse.json({ error: 'Failed to fetch hotspots' }, { status: 500 });
  }
}

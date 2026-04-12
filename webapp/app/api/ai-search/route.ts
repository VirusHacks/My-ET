/**
 * POST /api/ai-search
 *
 * Production-grade Generative UI Search Engine:
 *  Stage 0: Intent + Ticker extraction (1 fast GPT call, <500ms)
 *  Stage 1: Parallel data acquisition — Yahoo Finance (hard quotes) + Tavily (live news)
 *  Stage 2: Grounded synthesis — GPT merges hard data with news narrative
 *
 * Chart data for stocks comes 100% from Yahoo Finance.
 * Chart data for market/compare is AI-synthesized from news signals.
 * All arrays are guaranteed to be valid (never null/undefined).
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateJSON } from '@/lib/openai';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface TavilyResult { title: string; url: string; content: string; score: number; }

export type SearchResultType = 'stock' | 'market' | 'news' | 'compare' | 'general';

export interface StockResult {
  type: 'stock';
  name: string;
  symbol: string;
  value: string;
  change: string;
  pct: string;
  direction: 'up' | 'down' | 'flat';
  context: string;           // AI synthesized narrative from Tavily news
  chartData: { name: string; value: number }[]; // Hard Yahoo Finance data
  sources: { title: string; url: string }[];
}

export interface MarketResult {
  type: 'market';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  headline: string;
  bullets: string[];
  indices: { name: string; value: string; pct: string; direction: 'up' | 'down' | 'flat' }[];
  chartData: { name: string; value: number }[];
  sources: { title: string; url: string }[];
}

export interface NewsResult {
  type: 'news';
  answer: string;
  bullets: string[];
  sources: { title: string; url: string; snippet: string }[];
}

export interface CompareResult {
  type: 'compare';
  entity1: string;
  entity2: string;
  rows: { label: string; val1: string; val2: string; winner?: 1 | 2 | null }[];
  chartData: { name: string; val1: number; val2: number }[];
  verdict: string;
  sources: { title: string; url: string }[];
}

export interface GeneralResult {
  type: 'general';
  answer: string;
  bullets: string[];
  sources: { title: string; url: string }[];
}

export type SearchResult = StockResult | MarketResult | NewsResult | CompareResult | GeneralResult;

// ─── Data Fetchers ─────────────────────────────────────────────────────────────
async function tavilySearch(query: string): Promise<{ results: TavilyResult[]; answer?: string }> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return { results: [] };
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        topic: 'news',
        search_depth: 'advanced',
        include_answer: true,
        max_results: 6,
        days: 5,
        include_domains: [
          'economictimes.indiatimes.com', 'moneycontrol.com',
          'livemint.com', 'business-standard.com', 'nseindia.com',
          'bseindia.com', 'thehindu.com', 'financialexpress.com',
        ],
      }),
    });
    if (!res.ok) return { results: [] };
    return res.json();
  } catch {
    return { results: [] };
  }
}

interface YahooChartData {
  symbol: string;
  companyName: string;
  price: string;
  rawPrice: number;
  change: string;
  pct: string;
  direction: 'up' | 'down' | 'flat';
  chartData: { name: string; value: number }[];
}

async function fetchYahooChart(ticker: string): Promise<YahooChartData | null> {
  try {
    // Try query1 first, then query2 as fallback
    const urls = [
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=7d`,
      `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=7d`,
    ];

    let data: any = null;
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
          next: { revalidate: 60 },
        });
        if (res.ok) { data = await res.json(); break; }
      } catch { continue; }
    }

    if (!data) return null;
    const result = data.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const rawPrice = meta.regularMarketPrice ?? 0;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? rawPrice;
    const diff = rawPrice - prevClose;
    const pctChange = prevClose > 0 ? (diff / prevClose) * 100 : 0;

    // Build 7-day chart from real timestamps + closing prices
    const timestamps: number[] = result.timestamp || [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];
    const chartData = timestamps
      .map((ts, i) => ({
        name: new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Number((closes[i] ?? 0).toFixed(2)),
      }))
      .filter(d => d.value > 0);

    return {
      symbol: meta.symbol ?? ticker,
      companyName: meta.shortName ?? meta.longName ?? ticker,
      price: rawPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      rawPrice,
      change: (diff >= 0 ? '+' : '') + diff.toFixed(2),
      pct: (diff >= 0 ? '+' : '') + pctChange.toFixed(2) + '%',
      direction: diff > 0.005 ? 'up' : diff < -0.005 ? 'down' : 'flat',
      chartData,
    };
  } catch (err) {
    console.error(`[Yahoo] ${ticker} failed:`, err);
    return null;
  }
}

// ─── Main Handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let query = '', sector = 'Finance';
  try {
    const body = await req.json();
    query = (body.query ?? '').trim();
    sector = body.sector ?? 'Finance';
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!query) return NextResponse.json({ error: 'Query is required' }, { status: 400 });

  try {
    // ── Stage 0: Classify intent & extract Yahoo ticker ──────────────────────
    const routerResult = await generateJSON<{ intent: SearchResultType; yahooTicker: string | null }>(
      `You are a routing agent for Indian financial queries. Analyze the user's query and output ONLY valid JSON with two keys:
- "intent": one of "stock" | "market" | "news" | "compare" | "general"
  - "stock": user asks about a specific company's stock price, chart, or performance (e.g., "How is Reliance doing?")
  - "market": user asks about broad indices or overall market (e.g., "How is the market today?", "Nifty performance")
  - "news": user asks about a news event, policy, or fact (e.g., "What is SEBI's new rule?")
  - "compare": user compares two stocks/entities (e.g., "TCS vs Infosys")
  - "general": anything else about finance, economy, or investing
- "yahooTicker": ONLY if intent is "stock", provide the most likely NSE/BSE Yahoo Finance ticker (examples: RELIANCE.NS, TCS.NS, INFY.NS, HDFCBANK.NS, TATAMOTORS.NS, WIPRO.NS, BAJFINANCE.NS, ADANIENT.NS, SBIN.NS, ITC.NS). Otherwise null.`,
      `Classify: "${query}"`,
      'gpt-4o-mini',
      120,
    ).catch(() => ({ intent: 'general' as SearchResultType, yahooTicker: null }));

    // ── Stage 1: Parallel data acquisition ──────────────────────────────────
    const [tavilyData, yahooData] = await Promise.all([
      tavilySearch(`${query} India stock market ${sector} 2025 2026`),
      routerResult.intent === 'stock' && routerResult.yahooTicker
        ? fetchYahooChart(routerResult.yahooTicker)
        : Promise.resolve(null),
    ]);

    const newsContext = tavilyData.results
      .slice(0, 5)
      .map((r, i) => `[Source ${i + 1} – ${r.title}]\n${r.content.slice(0, 300)}`)
      .join('\n\n');

    const sourceList = tavilyData.results
      .slice(0, 6)
      .map(r => `{ "title": "${r.title.replace(/"/g, "'")}", "url": "${r.url}" }`)
      .join(',\n');

    // ── Stage 2: Grounded synthesis ─────────────────────────────────────────
    const hardDataSection = yahooData
      ? `
===HARD MARKET DATA (USE EXACTLY — DO NOT MODIFY THESE VALUES)===
Company Name: ${yahooData.companyName}
Ticker Symbol: ${yahooData.symbol}
Current Price: ₹${yahooData.price}
Change: ${yahooData.change} (${yahooData.pct})
Direction: ${yahooData.direction}
7-Day Chart Data (real daily closes): ${JSON.stringify(yahooData.chartData)}
===END HARD DATA===

For the "stock" schema, you MUST use the above values EXACTLY as given for name, symbol, value, change, pct, direction, and chartData.
`
      : '';

    const systemPrompt = `You are an elite Indian financial intelligence engine. Given search results and optional hard market data, output a single valid JSON object matching one of these schemas exactly.

${hardDataSection}

SCHEMAS (return ONLY one, with type field):

"stock" schema (use when hard data is provided above):
{
  "type": "stock",
  "name": "<company full name from hard data>",
  "symbol": "<NSE symbol from hard data>",
  "value": "<exact price string from hard data e.g. '1,234.56'>",
  "change": "<exact change from hard data e.g. '+12.34'>",
  "pct": "<exact percentage from hard data e.g. '+1.23%'>",
  "direction": "<exact direction from hard data: up|down|flat>",
  "context": "<2-3 sentence AI narrative synthesized from news explaining WHY the stock moved>",
  "chartData": <exact 7-day array from hard data>,
  "sources": [{"title":"...","url":"..."}] (3-5 from available sources)
}

"market" schema:
{
  "type": "market",
  "sentiment": "bullish|bearish|neutral",
  "headline": "<sharp 1-line market summary>",
  "bullets": ["<3-4 concise intelligence bullets from news>"],
  "indices": [{"name":"Nifty 50","value":"25,123","pct":"+0.8%","direction":"up"}, ...] (3-4 indices),
  "chartData": [{"name":"Nifty","value":72},{"name":"Bank Nifty","value":58},...] (4-5 sector strength scores 0-100 based on news),
  "sources": [{"title":"...","url":"..."}]
}

"news" schema:
{
  "type": "news",
  "answer": "<direct, confident answer in 1-2 sentences>",
  "bullets": ["<4-5 specific facts or implications from the search results>"],
  "sources": [{"title":"...","url":"...","snippet":"<1 key quote from article>"}]
}

"compare" schema:
{
  "type": "compare",
  "entity1": "<entity name 1>",
  "entity2": "<entity name 2>",
  "rows": [{"label":"Market Cap","val1":"₹18L Cr","val2":"₹6L Cr","winner":1}, ...] (4-5 rows),
  "chartData": [{"name":"Revenue","val1":80,"val2":60},...] (3-4 relative metrics 0-100),
  "verdict": "<1 sentence verdict from the comparison>",
  "sources": [{"title":"...","url":"..."}]
}

"general" schema:
{
  "type": "general",
  "answer": "<clear, helpful answer>",
  "bullets": ["<3-5 relevant points>"],
  "sources": [{"title":"...","url":"..."}]
}

RULES:
- Return ONLY the JSON object. No markdown, no backticks, no explanation.
- All arrays must be valid arrays (never null). Empty array [] if no data.
- If you have hard data, use the "stock" schema. Otherwise pick the best schema.
- Sources must come from the provided list only.
- Context/bullets must be grounded in the news, not hallucinated.`;

    const userPrompt = `User query: "${query}"
Sector context: ${sector}
Detected intent: ${routerResult.intent}

News search results:
${newsContext || 'No news results available.'}

Available sources:
[${sourceList}]

${tavilyData.answer ? `Tavily summary: ${tavilyData.answer}` : ''}`;

    const result = await generateJSON<SearchResult>(systemPrompt, userPrompt, 'gpt-4o-mini', 1500);

    // Post-process: guarantee all arrays exist and are valid
    const safe = result as any;
    if (!Array.isArray(safe.sources)) safe.sources = [];
    if (!Array.isArray(safe.bullets)) safe.bullets = [];
    if (!Array.isArray(safe.chartData)) safe.chartData = [];
    if (!Array.isArray(safe.indices)) safe.indices = [];
    if (!Array.isArray(safe.rows)) safe.rows = [];

    return NextResponse.json(safe);

  } catch (err) {
    console.error('[/api/ai-search] Fatal error:', err);
    const fallback: GeneralResult = {
      type: 'general',
      answer: 'I was unable to fetch live market data right now. Please try again in a moment.',
      bullets: ['This could be due to a temporary API issue.', 'Try rephrasing your question for better results.'],
      sources: [],
    };
    return NextResponse.json(fallback);
  }
}

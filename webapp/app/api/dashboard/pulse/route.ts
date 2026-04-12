/**
 * /api/dashboard/pulse/route.ts
 *
 * Fetches real-time market data for Indian indices & commodities.
 * Uses Yahoo Finance v8 Chart API for raw prices (most reliable free source).
 * Uses Tavily for the "AI Read" summary.
 */
import { NextRequest, NextResponse } from 'next/server';

const SYMBOLS = ['^NSEI', '^BSESN', '^NSEBANK', 'USDINR=X'];
const SYMBOL_CONFIG: Record<string, { label: string; name: string }> = {
  '^NSEI':    { label: 'NIFTY',      name: 'Nifty 50' },
  '^BSESN':   { label: 'SENSEX',     name: 'Sensex' },
  '^NSEBANK': { label: 'BANKNIFTY',  name: 'Nifty Bank' },
  'USDINR=X': { label: 'USDINR',     name: 'USD/INR' },
  // 'CL=F':     { label: 'CRUDE',      name: 'Crude Oil' },
};

export interface PulseIndex {
  name: string;
  symbol: string;
  value: string | null;
  change: string | null;
  pct: string | null;
  direction: 'up' | 'down' | 'flat';
  sourceUrl?: string;
}

export interface PulseResponse {
  indices: PulseIndex[];
  interpretation: string | null;
  generatedAt: string;
}

/** Fetch data for a single symbol from Yahoo Finance Chart API */
async function fetchYahooPrice(symbol: string): Promise<PulseIndex> {
  const config = SYMBOL_CONFIG[symbol];
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
    const res = await fetch(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 60 } // Cache for 1 minute
    });
    
    if (!res.ok) throw new Error(`Yahoo status ${res.status}`);
    
    const data = await res.json();
    const meta = data.chart?.result?.[0]?.meta;
    
    if (!meta) throw new Error('No metadata in response');

    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.previousClose;
    const diff = price - prevClose;
    const pctChange = (diff / prevClose) * 100;

    return {
      name: config.name,
      symbol: config.label,
      value: price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      change: diff.toFixed(2),
      pct: `${diff >= 0 ? '+' : ''}${pctChange.toFixed(2)}%`,
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat',
      sourceUrl: `https://finance.yahoo.com/quote/${symbol}`
    };
  } catch (err) {
    console.error(`[Pulse API] Failed for ${symbol}:`, err instanceof Error ? err.message : err);
    return {
      name: config.name,
      symbol: config.label,
      value: null,
      change: null,
      pct: null,
      direction: 'flat'
    };
  }
}

/** Get overall market interpretation from Tavily */
async function fetchTavilyInterpretation(): Promise<string | null> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return null;
  
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: 'Indian stock market today Nifty Sensex opening closing analysis',
        include_answer: true,
        search_depth: 'basic'
      }),
    });
    const data = await res.json();
    return data.answer || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Run all fetches in parallel
    const [indices, interpretation] = await Promise.all([
      Promise.all(SYMBOLS.map(fetchYahooPrice)),
      fetchTavilyInterpretation()
    ]);

    return NextResponse.json({
      indices,
      interpretation,
      generatedAt: new Date().toISOString()
    } satisfies PulseResponse);
  } catch (err) {
    console.error('[/api/dashboard/pulse] Global error:', err);
    return NextResponse.json({ error: 'Failed to fetch pulse data' }, { status: 500 });
  }
}

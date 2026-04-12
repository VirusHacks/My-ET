import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, context: { params: Promise<{ ticker: string }> }) {
  try {
    const params = await context.params;
    let ticker = params.ticker.toUpperCase();
    
    // Auto-append .NS for Indian stocks if no exchange is provided
    if (!ticker.includes('.')) {
      ticker += '.NS';
    }

    // Fetch 1-day range with 5-minute intervals
    // Using Yahoo Finance anonymous public endpoint
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1d&interval=5m`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      next: { revalidate: 60 }, // Cache on edge for 60s
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch data for ${ticker}` }, { status: response.status });
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result) {
      return NextResponse.json({ error: 'No chart data available' }, { status: 404 });
    }

    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0];
    
    const prices = quotes?.close || [];
    
    // Zip timestamps and prices into an array of objects for Recharts
    const chartData = timestamps.map((time: number, index: number) => ({
      time: new Date(time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: prices[index],
    })).filter((pt: any) => pt.price !== null); // Remove nulls from pre-market gaps

    return NextResponse.json({
      ticker: meta.symbol,
      currency: meta.currency,
      regularMarketPrice: meta.regularMarketPrice,
      previousClose: meta.chartPreviousClose,
      percentChange: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100,
      chartData,
    });
  } catch (error) {
    console.error('[/api/stock]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

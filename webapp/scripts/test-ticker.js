/**
 * Test script for Yahoo Finance v8 Chart API
 */
async function testTicker() {
  const symbols = ['^NSEI', '^BSESN', 'USDINR=X', 'CL=F'];
  
  for (const sym of symbols) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1m&range=1d`;
      console.log(`Fetching ${sym}...`);
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) {
        console.error(`Failed ${sym}: ${res.status}`);
        continue;
      }
      const data = await res.json();
      const meta = data.chart?.result?.[0]?.meta;
      if (!meta) {
        console.error(`No meta for ${sym}`);
        continue;
      }
      
      const price = meta.regularMarketPrice;
      const prevClose = meta.chartPreviousClose || meta.previousClose;
      const change = price - prevClose;
      const pct = (change / prevClose) * 100;
      
      console.log(`${sym}: ${price} (${change.toFixed(2)}, ${pct.toFixed(2)}%)`);
    } catch (err) {
      console.error(`Error ${sym}:`, err);
    }
  }
}

testTicker();

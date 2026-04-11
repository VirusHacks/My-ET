/**
 * lib/search.ts — Tavily-powered deep search for the "Custom Article Builder"
 * Falls back gracefully when TAVILY_API_KEY is not configured.
 */

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate?: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  answer?: string;
}

export async function deepSearch(
  query: string,
  maxResults = 5
): Promise<SearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    console.warn('[deepSearch] TAVILY_API_KEY not set – returning empty results');
    return { query, results: [], answer: undefined };
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'advanced',
        include_answer: true,
        include_domains: ['economictimes.indiatimes.com', 'bseindia.com', 'nseindia.com', 'rbi.org.in', 'sebi.gov.in'],
        max_results: maxResults,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      query: string;
      results: Array<{
        title: string;
        url: string;
        content: string;
        score: number;
        published_date?: string;
      }>;
      answer?: string;
    };

    return {
      query: data.query,
      results: data.results.map(r => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score,
        publishedDate: r.published_date,
      })),
      answer: data.answer,
    };
  } catch (err) {
    console.error('[deepSearch] Tavily search failed:', err);
    return { query, results: [], answer: undefined };
  }
}

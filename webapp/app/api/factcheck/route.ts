/**
 * POST /api/factcheck
 *
 * Multi-source misinformation detection pipeline:
 *  1. Google Fact Check Tools API  → existing verdicts from credible orgs
 *  2. Tavily deep search            → corroborating / contradicting web sources
 *  3. News API                      → recent news articles on the same story
 *  4. Gemini synthesis              → final verdict + confidence score
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateJSON, trimArticle } from '@/lib/openai';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface FactCheckRating {
  publisher: string;
  publisherUrl?: string;
  claimReviewed: string;
  rating: string;          // e.g. "False", "Mostly True", "Misleading"
  url: string;
  date?: string;
}

export interface NewsSource {
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  description?: string;
}

export interface TavilySource {
  title: string;
  url: string;
  snippet: string;
  score: number;
  supports: boolean | null; // null = neutral/unclear
}

export interface FactCheckResult {
  claim: string;
  verdict: 'TRUE' | 'MOSTLY_TRUE' | 'MISLEADING' | 'MOSTLY_FALSE' | 'FALSE' | 'UNVERIFIABLE';
  verdictLabel: string;
  confidence: number; // 0–100
  summary: string;    // 2–3 sentence synthesis
  reasoning: string[];  // bullet points
  existingFactChecks: FactCheckRating[];
  newsSources: NewsSource[];
  tavilySources: TavilySource[];
  redFlags: string[];
  suggestVerify: string[];
}

// ─── Google Fact Check Tools API ──────────────────────────────────────────────
async function googleFactCheck(query: string): Promise<FactCheckRating[]> {
  const apiKey = process.env.FACT_CHECK_API_KEY;
  if (!apiKey) return [];

  try {
    const url = new URL('https://factchecktools.googleapis.com/v1alpha1/claims:search');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('query', query);
    url.searchParams.set('languageCode', 'en');
    url.searchParams.set('pageSize', '5');

    const res = await fetch(url.toString());
    if (!res.ok) return [];

    const data = await res.json() as {
      claims?: Array<{
        text?: string;
        claimReview?: Array<{
          publisher?: { name?: string; site?: string };
          url?: string;
          title?: string;
          reviewDate?: string;
          textualRating?: string;
        }>;
      }>;
    };

    if (!data.claims) return [];

    return data.claims.flatMap(claim =>
      (claim.claimReview ?? []).map(review => ({
        publisher: review.publisher?.name ?? 'Unknown',
        publisherUrl: review.publisher?.site ? `https://${review.publisher.site}` : undefined,
        claimReviewed: claim.text ?? '',
        rating: review.textualRating ?? 'Reviewed',
        url: review.url ?? '',
        date: review.reviewDate,
      }))
    ).slice(0, 5);
  } catch {
    return [];
  }
}

// ─── News API ─────────────────────────────────────────────────────────────────
async function newsApiSearch(query: string): Promise<NewsSource[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  try {
    const url = new URL('https://newsapi.org/v2/everything');
    url.searchParams.set('q', query);
    url.searchParams.set('language', 'en');
    url.searchParams.set('sortBy', 'relevancy');
    url.searchParams.set('pageSize', '5');
    url.searchParams.set('apiKey', apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) return [];

    const data = await res.json() as {
      articles?: Array<{
        title?: string; url?: string; source?: { name?: string };
        publishedAt?: string; description?: string;
      }>;
    };

    return (data.articles ?? []).map(a => ({
      title: a.title ?? '',
      url: a.url ?? '',
      source: a.source?.name ?? '',
      publishedAt: a.publishedAt,
      description: a.description ?? '',
    })).filter(a => a.title && a.url);
  } catch {
    return [];
  }
}

// ─── Tavily Deep Search ────────────────────────────────────────────────────────
async function tavilyFactSearch(claim: string): Promise<TavilySource[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: `fact check: ${claim}`,
        search_depth: 'basic', // Much faster than advanced, still finds fact-check sites
        include_answer: false,
        max_results: 6,
        include_domains: [
          'factcheck.org', 'politifact.com', 'snopes.com', 'reuters.com/fact-check',
          'apnews.com', 'bbc.com', 'thewire.in', 'altnews.in', 'boomlive.in',
          'vishvasnews.com', 'factcrescendo.com',
        ],
      }),
    });
    if (!res.ok) return [];
    const data = await res.json() as { results?: Array<{ title: string; url: string; content: string; score: number }> };
    return (data.results ?? []).map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.content.slice(0, 200),
      score: r.score,
      supports: null, // Gemini will classify
    }));
  } catch {
    return [];
  }
}

// ─── Gemini Synthesis ─────────────────────────────────────────────────────────
async function synthesizeVerdict(
  claim: string,
  factChecks: FactCheckRating[],
  newsSources: NewsSource[],
  tavilyResults: TavilySource[]
): Promise<Omit<FactCheckResult, 'claim' | 'existingFactChecks' | 'newsSources' | 'tavilySources'>> {

  const evidence = [
    factChecks.length > 0
      ? `EXISTING FACT CHECKS:\n${factChecks.map(fc => `- ${fc.publisher}: "${fc.rating}" for "${fc.claimReviewed}"`).join('\n')}`
      : 'No existing fact checks found.',
    newsSources.length > 0
      ? `NEWS COVERAGE:\n${newsSources.slice(0, 4).map(n => `- ${n.source}: ${n.title}`).join('\n')}`
      : 'No recent news found.',
    tavilyResults.length > 0
      ? `WEB SOURCES:\n${tavilyResults.slice(0, 4).map(t => `- ${t.title}: ${t.snippet}`).join('\n')}`
      : 'No web sources found.',
  ].join('\n\n');

  const systemPrompt = `You are an expert fact-checker for a major Indian financial news organization. Ensure high accuracy and impartiality.`;

  const userPrompt = `CLAIM TO VERIFY: "${trimArticle(claim, 400)}"

EVIDENCE GATHERED:
${evidence}

Based on all evidence, synthesize a verdict. Return JSON:
{
  "verdict": "TRUE" | "MOSTLY_TRUE" | "MISLEADING" | "MOSTLY_FALSE" | "FALSE" | "UNVERIFIABLE",
  "verdictLabel": "Human-readable verdict label e.g. 'Mostly False'",
  "confidence": 75,
  "summary": "2-3 sentence plain-English explanation of your verdict",
  "reasoning": ["Reason 1", "Reason 2", "Reason 3"],
  "redFlags": ["Red flag 1 if any", "Red flag 2 if any"],
  "suggestVerify": ["Suggested verification step 1", "Step 2"]
}

confidence: 0-100 (how certain you are).
reasoning: 3-4 specific points based on the evidence.
redFlags: warning signs of misinformation (empty array if claim appears true).
suggestVerify: what the user should check themselves (e.g. "Check RBI official website").`;

  return generateJSON(systemPrompt, userPrompt);
}

// ─── Main Route ────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { claim } = await req.json() as { claim?: string };
  if (!claim?.trim()) return NextResponse.json({ error: 'Claim is required' }, { status: 400 });

  const cleanedClaim = claim.trim().slice(0, 500);

  // Run all 3 source lookups in parallel
  const [factChecks, newsSources, tavilyRaw] = await Promise.all([
    googleFactCheck(cleanedClaim),
    newsApiSearch(cleanedClaim),
    tavilyFactSearch(cleanedClaim),
  ]);

  // Synthesize with Gemini
  let synthesis;
  try {
    synthesis = await synthesizeVerdict(cleanedClaim, factChecks, newsSources, tavilyRaw);
  } catch (err) {
    console.error('[/api/factcheck] Gemini synthesis failed:', err);
    // Graceful degradation — return raw data without verdict
    synthesis = {
      verdict: 'UNVERIFIABLE' as const,
      verdictLabel: 'Unverifiable',
      confidence: 0,
      summary: 'Could not synthesize a verdict. Review the sources below manually.',
      reasoning: [],
      redFlags: [],
      suggestVerify: ['Review the sources listed below directly'],
    };
  }

  const result: FactCheckResult = {
    claim: cleanedClaim,
    ...synthesis,
    existingFactChecks: factChecks,
    newsSources,
    tavilySources: tavilyRaw,
  };

  return NextResponse.json(result);
}

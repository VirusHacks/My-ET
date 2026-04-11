/**
 * lib/agents/bullBear.ts — Bull/Bear dual-agent using a single Gemini call
 * with an explicit JSON schema to avoid rate limit issues from 3 concurrent calls.
 */
import { generateJSON, trimArticle } from '@/lib/gemini';

export interface AnalysisPoint {
  point: string; explanation: string; confidence: 'high' | 'medium' | 'low';
}
export interface BullBearDebateResult {
  bullish: AnalysisPoint[]; bearish: AnalysisPoint[]; orchestratorVerdict: string;
}

export async function generateBullBearDebate(articleText: string, userSector = 'Finance'): Promise<BullBearDebateResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const article = trimArticle(articleText, 1800);

  // Single comprehensive prompt — avoids 3 concurrent calls hitting rate limits
  const prompt = `You are a dual financial analyst system for ${userSector} professionals in India.

Analyze this article and produce a structured bull vs bear debate, then synthesize a verdict.

ARTICLE:
${article}

Return ONLY a JSON object with this EXACT structure:
{
  "bullish": [
    { "point": "Short title (max 5 words)", "explanation": "Specific evidence from the article supporting a bullish view", "confidence": "high" },
    { "point": "Second bullish signal", "explanation": "Supporting evidence", "confidence": "medium" },
    { "point": "Third bullish signal", "explanation": "Supporting evidence", "confidence": "low" }
  ],
  "bearish": [
    { "point": "Short title (max 5 words)", "explanation": "Specific risk or negative signal from the article", "confidence": "high" },
    { "point": "Second risk", "explanation": "Supporting evidence", "confidence": "medium" },
    { "point": "Third risk", "explanation": "Supporting evidence", "confidence": "low" }
  ],
  "orchestratorVerdict": "2-sentence direct verdict for a ${userSector} professional — what's the net signal? Be direct, no hedging."
}

confidence must be one of: high, medium, low.
Include exactly 3 bullish and 3 bearish points.`;

  const result = await generateJSON<BullBearDebateResult>(prompt);

  // Validate and provide defaults for missing fields
  return {
    bullish: Array.isArray(result.bullish) ? result.bullish : [],
    bearish: Array.isArray(result.bearish) ? result.bearish : [],
    orchestratorVerdict: result.orchestratorVerdict ?? 'Weigh the factors above for your portfolio decision.',
  };
}

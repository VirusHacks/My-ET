/**
 * lib/agents/truthEngine.ts — Multimodal Misinformation Detection Agent
 *
 * Flow:
 *   1. Read input (text OR base64 image)
 *   2. If image → use Gemini Vision to extract claims
 *   3. Search ET archive + Tavily for verification context
 *   4. Gemini reasoning agent issues a verdict
 */
import { GoogleGenAI } from '@google/genai';
import { deepSearch } from '../search';

export interface TruthVerdict {
  status: 'TRUE_ACCURATE' | 'FALSE_MISLEADING' | 'PARTIAL_CONTEXT' | 'INSUFFICIENT_DATA';
  summary: string;
  citations: { title: string; url: string }[];
  confidence: number;
  extractedClaims?: string;
}

async function extractClaimsFromImage(ai: GoogleGenAI, base64Image: string, mimeType: string): Promise<string> {
  const prompt = `You are a fact-checking assistant. This is a screenshot potentially containing financial misinformation (e.g., a WhatsApp forward, tweet, or post).

Extract the exact financial/economic claims being made in this image. List them as bullet points. Be precise.

If there are no financial claims, say "No financial claims found."`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ],
  });

  return response.text ?? 'Could not extract claims from image.';
}

async function issueVerdict(ai: GoogleGenAI, claims: string, searchContext: string): Promise<TruthVerdict> {
  const prompt = `You are the ET Truth Engine, a fact-checking AI powered by The Economic Times — India's most trusted financial newspaper.

CLAIMS TO VERIFY:
${claims}

SEARCH CONTEXT (from verified sources):
${searchContext}

Analyze these claims against the context. Return ONLY a JSON object:
{
  "status": "TRUE_ACCURATE" | "FALSE_MISLEADING" | "PARTIAL_CONTEXT" | "INSUFFICIENT_DATA",
  "summary": "A clear 2-3 sentence explanation of why this claim is true/false/misleading",
  "confidence": 0.0-1.0,
  "citations": [{"title": "Source title", "url": "Source URL"}]
}

Be definitive. Do not hedge unnecessarily. Use the search context to justify your verdict.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    return JSON.parse(response.text ?? '{}') as TruthVerdict;
  } catch {
    return {
      status: 'INSUFFICIENT_DATA',
      summary: 'Unable to verify this claim. Please provide more specific information.',
      citations: [],
      confidence: 0.3,
    };
  }
}

export async function runTruthEngine(
  input: { text?: string; base64Image?: string; mimeType?: string }
): Promise<TruthVerdict> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const ai = new GoogleGenAI({ apiKey });
  let claims = '';

  // Step 1: Extract claims
  if (input.base64Image && input.mimeType) {
    claims = await extractClaimsFromImage(ai, input.base64Image, input.mimeType);
  } else if (input.text) {
    claims = input.text;
  } else {
    return {
      status: 'INSUFFICIENT_DATA',
      summary: 'No input provided. Please upload an image or paste text.',
      citations: [],
      confidence: 0,
    };
  }

  // Step 2: Search for verification context via Tavily
  const searchQuery = `fact check: ${claims.slice(0, 200)}`; // Trim for query
  const searchData = await deepSearch(searchQuery, 4);
  const searchContext = searchData.results
    .map(r => `Source: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`)
    .join('\n\n');

  // Step 3: Issue verdict
  const verdict = await issueVerdict(ai, claims, searchContext || 'No external context found.');
  verdict.extractedClaims = claims;

  return verdict;
}

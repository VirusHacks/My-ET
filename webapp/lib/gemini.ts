/**
 * lib/gemini.ts — Shared Gemini helper with robust JSON extraction & retry
 *
 * Model strategy:
 *   - gemini-2.5-flash-8b  → primary (fast, cheap, high free-tier quota)
 *   - gemini-2.5-flash      → fallback
 *   - gemini-2.5-flash      → last resort
 */
import { GoogleGenAI } from '@google/genai';

let _ai: GoogleGenAI | null = null;

export function getAI(): GoogleGenAI {
  if (!_ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
}

// Model cascade — 8b has highest free-tier TPM
const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash', 'gemini-2.5-flash'];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Robust generate with auto-retry on 429 and model cascade.
 */
async function generateWithRetry(
  prompt: string,
  preferredModel = MODELS[0],
  maxRetries = 2
): Promise<string> {
  const ai = getAI();
  // Put the preferred model first, then the rest
  const models = [preferredModel, ...MODELS.filter(m => m !== preferredModel)];

  for (const m of models) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({ model: m, contents: prompt });
        const text = response.text ?? '';
        if (!text.trim()) throw new Error('Empty response');
        return text;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const is429 = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
        const isInvalid = msg.includes('NOT_FOUND') || msg.includes('invalid') || msg.includes('not supported');

        if (isInvalid) {
          console.warn(`[Gemini] Model ${m} not available, trying next…`);
          break; // skip to next model immediately
        }

        if (is429 && attempt < maxRetries) {
          const waitMs = 3000 * (attempt + 1);
          console.warn(`[Gemini] Rate limit on ${m}, attempt ${attempt + 1}. Waiting ${waitMs}ms…`);
          await sleep(waitMs);
          continue;
        }
        if (is429) {
          console.warn(`[Gemini] Rate limit exhausted on ${m}, trying next model…`);
          break;
        }
        // Non-retryable error on this model — break to next model
        console.warn(`[Gemini] Error on ${m}: ${msg}. Trying next model…`);
        break;
      }
    }
  }

  throw new Error('All Gemini models failed. Please try again in a moment.');
}

/** Generate plain text from a prompt. */
export async function generateText(prompt: string, model = MODELS[0]): Promise<string> {
  return generateWithRetry(prompt, model);
}

/**
 * Generate and parse JSON from a prompt.
 * Handles Gemini wrapping output in ```json ... ``` fences.
 */
export async function generateJSON<T>(prompt: string, model = MODELS[0]): Promise<T> {
  const fullPrompt = `${prompt}\n\nCRITICAL: Return ONLY valid raw JSON. No markdown fences, no explanation, no preamble. Start your response with { or [`;
  const raw = await generateWithRetry(fullPrompt, model);
  return extractJSON<T>(raw);
}

/**
 * Trim article text to stay within token limits.
 * Token budget: ~1800-2400 chars (≈ 500-600 tokens) leaves room for prompt + response.
 */
export function trimArticle(text: string, maxChars = 2400): string {
  if (text.length <= maxChars) return text;
  const frontChars = Math.floor(maxChars * 0.7);
  const endChars = maxChars - frontChars;
  return `${text.slice(0, frontChars)}\n\n[...]\n\n${text.slice(-endChars)}`;
}

/**
 * Robustly extract JSON from a string that might have markdown fences or extra text.
 */
export function extractJSON<T>(raw: string): T {
  if (!raw || !raw.trim()) throw new Error('Empty response from Gemini');

  // Try direct parse first
  try { return JSON.parse(raw) as T; } catch { /* fall through */ }

  // Strip ```json ... ``` or ``` ... ``` fences
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()) as T; } catch { /* fall through */ }
  }

  // Find first { ... } block (greedy to outermost closing brace)
  const objMatch = raw.match(/(\{[\s\S]*\})/);
  if (objMatch) {
    try { return JSON.parse(objMatch[1]) as T; } catch { /* fall through */ }
  }

  // Find first [ ... ] block
  const arrMatch = raw.match(/(\[[\s\S]*\])/);
  if (arrMatch) {
    try { return JSON.parse(arrMatch[1]) as T; } catch { /* fall through */ }
  }

  throw new Error(`Could not parse JSON. Got: ${raw.slice(0, 200)}`);
}

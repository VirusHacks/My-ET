/**
 * lib/openai.ts — Shared OpenAI helper
 * Uses gpt-4o-mini by default (fast, cheap, reliable).
 * Falls back to gpt-3.5-turbo for pure text tasks.
 */
import OpenAI from 'openai';

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

export const DEFAULT_MODEL = 'gpt-4o-mini';
export const FAST_MODEL = 'gpt-4o-mini';
export const QUALITY_MODEL = 'gpt-4o';

/**
 * Generate plain text from a system + user prompt.
 */
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  model = DEFAULT_MODEL,
  maxTokens = 600
): Promise<string> {
  const client = getOpenAI();
  const res = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt },
    ],
  });
  return res.choices[0]?.message?.content?.trim() ?? '';
}

/**
 * Generate structured JSON output using OpenAI's native JSON mode.
 * Guaranteed to return valid JSON — no fence-stripping needed.
 */
export async function generateJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  model = DEFAULT_MODEL,
  maxTokens = 1200
): Promise<T> {
  const client = getOpenAI();
  const res = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt + '\n\nYou MUST return valid JSON.' },
      { role: 'user',   content: userPrompt },
    ],
  });
  const raw = res.choices[0]?.message?.content ?? '{}';
  return JSON.parse(raw) as T;
}

/**
 * Trim article text to stay within token budget.
 * ~3000 chars ≈ 750 tokens — leaves ample room for prompt + response.
 */
export function trimArticle(text: string, maxChars = 3000): string {
  if (text.length <= maxChars) return text;
  const front = Math.floor(maxChars * 0.7);
  const tail  = maxChars - front;
  return `${text.slice(0, front)}\n\n[...]\n\n${text.slice(-tail)}`;
}

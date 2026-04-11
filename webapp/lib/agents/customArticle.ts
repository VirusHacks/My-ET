/**
 * lib/agents/customArticle.ts — Reddit-Style AI Custom Article Builder
 *
 * Flow:
 *   1. Take user query
 *   2. Tavily searches ET + financial web for relevant content
 *   3. OpenAI GPT-4o synthesizes a structured news article from findings
 */
import OpenAI from 'openai';
import { deepSearch } from '../search';

export interface GeneratedArticle {
  title: string;
  summary: string;
  body: string;
  sources: { title: string; url: string }[];
  generatedAt: string;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function buildCustomArticle(
  query: string,
  userSector: string
): Promise<GeneratedArticle> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  // Step 1: Search for source material
  const searchData = await deepSearch(query, 6);
  const sourceContext = searchData.results
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`)
    .join('\n\n---\n\n');

  // Step 2: Synthesize the article
  const prompt = `You are a senior financial journalist at The Economic Times writing for a ${userSector} professional.

USER QUERY: "${query}"

RESEARCH SOURCES:
${sourceContext || 'No external sources found. Use your knowledge of Indian financial markets.'}

Write a comprehensive, factual news article based on this research. Follow ET's journalism standards.

Return ONLY a JSON object:
{
  "title": "A compelling, specific headline",
  "summary": "A 2-sentence executive summary of the key finding",
  "body": "The full article body in markdown format. 400-600 words. Use headers, bullet points where appropriate. Cite sources as [1], [2] etc.",
  "sources": [{"title": "source title", "url": "source URL"}]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const text = response.choices[0].message.content ?? '{}';
    const parsed = JSON.parse(text) as Omit<GeneratedArticle, 'generatedAt'>;
    
    return {
      ...parsed,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    throw new Error('Failed to generate article: ' + String(err));
  }
}

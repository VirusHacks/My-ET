/**
 * lib/articleFetcher.ts
 * Fetches and enriches full article content from an ET article URL.
 *
 * Strategy:
 * 1. Try Tavily Extract (best quality, gets full text)
 * 2. Fallback: Use OpenAI GPT-4o-mini to write a comprehensive article from the excerpt
 */
import OpenAI from 'openai';

export interface FullArticle {
  title: string;
  content: string;
  author: string;
  publishedAt: string;
  category: string;
  sourceUrl: string;
  excerpt: string;
  imageUrl?: string;
  fetchMethod: 'tavily' | 'direct' | 'ai-expanded';
  readTime: number;
}

// ─── Junk line patterns for ET raw content ─────────────────────────────────
const JUNK_LINE_RE = [
  /^Nifty|^SENSEX|^NIFTY/i,
  /^\d[\d,]+\.\d+[-+]\d/,
  /Fund\s+(Direct|Plan|Growth)/i,
  /\(javascript:/i,
  /\[Sign In\]/i,
  /^Business News[›>]/i,
  /›.*Markets.*›/,
  /^(SECTIONS|Synopsis|Rate Story|Follow us|Font Size|Save|Print|Comment|Share)\s*$/i,
  /^Abc(Small|Medium|Large)\s*$/i,
  /^Read Today's Paper/i,
  /^The Economic Times daily/i,
  /^ETMarkets\.com$/i,
  /^By\s*$/i,
  /Rate Story/i,
  /Font Size/i,
  /^\s*\|?\s*(Share|Save|Print|Comment)\s*\|?\s*$/i,
  /^Follow us?$/i,
  /5Y Return|Invest Now|^NAV$|^AUM$/i,
  /^Expense Ratio|^Fund Size|^Category|^Risk|^Rating/i,
  /^\d+\.?\d*\s*%\s*$/,
  /\[FEATURED FUNDS/i,
] as RegExp[]

/**
 * Clean raw Tavily extraction — remove ET nav junk, find where the article actually starts.
 */
function cleanTavilyContent(raw: string): string {
  // Strip markdown images / ET promo images
  let text = raw
    .replace(/!\[[^\]]*\]\([^)]+(?:etimg|msid|logo|banner|promo|advert|tracking|pixel|1x1|beacon)[^)]*\)/gi, '')
    // Remove javascript: links
    .replace(/\[([^\]]+)\]\(javascript:[^)]+\)/g, '')
    // Convert regular links to plain text — preserve image markdown ![]()
    .replace(/(?<!!)(\[([^\]]+)\]\(https?:\/\/[^)]+\))/g, '$2')
    // Remove bare non-image URLs
    .replace(/^(?!https?:\/\/\S+\.(?:jpg|jpeg|png|webp|gif))https?:\/\/\S+$/gm, '')
    .replace(/[★☆✦✧]+/g, '')
    .replace(/\]\([^)]+\)\[?[A-Z\s]+\]?/g, '')

  const lines = text.split('\n')
  const cleaned = lines.filter(line => {
    const t = line.trim()
    if (!t) return false
    return !JUNK_LINE_RE.some(re => re.test(t))
  })

  // Find the first real content line (skip short nav remnants at the top)
  let startIdx = 0
  for (let i = 0; i < Math.min(cleaned.length, 30); i++) {
    const line = cleaned[i].trim()
    if (/^#{1,4} /.test(line)) { startIdx = i; break }
    if (line.length > 60 && !/^[-*•]/.test(line)) { startIdx = i; break }
    if (/^synopsis/i.test(line)) { startIdx = i; break }
  }

  return cleaned
    .slice(startIdx)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^(5Y Return|Invest Now)[^\n]*/gm, '')
    .trim()
}

/**
 * Attempt to extract article content via Tavily Extract API
 */
async function fetchViaTavily(url: string): Promise<string | null> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.tavily.com/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, urls: [url] }),
    });

    if (!res.ok) return null;
    const data = await res.json() as {
      results?: Array<{ raw_content?: string; url: string }>;
    };

    const raw = data.results?.[0]?.raw_content ?? null;
    if (!raw || raw.length < 200) return null;

    // Clean before returning
    const cleaned = cleanTavilyContent(raw);
    return cleaned.length > 100 ? cleaned : null;
  } catch {
    return null;
  }
}

/**
 * Fallback: Use OpenAI GPT-4o-mini to write a comprehensive article from excerpt.
 */
async function expandWithOpenAI(
  title: string,
  excerpt: string,
  category: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return excerpt;

  try {
    const client = new OpenAI({ apiKey });
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 900,
      messages: [
        {
          role: 'system',
          content: `You are a senior financial journalist at The Economic Times India. 
Write comprehensive, accurate, factual articles on Indian financial news. 
Use clear headings, bullet points where appropriate, and maintain ET's authoritative style.
Write in markdown format.`,
        },
        {
          role: 'user',
          content: `Based on this headline and excerpt, write a complete 400-600 word article body.
Do NOT repeat the headline. Be factual and analytical.

HEADLINE: ${title}
CATEGORY: ${category}
EXCERPT: ${excerpt}`,
        },
      ],
    });
    return res.choices[0]?.message?.content?.trim() ?? excerpt;
  } catch {
    return excerpt;
  }
}

/**
 * Main function: fetch a full article given its RSS metadata
 */
export async function fetchFullArticle(params: {
  title: string;
  excerpt: string;
  sourceUrl: string;
  author: string;
  publishedAt: string;
  category: string;
  imageUrl?: string;
}): Promise<FullArticle> {
  const { title, excerpt, sourceUrl, author, publishedAt, category, imageUrl } = params;

  let content: string | null = null;
  let fetchMethod: FullArticle['fetchMethod'] = 'ai-expanded';

  if (sourceUrl && sourceUrl !== '#') {
    content = await fetchViaTavily(sourceUrl);
    if (content) fetchMethod = 'tavily';
  }

  if (!content) {
    content = await expandWithOpenAI(title, excerpt, category);
    fetchMethod = 'ai-expanded';
  }

  const wordCount = content.split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return { title, content, author, publishedAt, category, sourceUrl, excerpt, imageUrl, fetchMethod, readTime };
}

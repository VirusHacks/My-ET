import Parser from 'rss-parser';

export interface RSSArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  timestamp: string;
  imageUrl?: string;
  sourceUrl: string;
}

// Economic Times RSS feed endpoints by category
const ET_RSS_FEEDS: Record<string, string> = {
  Finance: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
  Technology: 'https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms',
  Startups: 'https://economictimes.indiatimes.com/small-biz/startups/rssfeeds/14300511.cms',
  Law: 'https://economictimes.indiatimes.com/news/india/rssfeeds/1052732735.cms',
  Economy: 'https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms',
  Top: 'https://economictimes.indiatimes.com/rssfeedsdefault.cms',
  All: 'https://economictimes.indiatimes.com/rssfeedsdefault.cms',
};

// Fallback for missing sector mappings
const FALLBACK_FEED = ET_RSS_FEEDS.All;

type CustomFeed = Record<string, never>;
type CustomItem = {
  title?: string;
  summary?: string;
  content?: string;
  contentSnippet?: string;
  'media:thumbnail'?: { $: { url?: string } };
  author?: string;
  isoDate?: string;
  link?: string;
  guid?: string;
  categories?: string[];
};

export async function fetchETNews(
  sector: string,
  limit = 9
): Promise<RSSArticle[]> {
  const parser = new Parser<CustomFeed, CustomItem>({
    customFields: {
      item: [['media:thumbnail', 'media:thumbnail']],
    },
    timeout: 10000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; ET-GenAI/1.0; +https://et-genai.vercel.app)',
    },
  });

  const feedUrl = ET_RSS_FEEDS[sector] ?? FALLBACK_FEED;
  const allArticles: RSSArticle[] = [];

  try {
    const feed = await parser.parseURL(feedUrl);
    const items = (feed.items as CustomItem[]).slice(0, limit);

    for (const item of items) {
      const id =
        item.guid ?? item.link ?? `${Date.now()}-${Math.random()}`;
      const thumbnail =
        item['media:thumbnail']?.['$']?.url ?? undefined;

      allArticles.push({
        id,
        title: item.title ?? 'Untitled',
        excerpt: item.contentSnippet ?? item.summary ?? '',
        content: item.content ?? item.summary ?? item.contentSnippet ?? '',
        category: sector,
        author: item.author ?? 'Economic Times',
        timestamp: item.isoDate ?? new Date().toISOString(),
        imageUrl: thumbnail,
        sourceUrl: item.link ?? '#',
      });
    }
  } catch (err) {
    console.error(`[fetchETNews] Failed to fetch RSS for ${sector}:`, err);
    // Return empty array – caller should handle gracefully
  }

  return allArticles;
}

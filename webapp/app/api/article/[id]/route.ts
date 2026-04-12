import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchETNews } from '@/lib/rss';
import { fetchFullArticle } from '@/lib/articleFetcher';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const sector = searchParams.get('sector') ?? 'Finance';

  // Decode the ID (it's the article's source URL, base64 encoded)
  let sourceUrl: string;
  try {
    sourceUrl = Buffer.from(decodeURIComponent(id), 'base64').toString('utf-8');
  } catch {
    sourceUrl = decodeURIComponent(id);
  }

  // Find the article in the RSS feed
  const articles = await fetchETNews(sector, 20);
  const rssArticle = articles.find(a => a.id === sourceUrl || a.sourceUrl === sourceUrl);

  if (!rssArticle) {
    return NextResponse.json({ error: 'Article not found in RSS feed' }, { status: 404 });
  }

  // Fetch full content
  const fullArticle = await fetchFullArticle({
    title: rssArticle.title,
    excerpt: rssArticle.excerpt,
    sourceUrl: rssArticle.sourceUrl,
    author: rssArticle.author,
    publishedAt: rssArticle.timestamp,
    category: rssArticle.category,
    imageUrl: rssArticle.imageUrl,
  });

  return NextResponse.json(fullArticle);
}

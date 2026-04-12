import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchETNews } from '@/lib/rss';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sector = searchParams.get('sector') ?? 'Finance';
  const limit = parseInt(searchParams.get('limit') ?? '9', 10);

  try {
    const articles = await fetchETNews(sector, limit);
    return NextResponse.json({ articles });
  } catch (err) {
    console.error('[/api/news] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch news', articles: [] }, { status: 500 });
  }
}

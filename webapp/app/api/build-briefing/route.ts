import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { buildCustomArticle } from '@/lib/agents/customArticle';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as { query?: string };
  const query = body.query?.trim();

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  // Get user sector for personalized framing
  let sector = 'Finance';
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user) sector = user.sector;
  } catch { /* use default sector */ }

  try {
    const article = await buildCustomArticle(query, sector);
    return NextResponse.json({ article });
  } catch (err) {
    console.error('[/api/build-briefing] Error:', err);
    return NextResponse.json({ error: 'Failed to generate article' }, { status: 500 });
  }
}

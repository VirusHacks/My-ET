import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateText, trimArticle } from '@/lib/openai';
import { getCachedStudioResponse, setCachedStudioResponse } from '@/lib/db/cache';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { articleText?: string; sector?: string };
  const { articleText = '', sector = 'Finance' } = body;
  if (!articleText) return NextResponse.json({ error: 'articleText required' }, { status: 400 });

  const article = trimArticle(articleText, 2500);

  try {
    const cached = await getCachedStudioResponse('summary', articleText);
    if (cached) return NextResponse.json(cached);

    const summary = await generateText(
      `You are a senior editor at The Economic Times. Write crisp, actionable executive briefs for ${sector} professionals.`,
      `Write a 3-bullet executive brief for this article. Each bullet:
- Start with a bold keyword like **Keyword**
- One punchy sentence max
- Laser-focused on ${sector} implications

End with a single line: "Why it matters for you: ..."

ARTICLE:
${article}`,
      'gpt-4o-mini',
      400
    );
    await setCachedStudioResponse('summary', articleText, '', { summary });
    return NextResponse.json({ summary });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/studio/summarize]', msg);
    return NextResponse.json({ error: 'Summarization failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateJSON, trimArticle } from '@/lib/openai';
import { getCachedStudioResponse, setCachedStudioResponse } from '@/lib/db/cache';

export interface VideoScene {
  scene: number;
  duration: string;
  visual: string;
  narration: string;
  onscreen_text: string;
  broll?: string;
}
export interface VideoScriptResult {
  title: string;
  hook: string;
  total_duration: string;
  scenes: VideoScene[];
  cta: string;
  hashtags: string[];
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { articleTitle?: string; articleText?: string; sector?: string };
  const { articleTitle = '', articleText = '', sector = 'Finance' } = body;
  const article = trimArticle(articleText, 2000);

  try {
    const cached = await getCachedStudioResponse('video', articleText);
    if (cached) return NextResponse.json(cached);

    const result = await generateJSON<VideoScriptResult>(
      `You are a viral financial content creator. You make 60-90 second explainer videos for Indian ${sector} professionals on YouTube Shorts and Instagram Reels.`,
      `Create a video script for this article. Return a JSON object with EXACTLY these fields:
{
  "title": "Punchy video title (max 8 words, include a number or question)",
  "hook": "First 3 seconds — the hook line that stops scrollers cold",
  "total_duration": "60s" or "90s",
  "scenes": [
    {
      "scene": 1,
      "duration": "0:00-0:08",
      "visual": "What's shown on screen (stock footage description or graphic type)",
      "narration": "Exact words the narrator says",
      "onscreen_text": "Text overlay that appears on screen (max 6 words)",
      "broll": "Optional B-roll suggestion"
    }
  ],
  "cta": "Call to action for the final 3 seconds",
  "hashtags": ["#Finance", "#InvestWise", "#ETMarkets", "3-5 relevant hashtags"]
}

Create 5-7 scenes that tell a complete visual story. 
Keep narration punchy — max 2 sentences per scene.
Include text overlays for key numbers and stats.

ARTICLE TITLE: ${articleTitle}
ARTICLE: ${article}`,
      'gpt-4o-mini',
      1400
    );

    await setCachedStudioResponse('video', articleText, body.articleTitle || '', result);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/studio/video]', msg);
    return NextResponse.json({ error: 'Video script generation failed' }, { status: 500 });
  }
}

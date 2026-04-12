import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { runTruthEngine } from '@/lib/agents/truthEngine';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contentType = req.headers.get('content-type') ?? '';

  let textInput: string | undefined;
  let base64Image: string | undefined;
  let mimeType: string | undefined;

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    textInput = formData.get('text') as string | undefined;
    const file = formData.get('file') as File | null;

    if (file) {
      const buffer = await file.arrayBuffer();
      base64Image = Buffer.from(buffer).toString('base64');
      mimeType = file.type;
    }
  } else {
    const body = await req.json() as { text?: string };
    textInput = body.text;
  }

  try {
    const result = await runTruthEngine({ text: textInput, base64Image, mimeType });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/verify] Error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

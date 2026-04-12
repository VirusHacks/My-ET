/**
 * /api/studio/tts/route.ts
 * Text-to-Speech for Podcast scripts.
 *
 * English  → OpenAI TTS (tts-1, voices: alloy | echo | fable | onyx | nova | shimmer)
 * Regional → GPT-4o-mini translates first, then Sarvam AI TTS (Indian language specialist)
 *
 * Returns: audio/mpeg stream
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOpenAI } from '@/lib/openai';

// Languages supported
export const LANGUAGE_OPTIONS = [
  { code: 'en',    label: 'English',    flag: '🇬🇧', sarvamCode: null },
  { code: 'hi',    label: 'हिंदी',       flag: '🇮🇳', sarvamCode: 'hi-IN' },
  { code: 'ta',    label: 'தமிழ்',       flag: '🇮🇳', sarvamCode: 'ta-IN' },
  { code: 'te',    label: 'తెలుగు',      flag: '🇮🇳', sarvamCode: 'te-IN' },
  { code: 'kn',    label: 'ಕನ್ನಡ',       flag: '🇮🇳', sarvamCode: 'kn-IN' },
  { code: 'mr',    label: 'मराठी',       flag: '🇮🇳', sarvamCode: 'mr-IN' },
  { code: 'bn',    label: 'বাংলা',       flag: '🇮🇳', sarvamCode: 'bn-IN' },
] as const;

type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

/** Strip [HOST], [ANALYSIS] script tags for clean TTS narration */
function cleanScriptForTTS(script: string): string {
  return script
    .replace(/\[(HOST|ANALYSIS|MUSIC|SFX|INTRO|OUTRO)\]\s*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim()
    // OpenAI TTS limit: 4096 chars
    .slice(0, 4090);
}

/** Translate text to a target language using GPT-4o-mini */
async function translateScript(text: string, targetLang: string, targetLangName: string): Promise<string> {
  const openai = getOpenAI();
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1200,
    messages: [
      {
        role: 'system',
        content: `You are a professional translator and financial journalist. Translate the following podcast script to ${targetLangName}. 
Maintain the conversational, engaging tone. Keep financial terms accurate. 
Return ONLY the translated text — no notes, no explanations.`,
      },
      { role: 'user', content: text },
    ],
  });
  return res.choices[0]?.message?.content?.trim() ?? text;
}

/** OpenAI TTS — English (and fallback for all languages) */
async function openAITTS(text: string, voice: OpenAIVoice): Promise<ArrayBuffer> {
  const openai = getOpenAI();
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    input: text,
    voice,
  });
  return response.arrayBuffer();
}

/** Sarvam AI TTS — Indian regional languages (returns ArrayBuffer) */
async function sarvamTTS(text: string, languageCode: string): Promise<ArrayBuffer | null> {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
      },
      body: JSON.stringify({
        inputs: [text.slice(0, 2000)],     // Sarvam limit
        target_language_code: languageCode,
        speaker: 'meera',                  // Female, calm, clear
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
        model: 'bulbul:v1',
      }),
    });

    if (!res.ok) {
      console.warn('[Sarvam TTS] API error:', res.status, await res.text());
      return null;
    }

    const data = await res.json() as { audios?: string[] };
    const base64Audio = data.audios?.[0];
    if (!base64Audio) return null;

    return Buffer.from(base64Audio, 'base64').buffer;
  } catch (err) {
    console.warn('[Sarvam TTS] Failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    script: string;
    voice?: OpenAIVoice;
    language?: string;
  };

  const { script, voice = 'nova', language = 'en' } = body;

  if (!script) return NextResponse.json({ error: 'script is required' }, { status: 400 });

  const cleanText = cleanScriptForTTS(script);
  const langOption = LANGUAGE_OPTIONS.find(l => l.code === language);

  try {
    let audioBuffer: ArrayBuffer;

    if (language === 'en' || !langOption?.sarvamCode) {
      audioBuffer = await openAITTS(cleanText, voice);
    } else {
      const translated = await translateScript(cleanText, language, langOption.label);
      const sarvamAudio = await sarvamTTS(translated, langOption.sarvamCode);
      if (sarvamAudio) {
        audioBuffer = sarvamAudio;
      } else {
        audioBuffer = await openAITTS(translated.slice(0, 4090), voice);
      }
    }

    return new NextResponse(audioBuffer as BodyInit, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/studio/tts]', msg);
    return NextResponse.json({ error: `TTS failed: ${msg.slice(0, 100)}` }, { status: 500 });
  }
}

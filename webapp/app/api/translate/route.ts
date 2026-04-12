/**
 * POST /api/translate
 *
 * Translates article content for rural India accessibility.
 * Primary: OpenAI GPT-4o-mini
 * Fallback: Sarvam AI (if SARVAM_API_KEY is set)
 *
 * Body: { text: string, languageCode: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const LANGUAGE_NAMES: Record<string, string> = {
  hi: 'Hindi (हिंदी)',
  bn: 'Bengali (বাংলা)',
  te: 'Telugu (తెలుగు)',
  mr: 'Marathi (मराठी)',
  ta: 'Tamil (தமிழ்)',
  gu: 'Gujarati (ગુજરાتી)',
  kn: 'Kannada (ಕನ್ನಡ)',
  ml: 'Malayalam (മലയാളം)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
  or: 'Odia (ଓଡ଼ିଆ)',
}

async function translateWithSarvam(text: string, targetLang: string): Promise<string | null> {
  const apiKey = process.env.SARVAM_API_KEY
  if (!apiKey) return null
  try {
    const res = await fetch('https://api.sarvam.ai/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-subscription-key': apiKey },
      body: JSON.stringify({
        input: text.slice(0, 3000),
        source_language_code: 'en-IN',
        target_language_code: `${targetLang}-IN`,
        speaker_gender: 'Female',
        mode: 'formal',
        enable_preprocessing: true,
      }),
    })
    if (!res.ok) return null
    const data = await res.json() as { translated_text?: string }
    return data.translated_text ?? null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { text, languageCode } = await req.json() as { text: string; languageCode: string }

    if (!text || !languageCode) {
      return NextResponse.json({ error: 'Missing text or languageCode' }, { status: 400 })
    }

    const langName = LANGUAGE_NAMES[languageCode] ?? languageCode
    // Translate first ~4000 chars to stay within budget
    const contentToTranslate = text.slice(0, 4000)

    // ── Primary: OpenAI GPT-4o-mini ──────────────────────────────
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert translator for rural India audiences.
Translate the following English news article into ${langName}.

Rules:
1. Keep financial numbers, company names, stock tickers, and proper nouns in their original form.
2. Use simple, everyday vocabulary—avoid academic or bureaucratic jargon.
3. Adapt idioms and metaphors to be culturally relatable for rural audiences.
4. Preserve paragraph structure. Keep it natural and conversational.
5. Do NOT add commentary, disclaimers, or explanations—only the translation.
6. Preserve **bold** markdown formatting where present.`,
          },
          { role: 'user', content: contentToTranslate },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      })

      const translated = completion.choices[0].message.content ?? ''
      if (translated.length > 50) {
        return NextResponse.json({ translated, provider: 'openai', langName })
      }
    } catch (openaiErr) {
      console.warn('[translate] OpenAI failed, trying Sarvam:', openaiErr)
    }

    // ── Fallback: Sarvam AI ──────────────────────────────────────
    const sarvam = await translateWithSarvam(contentToTranslate, languageCode)
    if (sarvam) {
      return NextResponse.json({ translated: sarvam, provider: 'sarvam', langName })
    }

    return NextResponse.json({ error: 'All translation providers failed' }, { status: 500 })
  } catch (err) {
    console.error('[/api/translate]', err)
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
  }
}

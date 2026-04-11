/**
 * lib/sarvam.ts — Sarvam AI Cultural Translation Engine
 * Uses Sarvam's translate API with contextual financial terminology injection.
 * Falls back to Gemini-powered translation if Sarvam key is unavailable.
 */
import { GoogleGenAI } from '@google/genai';

// Language code mapping for Sarvam AI
export const SARVAM_LANGUAGES: Record<string, { code: string; name: string }> = {
  Hindi: { code: 'hi-IN', name: 'Hindi' },
  Bengali: { code: 'bn-IN', name: 'Bengali' },
  Tamil: { code: 'ta-IN', name: 'Tamil' },
  Telugu: { code: 'te-IN', name: 'Telugu' },
  Marathi: { code: 'mr-IN', name: 'Marathi' },
  Gujarati: { code: 'gu-IN', name: 'Gujarati' },
  Kannada: { code: 'kn-IN', name: 'Kannada' },
  Malayalam: { code: 'ml-IN', name: 'Malayalam' },
  Punjabi: { code: 'pa-IN', name: 'Punjabi' },
  Odia: { code: 'od-IN', name: 'Odia' },
};

export interface TranslationResult {
  translatedText: string;
  language: string;
  method: 'sarvam' | 'gemini-fallback';
}

/**
 * Translate article text with cultural injection.
 * - Uses Sarvam AI if SARVAM_API_KEY is set
 * - Falls back to Gemini with a cultural-injection prompt
 */
export async function translateWithContext(
  text: string,
  targetLanguage: string
): Promise<TranslationResult> {
  const sarvamKey = process.env.SARVAM_API_KEY;
  const langConfig = SARVAM_LANGUAGES[targetLanguage];

  if (!langConfig) {
    return { translatedText: text, language: 'English', method: 'gemini-fallback' };
  }

  // --- Primary: Sarvam AI ---
  if (sarvamKey) {
    try {
      const response = await fetch('https://api.sarvam.ai/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': sarvamKey,
        },
        body: JSON.stringify({
          input: text,
          source_language_code: 'en-IN',
          target_language_code: langConfig.code,
          speaker_gender: 'Male',
          mode: 'formal',
          model: 'mayura:v1',
          enable_preprocessing: true,
        }),
      });

      if (response.ok) {
        const data = await response.json() as { translated_text?: string };
        if (data.translated_text) {
          return {
            translatedText: data.translated_text,
            language: langConfig.name,
            method: 'sarvam',
          };
        }
      }
    } catch (err) {
      console.warn('[translateWithContext] Sarvam API failed, falling back to Gemini:', err);
    }
  }

  // --- Fallback: Gemini with Cultural Injection Prompt ---
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return { translatedText: text, language: 'English', method: 'gemini-fallback' };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const prompt = `You are a financial journalist translating a business news article to ${langConfig.name} for Indian readers. 

CRITICAL RULES:
1. Translate to ${langConfig.name} (${langConfig.code})
2. Do NOT just do literal translation — REPLACE Western financial metaphors with culturally relevant Indian analogies. For example, replace "Wall Street" with the BSE/NSE equivalent context.
3. Keep financial numbers, company names (like TCS, Infosys, SEBI, RBI) in their original form.
4. Maintain a formal, newspaper-style tone.
5. Return ONLY the translated text, nothing else.

Text to translate:
${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return {
      translatedText: response.text ?? text,
      language: langConfig.name,
      method: 'gemini-fallback',
    };
  } catch (err) {
    console.error('[translateWithContext] Gemini fallback also failed:', err);
    return { translatedText: text, language: 'English', method: 'gemini-fallback' };
  }
}

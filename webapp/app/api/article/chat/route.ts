import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { message, history, articleContext } = await req.json() as {
      message: string;
      history: { role: 'user' | 'assistant'; content: string }[];
      articleContext: { title: string; content: string };
    }

    if (!message || !articleContext) {
      return NextResponse.json({ error: 'Missing message or articleContext' }, { status: 400 })
    }

    const systemPrompt = `You are a helpful AI assistant for The Economic Times.
Your goal is to answer user questions regarding the following article.
ARTICLE TITLE: ${articleContext.title}
ARTICLE CONTENT: ${articleContext.content.slice(0, 8000)} // Truncate content to avoid token limit errors

Guidelines:
1. Provide accurate answers based ONLY on the provided article context.
2. If the answer is not in the article, state that clearly but try to be helpful if it's general financial knowledge.
3. Support multilingual requests. If the user asks in Hindi, Bengali, etc., respond in that language.
4. Keep your responses concise and naturally conversational.
5. Do NOT make up facts. Use a professional yet friendly tone.
6. Use markdown for better formatting if needed (bold, bullet points).`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user' as const, content: message },
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    })

    const response = completion.choices[0].message.content ?? "I'm sorry, I couldn't generate a response."

    return NextResponse.json({ answer: response })
  } catch (err) {
    console.error('[/api/article/chat]', err)
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 })
  }
}

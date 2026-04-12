'use server'

import { generateBullBearAnalysis } from '@/lib/news'
import type { BullBearAnalysis } from '@/lib/news'

export async function generateBullBear(articleText: string): Promise<BullBearAnalysis> {
  try {
    const analysis = await generateBullBearAnalysis(articleText)
    return analysis
  } catch (error) {
    console.error('Error in generateBullBear server action:', error)
    throw new Error('Failed to generate bull/bear analysis')
  }
}

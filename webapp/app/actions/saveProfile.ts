'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import type { OnboardingFormData } from '@/lib/schemas/onboarding'

export async function saveProfile(data: OnboardingFormData) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'User not authenticated' }
    }

    // Normalise watchlist: accept comma-string or array
    const watchlistArr = typeof data.watchlist === 'string'
      ? (data.watchlist as string).split(',').map((t: string) => t.trim().toUpperCase()).filter(Boolean)
      : (data.watchlist as unknown as string[])

    const interests = Array.isArray(data.interests) && data.interests.length > 0
      ? data.interests
      : ['Markets & Stocks']

    await db
      .insert(users)
      .values({
        id: userId,
        sector: data.sector,
        watchlist: watchlistArr,
        location: data.location?.trim() ?? '',
        preferredLanguage: data.preferredLanguage ?? 'English',
        interests,
        experienceLevel: data.experienceLevel ?? 'Intermediate',
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          sector: data.sector,
          watchlist: watchlistArr,
          location: data.location?.trim() ?? '',
          preferredLanguage: data.preferredLanguage ?? 'English',
          interests,
          experienceLevel: data.experienceLevel ?? 'Intermediate',
        },
      })

    return { success: true, message: 'Profile saved successfully' }
  } catch (error) {
    console.error('[saveProfile] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save profile',
    }
  }
}

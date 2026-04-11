import { z } from 'zod'

export const SECTORS = ['Finance', 'Law', 'Founder', 'Student'] as const
export const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Expert'] as const
export const LANGUAGES = [
  'English', 'Hindi', 'Bengali', 'Tamil', 'Telugu',
  'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Odia',
] as const

export const INTEREST_OPTIONS = [
  'Markets & Stocks', 'Startups & VC', 'Real Estate', 'Crypto & Web3',
  'Policy & Regulation', 'Global Economy', 'Banking & Finance',
  'Technology', 'Energy & Sustainability', 'Healthcare',
] as const

export const onboardingSchema = z.object({
  sector: z.enum(SECTORS, {
    errorMap: () => ({ message: 'Please select a valid sector' }),
  }),
  watchlist: z
    .string()
    .min(1, 'Please add at least one ticker')
    .transform((val) =>
      val
        .split(',')
        .map((ticker) => ticker.trim().toUpperCase())
        .filter((ticker) => ticker.length > 0)
    )
    .refine((tickers) => tickers.length > 0, 'Please add at least one ticker'),
  location: z
    .string()
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location must be less than 100 characters'),
  preferredLanguage: z.enum(LANGUAGES).default('English'),
  interests: z.array(z.enum(INTEREST_OPTIONS)).min(1, 'Select at least one interest'),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).default('Intermediate'),
})

export type OnboardingFormData = z.infer<typeof onboardingSchema>


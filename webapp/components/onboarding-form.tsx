'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { saveProfile } from '@/app/actions/saveProfile'
import {
  SECTORS,
  EXPERIENCE_LEVELS,
  LANGUAGES,
  INTEREST_OPTIONS,
  type OnboardingFormData,
} from '@/lib/schemas/onboarding'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/hooks/use-toast'
import {
  TrendingUp, Scale, Rocket, GraduationCap,
  Globe, ChevronRight, ChevronLeft, Check, Star, Zap,
} from 'lucide-react'

const SECTOR_CONFIG: Record<string, { icon: React.ElementType; desc: string; color: string; activeColor: string }> = {
  Finance: {
    icon: TrendingUp,
    desc: 'Traders, investors, portfolio managers',
    color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-400',
    activeColor: 'from-emerald-500/30 to-emerald-600/20 border-emerald-400 ring-2 ring-emerald-400/50',
  },
  Law: {
    icon: Scale,
    desc: 'Lawyers, compliance officers, bureaucrats',
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-400',
    activeColor: 'from-blue-500/30 to-blue-600/20 border-blue-400 ring-2 ring-blue-400/50',
  },
  Founder: {
    icon: Rocket,
    desc: 'Startup founders, executives, VCs',
    color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-400',
    activeColor: 'from-purple-500/30 to-purple-600/20 border-purple-400 ring-2 ring-purple-400/50',
  },
  Student: {
    icon: GraduationCap,
    desc: 'MBA students, UPSC aspirants, academics',
    color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 hover:border-orange-400',
    activeColor: 'from-orange-500/30 to-orange-600/20 border-orange-400 ring-2 ring-orange-400/50',
  },
}

const STEPS = ['Persona', 'Interests', 'Preferences', 'Portfolio']
const TOTAL_STEPS = STEPS.length

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 60 : -60, opacity: 0 }),
}

export function OnboardingForm() {
  const router = useRouter()
  const { toast } = useToast()

  // Step state
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form fields as simple state — avoids Zod/RHF complexity
  const [sector, setSector] = useState<string>('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [experienceLevel, setExperienceLevel] = useState<string>('Intermediate')
  const [preferredLanguage, setPreferredLanguage] = useState<string>('English')
  const [watchlist, setWatchlist] = useState('')
  const [location, setLocation] = useState('')

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  const goNext = () => {
    // Step-level validation
    if (step === 0 && !sector) {
      setErrors({ sector: 'Please select a sector' })
      return
    }
    if (step === 1 && selectedInterests.length === 0) {
      setErrors({ interests: 'Select at least one interest' })
      return
    }
    setErrors({})
    setDirection(1)
    setStep(s => Math.min(s + 1, TOTAL_STEPS - 1))
  }

  const goBack = () => {
    setErrors({})
    setDirection(-1)
    setStep(s => Math.max(s - 1, 0))
  }

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    )
    setErrors(e => ({ ...e, interests: '' }))
  }

  async function handleLaunch() {
    // Final validation
    const newErrors: Record<string, string> = {}
    if (!watchlist.trim()) newErrors.watchlist = 'Add at least one ticker'
    if (!location.trim()) newErrors.location = 'Location is required'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const tickers = watchlist
        .split(',')
        .map(t => t.trim().toUpperCase())
        .filter(t => t.length > 0)

      const payload: OnboardingFormData = {
        sector: sector as OnboardingFormData['sector'],
        watchlist: tickers.join(','),
        location: location.trim(),
        preferredLanguage: preferredLanguage as OnboardingFormData['preferredLanguage'],
        experienceLevel: experienceLevel as OnboardingFormData['experienceLevel'],
        interests: (selectedInterests.length > 0 ? selectedInterests : ['Markets & Stocks']) as OnboardingFormData['interests'],
      }

      const result = await saveProfile(payload)

      if (result.success) {
        toast({ title: '🎉 All set!', description: 'Your News OS is ready.' })
        router.push('/dashboard')
      } else {
        toast({ title: 'Error saving profile', description: result.error ?? 'Please try again.', variant: 'destructive' })
        setIsSubmitting(false)
      }
    } catch (err) {
      console.error('[handleLaunch]', err)
      toast({ title: 'Unexpected error', description: 'Please try again.', variant: 'destructive' })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-lg">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i < step ? 'bg-primary text-primary-foreground' :
                i === step ? 'bg-primary/20 border-2 border-primary text-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-16 md:w-24 transition-all duration-500 ${i < step ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Step {step + 1} of {TOTAL_STEPS}: <span className="text-foreground font-medium">{STEPS[step]}</span>
        </p>
      </div>

      {/* Card */}
      <div className="relative rounded-2xl backdrop-blur-md bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 p-8 shadow-2xl overflow-hidden min-h-[420px]">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/5 to-slate-600/5 pointer-events-none" />

        <AnimatePresence mode="wait" custom={direction}>

          {/* ——— STEP 0: Sector Persona ——— */}
          {step === 0 && (
            <motion.div key="step-0" custom={direction} variants={slideVariants}
              initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <h2 className="text-2xl font-bold text-foreground mb-1">Who are you?</h2>
              <p className="text-sm text-muted-foreground mb-6">Your sector unlocks specialized AI tools.</p>
              <div className="grid grid-cols-2 gap-3">
                {SECTORS.map(s => {
                  const cfg = SECTOR_CONFIG[s]
                  const Icon = cfg.icon
                  const isActive = sector === s
                  return (
                    <motion.button key={s} type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => { setSector(s); setErrors(e => ({ ...e, sector: '' })) }}
                      className={`relative p-4 rounded-xl bg-gradient-to-br border text-left transition-all duration-200 ${isActive ? cfg.activeColor : cfg.color}`}>
                      <Icon className="w-5 h-5 mb-2 text-foreground" />
                      <div className="font-semibold text-foreground text-sm">{s}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{cfg.desc}</div>
                      {isActive && <Check className="absolute top-3 right-3 w-4 h-4 text-foreground" />}
                    </motion.button>
                  )
                })}
              </div>
              {errors.sector && <p className="text-xs text-destructive mt-2">{errors.sector}</p>}
              <div className="flex justify-end mt-6">
                <Button type="button" onClick={goNext} disabled={!sector} className="gap-2">
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ——— STEP 1: Interests ——— */}
          {step === 1 && (
            <motion.div key="step-1" custom={direction} variants={slideVariants}
              initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <h2 className="text-2xl font-bold text-foreground mb-1">What do you follow?</h2>
              <p className="text-sm text-muted-foreground mb-6">Select topics to personalize your feed. Pick at least one.</p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map(interest => {
                  const active = selectedInterests.includes(interest)
                  return (
                    <motion.button key={interest} type="button" whileTap={{ scale: 0.95 }}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                        active
                          ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                          : 'bg-white/10 text-foreground border-white/20 hover:border-primary/50 hover:bg-primary/10'
                      }`}>
                      {active && <Check className="inline w-3 h-3 mr-1" />}{interest}
                    </motion.button>
                  )
                })}
              </div>
              {errors.interests && <p className="text-xs text-destructive mt-2">{errors.interests}</p>}
              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={goBack} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />Back
                </Button>
                <Button type="button" onClick={goNext} disabled={selectedInterests.length === 0} className="gap-2">
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ——— STEP 2: Preferences ——— */}
          {step === 2 && (
            <motion.div key="step-2" custom={direction} variants={slideVariants}
              initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <h2 className="text-2xl font-bold text-foreground mb-1">Your Preferences</h2>
              <p className="text-sm text-muted-foreground mb-6">Set language and expertise level.</p>

              {/* Experience Level */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" /> Experience Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPERIENCE_LEVELS.map(level => (
                    <motion.button key={level} type="button" whileTap={{ scale: 0.97 }}
                      onClick={() => setExperienceLevel(level)}
                      className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                        experienceLevel === level
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-white/10 text-foreground border-white/20 hover:border-primary/50'
                      }`}>
                      {level}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Preferred Language
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(lang => (
                    <button key={lang} type="button"
                      onClick={() => setPreferredLanguage(lang)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        preferredLanguage === lang
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-white/10 text-foreground border-white/20 hover:border-primary/50'
                      }`}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={goBack} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />Back
                </Button>
                <Button type="button" onClick={goNext} className="gap-2">
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ——— STEP 3: Portfolio ——— */}
          {step === 3 && (
            <motion.div key="step-3" custom={direction} variants={slideVariants}
              initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <h2 className="text-2xl font-bold text-foreground mb-1">Your Portfolio Context</h2>
              <p className="text-sm text-muted-foreground mb-6">Used to cross-reference news against your stocks.</p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" /> Watchlist Tickers
                  </label>
                  <Input
                    placeholder="TCS, RELIANCE, INFY, HDFCBANK"
                    value={watchlist}
                    onChange={e => { setWatchlist(e.target.value); setErrors(err => ({ ...err, watchlist: '' })) }}
                    className="bg-white/50 dark:bg-white/10 border-white/20 text-foreground placeholder:text-muted-foreground"
                  />
                  {errors.watchlist && <p className="text-xs text-destructive mt-1">{errors.watchlist}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Comma-separated NSE/BSE tickers</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" /> Location
                  </label>
                  <Input
                    placeholder="e.g., Mumbai, Maharashtra"
                    value={location}
                    onChange={e => { setLocation(e.target.value); setErrors(err => ({ ...err, location: '' })) }}
                    className="bg-white/50 dark:bg-white/10 border-white/20 text-foreground placeholder:text-muted-foreground"
                  />
                  {errors.location && <p className="text-xs text-destructive mt-1">{errors.location}</p>}
                </div>
              </div>

              {/* Summary */}
              <div className="mt-5 p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 mb-2 text-foreground font-semibold text-sm">
                  <Zap className="w-4 h-4 text-primary" /> Your AI Profile Summary
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-foreground font-medium">Sector:</span><span>{sector}</span>
                  <span className="text-foreground font-medium">Language:</span><span>{preferredLanguage}</span>
                  <span className="text-foreground font-medium">Level:</span><span>{experienceLevel}</span>
                  <span className="text-foreground font-medium">Interests:</span><span>{selectedInterests.length} topics</span>
                </div>
              </div>

              <div className="flex justify-between mt-5">
                <Button type="button" variant="outline" onClick={goBack} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />Back
                </Button>
                <Button
                  type="button"
                  onClick={handleLaunch}
                  disabled={isSubmitting}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  {isSubmitting
                    ? <><Spinner className="w-4 h-4" /> Launching...</>
                    : <><Zap className="w-4 h-4" /> Launch My ET</>
                  }
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { DashboardHeader } from '@/components/dashboard-header'
import { NewsCard } from '@/components/news-card'
import { Skeleton } from '@/components/ui/skeleton'
import { MarketPulseTicker } from '@/components/market-pulse-ticker'
import { DailyDigest } from '@/components/daily-digest'
import { GenerativeSearchResult } from '@/components/generative-search-result'
import { CategoryAIDashboard } from '@/components/category-ai-dashboard'
import { SidebarIntelligence } from '@/components/sidebar-intelligence'
import type { SearchResult } from '@/app/api/ai-search/route'
import type { RSSArticle } from '@/lib/rss'
import { Search, Zap, X, ArrowRight, Newspaper, RefreshCw, Globe, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UserProfile {
  id: string
  sector: string
  location: string
  watchlist: string[]
  preferredLanguage?: string
  experienceLevel?: string
}

const SECTORS = ['All', 'Finance', 'Markets', 'Policy', 'Startups', 'Global']

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const cardAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 overflow-hidden">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}

function SearchBriefing({ sector }: { sector: string }) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState(0)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const LOADING_STAGES = [
    'Routing query…',
    'Fetching live market data…',
    'Synthesizing intelligence…',
  ]

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || isLoading) return
    setIsLoading(true)
    setResult(null)
    setError(null)
    setLoadingStage(0)

    // Simulate progressive stages for UX transparency
    const stageTimer1 = setTimeout(() => setLoadingStage(1), 600)
    const stageTimer2 = setTimeout(() => setLoadingStage(2), 1400)

    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, sector }),
      })
      if (!res.ok) throw new Error(`Search failed (${res.status})`)
      const data = await res.json() as SearchResult
      setResult(data)
    } catch (err) {
      console.error('[SearchBriefing]', err)
      setError('Something went wrong. Please try again.')
    } finally {
      clearTimeout(stageTimer1)
      clearTimeout(stageTimer2)
      setIsLoading(false)
      setLoadingStage(0)
    }
  }

  const suggestions = [
    `How is ${sector} performing today?`,
    'Nifty 50 weekly performance',
    'Compare TCS vs Infosys',
    'What did RBI announce this week?',
    'Top Indian startup funding news',
  ]

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSearch} className="relative">
        <motion.div
          animate={{ scale: isFocused ? 1.005 : 1 }}
          transition={{ duration: 0.15 }}
          className={`relative flex items-center rounded-2xl border transition-all duration-200 bg-card/80 backdrop-blur-sm shadow-sm ${
            isFocused
              ? 'border-primary/50 shadow-primary/10 shadow-lg'
              : 'border-border/60 hover:border-border'
          }`}
        >
          <Search className={`absolute left-4 w-4.5 h-4.5 transition-colors ${isFocused ? 'text-primary' : 'text-muted-foreground/60'}`} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={`Ask anything — stock charts, market news, comparisons…`}
            className="w-full pl-12 pr-36 py-4 bg-transparent text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResult(null); setError(null) }}
              className="absolute right-28 text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-2 h-10 px-5 rounded-xl text-xs font-bold gap-1.5 shrink-0"
          >
            {isLoading
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              : <><Zap className="w-3.5 h-3.5" />Ask AI</>
            }
          </Button>
        </motion.div>
      </form>

      {/* Suggestion Chips */}
      {!query && !result && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mt-3"
        >
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => { setQuery(s); setTimeout(() => inputRef.current?.focus(), 50) }}
              className="text-xs px-3 py-1.5 rounded-full border border-border/50 text-muted-foreground/70 hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              {s}
            </button>
          ))}
        </motion.div>
      )}

      {/* Result / Loading / Error */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-5 rounded-3xl border border-border/60 bg-card overflow-hidden shadow-sm"
          >
            {/* Stage indicator */}
            <div className="px-7 py-4 border-b border-border/40 bg-muted/5 flex items-center gap-3">
              <Zap className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs font-bold text-muted-foreground">
                {LOADING_STAGES[loadingStage]}
              </span>
              <div className="ml-auto flex gap-1">
                {LOADING_STAGES.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 w-8 rounded-full transition-all duration-500 ${
                      i <= loadingStage ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
            {/* Skeleton content */}
            <div className="p-7 space-y-4 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="h-6 w-48 bg-muted rounded" />
                </div>
                <div className="text-right space-y-2">
                  <div className="h-6 w-24 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted/60 rounded" />
                </div>
              </div>
              <div className="h-[120px] w-full bg-muted/40 rounded-2xl" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-muted/60 rounded" />
                <div className="h-3 w-4/5 bg-muted/60 rounded" />
                <div className="h-3 w-3/5 bg-muted/60 rounded" />
              </div>
            </div>
          </motion.div>
        )}

        {!isLoading && error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 p-5 rounded-2xl border border-red-200/50 bg-red-50/30 text-sm text-red-600/80 font-medium"
          >
            {error}
          </motion.div>
        )}

        {!isLoading && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="mt-5"
          >
            <GenerativeSearchResult result={result} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


export default function DashboardPage() {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [articles, setArticles] = useState<RSSArticle[]>([])
  const [topArticles, setTopArticles] = useState<RSSArticle[]>([])
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isLoadingArticles, setIsLoadingArticles] = useState(true)
  const [isLoadingTop, setIsLoadingTop] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')

  useEffect(() => {
    if (!isLoaded) return
    if (!userId) { router.push('/sign-in'); return }

    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile')
        if (res.ok) {
          const data = await res.json() as UserProfile
          setUserProfile(data)
          setIsLoadingProfile(false)

          const newsRes = await fetch(`/api/news?sector=${encodeURIComponent(data.sector)}`)
          if (newsRes.ok) {
            const newsData = await newsRes.json() as { articles: RSSArticle[] }
            setArticles(newsData.articles)
          }

          // Fetch General Top News
          const topRes = await fetch('/api/news?sector=Top&limit=6')
          if (topRes.ok) {
            const topData = await topRes.json() as { articles: RSSArticle[] }
            setTopArticles(topData.articles)
          }
        } else if (res.status === 404) {
          router.push('/onboarding')
        }
      } catch (err) {
        console.error('[DashboardPage]', err)
      } finally {
        setIsLoadingProfile(false)
        setIsLoadingArticles(false)
        setIsLoadingTop(false)
      }
    }

    fetchProfile()
  }, [isLoaded, userId, router])

  const filteredArticles = activeFilter === 'All'
    ? articles
    : articles.filter(a => a.category?.toLowerCase().includes(activeFilter.toLowerCase()))

  if (!isLoaded || isLoadingProfile) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
            <span className="text-white font-black text-sm">ET</span>
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading your briefing...</p>
        </div>
      </main>
    )
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <DashboardHeader userId={userId!} userProfile={userProfile} />
      <MarketPulseTicker />

      <main className="min-h-screen bg-background">
        {/* ── Hero section ── */}
        <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-background to-muted/30">
          {/* Subtle background texture */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/6 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/4 rounded-full blur-[80px]" />
          </div>

          <div className="relative max-w-7xl mx-auto px-6 pt-12 pb-14">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <p className="text-sm text-muted-foreground mb-1.5">
                {greeting} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-2">
                Your <span className="text-gradient">{userProfile?.sector ?? 'Financial'}</span> Briefing
              </h1>
              <p className="text-muted-foreground mb-8">
                {articles.length > 0 ? `${articles.length} articles curated from ET` : 'Fetching live news from Economic Times...'}
                {userProfile?.location ? ` · ${userProfile.location}` : ''}
              </p>
            </motion.div>

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
              <SearchBriefing sector={userProfile?.sector ?? 'Finance'} />
            </motion.div>
          </div>
        </section>

        {/* ── Filter tabs ── */}
        <section className="sticky top-16 z-40 bg-background/90 backdrop-blur-md border-b border-border/40">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-none">
              {SECTORS.map(s => (
                <button key={s} onClick={() => setActiveFilter(s)}
                  className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeFilter === s
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}>
                  {s}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2 shrink-0">
                <Newspaper className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{filteredArticles.length} articles</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Main Content Grid (70/30 Layout) ── */}
        <section className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column (70%) */}
            <div className="lg:col-span-8 space-y-8">
              {/* Daily AI Digest — Tavily powered */}
              {!isLoadingArticles && userProfile && (
                <DailyDigest sector={userProfile.sector} />
              ) }

              {isLoadingArticles ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
              ) : filteredArticles.length > 0 ? (
                <motion.div
                  key={activeFilter}
                  variants={stagger} initial="hidden" animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {filteredArticles.map((article, i) => (
                    <motion.div key={article.id} variants={cardAnim} custom={i}>
                      <NewsCard article={article} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : activeFilter !== 'All' ? (
                <div className="space-y-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-foreground">AI Sector Intelligence</h3>
                      <p className="text-xs text-muted-foreground">Generating real-time category dashboard from Tavily</p>
                    </div>
                  </div>
                  {userProfile && <CategoryAIDashboard category={activeFilter} sector={userProfile.sector} />}
                </div>
              ) : (
                <div className="text-center py-24 border border-dashed border-border/60 rounded-3xl">
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Newspaper className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No articles in this category</h3>
                  <p className="text-muted-foreground mb-5">Try a different filter, or check back soon for fresh updates.</p>
                  <Button variant="outline" size="sm" onClick={() => setActiveFilter('All')}>
                    Show all articles <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              )}
            </div>

            {/* Right Column / Sidebar (30%) */}
            <aside className="lg:col-span-4 hidden lg:block">
              {userProfile && <SidebarIntelligence sector={userProfile.sector} />}
            </aside>
          </div>
        </section>

        {/* ── Global Pulse Section (Editorial Staggered) ── */}
        <section className="bg-muted/10 border-t border-border/40 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-5 h-5 text-primary" />
                  <span className="text-xs font-black uppercase tracking-widest text-primary">Global Coverage</span>
                </div>
                <h2 className="text-3xl font-black text-foreground tracking-tight">Financial Pulse</h2>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  Top general headlines from across the world that impact global trade and domestic policy, refreshed every hour.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button asChild variant="default" size="sm" className="gap-2 px-6 rounded-full shadow-lg shadow-primary/20">
                  <Link href="/globe"><Sparkles className="w-3.5 h-3.5" /> Explore World Map</Link>
                </Button>
              </div>
            </div>

            {isLoadingTop ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : topArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                {/* Visual stagger/different editorial priority */}
                {topArticles.map((article, i) => (
                  <div key={article.id} className={`${i === 0 ? 'lg:col-span-2' : ''}`}>
                    <NewsCard article={article} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/20 border border-border/40 rounded-3xl border-dashed">
                <p className="text-muted-foreground font-medium italic">No default headlines currently available.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}

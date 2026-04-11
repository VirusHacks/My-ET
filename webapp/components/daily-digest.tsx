'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ChevronDown, ChevronUp, ExternalLink, RefreshCw } from 'lucide-react'

interface DigestSource {
  title: string; url: string; snippet: string; publishedDate?: string
}
interface DigestData {
  digest: string | null; sources: DigestSource[]; sector: string; generatedAt: string
}

/**
 * Parse Tavily's free-form answer into numbered bullet points.
 * Handles formats like "1. ...\n2. ..." or "• ..." or plain prose.
 */
function parseDigest(text: string): string[] {
  // Try numbered list first
  const numbered = text.match(/\d+[\.\)]\s+([^\n]+)/g)
  if (numbered && numbered.length >= 3) {
    return numbered.map(l => l.replace(/^\d+[\.\)]\s+/, '').trim()).filter(Boolean).slice(0, 5)
  }

  // Try bullet points
  const bullets = text.match(/[•\-\*]\s+([^\n]+)/g)
  if (bullets && bullets.length >= 2) {
    return bullets.map(l => l.replace(/^[•\-\*]\s+/, '').trim()).filter(Boolean).slice(0, 5)
  }

  // Split by sentences and take first 5
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 40)
    .slice(0, 5)
  return sentences
}

export function DailyDigest({ sector }: { sector: string }) {
  const [data, setData] = useState<DigestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(true)
  const [showSources, setShowSources] = useState(false)

  useEffect(() => {
    // Cache in sessionStorage — don't re-fetch on filter changes
    const cacheKey = `digest-${sector}-${new Date().toDateString()}`
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      try { setData(JSON.parse(cached) as DigestData); setLoading(false); return } catch { /* ignore */ }
    }

    fetch(`/api/dashboard/digest?sector=${encodeURIComponent(sector)}`)
      .then(r => r.ok ? r.json() as Promise<DigestData> : null)
      .then(json => {
        if (json) {
          setData(json)
          sessionStorage.setItem(cacheKey, JSON.stringify(json))
        }
      })
      .catch(() => { /* silent fail */ })
      .finally(() => setLoading(false))
  }, [sector])

  if (!loading && !data?.digest) return null

  const points = data?.digest ? parseDigest(data.digest) : []

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden shadow-sm mb-6"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-primary/3 transition-colors"
      >
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Your 5 Things Today</p>
          <p className="text-xs text-muted-foreground">
            {loading ? 'Searching latest news...' : `${sector} · ${data?.sources.length ?? 0} sources`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {loading && <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-border/30">
              {loading ? (
                <div className="space-y-3 pt-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-muted/60 shrink-0 animate-pulse mt-0.5" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-full bg-muted/50 rounded animate-pulse" />
                        <div className="h-3.5 w-4/5 bg-muted/40 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : points.length > 0 ? (
                <div className="space-y-3 pt-4">
                  {points.map((point, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex gap-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-foreground/85 leading-relaxed">{point}</p>
                    </motion.div>
                  ))}

                  {/* Sources toggle */}
                  {data?.sources && data.sources.length > 0 && (
                    <div className="pt-2">
                      <button
                        onClick={() => setShowSources(s => !s)}
                        className="text-[11px] text-muted-foreground hover:text-foreground transition-colors font-medium"
                      >
                        {showSources ? '▾ Hide sources' : `▸ ${data.sources.length} sources`}
                      </button>
                      <AnimatePresence>
                        {showSources && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-2"
                          >
                            <div className="space-y-2">
                              {data.sources.map((src, i) => (
                                <a key={i} href={src.url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-start gap-2 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/30 transition-colors group">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">{src.title}</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{src.snippet}</p>
                                  </div>
                                  <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                                </a>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground pt-4">No digest available. Try refreshing.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

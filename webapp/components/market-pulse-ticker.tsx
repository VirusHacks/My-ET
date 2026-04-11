'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, ExternalLink, RefreshCw, Activity } from 'lucide-react'

interface PulseIndex {
  name: string; symbol: string; value: string | null; change: string | null
  pct: string | null; direction: 'up' | 'down' | 'flat'
  sourceTitle?: string; sourceUrl?: string
}

interface PulseData {
  indices: PulseIndex[]
  interpretation: string | null
  generatedAt: string
}

function IndexChip({ idx, delay }: { idx: PulseIndex; delay: number }) {
  const isUp = idx.direction === 'up'
  const isDown = idx.direction === 'down'
  const hasData = idx.value !== null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card/40 hover:bg-card/60 border border-border/40 hover:border-primary/30 transition-all shrink-0 group shadow-sm"
    >
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-tight mb-0.5">{idx.symbol}</span>
        {hasData ? (
          <span className="text-sm font-black text-foreground tabular-nums leading-none tracking-tight">{idx.value}</span>
        ) : (
          <div className="h-4 w-16 bg-muted/60 rounded animate-pulse mt-1" />
        )}
      </div>
      
      {hasData && idx.pct ? (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black shadow-sm ${
          isUp ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
            : isDown ? 'bg-red-500/15 text-red-500 border border-red-500/20'
            : 'bg-muted/60 text-muted-foreground'
        }`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {idx.pct}
        </div>
      ) : !hasData && (
        <div className="h-5 w-12 bg-muted/60 rounded-lg animate-pulse" />
      )}
      
      {idx.sourceUrl && (
        <a href={idx.sourceUrl} target="_blank" rel="noopener noreferrer"
          className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary">
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </motion.div>
  )
}

export function MarketPulseTicker() {
  const [data, setData] = useState<PulseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInterpretation, setShowInterpretation] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/pulse')
      if (!res.ok) throw new Error('fetch failed')
      const json = await res.json() as PulseData
      setData(json)
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
    } catch { /* silently fail */ }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 2 * 60 * 1000) // Refresh every 2 minutes for "live" feel
    return () => clearInterval(t)
  }, [])

  const upCount = data?.indices.filter(i => i.direction === 'up').length ?? 0
  const downCount = data?.indices.filter(i => i.direction === 'down').length ?? 0
  const overallUp = upCount > downCount

  return (
    <div className="w-full border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-[50]">
      <div className="max-w-7xl mx-auto px-6 py-2.5">
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-none">
          {/* Status Badge */}
          <div className="flex items-center gap-2 shrink-0 bg-muted/20 px-3 py-1.5 rounded-full border border-border/40">
            <div className="relative flex h-2 w-2">
              <motion.span
                animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${loading ? 'bg-amber-400' : overallUp ? 'bg-emerald-400' : 'bg-red-400'}`}
              ></motion.span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${loading ? 'bg-amber-500' : overallUp ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            </div>
            <span className="text-[10px] font-black text-foreground uppercase tracking-widest">Live</span>
          </div>

          {/* Index chips */}
          <div className="flex items-center gap-3">
            {loading && !data ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-card/40 border border-border/40 shrink-0">
                  <div className="space-y-1">
                    <div className="h-2 w-10 bg-muted/70 rounded animate-pulse" />
                    <div className="h-3 w-14 bg-muted/70 rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-10 bg-muted/60 rounded-lg animate-pulse" />
                </div>
              ))
            ) : (
              data?.indices.map((idx, i) => (
                <IndexChip key={idx.symbol} idx={idx} delay={i * 0.05} />
              ))
            )}
          </div>

          {/* Tools */}
          <div className="ml-auto flex items-center gap-3 shrink-0 pl-4 border-l border-border/40">
            {data?.interpretation && (
              <button
                onClick={() => setShowInterpretation(s => !s)}
                className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border ${
                  showInterpretation
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                    : 'bg-muted/20 text-muted-foreground border-border/40 hover:text-foreground hover:bg-muted/40'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                AI Read
              </button>
            )}
            
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter leading-none">Last Check</span>
              <span className="text-[10px] font-black text-muted-foreground leading-none mt-0.5 tabular-nums">{lastUpdated ?? '--:--'}</span>
            </div>

            <button onClick={load} className="text-muted-foreground hover:text-primary transition-all p-2 rounded-xl bg-muted/20 hover:bg-primary/10 border border-border/20">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showInterpretation && data?.interpretation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="py-4 border-t border-border/40 mt-3 flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                   <Activity className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground/80 leading-relaxed italic">
                  <span className="text-primary font-black uppercase text-[10px] tracking-widest block not-italic mb-1">Market Sentiment Analysis</span>
                  {data.interpretation}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

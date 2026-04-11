'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, 
  TrendingUp, 
  BarChart3, 
  LayoutList, 
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Info
} from 'lucide-react'
import { MarketMoodGauge } from './market-mood-gauge'
import { TrendingRadar } from './trending-radar'
import type { SidebarAIData } from '@/app/api/dashboard/sidebar/route'

interface WatchlistStock {
  symbol: string
  name: string
  price: string
  change: string
  pct: string
  direction: 'up' | 'down'
}

const MOCK_WATCHLIST: WatchlistStock[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', price: '2,945.30', change: '+12.45', pct: '+0.42%', direction: 'up' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', price: '4,102.15', change: '-45.60', pct: '-1.10%', direction: 'down' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', price: '1,532.80', change: '+8.90', pct: '+0.58%', direction: 'up' },
]

export function SidebarIntelligence({ sector }: { sector: string }) {
  const [data, setData] = useState<SidebarAIData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/dashboard/sidebar?sector=${sector}`)
        if (res.ok) {
          const json = await res.json() as SidebarAIData
          setData(json)
        }
      } catch (err) {
        console.error('[SidebarIntelligence] Failed:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sector])

  return (
    <div className="space-y-6 sticky top-24">
      {/* 1. Market Mood Gauge */}
      <MarketMoodGauge 
        score={data?.sentiment ?? 50} 
        label={data?.sentimentLabel ?? 'Neutral'} 
        loading={loading} 
      />

      {/* 2. Trending Topics Radar */}
      <TrendingRadar 
        topics={data?.trending ?? []} 
        loading={loading} 
      />

      {/* 3. AI Recommendation Pick */}
      <AnimatePresence>
        {!loading && data?.recommendation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group block relative overflow-hidden p-5 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/8 transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-primary fill-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Daily Must-Read</span>
            </div>
            
            <a href={data.recommendation.url} target="_blank" rel="noopener noreferrer">
              <h4 className="text-sm font-black text-foreground group-hover:text-primary transition-colors leading-snug mb-2">
                {data.recommendation.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed italic mb-3">
                "{data.recommendation.reason}"
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary group-hover:gap-2 transition-all">
                Read full brief <ChevronRight className="w-3 h-3" />
              </div>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Watchlist Snapshot (Simplified) */}
      <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <LayoutList className="w-4 h-4" />
            Watchlist
          </h3>
          <span className="text-[10px] text-primary font-bold hover:underline cursor-pointer tracking-wider uppercase">View All</span>
        </div>
        
        <div className="space-y-1.5">
          {MOCK_WATCHLIST.map((stock) => (
            <div key={stock.symbol} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/40 transition-colors border border-transparent hover:border-border/60 group">
              <div className="flex flex-col">
                <span className="text-xs font-black text-foreground">{stock.symbol}</span>
                <span className="text-[10px] text-muted-foreground truncate w-24">
                  {stock.name}
                </span>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-xs font-bold tabular-nums">₹{stock.price}</span>
                <span className={`text-[10px] font-bold tabular-nums flex items-center gap-1 ${
                  stock.direction === 'up' ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {stock.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stock.pct}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

       {/* 5. Sector Performance - Quick Glance */}
       <div className="px-1">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5 mb-3">
            <Info className="w-3.5 h-3.5" />
            Quick Discovery
          </p>
          <div className="grid grid-cols-2 gap-2">
            {['IPO Watch', 'Earnings', 'Startup Funding', 'Policy'].map((tag) => (
              <div key={tag} className="text-[10px] font-bold px-3 py-2 bg-muted/40 border border-border/40 rounded-xl text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all cursor-pointer flex items-center justify-between group">
                {tag}
                <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
       </div>
    </div>
  )
}

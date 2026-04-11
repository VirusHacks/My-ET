'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Zap, TrendingUp, Hash } from 'lucide-react'

interface TrendingRadarProps {
  topics: string[]
  loading?: boolean
}

export function TrendingRadar({ topics, loading }: TrendingRadarProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border/40 rounded-2xl p-6 h-[180px] space-y-3 animate-pulse">
        <div className="h-4 w-1/3 bg-muted/60 rounded" />
        <div className="flex flex-wrap gap-2 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-16 bg-muted/60 rounded-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border/40 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-primary" />
          Trending Radar
        </h3>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Live</span>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {topics.map((topic, i) => (
          <motion.div
            key={topic}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.05 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              i === 0 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-muted/40 text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground hover:bg-muted'
            }`}
          >
            {i === 0 ? <TrendingUp className="w-3 h-3" /> : <Hash className="w-3 h-3" />}
            {topic}
          </motion.div>
        ))}
      </div>

      <div className="mt-5 p-3 rounded-xl bg-muted/30 border border-border/20 text-[10px] text-muted-foreground italic leading-relaxed">
        AI-extracted from 30+ headlines over the last hour. Updated real-time.
      </div>
    </div>
  )
}

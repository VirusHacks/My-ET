'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Zap, TrendingUp, BarChart3, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react'
import type { CategoryAIData } from '@/app/api/dashboard/category-ai/route'

const cardAnim = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  fontSize: '11px',
  fontWeight: 'bold',
  padding: '8px 12px'
}

export function CategoryAIDashboard({ category, sector }: { category: string; sector: string }) {
  const [data, setData] = useState<CategoryAIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/dashboard/category-ai?category=${category}&sector=${sector}`)
        if (!res.ok) throw new Error('API failed')
        const json = await res.json() as CategoryAIData
        setData(json)
      } catch (err) {
        console.error('[CategoryAIDashboard]', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [category, sector])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[400px]">
        <div className="bg-card border border-border/60 rounded-[2rem] p-8 h-full flex flex-col gap-6 animate-pulse">
           <div className="h-4 w-1/4 bg-muted rounded-full" />
           <div className="h-6 w-3/4 bg-muted rounded-full" />
           <div className="h-4 w-full bg-muted rounded-full" />
           <div className="mt-auto h-48 w-full bg-muted/40 rounded-2xl" />
        </div>
        <div className="bg-card border border-border/60 rounded-[2rem] p-8 space-y-6 animate-pulse">
          <div className="h-4 w-1/3 bg-muted rounded-full" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-muted mt-1 shrink-0" />
              <div className="h-4 w-full bg-muted rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">

      {/* ── Summary & Chart ── */}
      <motion.div variants={cardAnim} className="bg-card border border-border/60 rounded-[2rem] p-8 shadow-sm flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
             <Zap className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{category} Pulse Analysis</h3>
        </div>

        <h2 className="text-2xl font-black text-foreground mb-4 leading-tight tracking-tighter">{data.headline}</h2>
        <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-8 italic">"{data.summary}"</p>

        <div className="mt-auto h-56 w-full relative">
          {isMounted && (
            <ResponsiveContainer width="100%" height="100%">
              {data.chartType === 'line' ? (
                <LineChart data={data.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }} 
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }}
                    animationDuration={1500}
                  />
                  <Tooltip
                    contentStyle={CUSTOM_TOOLTIP_STYLE}
                    cursor={{ stroke: 'rgba(0,0,0,0.05)', strokeWidth: 2 }}
                  />
                </LineChart>
              ) : data.chartType === 'area' ? (
                <AreaChart data={data.chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                   <linearGradient id="colorValDashboard" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValDashboard)" 
                    animationDuration={1500}
                  />
                  <Tooltip
                    contentStyle={CUSTOM_TOOLTIP_STYLE}
                    cursor={{ stroke: 'rgba(0,0,0,0.05)', strokeWidth: 2 }}
                  />
                </AreaChart>
              ) : (
                <BarChart data={data.chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <Bar 
                    dataKey="value" 
                    fill="#6366f1" 
                    radius={[6, 6, 0, 0]} 
                    animationDuration={1000} 
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={CUSTOM_TOOLTIP_STYLE}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* ── Key Indicators & Sources ── */}
      <motion.div variants={cardAnim} className="bg-card border border-border/60 rounded-[2rem] p-8 shadow-sm flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
             <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Key Intelligence Updates</h3>
        </div>

        <div className="space-y-5 mb-10 flex-1">
          {data.bullets.map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + (i * 0.1) }}
              className="flex gap-4 items-start group">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors mt-2 shrink-0 shadow-sm shadow-primary/30" />
              <p className="text-sm font-bold text-foreground/80 leading-relaxed tracking-tight">{b}</p>
            </motion.div>
          ))}
        </div>

        <div className="pt-8 border-t border-border/40">
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 opacity-60">Verified Primary Sources</p>
           <div className="flex flex-wrap gap-3">
             {data.sources.map((s, i) => (
               <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2.5 text-[10px] font-black px-4 py-2.5 rounded-xl bg-muted/30 text-muted-foreground/80 hover:bg-primary/5 hover:text-primary transition-all uppercase tracking-tight group/link">
                 <span className="truncate max-w-[180px]">{s.title}</span>
                 <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover/link:opacity-100 group-hover/link:scale-110 transition-all" />
               </a>
             ))}
           </div>
        </div>
      </motion.div>

    </motion.div>
  )
}

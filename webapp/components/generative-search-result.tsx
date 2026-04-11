'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Minus, ExternalLink,
  Zap, Target, BarChart3, Crown, ChevronRight,
  MessageSquare, Activity, Newspaper, Scale, Globe,
  ArrowUpRight, ArrowDownRight, Dot
} from 'lucide-react'
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis,
  Tooltip, ResponsiveContainer,
  Cell
} from 'recharts'
import type {
  SearchResult, StockResult, MarketResult,
  NewsResult, CompareResult, GeneralResult
} from '@/app/api/ai-search/route'
import { Button } from './ui/button'

// ─── Animations ─────────────────────────────────────────────────────────────
const cardAnim = {
  hidden: { opacity: 0, y: 16, scale: 0.99 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] } }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function useIsMounted() {
  const [m, setM] = useState(false)
  useEffect(() => setM(true), [])
  return m
}

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '10px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  fontSize: '11px',
  fontWeight: '700',
  padding: '8px 14px',
  color: 'hsl(var(--foreground))',
}

function DirectionIcon({ d, cls = 'w-4 h-4' }: { d: 'up' | 'down' | 'flat'; cls?: string }) {
  if (d === 'up') return <TrendingUp className={cls} />
  if (d === 'down') return <TrendingDown className={cls} />
  return <Minus className={cls} />
}

function dirColor(d: 'up' | 'down' | 'flat') {
  return d === 'up' ? 'text-emerald-500' : d === 'down' ? 'text-red-500' : 'text-muted-foreground'
}

function SourceChip({ title, url }: { title: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors border border-border/40 hover:border-primary/30 px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-primary/5 shrink-0"
    >
      {title.slice(0, 36)}{title.length > 36 ? '…' : ''}
      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  )
}

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-3.5 h-3.5 text-muted-foreground/50" />
      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground/50">{label}</span>
    </div>
  )
}

function AskMoreButton({ text }: { text: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="mt-5 w-full justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 border border-border/40 hover:border-primary/20 transition-all rounded-xl py-5 group"
    >
      <div className="flex items-center gap-2.5">
        <MessageSquare className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition" />
        {text}
      </div>
      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
    </Button>
  )
}

// ─── 1. Stock Card ────────────────────────────────────────────────────────────
function StockCard({ data }: { data: StockResult }) {
  const isMounted = useIsMounted()
  const up = data.direction === 'up'
  const down = data.direction === 'down'
  const accentColor = up ? '#10b981' : down ? '#ef4444' : '#6366f1'
  const gradientId = `sg-${Math.random().toString(36).slice(2, 7)}`

  return (
    <motion.div variants={cardAnim} className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
      {/* Header */}
      <div
        className="p-7 border-b border-border/40"
        style={{ borderTop: `3px solid ${accentColor}` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/50 block mb-1.5">
              {data.symbol} · NSE
            </span>
            <h3 className="text-2xl font-black tracking-tight text-foreground leading-none">{data.name || data.symbol}</h3>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black tabular-nums tracking-tight text-foreground">
              {data.value ? `₹${data.value}` : '—'}
            </p>
            <div className={`flex items-center gap-1 justify-end mt-1.5 text-sm font-black ${dirColor(data.direction)}`}>
              <DirectionIcon d={data.direction} cls="w-3.5 h-3.5" />
              <span>{data.change}</span>
              <span className="opacity-70 font-semibold">({data.pct})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-7 space-y-6">
        {/* 7-Day Chart */}
        {isMounted && data.chartData && data.chartData.length > 1 && (
          <div>
            <SectionLabel icon={Activity} label="7-Day Price History (Yahoo Finance)" />
            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={accentColor} stopOpacity={0.12} />
                      <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    dy={6}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Price']}
                    cursor={{ stroke: accentColor, strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.5 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={accentColor}
                    strokeWidth={2.5}
                    fill={`url(#${gradientId})`}
                    dot={false}
                    activeDot={{ r: 4, fill: accentColor, strokeWidth: 0 }}
                    animationDuration={1200}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* AI Context */}
        {data.context && (
          <div className="flex gap-4 p-4 bg-muted/30 border border-border/40 rounded-2xl items-start">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground/70 leading-relaxed">{data.context}</p>
          </div>
        )}

        {/* Sources */}
        {data.sources?.length > 0 && (
          <div>
            <SectionLabel icon={Newspaper} label="News Sources" />
            <div className="flex flex-wrap gap-2">
              {data.sources.map((s, i) => <SourceChip key={i} {...s} />)}
            </div>
          </div>
        )}

        <AskMoreButton text={`Deeper analysis of ${data.symbol}`} />
      </div>
    </motion.div>
  )
}

// ─── 2. Market Card ───────────────────────────────────────────────────────────
function MarketCard({ data }: { data: MarketResult }) {
  const isMounted = useIsMounted()
  const sentimentConfig = {
    bullish: { color: '#10b981', bg: 'bg-emerald-500/8 border-emerald-500/20', label: '🟢 Bullish' },
    bearish: { color: '#ef4444', bg: 'bg-red-500/8 border-red-500/20', label: '🔴 Bearish' },
    neutral: { color: '#f59e0b', bg: 'bg-amber-500/8 border-amber-500/20', label: '🟡 Neutral' },
  }
  const sc = sentimentConfig[data.sentiment] ?? sentimentConfig.neutral

  return (
    <motion.div variants={cardAnim} className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
      {/* Sentiment Header */}
      <div className="p-7 border-b border-border/40 bg-muted/5">
        <div className="flex items-center gap-3 mb-5">
          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${sc.bg}`} style={{ color: sc.color }}>
            {sc.label}
          </span>
          <Globe className="w-4 h-4 text-muted-foreground/30 ml-auto" />
        </div>
        <h3 className="text-xl font-black text-foreground leading-snug tracking-tight">{data.headline}</h3>
      </div>

      <div className="p-7 space-y-7">
        {/* Sector Strength Chart */}
        {isMounted && data.chartData?.length > 0 && (
          <div>
            <SectionLabel icon={BarChart3} label="Sector Relative Strength" />
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    dy={6}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number) => [`${v}/100`, 'Strength']}
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]} animationDuration={900} strokeWidth={0}>
                    {data.chartData.map((e, i) => (
                      <Cell
                        key={i}
                        fill={e.value >= 65 ? '#10b981' : e.value >= 45 ? '#6366f1' : '#ef4444'}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Indices Grid */}
        {data.indices?.length > 0 && (
          <div>
            <SectionLabel icon={Activity} label="Key Indices" />
            <div className="grid grid-cols-2 gap-3">
              {data.indices.map((idx, i) => (
                <div key={i} className="p-4 rounded-2xl bg-muted/20 border border-border/40 hover:bg-muted/30 transition-colors">
                  <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 mb-2">{idx.name}</div>
                  <div className={`text-sm font-black flex items-center gap-1.5 ${dirColor(idx.direction)}`}>
                    <DirectionIcon d={idx.direction} cls="w-3.5 h-3.5" />
                    <span className="text-foreground tabular-nums">{idx.value}</span>
                    <span className="text-xs font-semibold opacity-70">{idx.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bullets */}
        {data.bullets?.length > 0 && (
          <div>
            <SectionLabel icon={Zap} label="Intelligence Bullets" />
            <div className="space-y-3">
              {data.bullets.map((b, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <Dot className="w-5 h-5 text-primary/60 shrink-0 mt-0.5 -ml-1" />
                  <p className="text-sm font-medium text-foreground/80 leading-relaxed">{b}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sources */}
        {data.sources?.length > 0 && (
          <div>
            <SectionLabel icon={Newspaper} label="Sources" />
            <div className="flex flex-wrap gap-2">
              {data.sources.map((s, i) => <SourceChip key={i} {...s} />)}
            </div>
          </div>
        )}

        <AskMoreButton text="Explore full market briefing" />
      </div>
    </motion.div>
  )
}

// ─── 3. News Card ─────────────────────────────────────────────────────────────
function NewsCard({ data }: { data: NewsResult }) {
  return (
    <motion.div variants={cardAnim} className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
      <div className="p-7 border-b border-border/40 bg-muted/5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">AI Brief</span>
        </div>
        <p className="text-lg font-black text-foreground leading-snug tracking-tight">{data.answer}</p>
      </div>

      <div className="p-7 space-y-6">
        {/* Key Facts */}
        {data.bullets?.length > 0 && (
          <div className="space-y-2.5">
            {data.bullets.map((b, i) => (
              <div key={i} className="flex gap-4 items-start p-4 rounded-xl bg-muted/20 border border-border/30 hover:bg-muted/30 hover:border-primary/20 transition-colors group">
                <span className="text-[10px] font-black text-primary/30 group-hover:text-primary transition-colors mt-0.5 tabular-nums shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-sm font-medium text-foreground/80 leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        )}

        {/* Source Articles */}
        {data.sources?.length > 0 && (
          <div>
            <SectionLabel icon={Newspaper} label="Verified From" />
            <div className="space-y-2.5">
              {data.sources.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col p-4 rounded-xl bg-muted/20 hover:bg-muted/35 border border-border/40 hover:border-primary/25 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-snug">{s.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  {s.snippet && (
                    <p className="text-[11px] text-muted-foreground/70 leading-relaxed font-medium line-clamp-2">
                      {s.snippet}
                    </p>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        <AskMoreButton text="Ask a follow-up question" />
      </div>
    </motion.div>
  )
}

// ─── 4. Compare Card ─────────────────────────────────────────────────────────
function CompareCard({ data }: { data: CompareResult }) {
  const isMounted = useIsMounted()

  return (
    <motion.div variants={cardAnim} className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
      {/* Versus Header */}
      <div className="p-7 border-b border-border/40 bg-muted/5">
        <div className="flex items-center gap-3">
          <div className="flex-1 px-4 py-3 bg-indigo-500/8 border border-indigo-500/20 rounded-2xl text-center">
            <span className="text-sm font-black text-foreground tracking-tight">{data.entity1}</span>
          </div>
          <div className="shrink-0">
            <Scale className="w-5 h-5 text-muted-foreground/40" />
          </div>
          <div className="flex-1 px-4 py-3 bg-slate-500/8 border border-slate-500/20 rounded-2xl text-center">
            <span className="text-sm font-black text-foreground tracking-tight">{data.entity2}</span>
          </div>
        </div>
      </div>

      <div className="p-7 space-y-6">
        {/* Comparison Chart */}
        {isMounted && data.chartData?.length > 0 && (
          <div>
            <SectionLabel icon={BarChart3} label="Head-to-Head Metrics" />
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  />
                  <Bar dataKey="val1" name={data.entity1} fill="#6366f1" radius={[0, 5, 5, 0]} barSize={10} animationDuration={1000} fillOpacity={0.85} />
                  <Bar dataKey="val2" name={data.entity2} fill="#94a3b8" radius={[0, 5, 5, 0]} barSize={10} animationDuration={1000} fillOpacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Row Comparison Table */}
        {data.rows?.length > 0 && (
          <div className="rounded-2xl border border-border/40 overflow-hidden">
            <div className="grid grid-cols-3 bg-muted/30 px-5 py-3 border-b border-border/30">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Metric</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-center text-indigo-500/70">{data.entity1}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-center text-muted-foreground/60">{data.entity2}</span>
            </div>
            {data.rows.map((row, i) => (
              <div key={i} className="grid grid-cols-3 px-5 py-3.5 border-b border-border/20 last:border-none hover:bg-muted/15 transition-colors">
                <span className="text-xs font-bold text-muted-foreground/70 self-center">{row.label}</span>
                <div className="text-center">
                  <span className={`text-sm font-black tabular-nums ${row.winner === 1 ? 'text-primary' : 'text-foreground/50'}`}>
                    {row.val1}
                    {row.winner === 1 && <Crown className="inline w-3 h-3 ml-1 text-amber-500" />}
                  </span>
                </div>
                <div className="text-center">
                  <span className={`text-sm font-black tabular-nums ${row.winner === 2 ? 'text-primary' : 'text-foreground/50'}`}>
                    {row.val2}
                    {row.winner === 2 && <Crown className="inline w-3 h-3 ml-1 text-amber-500" />}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Verdict */}
        {data.verdict && (
          <div className="flex gap-4 p-5 bg-primary/5 border border-primary/20 rounded-2xl items-start">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-1">AI Verdict</p>
              <p className="text-sm font-bold text-foreground leading-relaxed">{data.verdict}</p>
            </div>
          </div>
        )}

        {/* Sources */}
        {data.sources?.length > 0 && (
          <div>
            <SectionLabel icon={Newspaper} label="Sources" />
            <div className="flex flex-wrap gap-2">
              {data.sources.map((s, i) => <SourceChip key={i} {...s} />)}
            </div>
          </div>
        )}

        <AskMoreButton text="Dig deeper into this comparison" />
      </div>
    </motion.div>
  )
}

// ─── 5. General Card ─────────────────────────────────────────────────────────
function GeneralCard({ data }: { data: GeneralResult }) {
  return (
    <motion.div variants={cardAnim} className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
      <div className="p-7 border-b border-border/40 bg-muted/5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe className="w-4 h-4 text-primary" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">AI Summary</span>
        </div>
        <p className="text-lg font-black text-foreground leading-snug tracking-tight">{data.answer}</p>
      </div>

      <div className="p-7 space-y-6">
        {data.bullets?.length > 0 && (
          <div className="space-y-2.5">
            {data.bullets.map((b, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0 mt-2" />
                <p className="text-sm font-medium text-foreground/80 leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        )}

        {data.sources?.length > 0 && (
          <div>
            <SectionLabel icon={Newspaper} label="Sources" />
            <div className="flex flex-wrap gap-2">
              {data.sources.map((s, i) => <SourceChip key={i} {...s} />)}
            </div>
          </div>
        )}

        <AskMoreButton text="Ask a follow-up" />
      </div>
    </motion.div>
  )
}

// ─── Root Export ──────────────────────────────────────────────────────────────
const CARD_MAP = {
  stock: StockCard,
  market: MarketCard,
  news: NewsCard,
  compare: CompareCard,
  general: GeneralCard,
} as const

export function GenerativeSearchResult({ result }: { result: SearchResult }) {
  const Card = (CARD_MAP[result.type] ?? GeneralCard) as React.ComponentType<{ data: any }>

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={result.type + JSON.stringify(result).slice(0, 40)}
        initial="hidden"
        animate="show"
        variants={cardAnim}
        className="w-full"
      >
        <Card data={result} />
      </motion.div>
    </AnimatePresence>
  )
}

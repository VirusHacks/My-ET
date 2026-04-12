'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Clock, User, ExternalLink, Sparkles, AlertCircle,
  Zap, FileText, BarChart2, Clock3, Layers, BookOpen, Shuffle,
  X, ChevronRight, TrendingUp, TrendingDown, Eye, PanelRight,
  AlertTriangle, CheckCircle, ChevronLeft, Wand2,
  Mic2, Video, Activity, Play, Hash, MonitorPlay, Gauge,
  Languages, ChevronDown, Loader2, RotateCcw,
} from 'lucide-react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'
import { ArticleChat } from '@/components/article-chat'
import type { FullArticle } from '@/lib/articleFetcher'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface UserProfile { sector: string; experienceLevel?: string }
interface BullBearPoint { point: string; explanation: string; confidence?: 'high' | 'medium' | 'low' }
interface BullBearResult { bullish: BullBearPoint[]; bearish: BullBearPoint[]; orchestratorVerdict: string }
interface StoryArcEvent { date: string; headline: string; significance: string; type: string }
interface StoryArcResult { topic: string; summary: string; events: StoryArcEvent[]; whatToWatch: string[] }
interface Flashcard { term: string; definition: string; example: string; difficulty: string; category: string }
interface FlashcardsResult { cards: Flashcard[]; articleSummary: string; keyTakeaway: string }
interface ContextTerm { term: string; shortDef: string; deeperExplanation: string; indianContext: string; relatedTerms: string[] }
interface ContextResult { backgroundContext: string; keyTerms: ContextTerm[]; whyItMatters: string; historicalAnalogy: string }
interface ContraryView { headline: string; mainArgument: string; whoBelieves: string; counterToMainNarrative: string; supportingPoints: { point: string; reasoning: string }[] }
interface VideoScene { scene: number; duration: string; visual: string; narration: string; onscreen_text: string; broll?: string }
interface VideoScriptResult { title: string; hook: string; total_duration: string; scenes: VideoScene[]; cta: string; hashtags: string[] }
interface ImpactCategory { label: string; score: number; direction: 'positive' | 'negative' | 'neutral'; reasoning: string }
interface ImpactResult { overallScore: number; overallSentiment: string; headline: string; categories: ImpactCategory[]; affectedStocks: { ticker: string; exchange: string; impact: string; reason: string }[]; timeHorizon: string; confidence: number }
type ToolId = 'summary' | 'bullbear' | 'story' | 'context' | 'flashcards' | 'contrarian' | 'podcast' | 'video' | 'impact'
type ToolStatus = 'idle' | 'loading' | 'done' | 'error'

// ─── Tool config ───────────────────────────────────────────────────────────────
const TOOLS: { id: ToolId; label: string; desc: string; icon: React.ElementType; endpoint: string; accent?: string }[] = [
  { id: 'summary',    label: 'Executive Brief',  desc: '30-sec sector brief',      icon: FileText,  endpoint: '/api/studio/summarize' },
  { id: 'bullbear',   label: 'Bull / Bear',       desc: 'Dual-agent debate',        icon: BarChart2, endpoint: '/api/studio/bull-bear' },
  { id: 'story',      label: 'Story Arc',         desc: 'Timeline of this story',   icon: Clock3,    endpoint: '/api/studio/story-arc' },
  { id: 'context',    label: 'Context',           desc: 'Background & key terms',   icon: Layers,    endpoint: '/api/studio/context' },
  { id: 'flashcards', label: 'Flashcards',        desc: 'Study cards',              icon: BookOpen,  endpoint: '/api/studio/flashcards' },
  { id: 'contrarian', label: 'Contrarian',        desc: "Devil's advocate",         icon: Shuffle,   endpoint: '/api/studio/contrarian' },
  { id: 'podcast',    label: 'Podcast Script',    desc: '3-min audio script',       icon: Mic2,      endpoint: '/api/studio/podcast',   accent: 'purple' },
  { id: 'video',      label: 'Video Brief',       desc: 'Reels/Shorts script',      icon: MonitorPlay, endpoint: '/api/studio/video',   accent: 'blue' },
  { id: 'impact',     label: 'Impact Score',      desc: 'Market impact meter',      icon: Activity,  endpoint: '/api/studio/impact',    accent: 'amber' },
]

// ─── Article content cleaner ───────────────────────────────────────────────────
// Patterns that indicate junk lines (ET nav, fund ads, UI chrome)
const JUNK_LINE_RE = [
  /^Nifty|^SENSEX|^NIFTY/i,
  /^\d[\d,]+\.\d+[-+]\d/,                        // "22,819.60-486.86" stock tickers
  /Fund\s+(Direct|Plan|Growth)/i,                 // fund names
  /\(javascript:/i,                               // JS links
  /\[Sign In\]/i,
  /^Business News[›>]/i,                          // breadcrumb
  /›.*Markets.*›/,                                // nav breadcrumb
  /^(SECTIONS|Synopsis|Rate Story|Follow us|Font Size|Save|Print|Comment|Share)\s*$/i,
  /^Abc(Small|Medium|Large)\s*$/i,
  /^Read Today's Paper/i,
  /^The Economic Times daily/i,
  /^ETMarkets\.com$/i,
  /^By\s*$/i,
  /Rate Story/i,
  /Font Size/i,
  /^\s*\|?\s*(Share|Save|Print|Comment)\s*\|?\s*$/i,
  /^Follow us?$/i,
  /^Debaroti|^Authored by/i,                      // byline lines
  /5Y Return|Invest Now|^NAV$|^AUM$/i,            // fund marketing
  /^Expense Ratio|^Fund Size|^Category|^Risk|^Rating/i,
  /^\d+\.?\d*\s*%\s*$/,                           // percentage-only lines
  /\[FEATURED FUNDS/i,
] as RegExp[]

function isJunkLine(line: string): boolean {
  const t = line.trim()
  if (!t) return false
  return JUNK_LINE_RE.some(re => re.test(t))
}

function cleanArticleContent(raw: string): string {
  // 1. Strip markdown images (ET logos, promo images)
  let text = raw
    // Strip known ET junk/tracking images only
    .replace(/!\[[^\]]*\]\([^)]+(?:etimg|msid|logo|banner|promo|advert|tracking|pixel|1x1|beacon)[^)]*\)/gi, '')
    // Remove javascript: links entirely
    .replace(/\[([^\]]+)\]\(javascript:[^)]+\)/g, '')
    // Convert regular [text](url) links to plain text — but NOT image markdown ![]()
    .replace(/(?<!!)(\[([^\]]+)\]\(https?:\/\/[^)]+\))/g, '$2')
    // Remove bare URLs (that aren't image URLs — those are handled by ArticleBody)
    .replace(/^(?!https?:\/\/\S+\.(?:jpg|jpeg|png|webp|gif))https?:\/\/\S+$/gm, '')
    // Remove star ratings
    .replace(/[★☆✦✧]+/g, '')
    // Remove leftover link fragments
    .replace(/\]\([^)]+\)\[?[A-Z\s]+\]?/g, '')

  // 2. Split into lines and remove junk lines
  const lines = text.split('\n')
  const cleanedLines = lines.filter(line => !isJunkLine(line))

  // 3. Find the first "real content" line — skip any short preamble lines
  //    Real content = line with >60 chars that isn't a heading or junk
  let startIdx = 0
  for (let i = 0; i < Math.min(cleanedLines.length, 30); i++) {
    const line = cleanedLines[i].trim()
    // Keep headings (they mark article structure)
    if (/^#{1,4} /.test(line)) { startIdx = i; break }
    // Keep thick content paragraphs
    if (line.length > 60 && !/^[-*•]/.test(line)) { startIdx = i; break }
    // Keep "Synopsis" block start even if short
    if (/^synopsis/i.test(line) && i + 1 < cleanedLines.length) { startIdx = i; break }
  }

  const result = cleanedLines.slice(startIdx).join('\n')

  // 4. Final cleanup: collapse 3+ blank lines → 2, trim
  return result
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^(5Y Return|Invest Now)[^\n]*/gm, '')
    .trim()
}


// ─── Markdown renderer ─────────────────────────────────────────────────────────
function renderInline(text: string, contextTerms: ContextTerm[] = []): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  
  let regexStr = '(\\*\\*([^*]+)\\*\\*)|(\\*([^*]+)\\*)|(\\[([^\\]]+)\\]\\((https?:\\/\\/[^)]+)\\))'
  const terms = contextTerms.map(t => t.term).sort((a,b) => b.length - a.length)
  if (terms.length > 0) {
    const escapedTerms = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    regexStr += `|(\\b(${escapedTerms.join('|')})\\b)`
  }
  
  const regex = new RegExp(regexStr, 'gi')
  let last = 0, m: RegExpExecArray | null
  while ((m = regex.exec(text)) !== null) {
    if (last < m.index) parts.push(text.slice(last, m.index))
    
    if (m[1]) parts.push(<strong key={m.index} className="font-semibold text-foreground">{m[2]}</strong>)
    else if (m[3]) parts.push(<em key={m.index} className="italic">{m[4]}</em>)
    else if (m[5]) parts.push(
      <a key={m.index} href={m[7]} target="_blank" rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity">{m[6]}</a>
    )
    else if (m[8]) {
      const termDef = contextTerms.find(t => t.term.toLowerCase() === m[8].toLowerCase())
      parts.push(
        <HoverCard key={m.index}>
          <HoverCardTrigger className="font-medium bg-amber-500/15 text-foreground hover:bg-amber-500/25 border-b border-amber-500/40 border-dashed cursor-help transition-colors rounded-sm px-0.5 whitespace-nowrap">
            {m[8]}
          </HoverCardTrigger>
          <HoverCardContent side="top" align="center" style={{ zIndex: 100 }} className="w-64 p-4 rounded-xl bg-card/95 backdrop-blur-md border border-border/50 shadow-2xl">
            <p className="font-bold text-sm text-foreground mb-1.5">{termDef?.term}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{termDef?.shortDef}</p>
          </HoverCardContent>
        </HoverCard>
      )
    }
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length ? parts : [text]
}

// Returns true if a URL is a known ET junk/promo/logo image
function isJunkImageUrl(url: string): boolean {
  return /etimg|msid|logo|banner|promo|advert|tracking|pixel|1x1|beacon|icon/i.test(url)
}

// Image card component for article-embedded images
function ArticleImage({ src, alt }: { src: string; alt?: string }) {
  const [err, setErr] = useState(false)
  if (err) return null
  return (
    <figure className="my-6 rounded-2xl overflow-hidden border border-border/30 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? ''}
        onError={() => setErr(true)}
        className="w-full object-cover max-h-[420px]"
      />
      {alt && alt.length > 3 && (
        <figcaption className="px-4 py-2 text-[11px] text-muted-foreground bg-muted/30 text-center">
          {alt}
        </figcaption>
      )}
    </figure>
  )
}

function ArticleBody({ content, contextTerms = [] }: { content: string, contextTerms?: ContextTerm[] }) {
  const cleaned = cleanArticleContent(content)
  const lines = cleaned.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line) { i++; continue }

    // Headings
    if (/^#{1,4} /.test(line)) {
      const level = line.match(/^#+/)?.[0].length ?? 2
      const text = line.replace(/^#+\s/, '')
      const cls = level === 1 ? 'text-2xl font-bold text-foreground mt-8 mb-4'
        : level === 2 ? 'text-xl font-bold text-foreground mt-6 mb-3'
        : 'text-lg font-semibold text-foreground mt-5 mb-2'
      elements.push(<h2 key={i} className={cls}>{text}</h2>)
      i++; continue
    }

    // HR
    if (/^-{3,}$/.test(line) || /^\*{3,}$/.test(line)) {
      elements.push(<hr key={i} className="border-border/40 my-6" />)
      i++; continue
    }

    // Bullets
    if (/^[-*•]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*•]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s/, ''))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-3 space-y-2">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2.5 text-[0.93rem] text-foreground/85 leading-relaxed">
              <span className="text-primary/60 mt-1.5 shrink-0 text-xs">●</span>
              <span>{renderInline(item, contextTerms)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Skip junk lines: only a URL, partial markdown, etc.
    if (/^https?:\/\/\S+$/.test(line)) { i++; continue }
    if (/^\]\(https?:\/\//.test(line)) { i++; continue }
    if (/^\[.*\]\(https?:\/\//.test(line) && line.length > 120) { i++; continue }

    // ── Markdown images  ![alt](url)
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imgMatch) {
      const [, alt, src] = imgMatch
      if (!isJunkImageUrl(src)) {
        elements.push(<ArticleImage key={i} src={src} alt={alt} />)
      }
      i++; continue
    }

    // ── Bare image URL on its own line (e.g. from Tavily)
    const bareImgMatch = line.match(/^(https?:\/\/\S+\.(?:jpg|jpeg|png|webp|gif)(\?[^\s]*)?)$/i)
    if (bareImgMatch && !isJunkImageUrl(bareImgMatch[1])) {
      elements.push(<ArticleImage key={i} src={bareImgMatch[1]} />)
      i++; continue
    }

    elements.push(
      <p key={i} className="mb-4 text-[0.95rem] text-foreground/80 leading-[1.75]">
        {renderInline(line, contextTerms)}
      </p>
    )
    i++
  }
  return <div>{elements}</div>
}

// ─── Skeleton (neutral, no colour) ────────────────────────────────────────────
function Sk({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />
}

function ArticleSkeleton() {
  return (
    <div className="space-y-5">
      <Sk className="h-7 w-24" />
      <Sk className="h-10 w-full" />
      <Sk className="h-10 w-4/5" />
      <Sk className="h-5 w-full mt-2" />
      <Sk className="h-5 w-3/4" />
      <Sk className="h-56 w-full mt-4 rounded-2xl" />
      {[...Array(5)].map((_, i) => <Sk key={i} className={`h-4 ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />)}
    </div>
  )
}

function ToolSkeleton() {
  return (
    <div className="space-y-3 p-2">
      {[...Array(4)].map((_, i) => <Sk key={i} className={`h-4 ${i % 2 === 1 ? 'w-3/4' : 'w-full'}`} />)}
    </div>
  )
}

// ─── Result Views ──────────────────────────────────────────────────────────────
function SummaryView({ data }: { data: unknown }) {
  const text = (data as string) || ''
  return (
    <div className="space-y-3">
      {text.split('\n').filter(Boolean).map((line, i) => (
        <div key={i} className="flex gap-3 p-4 rounded-xl bg-muted/40 border border-border/30">
          <span className="text-primary font-bold shrink-0">›</span>
          <p className="text-sm text-foreground leading-relaxed">{line.replace(/\*\*/g, '')}</p>
        </div>
      ))}
    </div>
  )
}

function BullBearView({ data }: { data: unknown }) {
  const r = data as BullBearResult
  const confCls = (c?: string) => c === 'high' ? 'text-emerald-600 bg-emerald-500/10' : c === 'medium' ? 'text-amber-600 bg-amber-500/10' : 'text-slate-500 bg-slate-500/10'
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">Bullish</span>
          </div>
          <div className="space-y-2">
            {r.bullish?.map((pt, i) => (
              <div key={i} className="p-3 rounded-xl bg-emerald-500/6 border border-emerald-500/15">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <p className="font-semibold text-foreground text-sm leading-snug">{pt.point}</p>
                  {pt.confidence && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${confCls(pt.confidence)}`}>{pt.confidence}</span>}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{pt.explanation}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="font-semibold text-red-600 dark:text-red-400 text-sm">Bearish</span>
          </div>
          <div className="space-y-2">
            {r.bearish?.map((pt, i) => (
              <div key={i} className="p-3 rounded-xl bg-red-500/6 border border-red-500/15">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <p className="font-semibold text-foreground text-sm leading-snug">{pt.point}</p>
                  {pt.confidence && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${confCls(pt.confidence)}`}>{pt.confidence}</span>}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{pt.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {r.orchestratorVerdict && (
        <div className="p-4 rounded-xl bg-primary/6 border border-primary/15">
          <div className="flex items-center gap-2 mb-1.5">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-primary">AI Verdict</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{r.orchestratorVerdict}</p>
        </div>
      )}
    </div>
  )
}

const arcCfg: Record<string, { dot: string; badge: string; label: string }> = {
  origin:        { dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',   label: 'Origin' },
  escalation:    { dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',   label: 'Escalation' },
  turning_point: { dot: 'bg-violet-500',  badge: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', label: 'Turning Point' },
  current:       { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', label: 'Current' },
  projection:    { dot: 'bg-blue-400',    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',     label: 'Upcoming' },
}

function StoryArcView({ data }: { data: unknown }) {
  const r = data as StoryArcResult
  return (
    <div className="space-y-4">
      {r.summary && <p className="text-sm text-muted-foreground leading-relaxed italic border-l-3 border-primary/30 pl-3">{r.summary}</p>}
      <div className="relative pl-5 mt-4">
        {r.events?.map((ev, i) => {
          const cfg = arcCfg[ev.type] ?? arcCfg.origin
          return (
            <div key={i} className="relative mb-5">
              {i < r.events.length - 1 && <div className="absolute left-[-17px] top-3 bottom-[-14px] w-px bg-border/60" />}
              <div className={`absolute left-[-21px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-background ${cfg.dot}`} />
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="text-xs text-muted-foreground">{ev.date}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>{cfg.label}</span>
              </div>
              <p className="text-sm font-semibold text-foreground leading-snug mb-0.5">{ev.headline}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{ev.significance}</p>
            </div>
          )
        })}
      </div>
      {r.whatToWatch?.length > 0 && (
        <div className="mt-2 p-4 rounded-xl bg-amber-500/6 border border-amber-500/20">
          <div className="flex items-center gap-1.5 mb-2">
            <Eye className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Watch For</span>
          </div>
          {r.whatToWatch.map((w, i) => (
            <div key={i} className="flex gap-2 mb-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-foreground">{w}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ContextView({ data }: { data: unknown }) {
  const r = data as ContextResult
  const [exp, setExp] = useState<number | null>(null)
  return (
    <div className="space-y-4">
      {r.backgroundContext && (
        <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Background</p>
          <p className="text-sm text-foreground leading-relaxed">{r.backgroundContext}</p>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        {r.whyItMatters && (
          <div className="p-4 rounded-xl bg-amber-500/6 border border-amber-500/15">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1.5">Why It Matters</p>
            <p className="text-xs text-foreground leading-relaxed">{r.whyItMatters}</p>
          </div>
        )}
        {r.historicalAnalogy && (
          <div className="p-4 rounded-xl bg-violet-500/6 border border-violet-500/15">
            <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-1.5">Historical Parallel</p>
            <p className="text-xs text-foreground italic leading-relaxed">{r.historicalAnalogy}</p>
          </div>
        )}
      </div>
      {r.keyTerms?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Key Terms</p>
          <div className="space-y-1.5">
            {r.keyTerms.map((term, i) => (
              <div key={i} className="rounded-xl border border-border/40 overflow-hidden">
                <button onClick={() => setExp(exp === i ? null : i)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 text-left transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{term.term}</p>
                    <p className="text-xs text-muted-foreground truncate">{term.shortDef}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${exp === i ? 'rotate-90' : ''}`} />
                </button>
                <AnimatePresence>
                  {exp === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 border-t border-border/30 pt-3 space-y-2">
                        <p className="text-xs text-muted-foreground leading-relaxed">{term.deeperExplanation}</p>
                        {term.indianContext && <p className="text-xs text-amber-600/80 italic">🇮🇳 {term.indianContext}</p>}
                        {term.relatedTerms?.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {term.relatedTerms.map(rt => <span key={rt} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{rt}</span>)}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FlashcardsView({ data }: { data: unknown }) {
  const r = data as FlashcardsResult
  const [cur, setCur] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const cards = r.cards ?? []
  const card = cards[cur]
  if (!card) return null
  const catCls: Record<string, string> = {
    concept: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    person: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
    organization: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    metric: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    event: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  }
  return (
    <div className="space-y-4">
      {r.keyTakeaway && <div className="p-3 rounded-xl bg-primary/6 border border-primary/15 text-xs text-foreground"><span className="font-bold text-primary">Key Takeaway: </span>{r.keyTakeaway}</div>}
      <div className="flex gap-1">
        {cards.map((_, i) => (
          <button key={i} onClick={() => { setCur(i); setFlipped(false) }}
            className={`flex-1 h-1.5 rounded-full transition-colors ${i === cur ? 'bg-primary' : i < cur ? 'bg-primary/30' : 'bg-muted'}`} />
        ))}
      </div>
      <div className="relative w-full aspect-[4/3] max-w-sm mx-auto cursor-pointer perspective" onClick={() => setFlipped(f => !f)} style={{ perspective: '1000px' }}>
        <motion.div
           animate={{ rotateY: flipped ? 180 : 0 }}
           transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
           className="w-full h-full relative preserve-3d"
           style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front Face */}
          <div className="absolute inset-0 backface-hidden w-full h-full p-5 rounded-2xl border border-border/50 bg-card hover:border-primary/30 transition-colors flex flex-col shadow-sm" style={{ backfaceVisibility: 'hidden' }}>
            <div className="flex justify-between gap-2 mb-4">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${catCls[card.category] ?? 'bg-muted text-muted-foreground'}`}>{card.category}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{card.difficulty}</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
              <p className="text-2xl font-bold text-foreground">{card.term}</p>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-3">Click to reveal</p>
          </div>

          {/* Back Face */}
          <div className="absolute inset-0 backface-hidden w-full h-full p-5 rounded-2xl border border-border/50 bg-muted/30 flex flex-col shadow-sm" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
              <p className="text-sm text-foreground leading-relaxed font-medium">{card.definition}</p>
              {card.example && <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3 text-left w-full bg-background/50 p-2 rounded-r-lg">{card.example}</p>}
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-3">Click to hide</p>
          </div>
        </motion.div>
      </div>
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => { setCur(c => Math.max(0, c-1)); setFlipped(false) }} disabled={cur === 0} className="text-xs h-8">
          <ChevronLeft className="w-3.5 h-3.5 mr-1" />Prev
        </Button>
        <span className="text-xs text-muted-foreground">{cur+1} / {cards.length}</span>
        <Button variant="ghost" size="sm" onClick={() => { setCur(c => Math.min(cards.length-1, c+1)); setFlipped(false) }} disabled={cur === cards.length-1} className="text-xs h-8">
          Next<ChevronRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  )
}

function ContrarianView({ data }: { data: unknown }) {
  const r = data as ContraryView
  return (
    <div className="space-y-4">
      {r.headline && (
        <div className="p-4 rounded-xl bg-red-500/6 border border-red-500/20">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Shuffle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Contrarian Take</span>
          </div>
          <p className="text-base font-bold text-foreground leading-snug">{r.headline}</p>
        </div>
      )}
      {r.mainArgument && <p className="text-sm text-foreground leading-relaxed">{r.mainArgument}</p>}
      {r.counterToMainNarrative && (
        <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Strongest Counter-Point</p>
          <p className="text-sm text-foreground font-medium">{r.counterToMainNarrative}</p>
        </div>
      )}
      {r.supportingPoints?.map((pt, i) => (
        <div key={i} className="flex gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground mb-0.5">{pt.point}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{pt.reasoning}</p>
          </div>
        </div>
      ))}
      {r.whoBelieves && (
        <div className="flex gap-2.5 p-3 rounded-xl bg-muted/20">
          <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground italic">{r.whoBelieves}</p>
        </div>
      )}
    </div>
  )
}

// ─── Podcast View ─────────────────────────────────────────────────────────────
const PODCAST_LANGUAGES = [
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी',    flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்',    flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు',   flag: '🇮🇳' },
  { code: 'kn', label: 'ಕನ್ನಡ',    flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी',    flag: '🇮🇳' },
  { code: 'bn', label: 'বাংলা',    flag: '🇮🇳' },
]

const OPENAI_VOICES = [
  { id: 'nova',    label: 'Nova',    desc: 'Warm & expressive' },
  { id: 'alloy',   label: 'Alloy',   desc: 'Neutral & balanced' },
  { id: 'echo',    label: 'Echo',    desc: 'Deep & resonant' },
  { id: 'shimmer', label: 'Shimmer', desc: 'Calm & clear' },
  { id: 'onyx',    label: 'Onyx',    desc: 'Rich & authoritative' },
  { id: 'fable',   label: 'Fable',   desc: 'Bright & storytelling' },
]

function PodcastView({ data }: { data: unknown }) {
  const script = data as string
  const [lang, setLang] = useState('en')
  const [voice, setVoice] = useState('nova')
  const [tab, setTab] = useState<'player' | 'script'>('player')
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Animated bars for waveform
  const BAR_COUNT = 28
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => i)

  async function generateAudio() {
    setIsGenerating(true)
    setAudioError(null)
    setAudioUrl(null)
    setIsPlaying(false)
    setCurrentTime(0)
    try {
      const res = await fetch('/api/studio/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, voice, language: lang }),
      })
      if (!res.ok) {
        const e = await res.json() as { error?: string }
        throw new Error(e.error ?? `Request failed (${res.status})`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
    } catch (e) {
      setAudioError(e instanceof Error ? e.message : 'Audio generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) { audio.pause() } else { audio.play() }
    setIsPlaying(!isPlaying)
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audio.currentTime = pct * duration
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  const lines = script.split('\n').filter(Boolean)
  const langChanged = !!audioUrl // re-enable generate on lang/voice change

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-500/8 border border-purple-500/20">
        <Mic2 className="w-4 h-4 text-purple-500 shrink-0" />
        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">ET Markets Daily · Podcast</p>
        <div className="ml-auto flex gap-1">
          {(['player', 'script'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-[10px] px-2.5 py-1 rounded-full font-semibold transition-all ${
                tab === t ? 'bg-purple-500 text-white' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {t === 'player' ? '▶ Player' : '📄 Script'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'player' ? (
        <div className="space-y-4">
          {/* Language selector */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Language</p>
            <div className="flex flex-wrap gap-1.5">
              {PODCAST_LANGUAGES.map(l => (
                <button key={l.code} onClick={() => { setLang(l.code); setAudioUrl(null) }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    lang === l.code
                      ? 'bg-purple-500 text-white border-purple-500 shadow-sm'
                      : 'border-border/60 text-muted-foreground hover:border-purple-300 hover:text-foreground'
                  }`}>
                  {l.flag} {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice selector (English only) */}
          {lang === 'en' && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Voice</p>
              <div className="grid grid-cols-3 gap-1.5">
                {OPENAI_VOICES.map(v => (
                  <button key={v.id} onClick={() => { setVoice(v.id); setAudioUrl(null) }}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      voice === v.id
                        ? 'bg-purple-500/10 border-purple-400/50 text-purple-600 dark:text-purple-300'
                        : 'border-border/40 hover:border-border/70'
                    }`}>
                    <p className={`text-xs font-semibold ${voice === v.id ? 'text-purple-600 dark:text-purple-300' : 'text-foreground'}`}>{v.label}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{v.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generate button */}
          {!audioUrl && (
            <button onClick={generateAudio} disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-purple-500/20 active:scale-[0.98]">
              {isGenerating
                ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Generating audio...</>
                : <><Mic2 className="w-4 h-4" />Generate Podcast Audio</>
              }
            </button>
          )}

          {/* Error */}
          {audioError && (
            <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-xs text-red-600">
              ⚠ {audioError}
              <button onClick={generateAudio} className="ml-2 underline font-semibold">Retry</button>
            </div>
          )}

          {/* Audio Player */}
          {audioUrl && (
            <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 p-5 shadow-xl shadow-purple-500/20">
              <audio ref={audioRef} src={audioUrl} preload="auto"
                onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
                onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
                onEnded={() => setIsPlaying(false)} />

              {/* Waveform animation */}
              <div className="flex items-center justify-center gap-[3px] h-10 mb-4">
                {bars.map(i => (
                  <motion.div key={i}
                    animate={isPlaying ? { scaleY: [0.3, 1, 0.3] } : { scaleY: 0.3 }}
                    transition={{ duration: 0.8 + (i % 3) * 0.2, repeat: Infinity, delay: i * 0.04, ease: 'easeInOut' }}
                    className="w-[3px] rounded-full bg-white/70 origin-bottom"
                    style={{ height: `${20 + (i % 5) * 8}px` }}
                  />
                ))}
              </div>

              {/* Progress bar */}
              <div className="mb-3 cursor-pointer" onClick={seek}>
                <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all"
                    style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }} />
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/60 tabular-nums">{fmt(currentTime)}</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10 }}
                    className="text-white/70 hover:text-white transition text-xs font-bold">⟨10</button>
                  <button onClick={togglePlay}
                    className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                    {isPlaying
                      ? <span className="flex gap-1"><span className="w-1.5 h-4 bg-purple-600 rounded-sm" /><span className="w-1.5 h-4 bg-purple-600 rounded-sm" /></span>
                      : <Play className="w-5 h-5 text-purple-600 ml-0.5" />
                    }
                  </button>
                  <button onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10 }}
                    className="text-white/70 hover:text-white transition text-xs font-bold">10⟩</button>
                </div>
                <span className="text-[11px] text-white/60 tabular-nums">{fmt(duration)}</span>
              </div>

              {/* Regenerate */}
              <button onClick={() => setAudioUrl(null)}
                className="mt-4 w-full text-[10px] text-white/50 hover:text-white/80 transition text-center">
                ↻ Change voice / language
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Script tab */
        <div className="space-y-2.5">
          {lines.map((line, i) => {
            const isTag = /^\[(HOST|ANALYSIS|MUSIC|SFX|INTRO|OUTRO)\]/.test(line)
            if (isTag) {
              const tag = line.match(/^\[([^\]]+)\]/)?.[1] ?? ''
              const rest = line.replace(/^\[[^\]]+\]\s*/, '')
              return (
                <div key={i} className="flex gap-2.5">
                  <span className="text-[9px] px-1.5 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold shrink-0 h-fit mt-0.5 tracking-wider">{tag}</span>
                  <p className="text-sm text-foreground leading-relaxed">{rest}</p>
                </div>
              )
            }
            return <p key={i} className="text-sm text-foreground/75 leading-relaxed">{line}</p>
          })}
        </div>
      )}
    </div>
  )
}

// ─── Video View ────────────────────────────────────────────────────────────────
function VideoView({ data }: { data: unknown }) {
  const r = data as VideoScriptResult
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-blue-500/8 border border-blue-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Video className="w-4 h-4 text-blue-500" />
          <p className="font-bold text-blue-600 dark:text-blue-400 text-sm">{r.title}</p>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 font-medium">{r.total_duration}</span>
        </div>
        <p className="text-xs text-muted-foreground italic">Hook: &ldquo;{r.hook}&rdquo;</p>
      </div>

      <div className="space-y-3">
        {r.scenes?.map((scene, i) => (
          <div key={i} className="rounded-xl border border-border/40 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b border-border/30">
              <span className="text-[10px] font-bold text-muted-foreground">SCENE {scene.scene}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{scene.duration}</span>
            </div>
            <div className="p-3 grid gap-2">
              <div className="flex gap-2">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider shrink-0 mt-0.5 w-14">Visual</span>
                <p className="text-xs text-muted-foreground italic">{scene.visual}</p>
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] font-bold text-foreground uppercase tracking-wider shrink-0 mt-0.5 w-14">Narrate</span>
                <p className="text-xs text-foreground leading-relaxed">{scene.narration}</p>
              </div>
              {scene.onscreen_text && (
                <div className="flex gap-2 items-start">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider shrink-0 mt-0.5 w-14">Text</span>
                  <span className="text-xs px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 font-mono">{scene.onscreen_text}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {r.cta && (
        <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">CTA</p>
          <p className="text-sm text-foreground">{r.cta}</p>
        </div>
      )}
      {r.hashtags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {r.hashtags.map(h => <span key={h} className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium flex items-center gap-1"><Hash className="w-2.5 h-2.5" />{h.replace('#','')}</span>)}
        </div>
      )}
    </div>
  )
}

// ─── Impact View & Stock Graph ────────────────────────────────────────────────
function StockSummaryCard({ ticker, exchange, impact, reason }: { ticker: string, exchange: string, impact: string, reason: string }) {
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    fetch(`/api/stock/${ticker}`).then(r => r.json()).then(d => {
      if (!d.error) setData(d)
    }).catch(console.error)
  }, [ticker])

  const isUp = (data?.percentChange ?? 0) >= 0;
  const color = isUp ? '#10b981' : '#ef4444';

  return (
    <div className={`p-4 rounded-xl border ${
      impact === 'positive' ? 'bg-emerald-500/5 border-emerald-500/20' :
      impact === 'negative' ? 'bg-red-500/5 border-red-500/20' :
      'bg-muted/30 border-border/40'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-bold text-foreground text-sm flex items-center gap-1.5 pt-0.5">
            {ticker} 
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{exchange}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px] leading-relaxed">{reason}</p>
        </div>
        {data ? (
          <div className="text-right shrink-0 min-w[80px]">
            <p className="text-base font-bold tabular-nums text-foreground">₹{data.regularMarketPrice?.toFixed(2)}</p>
            <p className={`text-xs font-semibold tabular-nums ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
              {isUp ? '+' : ''}{data.percentChange?.toFixed(2)}%
            </p>
          </div>
        ) : (
          <div className="text-right space-y-1.5 mt-1">
            <div className="w-16 h-4 bg-muted animate-pulse rounded ml-auto" />
            <div className="w-10 h-3 bg-muted animate-pulse rounded ml-auto" />
          </div>
        )}
      </div>
      
      {data?.chartData?.length > 0 && (
        <div className="h-12 w-full mt-3 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.chartData}>
              <YAxis domain={['auto', 'auto']} hide />
              <Line type="monotone" dataKey="price" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={true} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function ImpactView({ data }: { data: unknown }) {
  const r = data as ImpactResult
  const sentimentCfg: Record<string, { label: string; color: string; bar: string }> = {
    very_bullish: { label: '🚀 Very Bullish', color: 'text-emerald-600', bar: 'bg-emerald-500' },
    bullish:      { label: '📈 Bullish',      color: 'text-emerald-500', bar: 'bg-emerald-400' },
    neutral:      { label: '➡️ Neutral',       color: 'text-slate-500',   bar: 'bg-slate-400' },
    bearish:      { label: '📉 Bearish',       color: 'text-red-500',     bar: 'bg-red-400' },
    very_bearish: { label: '🔻 Very Bearish', color: 'text-red-600',     bar: 'bg-red-500' },
  }
  const cfg = sentimentCfg[r.overallSentiment] ?? sentimentCfg.neutral
  const dirClr = (d: string) => d === 'positive' ? 'bg-emerald-500' : d === 'negative' ? 'bg-red-500' : 'bg-slate-400'

  return (
    <div className="space-y-5">
      {/* Overall score */}
      <div className="p-5 rounded-2xl border border-border/50 bg-muted/30">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className={`text-2xl font-black ${cfg.color}`}>{r.overallScore}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
            <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Confidence</p>
            <p className="text-lg font-bold text-foreground">{r.confidence}%</p>
            <p className="text-[10px] text-muted-foreground">{r.timeHorizon?.replace('_',' ')}</p>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5">
          <div className={`h-2.5 rounded-full transition-all ${cfg.bar}`} style={{ width: `${r.overallScore}%` }} />
        </div>
        <p className="text-sm text-foreground mt-3 font-medium">{r.headline}</p>
      </div>

      {/* Category scores */}
      {r.categories?.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category Breakdown</p>
          {r.categories.map((cat, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <span className="text-xs font-medium text-foreground">{cat.label}</span>
                <span className="text-xs text-muted-foreground">{cat.score}/100</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mb-1.5">
                <div className={`h-1.5 rounded-full ${dirClr(cat.direction)}`} style={{ width: `${cat.score}%` }} />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{cat.reasoning}</p>
            </div>
          ))}
        </div>
      )}

      {/* Affected stocks */}
      {r.affectedStocks?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Affected Stocks</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {r.affectedStocks.map((s, i) => (
              <StockSummaryCard key={i} {...s} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
function ToolModal({ toolId, status, data, errorMsg, label, desc, icon: Icon, onClose, onRetry }: {
  toolId: ToolId; status: ToolStatus; data: unknown; errorMsg?: string; label: string; desc: string; icon: React.ElementType
  onClose: () => void; onRetry: () => void
}) {
  function render() {
    switch (toolId) {
      case 'summary':    return <SummaryView data={data} />
      case 'bullbear':   return <BullBearView data={data} />
      case 'story':      return <StoryArcView data={data} />
      case 'context':    return <ContextView data={data} />
      case 'flashcards': return <FlashcardsView data={data} />
      case 'contrarian': return <ContrarianView data={data} />
      case 'podcast':    return <PodcastView data={data} />
      case 'video':      return <VideoView data={data} />
      case 'impact':     return <ImpactView data={data} />
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}>
      <motion.div initial={{ y: 16, scale: 0.97, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 16, scale: 0.97, opacity: 0 }} transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-2xl max-h-[85vh] bg-background rounded-2xl border border-border/50 shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
            <Icon className="w-4 h-4 text-foreground/70" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
          {status === 'loading' && (
            <div className="flex gap-1 ml-2">
              {[0,150,300].map(d => <div key={d} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="ml-auto w-8 h-8 rounded-xl">
            <X className="w-4 h-4" />
          </Button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {status === 'loading' && <ToolSkeleton />}
          {status === 'error' && (
            <div className="flex flex-col items-center py-10 text-center">
              <AlertCircle className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="font-medium text-foreground mb-1">Generation failed</p>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                {errorMsg ?? 'Something went wrong. Please try again.'}
              </p>
              <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>
            </div>
          )}
          {status === 'done' && render()}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Studio Panel (NotebookLM style) ──────────────────────────────────────────
function StudioPanel({ articleText, articleTitle, userSector = 'Finance', userExperienceLevel = 'Intermediate', onContextLoaded }: {
  articleText: string; articleTitle: string; userSector?: string; userExperienceLevel?: string; onContextLoaded?: (terms: ContextTerm[]) => void
}) {
  const [open, setOpen] = useState(true)
  const [modal, setModal] = useState<ToolId | null>(null)
  const [states, setStates] = useState<Partial<Record<ToolId, { status: ToolStatus; data: unknown; errorMsg?: string }>>>({})

  const run = useCallback(async (id: ToolId) => {
    const tool = TOOLS.find(t => t.id === id)!
    setModal(id)
    if (states[id]?.status === 'done') return

    setStates(p => ({ ...p, [id]: { status: 'loading', data: null } }))
    try {
      const res = await fetch(tool.endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleText, articleTitle, sector: userSector, experienceLevel: userExperienceLevel }),
      })
      if (!res.ok) {
        // Try to read a useful error message from the response body
        let errMsg = `Request failed (${res.status})`
        try {
          const errBody = await res.json() as { error?: string }
          if (errBody.error) errMsg = errBody.error
        } catch { /* ignore */ }
        throw new Error(errMsg)
      }
      const raw = await res.json() as unknown
      let finalData: unknown = raw
      if (id === 'summary') finalData = (raw as { summary: string }).summary ?? raw
      if (id === 'podcast') finalData = (raw as { script: string }).script ?? raw
      setStates(p => ({ ...p, [id]: { status: 'done', data: finalData } }))
      if (id === 'context' && onContextLoaded && (finalData as ContextResult)?.keyTerms) {
        onContextLoaded((finalData as ContextResult).keyTerms)
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e)
      console.error(`[Studio:${id}]`, errMsg)
      setStates(p => ({ ...p, [id]: { status: 'error', data: null, errorMsg: errMsg } }))
    }
  }, [articleText, articleTitle, userSector, userExperienceLevel, states])

  const activeTool = modal ? TOOLS.find(t => t.id === modal)! : null
  const activeState = modal ? states[modal] ?? { status: 'loading', data: null, errorMsg: undefined } : null

  return (
    <>
      {/* ── Floating Action Button — bottom-right corner */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all shadow-lg active:scale-95 ${
          open
            ? 'bg-foreground text-background shadow-foreground/20'
            : 'bg-background text-foreground border border-border/60 hover:border-primary/40 hover:shadow-primary/10 shadow-black/10'
        }`}
      >
        <Zap className="w-4 h-4" />
        <span>AI Studio</span>
        {Object.values(states).some(s => s?.status === 'done') && (
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
        )}
      </button>

      {/* ── Slide-in panel ── */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="fixed right-0 top-0 h-full w-72 z-30 bg-background border-l border-border/50 flex flex-col shadow-xl"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 shrink-0">
              <h2 className="text-base font-semibold text-foreground">Studio</h2>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg hover:bg-muted/60 flex items-center justify-center transition-colors">
                <PanelRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Tools grid — 2 columns, like NotebookLM */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-2.5">
                {TOOLS.map(tool => {
                  const state = states[tool.id]
                  const isDone = state?.status === 'done'
                  const isLoading = state?.status === 'loading'
                  const Icon = tool.icon

                  return (
                    <motion.button
                      key={tool.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => run(tool.id)}
                      className={`relative flex flex-col items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                        isDone
                          ? 'bg-muted/60 border-border/50'
                          : 'bg-muted/30 border-border/30 hover:bg-muted/50 hover:border-border/60'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-background/80 flex items-center justify-center shadow-sm">
                        {isLoading
                          ? <div className="w-4 h-4 rounded-full border-2 border-border border-t-foreground animate-spin" />
                          : <Icon className="w-4 h-4 text-foreground/70" />
                        }
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground leading-tight">{tool.label}</p>
                      </div>
                      {isDone && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-500" />}
                    </motion.button>
                  )
                })}
              </div>

              {/* Empty state */}
              {Object.keys(states).length === 0 && (
                <div className="mt-8 text-center">
                  <Wand2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">Studio output will be saved here.</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Click a tool above to generate insights from this article.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border/40 shrink-0">
              <p className="text-[11px] text-muted-foreground text-center">{userSector} · {userExperienceLevel}</p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Modal ── */}
      <AnimatePresence>
        {modal && activeTool && activeState && (
          <ToolModal
            toolId={modal}
            status={activeState.status as ToolStatus}
            data={activeState.data}
            errorMsg={activeState.errorMsg}
            label={activeTool.label}
            desc={activeTool.desc}
            icon={activeTool.icon}
            onClose={() => setModal(null)}
            onRetry={() => run(modal)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'hi', label: 'हिंदी', name: 'Hindi' },
  { code: 'bn', label: 'বাংলা', name: 'Bengali' },
  { code: 'te', label: 'తెలుగు', name: 'Telugu' },
  { code: 'mr', label: 'मराठी', name: 'Marathi' },
  { code: 'ta', label: 'தமிழ்', name: 'Tamil' },
  { code: 'gu', label: 'ગુજરાতી', name: 'Gujarati' },
  { code: 'kn', label: 'ಕನ್ನಡ', name: 'Kannada' },
  { code: 'ml', label: 'മലയാളം', name: 'Malayalam' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', name: 'Punjabi' },
  { code: 'or', label: 'ଓଡ଼ିଆ', name: 'Odia' },
]

export default function ArticlePage() {
  const params = useParams()
  const encodedId = params.id as string
  const [article, setArticle] = useState<FullArticle | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile>({ sector: 'Finance', experienceLevel: 'Intermediate' })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contextTerms, setContextTerms] = useState<ContextTerm[]>([])

  // ── Translation state ──
  const [selectedLang, setSelectedLang] = useState<string | null>(null)
  const [translatedText, setTranslatedText] = useState<string | null>(null)
  const [translateLoading, setTranslateLoading] = useState(false)
  const [translateProvider, setTranslateProvider] = useState<string | null>(null)
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)

  const handleTranslate = useCallback(async (langCode: string, articleContent: string, articleTitle: string) => {
    setSelectedLang(langCode)
    setLangDropdownOpen(false)
    if (!articleContent) return
    setTranslateLoading(true)
    setTranslatedText(null)
    setTranslateProvider(null)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `${articleTitle}\n\n${articleContent}`, languageCode: langCode }),
      })
      if (!res.ok) throw new Error('Translation failed')
      const data = await res.json() as { translated: string; provider: string }
      setTranslatedText(data.translated)
      setTranslateProvider(data.provider)
    } catch (e) {
      console.error(e)
      setTranslatedText(null)
    } finally {
      setTranslateLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch('/api/user/profile').then(r => r.ok ? r.json() as Promise<UserProfile> : null).then(p => { if (p) setUserProfile(p) }).catch(() => {})
    fetch(`/api/article/${encodedId}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json() as Promise<FullArticle> })
      .then(setArticle).catch(e => { console.error(e); setError('Article unavailable.') })
      .finally(() => setIsLoading(false))
  }, [encodedId])

  return (
    <>
      <main className={`min-h-screen bg-background transition-all duration-300`}>
        <div className="mx-auto max-w-2xl px-5 py-8 pb-24">
          <Button asChild variant="ghost" size="sm" className="mb-6 -ml-1 text-muted-foreground gap-1.5 h-8">
            <Link href="/dashboard"><ArrowLeft className="w-3.5 h-3.5" />Dashboard</Link>
          </Button>

          {isLoading ? <ArticleSkeleton />
            : error ? (
              <div className="text-center py-24">
                <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold text-foreground mb-1">Article unavailable</p>
                <p className="text-sm text-muted-foreground mb-5">{error}</p>
                <Button asChild variant="outline" size="sm"><Link href="/dashboard">Back to Dashboard</Link></Button>
              </div>
            ) : article ? (
              <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                {/* Header */}
                <div className="mb-7">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="text-xs">{article.category}</Badge>
                    {article.fetchMethod === 'ai-expanded' && (
                      <Badge variant="outline" className="text-primary border-primary/25 text-xs gap-1">
                        <Sparkles className="w-3 h-3" />AI
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-black text-foreground leading-tight mb-4 tracking-tight">{article.title}</h1>
                  <p className="text-base text-muted-foreground italic border-l-4 border-muted pl-4 mb-5 leading-relaxed">{article.excerpt}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground border-y border-border/40 py-3">
                    <span className="flex items-center gap-1.5"><User className="w-3 h-3" />{article.author}</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {new Date(article.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span>{article.readTime} min read</span>
                    {article.sourceUrl && article.sourceUrl !== '#' && (
                      <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:text-primary/80 font-semibold ml-auto transition-colors">
                        Read on ET <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* ── Language Translator Bar ── */}
                <div className="relative mb-6">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/15">
                    <Languages className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-semibold text-foreground flex-1">
                      {selectedLang
                        ? `Reading in ${LANGUAGES.find(l => l.code === selectedLang)?.name}`
                        : 'Translate for Rural India'}
                    </span>
                    {selectedLang && (
                      <button onClick={() => { setSelectedLang(null); setTranslatedText(null) }}
                        className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                        <RotateCcw className="w-3 h-3" /> English
                      </button>
                    )}
                    <button
                      onClick={() => setLangDropdownOpen(o => !o)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
                      {translateLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronDown className="w-3 h-3" />}
                      {selectedLang ? LANGUAGES.find(l => l.code === selectedLang)?.label : 'Pick Language'}
                    </button>
                  </div>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {langDropdownOpen && (
                      <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        className="absolute right-0 top-full mt-2 z-50 w-64 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                        <div className="p-2 grid grid-cols-2 gap-1">
                          {LANGUAGES.map(lang => (
                            <button key={lang.code}
                              onClick={() => handleTranslate(lang.code, article.content, article.title)}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all hover:bg-primary/8 ${
                                selectedLang === lang.code ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground'
                              }`}>
                              <span className="text-base leading-none">{lang.label}</span>
                              <span className="text-[10px] text-muted-foreground">{lang.name}</span>
                            </button>
                          ))}
                        </div>
                        <div className="px-3 py-2 border-t border-border/50 bg-muted/30">
                          <p className="text-[10px] text-muted-foreground">Powered by OpenAI · Sarvam AI fallback</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Provider Badge ── */}
                {translateProvider && !translateLoading && (
                  <div className="flex items-center gap-1.5 mb-4">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium
                      bg-emerald-100 text-emerald-700 border border-emerald-200">
                      ✓ Translated via {translateProvider !== 'openai' ? 'OpenAI GPT-4o-mini' : 'Sarvam AI'}
                    </span>
                  </div>
                )}

                {article.imageUrl && (
                  <div className="w-full h-56 rounded-xl overflow-hidden mb-7 bg-muted">
                    <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* ── Article Content: translated or original ── */}
                {translateLoading ? (
                  <div className="space-y-3 py-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className={`h-4 rounded-lg bg-muted/60 animate-pulse ${i % 3 === 2 ? 'w-3/4' : 'w-full'}`} />
                    ))}
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      Translating to {LANGUAGES.find(l => l.code === selectedLang)?.name}…
                    </p>
                  </div>
                ) : translatedText ? (
                  <div className="space-y-4">
                    {translatedText.split('\n').filter(Boolean).map((para, i) => (
                      <p key={i} className="text-[0.95rem] text-foreground/85 leading-[1.85]">
                        {para.replace(/\*\*/g, '')}
                      </p>
                    ))}
                  </div>
                ) : (
                  <ArticleBody content={article.content} contextTerms={contextTerms} />
                )}

                <div className="mt-10 pt-5 border-t border-border/40 flex gap-3">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href="/dashboard">← More Articles</Link>
                  </Button>
                  {article.sourceUrl && article.sourceUrl !== '#' && (
                    <Button asChild size="sm" className="flex-1">
                      <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">Full Story <ExternalLink className="w-3.5 h-3.5 ml-1" /></a>
                    </Button>
                  )}
                </div>
              </motion.article>
            ) : null}
        </div>
      </main>

      {article && (
        <>
          <ArticleChat 
            articleTitle={article.title} 
            articleContent={article.content} 
          />
          <StudioPanel
            articleText={`${article.title}\n\n${article.excerpt}\n\n${article.content}`}
            articleTitle={article.title}
            userSector={userProfile.sector}
            userExperienceLevel={userProfile.experienceLevel}
            onContextLoaded={setContextTerms}
          />
        </>
      )}
    </>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Zap, X, FileText, TrendingUp, TrendingDown, BookOpen,
  Clock, Info, Shuffle, ChevronLeft, ChevronRight,
  CheckCircle, AlertCircle, BarChart2, Layers, Eye,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface BullBearPoint { point: string; explanation: string; confidence?: 'high' | 'medium' | 'low' }
interface BullBearResult {
  bullish: BullBearPoint[]
  bearish: BullBearPoint[]
  orchestratorVerdict: string
  bullishPercentage?: number
}

interface StoryArcEvent {
  date: string; headline: string; significance: string
  type: 'origin' | 'escalation' | 'turning_point' | 'current' | 'projection'
}
interface StoryArcResult {
  topic: string; summary: string; events: StoryArcEvent[]; whatToWatch: string[]
}

interface Flashcard {
  term: string; definition: string; example: string
  difficulty: 'basic' | 'intermediate' | 'advanced'
  category: 'concept' | 'person' | 'organization' | 'metric' | 'event'
}
interface FlashcardsResult { cards: Flashcard[]; articleSummary: string; keyTakeaway: string }

interface ContextTerm { term: string; shortDef: string; deeperExplanation: string; indianContext: string; relatedTerms: string[] }
interface ContextResult { backgroundContext: string; keyTerms: ContextTerm[]; whyItMatters: string; historicalAnalogy: string }

interface ContraryView {
  headline: string; mainArgument: string; whoBelieves: string
  counterToMainNarrative: string
  supportingPoints: { point: string; reasoning: string }[]
}

type ToolId = 'summary' | 'bullbear' | 'story' | 'flashcards' | 'context' | 'contrarian'
type ToolState = { status: 'idle' | 'loading' | 'done' | 'error'; data: unknown }

// ─── Tool config ──────────────────────────────────────────────────────────────

const TOOLS: { id: ToolId; label: string; desc: string; icon: React.ElementType; color: string; endpoint: string }[] = [
  { id: 'summary',    label: 'Executive Brief',  desc: '30-second sector brief',     icon: FileText,   color: 'text-blue-400',   endpoint: '/api/studio/summarize' },
  { id: 'bullbear',   label: 'Bull / Bear',       desc: 'Dual-agent debate',          icon: BarChart2,  color: 'text-emerald-400', endpoint: '/api/studio/bull-bear' },
  { id: 'story',      label: 'Story Arc',         desc: 'Full timeline of this story', icon: Clock,     color: 'text-violet-400', endpoint: '/api/studio/story-arc' },
  { id: 'context',    label: 'Context Overlay',   desc: 'Background & key terms',     icon: Layers,    color: 'text-amber-400',  endpoint: '/api/studio/context' },
  { id: 'flashcards', label: 'Flashcards',        desc: 'Study cards from article',   icon: BookOpen,  color: 'text-pink-400',   endpoint: '/api/studio/flashcards' },
  { id: 'contrarian', label: 'Contrarian View',   desc: "Devil's advocate take",      icon: Shuffle,   color: 'text-red-400',    endpoint: '/api/studio/contrarian' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const confidenceBadge = (c?: string) => c === 'high' ? 'bg-green-500/20 text-green-400' : c === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'

const arcTypeConfig: Record<string, { color: string; label: string }> = {
  origin:        { color: 'bg-slate-500',   label: 'Origin' },
  escalation:    { color: 'bg-amber-500',   label: 'Escalation' },
  turning_point: { color: 'bg-violet-500',  label: 'Turning Point' },
  current:       { color: 'bg-emerald-500', label: 'Current' },
  projection:    { color: 'bg-blue-500',    label: 'Upcoming' },
}

// ─── Result renderers ─────────────────────────────────────────────────────────

function SummaryResult({ data }: { data: unknown }) {
  const text = data as string
  return (
    <div className="space-y-3">
      {text.split('\n').filter(Boolean).map((line, i) => (
        <p key={i} className={`text-sm leading-relaxed ${line.startsWith('**') ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
          {line.replace(/\*\*/g, '')}
        </p>
      ))}
    </div>
  )
}

function BullBearResult({ data }: { data: unknown }) {
  const r = data as BullBearResult
  const bullPct = r.bullishPercentage ?? 50
  const bearPct = 100 - bullPct

  return (
    <div className="space-y-5">
      {/* Sentiment Heat Bar */}
      <div className="p-4 rounded-xl bg-card border border-border/50 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-end mb-2 relative z-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bullish</span>
            <span className="text-xl font-black text-emerald-500 tabular-nums leading-none tracking-tighter">{bullPct}%</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bearish</span>
            <span className="text-xl font-black text-red-500 tabular-nums leading-none tracking-tighter">{bearPct}%</span>
          </div>
        </div>
        
        <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden flex relative z-10">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${bullPct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-emerald-500 rounded-l-full"
          />
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${bearPct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-red-500 rounded-r-full"
          />
        </div>
        
        {/* Subtle background glow based on dominant sentiment */}
        <div className={`absolute inset-0 opacity-5 blur-xl pointer-events-none transition-colors duration-1000 ${bullPct > 55 ? 'bg-emerald-500' : bullPct < 45 ? 'bg-red-500' : 'bg-transparent'}`} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Bullish Column */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 opacity-60">Bull Case</span>
          </div>
          <div className="space-y-2">
            {r.bullish?.slice(0, 3).map((pt, i) => (
              <div key={i} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 group hover:bg-emerald-500/10 transition-colors">
                <p className="text-[11px] font-black text-foreground leading-tight mb-1">{pt.point}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-3 leading-relaxed">{pt.explanation}</p>
                {pt.confidence && (
                  <span className={`mt-2 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md inline-block ${confidenceBadge(pt.confidence)}`}>
                    {pt.confidence}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bearish Column */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
             <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <TrendingDown className="w-3 h-3 text-red-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-red-500 opacity-60">Bear Case</span>
          </div>
          <div className="space-y-2">
            {r.bearish?.slice(0, 3).map((pt, i) => (
              <div key={i} className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 group hover:bg-red-500/10 transition-colors">
                <p className="text-[11px] font-black text-foreground leading-tight mb-1">{pt.point}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-3 leading-relaxed">{pt.explanation}</p>
                {pt.confidence && (
                  <span className={`mt-2 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md inline-block ${confidenceBadge(pt.confidence)}`}>
                    {pt.confidence}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {r.orchestratorVerdict && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mt-4">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center shrink-0">
               <Zap className="w-3 h-3 text-primary" />
             </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary opacity-80">AI Verdict</span>
          </div>
          <p className="text-sm font-bold text-foreground leading-relaxed">{r.orchestratorVerdict}</p>
        </div>
      )}
    </div>
  )
}

function StoryArcResult({ data }: { data: unknown }) {
  const r = data as StoryArcResult
  return (
    <div className="space-y-4">
      {r.summary && <p className="text-sm text-muted-foreground italic border-l-2 border-primary/40 pl-3">{r.summary}</p>}
      <div className="relative">
        {r.events?.map((ev, i) => {
          const cfg = arcTypeConfig[ev.type] ?? arcTypeConfig.origin
          return (
            <div key={i} className="flex gap-3 mb-4 relative">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full shrink-0 mt-1 ${cfg.color}`} />
                {i < (r.events?.length ?? 0) - 1 && (
                  <div className="w-0.5 bg-border/50 flex-1 mt-1 min-h-[16px]" />
                )}
              </div>
              <div className="pb-2 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-muted-foreground">{ev.date}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full text-white/80 ${cfg.color}`}>{cfg.label}</span>
                </div>
                <p className="text-sm font-semibold text-foreground leading-tight">{ev.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{ev.significance}</p>
              </div>
            </div>
          )
        })}
      </div>
      {r.whatToWatch && r.whatToWatch.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-1.5 mb-2">
            <Eye className="w-3 h-3 text-amber-400" />
            <span className="text-xs font-bold text-amber-400">Watch For</span>
          </div>
          {r.whatToWatch.map((w, i) => (
            <p key={i} className="text-xs text-muted-foreground flex gap-1.5 mb-1">
              <span className="text-amber-400 shrink-0">→</span>{w}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function FlashcardsResult({ data }: { data: unknown }) {
  const r = data as FlashcardsResult
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const cards = r.cards ?? []
  const card = cards[current]

  const catColor: Record<string, string> = {
    concept: 'bg-blue-500/20 text-blue-400',
    person: 'bg-purple-500/20 text-purple-400',
    organization: 'bg-amber-500/20 text-amber-400',
    metric: 'bg-emerald-500/20 text-emerald-400',
    event: 'bg-red-500/20 text-red-400',
  }

  if (!card) return null

  return (
    <div className="space-y-4">
      {r.keyTakeaway && (
        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-xs text-muted-foreground"><span className="font-bold text-primary">Key Takeaway: </span>{r.keyTakeaway}</p>
        </div>
      )}
      {/* Card */}
      <div className="relative">
        <motion.div
          key={`${current}-${flipped}`}
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
          onClick={() => setFlipped(f => !f)}
          className="cursor-pointer p-4 rounded-xl border border-border/50 bg-card/80 min-h-[120px] flex flex-col justify-between hover:border-primary/40 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${catColor[card.category] ?? 'bg-muted text-muted-foreground'}`}>
              {card.category}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              card.difficulty === 'basic' ? 'bg-green-500/20 text-green-400' :
              card.difficulty === 'intermediate' ? 'bg-amber-500/20 text-amber-400' :
              'bg-red-500/20 text-red-400'
            }`}>{card.difficulty}</span>
          </div>
          {!flipped ? (
            <div className="flex-1 flex items-center justify-center py-4">
              <p className="text-lg font-bold text-foreground text-center">{card.term}</p>
            </div>
          ) : (
            <div className="flex-1 py-2 space-y-2">
              <p className="text-sm text-foreground">{card.definition}</p>
              {card.example && (
                <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">{card.example}</p>
              )}
            </div>
          )}
          <p className="text-xs text-center text-muted-foreground mt-2">
            {flipped ? 'Click to see term' : 'Click to reveal definition'}
          </p>
        </motion.div>
        {/* Navigation */}
        <div className="flex items-center justify-between mt-3">
          <Button variant="ghost" size="sm" onClick={() => { setCurrent(c => Math.max(0, c - 1)); setFlipped(false) }} disabled={current === 0}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground">{current + 1} / {cards.length}</span>
          <Button variant="ghost" size="sm" onClick={() => { setCurrent(c => Math.min(cards.length - 1, c + 1)); setFlipped(false) }} disabled={current === cards.length - 1}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function ContextResult({ data }: { data: unknown }) {
  const r = data as ContextResult
  const [expanded, setExpanded] = useState<number | null>(null)
  return (
    <div className="space-y-4">
      {r.backgroundContext && (
        <div className="p-3 rounded-lg bg-card/80 border border-border/50">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Background</p>
          <p className="text-sm text-foreground leading-relaxed">{r.backgroundContext}</p>
        </div>
      )}
      {r.whyItMatters && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-1">Why It Matters</p>
          <p className="text-sm text-foreground">{r.whyItMatters}</p>
        </div>
      )}
      {r.historicalAnalogy && (
        <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <p className="text-xs font-bold text-violet-400 uppercase tracking-wide mb-1">Historical Parallel</p>
          <p className="text-sm text-foreground italic">{r.historicalAnalogy}</p>
        </div>
      )}
      {r.keyTerms && r.keyTerms.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Key Terms</p>
          {r.keyTerms.map((term, i) => (
            <div key={i} className="mb-2 border border-border/40 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full flex items-center justify-between p-2.5 hover:bg-muted/30 transition-colors text-left"
              >
                <span className="text-sm font-semibold text-foreground">{term.term}</span>
                <span className="text-xs text-muted-foreground ml-2 flex-1 line-clamp-1">{term.shortDef}</span>
                <Info className="w-3 h-3 text-muted-foreground shrink-0 ml-2" />
              </button>
              <AnimatePresence>
                {expanded === i && (
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-2 border-t border-border/40 pt-2">
                      <p className="text-xs text-muted-foreground">{term.deeperExplanation}</p>
                      {term.indianContext && (
                        <p className="text-xs text-amber-400/80 italic">🇮🇳 {term.indianContext}</p>
                      )}
                      {term.relatedTerms?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {term.relatedTerms.map(rt => (
                            <span key={rt} className="text-xs bg-muted/50 px-2 py-0.5 rounded-full text-muted-foreground">{rt}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ContrarianResult({ data }: { data: unknown }) {
  const r = data as ContraryView
  return (
    <div className="space-y-4">
      {r.headline && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-2 mb-1">
            <Shuffle className="w-3 h-3 text-red-400" />
            <span className="text-xs font-bold text-red-400 uppercase">Contrarian Take</span>
          </div>
          <p className="text-base font-bold text-foreground">{r.headline}</p>
        </div>
      )}
      {r.mainArgument && (
        <p className="text-sm text-muted-foreground leading-relaxed">{r.mainArgument}</p>
      )}
      {r.counterToMainNarrative && (
        <div className="p-3 rounded-lg bg-card/80 border border-border/50">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Strongest Counter-Point</p>
          <p className="text-sm text-foreground font-medium">{r.counterToMainNarrative}</p>
        </div>
      )}
      {r.supportingPoints?.map((pt, i) => (
        <div key={i} className="flex gap-2.5 p-2.5 rounded-lg bg-muted/20">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">{pt.point}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{pt.reasoning}</p>
          </div>
        </div>
      ))}
      {r.whoBelieves && (
        <div className="flex gap-2 p-2.5 rounded-lg bg-muted/20">
          <CheckCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground italic">{r.whoBelieves}</p>
        </div>
      )}
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function ToolSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

// ─── Main Floating Panel ──────────────────────────────────────────────────────
interface AiStudioFloatProps {
  articleText: string
  articleTitle: string
  userSector?: string
  userExperienceLevel?: string
}

export function AiStudioFloat({
  articleText,
  articleTitle,
  userSector = 'Finance',
  userExperienceLevel = 'Intermediate',
}: AiStudioFloatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTool, setActiveTool] = useState<ToolId | null>(null)
  const [toolStates, setToolStates] = useState<Partial<Record<ToolId, ToolState>>>({})
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // Don't close — user might be reading
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function runTool(toolId: ToolId) {
    const tool = TOOLS.find(t => t.id === toolId)!

    // If already done, just switch to it
    if (toolStates[toolId]?.status === 'done') {
      setActiveTool(toolId)
      return
    }

    setActiveTool(toolId)
    setToolStates(prev => ({ ...prev, [toolId]: { status: 'loading', data: null } }))

    const body: Record<string, string> = {
      articleText,
      articleTitle,
      sector: userSector,
      experienceLevel: userExperienceLevel,
    }

    try {
      const res = await fetch(tool.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: unknown = await res.json()

      // Summary returns { summary: string }, extract text
      const finalData = toolId === 'summary' ? (data as { summary: string }).summary : data

      setToolStates(prev => ({ ...prev, [toolId]: { status: 'done', data: finalData } }))
    } catch (err) {
      console.error(`[AiStudioFloat] ${toolId} error:`, err)
      setToolStates(prev => ({ ...prev, [toolId]: { status: 'error', data: null } }))
    }
  }

  const currentState = activeTool ? toolStates[activeTool] : null

  function renderResult(toolId: ToolId, data: unknown) {
    switch (toolId) {
      case 'summary':    return <SummaryResult data={data} />
      case 'bullbear':   return <BullBearResult data={data} />
      case 'story':      return <StoryArcResult data={data} />
      case 'flashcards': return <FlashcardsResult data={data} />
      case 'context':    return <ContextResult data={data} />
      case 'contrarian': return <ContrarianResult data={data} />
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3" ref={panelRef}>
      {/* Floating Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-[380px] max-h-[80vh] flex flex-col rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">AI Studio</p>
                  <p className="text-xs text-muted-foreground">Powered by Gemini</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Tools grid */}
            <div className="grid grid-cols-3 gap-1.5 p-3 shrink-0 border-b border-border/40">
              {TOOLS.map(tool => {
                const state = toolStates[tool.id]
                const Icon = tool.icon
                const isActive = activeTool === tool.id
                const isDone = state?.status === 'done'
                const isLoading = state?.status === 'loading'

                return (
                  <motion.button
                    key={tool.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => runTool(tool.id)}
                    className={`relative flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
                      isActive
                        ? 'border-primary/60 bg-primary/10'
                        : isDone
                        ? 'border-border/50 bg-muted/30'
                        : 'border-border/40 bg-card/50 hover:border-border/70 hover:bg-muted/20'
                    }`}
                  >
                    <div className="relative">
                      {isLoading ? (
                        <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                      ) : (
                        <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : tool.color}`} />
                      )}
                      {isDone && !isActive && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-foreground leading-tight">{tool.label}</span>
                  </motion.button>
                )
              })}
            </div>

            {/* Result area */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {!activeTool && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">Choose a tool above</p>
                  <p className="text-xs text-muted-foreground">Each tool uses AI to unlock deeper insights from this article</p>
                </div>
              )}
              {currentState?.status === 'loading' && <ToolSkeleton />}
              {currentState?.status === 'error' && (
                <div className="flex flex-col items-center text-center py-6">
                  <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
                  <p className="text-sm text-muted-foreground">Generation failed. Try again.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => activeTool && runTool(activeTool)}>
                    Retry
                  </Button>
                </div>
              )}
              {currentState?.status === 'done' && activeTool && renderResult(activeTool, currentState.data)}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border/40 shrink-0">
              <p className="text-[10px] text-muted-foreground text-center">
                {userSector} · {userExperienceLevel} · Results may vary
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(o => !o)}
        className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all ${
          isOpen
            ? 'bg-foreground text-background'
            : 'bg-primary text-primary-foreground shadow-primary/40'
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Zap className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-2xl animate-ping bg-primary/30 duration-1000" />
        )}

        {/* Badge showing how many tools have been run */}
        {Object.values(toolStates).filter(s => s?.status === 'done').length > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
            {Object.values(toolStates).filter(s => s?.status === 'done').length}
          </span>
        )}
      </motion.button>
    </div>
  )
}

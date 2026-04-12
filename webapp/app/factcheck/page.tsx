'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Shield, ShieldCheck, ShieldX, ShieldAlert, Search, Loader2,
  ExternalLink, AlertTriangle, CheckCircle, XCircle, HelpCircle,
  ChevronDown, ChevronUp, ArrowLeft, Info, Newspaper, Globe,
  Zap, BookOpen, Eye, Copy, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FactCheckResult } from '@/app/api/factcheck/route'

// ─── Verdict config ─────────────────────────────────────────────────────────
const VERDICT_CONFIG: Record<string, {
  icon: React.ElementType; label: string; color: string; bg: string
  border: string; barColor: string; description: string
}> = {
  TRUE: {
    icon: ShieldCheck, label: 'True', color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/8', border: 'border-emerald-500/25', barColor: 'bg-emerald-500',
    description: 'This claim is supported by credible evidence.',
  },
  MOSTLY_TRUE: {
    icon: CheckCircle, label: 'Mostly True', color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-500/8', border: 'border-teal-500/25', barColor: 'bg-teal-500',
    description: 'This claim is largely accurate with minor caveats.',
  },
  MISLEADING: {
    icon: ShieldAlert, label: 'Misleading', color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/8', border: 'border-amber-500/25', barColor: 'bg-amber-500',
    description: 'This claim contains a mix of truth and distortion.',
  },
  MOSTLY_FALSE: {
    icon: AlertTriangle, label: 'Mostly False', color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500/8', border: 'border-orange-500/25', barColor: 'bg-orange-500',
    description: 'This claim contains significant inaccuracies.',
  },
  FALSE: {
    icon: ShieldX, label: 'False', color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/8', border: 'border-red-500/25', barColor: 'bg-red-500',
    description: 'This claim is contradicted by credible evidence.',
  },
  UNVERIFIABLE: {
    icon: HelpCircle, label: 'Unverifiable', color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-500/8', border: 'border-slate-500/25', barColor: 'bg-slate-400',
    description: 'Insufficient evidence to make a determination.',
  },
}

// ─── Example claims ──────────────────────────────────────────────────────────
const EXAMPLE_CLAIMS = [
  'RBI has cut interest rates by 50 basis points in March 2026',
  'India\'s GDP growth rate is the highest in the world in 2025',
  'Adani Group acquired a major stake in NDTV in 2022',
  'GST collection crossed ₹2 lakh crore for the first time in February 2026',
  'SEBI banned short selling in Indian markets permanently',
]

// ─── Confidence Meter ────────────────────────────────────────────────────────
function ConfidenceMeter({ confidence, barColor }: { confidence: number; barColor: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-medium text-muted-foreground">Confidence</span>
        <span className="text-xs font-bold text-foreground tabular-nums">{confidence}%</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
    </div>
  )
}

// ─── Source sections ─────────────────────────────────────────────────────────
function SourceSection({
  title, icon: Icon, count, children, defaultOpen = false,
}: { title: string; icon: React.ElementType; count: number; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl border border-border/50 overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors text-left">
        <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{count} source{count !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex items-center gap-2">
          {count > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{count}</span>}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-border/40 p-4 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Rating badge ────────────────────────────────────────────────────────────
function RatingBadge({ rating }: { rating: string }) {
  const lower = rating.toLowerCase()
  const cls = lower.includes('false') || lower.includes('wrong') || lower.includes('fake')
    ? 'bg-red-500/10 text-red-600 border-red-500/20'
    : lower.includes('true') || lower.includes('correct') || lower.includes('accurate')
    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    : lower.includes('mislead') || lower.includes('mix') || lower.includes('partial')
    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    : 'bg-muted/60 text-muted-foreground border-border/40'
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide shrink-0 ${cls}`}>
      {rating}
    </span>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FactCheckPage() {
  const [claim, setClaim] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<FactCheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [step, setStep] = useState<string | null>(null)

  async function handleCheck(claimText = claim) {
    if (!claimText.trim() || isChecking) return
    setIsChecking(true)
    setResult(null)
    setError(null)

    const steps = [
      'Querying Google Fact Check database...',
      'Searching News API for recent coverage...',
      'Deep searching fact-check websites...',
      'Synthesizing verdict with AI...',
    ]
    let stepIdx = 0
    setStep(steps[0])
    const stepInterval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length
      setStep(steps[stepIdx])
    }, 2200)

    try {
      const res = await fetch('/api/factcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: claimText }),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? `Request failed (${res.status})`)
      }
      const data = await res.json() as FactCheckResult
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check failed. Please try again.')
    } finally {
      clearInterval(stepInterval)
      setStep(null)
      setIsChecking(false)
    }
  }

  function useClaim(c: string) {
    setClaim(c)
    handleCheck(c)
  }

  function copyResult() {
    if (!result) return
    const text = `Fact Check Result\n\nClaim: ${result.claim}\nVerdict: ${result.verdictLabel}\nConfidence: ${result.confidence}%\n\n${result.summary}\n\nReasoning:\n${result.reasoning.map(r => `• ${r}`).join('\n')}`
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const verdictCfg = result ? VERDICT_CONFIG[result.verdict] ?? VERDICT_CONFIG.UNVERIFIABLE : null
  const VerdictIcon = verdictCfg?.icon ?? Shield
  const totalSources = result
    ? result.existingFactChecks.length + result.newsSources.length + result.tavilySources.length
    : 0

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-5 py-3.5 flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 h-8 text-muted-foreground">
            <Link href="/dashboard"><ArrowLeft className="w-3.5 h-3.5" />Dashboard</Link>
          </Button>
          <div className="h-4 w-px bg-border/60" />
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Truth Engine</span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">· AI-powered misinformation detection</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-10">
        {/* ── Hero ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/10">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tight mb-3">Truth Engine</h1>
          <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Verify any claim using Google Fact Check, News API, and AI-powered analysis of 10+ Indian fact-check sites.
          </p>
          {/* Source badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            {[
              { label: 'Google Fact Check', icon: '🔍' },
              { label: 'News API', icon: '📰' },
              { label: 'AltNews · BoomLive · Snopes', icon: '🌐' },
              { label: 'Gemini AI Synthesis', icon: '✨' },
            ].map(s => (
              <span key={s.label} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-muted/50 border border-border/40 text-muted-foreground">
                <span>{s.icon}</span>{s.label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* ── Search box ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.35 }}
          className="mb-8">
          <div className={`relative rounded-2xl border-2 transition-all duration-200 bg-card shadow-lg ${
            isChecking ? 'border-primary/40' : 'border-border/60 focus-within:border-primary/50 focus-within:shadow-primary/10'
          }`}>
            <textarea
              value={claim}
              onChange={e => setClaim(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCheck() }}
              placeholder="Enter a claim, headline, or statement to verify... e.g. 'RBI cut rates by 50 bps in March 2026'"
              rows={3}
              disabled={isChecking}
              className="w-full px-5 pt-4 pb-14 bg-transparent text-foreground placeholder:text-muted-foreground text-sm leading-relaxed resize-none focus:outline-none disabled:opacity-60"
            />
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/60">
                {claim.length}/500 · Ctrl+Enter to check
              </span>
              <Button
                onClick={() => handleCheck()}
                disabled={isChecking || !claim.trim()}
                className="h-9 px-5 gap-2 rounded-xl shadow-md shadow-primary/20"
              >
                {isChecking
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Checking...</>
                  : <><Search className="w-3.5 h-3.5" />Verify Claim</>
                }
              </Button>
            </div>
          </div>

          {/* Example claims */}
          {!result && !isChecking && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2.5 text-center">Try an example:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {EXAMPLE_CLAIMS.map(c => (
                  <button key={c} onClick={() => useClaim(c)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all text-left max-w-[280px] truncate">
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Loading state ── */}
        <AnimatePresence>
          {isChecking && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="text-center py-16">
              <div className="relative w-20 h-20 mx-auto mb-6">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-4 border-primary/15" />
                {/* Spinning ring */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                {/* Inner icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
              </div>
              <p className="text-base font-semibold text-foreground mb-2">Verifying claim...</p>
              <motion.p key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground">
                {step}
              </motion.p>
              {/* Progress steps */}
              <div className="flex items-center justify-center gap-2 mt-6">
                {['Google Fact Check', 'News API', 'Fact-Check Sites', 'AI Synthesis'].map((s, i) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.5 }}
                      className="w-2 h-2 rounded-full bg-primary/40"
                    />
                    <span className="text-[10px] text-muted-foreground hidden sm:block">{s}</span>
                    {i < 3 && <div className="w-4 h-px bg-border/60" />}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error ── */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-red-500/8 border border-red-500/20 mb-6">
            <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Verification failed</p>
              <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
            </div>
          </motion.div>
        )}

        {/* ── Results ── */}
        <AnimatePresence>
          {result && verdictCfg && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              className="space-y-5">

              {/* ── Verdict Card ── */}
              <div className={`rounded-2xl border-2 p-6 ${verdictCfg.bg} ${verdictCfg.border}`}>
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                      result.verdict === 'TRUE' ? 'bg-emerald-500/20'
                      : result.verdict === 'FALSE' ? 'bg-red-500/20'
                      : result.verdict === 'MISLEADING' ? 'bg-amber-500/20'
                      : 'bg-muted/50'
                    }`}>
                      <VerdictIcon className={`w-7 h-7 ${verdictCfg.color}`} />
                    </div>
                    <div>
                      <p className={`text-2xl font-black ${verdictCfg.color}`}>{verdictCfg.label}</p>
                      <p className="text-xs text-muted-foreground">{verdictCfg.description}</p>
                    </div>
                  </div>
                  <button onClick={copyResult}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all shrink-0">
                    {copied ? <><Check className="w-3 h-3 text-emerald-500" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                  </button>
                </div>

                {/* Confidence */}
                <ConfidenceMeter confidence={result.confidence} barColor={verdictCfg.barColor} />

                {/* Summary */}
                <div className="mt-5 p-4 rounded-xl bg-background/60 border border-border/30">
                  <p className="text-sm text-foreground leading-relaxed">{result.summary}</p>
                </div>

                {/* Source count */}
                <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="w-3.5 h-3.5" />
                  <span>Based on {totalSources} source{totalSources !== 1 ? 's' : ''} across 3 databases</span>
                </div>
              </div>

              {/* ── Assessed Claim ── */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Claim Assessed</p>
                <p className="text-sm text-foreground italic leading-relaxed">"{result.claim}"</p>
              </div>

              {/* ── Reasoning ── */}
              {result.reasoning.length > 0 && (
                <div className="p-5 rounded-2xl border border-border/50 bg-card">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-primary" />
                    <p className="text-sm font-bold text-foreground">AI Reasoning</p>
                  </div>
                  <div className="space-y-3">
                    {result.reasoning.map((r, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                        className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <p className="text-sm text-foreground/85 leading-relaxed">{r}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Red Flags ── */}
              {result.redFlags.length > 0 && (
                <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">Misinformation Red Flags</p>
                  </div>
                  <div className="space-y-2">
                    {result.redFlags.map((f, i) => (
                      <div key={i} className="flex gap-2.5">
                        <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground/85">{f}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Suggest Verify ── */}
              {result.suggestVerify.length > 0 && (
                <div className="p-5 rounded-2xl border border-blue-500/15 bg-blue-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">Verify Yourself</p>
                  </div>
                  <div className="space-y-2">
                    {result.suggestVerify.map((s, i) => (
                      <div key={i} className="flex gap-2.5">
                        <BookOpen className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground/85">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Sources ── */}
              <div className="space-y-3">
                {/* Google Fact Checks */}
                <SourceSection
                  title="Google Fact Check Database"
                  icon={ShieldCheck}
                  count={result.existingFactChecks.length}
                  defaultOpen={result.existingFactChecks.length > 0}
                >
                  {result.existingFactChecks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No existing fact-checks found in Google's database.</p>
                  ) : result.existingFactChecks.map((fc, i) => (
                    <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border/30">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-xs font-semibold text-muted-foreground">{fc.publisher}</p>
                        <RatingBadge rating={fc.rating} />
                      </div>
                      <p className="text-sm text-foreground mb-2 leading-relaxed">"{fc.claimReviewed}"</p>
                      <a href={fc.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium">
                        Read full fact-check <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </SourceSection>

                {/* News API */}
                <SourceSection
                  title="News Coverage"
                  icon={Newspaper}
                  count={result.newsSources.length}
                  defaultOpen={false}
                >
                  {result.newsSources.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent news coverage found.</p>
                  ) : result.newsSources.map((n, i) => (
                    <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                      className="flex gap-3 p-3 rounded-xl hover:bg-muted/50 border border-border/30 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded shrink-0">{n.source}</span>
                          {n.publishedAt && <span className="text-[10px] text-muted-foreground">{new Date(n.publishedAt).toLocaleDateString('en-IN')}</span>}
                        </div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">{n.title}</p>
                        {n.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{n.description}</p>}
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                    </a>
                  ))}
                </SourceSection>

                {/* Tavily fact-check sites */}
                <SourceSection
                  title="Fact-Check Websites"
                  icon={Globe}
                  count={result.tavilySources.length}
                  defaultOpen={false}
                >
                  {result.tavilySources.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No relevant fact-check articles found.</p>
                  ) : result.tavilySources.map((t, i) => (
                    <a key={i} href={t.url} target="_blank" rel="noopener noreferrer"
                      className="flex gap-3 p-3 rounded-xl hover:bg-muted/50 border border-border/30 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug mb-1">{t.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{t.snippet}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1 truncate">{new URL(t.url).hostname}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                    </a>
                  ))}
                </SourceSection>
              </div>

              {/* ── Try another ── */}
              <div className="pt-4 pb-8 text-center">
                <Button variant="outline" onClick={() => { setResult(null); setClaim(''); setError(null) }} className="gap-2">
                  <Search className="w-4 h-4" /> Check Another Claim
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

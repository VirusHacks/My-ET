'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Zap, Radio, Radar, TrendingUp, TrendingDown,
  Scale, FileText, BookOpen, CheckCircle, AlertCircle, ShieldAlert, HelpCircle,
} from 'lucide-react'
import type { BullBearDebateResult } from '@/lib/agents/bullBear'

interface AiStudioSidebarProps {
  articleText: string
  articleTitle: string
  userSector?: string
}

type ActiveTool = 'bullbear' | 'summary' | null

export function AiStudioSidebar({ articleText, articleTitle, userSector = 'Finance' }: AiStudioSidebarProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTool, setActiveTool] = useState<ActiveTool>(null)
  const [bullBearResult, setBullBearResult] = useState<BullBearDebateResult | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  const runBullBear = async () => {
    setActiveTool('bullbear')
    setShowDialog(true)
    setIsLoading(true)
    setBullBearResult(null)
    try {
      const res = await fetch('/api/studio/bull-bear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleText }),
      })
      const data = await res.json() as BullBearDebateResult
      setBullBearResult(data)
    } catch (err) {
      console.error('Bull/Bear error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const runSummary = async () => {
    setActiveTool('summary')
    setShowDialog(true)
    setIsLoading(true)
    setSummary(null)
    try {
      const res = await fetch('/api/studio/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleText, sector: userSector }),
      })
      const data = await res.json() as { summary: string }
      setSummary(data.summary)
    } catch {
      setSummary('Failed to generate summary.')
    } finally {
      setIsLoading(false)
    }
  }

  const sectorButtons = [
    userSector === 'Law' && {
      label: 'Extract Legal Clauses',
      icon: Scale,
      desc: 'Pull SEBI/RBI clauses in plain English',
      action: () => {},
      comingSoon: true,
    },
    userSector === 'Founder' && {
      label: 'Competitor Radar',
      icon: Radar,
      desc: 'See how rivals responded to this trend',
      action: () => {},
      comingSoon: true,
    },
    userSector === 'Student' && {
      label: 'Generate Flashcards',
      icon: BookOpen,
      desc: 'UPSC/MBA-ready key terms & quiz',
      action: () => {},
      comingSoon: true,
    },
  ].filter(Boolean)

  const confidenceColor = (c: 'high' | 'medium' | 'low') =>
    c === 'high' ? 'text-green-500' : c === 'medium' ? 'text-yellow-500' : 'text-red-500'

  return (
    <>
      <aside className="space-y-3 sticky top-24">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-foreground mb-0.5 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> AI Studio
          </h3>
          <p className="text-xs text-muted-foreground">Unlock deeper insights with AI</p>
        </div>

        {/* Executive Summary */}
        <Button onClick={runSummary} disabled={isLoading}
          variant="outline"
          className="w-full justify-start gap-3 h-auto py-3 bg-background/50 hover:bg-primary/10 border-border/50 hover:border-primary/50">
          <FileText className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="text-left">
            <div className="text-sm font-medium">Executive Summary</div>
            <div className="text-xs text-muted-foreground">30-second sector-specific brief</div>
          </div>
        </Button>

        {/* Bull/Bear Splitter */}
        <Button onClick={runBullBear} disabled={isLoading}
          variant="outline"
          className="w-full justify-start gap-3 h-auto py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20">
          <TrendingUp className="w-4 h-4 flex-shrink-0" />
          <div className="text-left">
            <div className="text-sm font-medium">Bull/Bear Splitter</div>
            <div className="text-xs text-muted-foreground">{isLoading && activeTool === 'bullbear' ? 'Debating...' : 'Dual-agent analysis'}</div>
          </div>
        </Button>

        {/* Podcast - coming soon */}
        <Button variant="outline" disabled
          className="w-full justify-start gap-3 h-auto py-3 bg-background/50 border-border/30 opacity-60">
          <Radio className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="text-left">
            <div className="text-sm font-medium">Generate Podcast</div>
            <div className="text-xs text-muted-foreground">Coming soon</div>
          </div>
        </Button>

        {/* Sector-specific buttons */}
        {sectorButtons.map((btn) => {
          if (!btn) return null
          const Icon = btn.icon
          return (
            <Button key={btn.label} variant="outline" disabled={btn.comingSoon}
              onClick={btn.action}
              className="w-full justify-start gap-3 h-auto py-3 bg-background/50 border-border/50 hover:border-primary/50 opacity-80">
              <Icon className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="text-left">
                <div className="text-sm font-medium">{btn.label}</div>
                <div className="text-xs text-muted-foreground">{btn.comingSoon ? 'Coming soon' : btn.desc}</div>
              </div>
            </Button>
          )
        })}
      </aside>

      {/* Result Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeTool === 'bullbear' ? '🐂 Bull / 🐻 Bear Analysis' : '📋 Executive Summary'}
            </DialogTitle>
            <DialogDescription className="text-xs truncate">{articleTitle}</DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : activeTool === 'bullbear' && bullBearResult ? (
            <div className="space-y-5 py-2">
              {/* Bullish */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <h4 className="font-bold text-foreground">Bullish Signals</h4>
                </div>
                <div className="space-y-2">
                  {bullBearResult.bullish.map((pt, i) => (
                    <Card key={i} className="p-3 bg-green-50/30 dark:bg-green-950/20 border border-green-500/20">
                      <div className="flex gap-2 items-start">
                        <Badge className="bg-green-600/20 text-green-700 dark:text-green-400 border-green-500/30 text-xs shrink-0">+</Badge>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{pt.point}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{pt.explanation}</p>
                          {pt.confidence && (
                            <span className={`text-xs font-medium ${confidenceColor(pt.confidence)}`}>
                              {pt.confidence} confidence
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Bearish */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  <h4 className="font-bold text-foreground">Bearish Risks</h4>
                </div>
                <div className="space-y-2">
                  {bullBearResult.bearish.map((pt, i) => (
                    <Card key={i} className="p-3 bg-red-50/30 dark:bg-red-950/20 border border-red-500/20">
                      <div className="flex gap-2 items-start">
                        <Badge className="bg-red-600/20 text-red-700 dark:text-red-400 border-red-500/30 text-xs shrink-0">−</Badge>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{pt.point}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{pt.explanation}</p>
                          {pt.confidence && (
                            <span className={`text-xs font-medium ${confidenceColor(pt.confidence)}`}>
                              {pt.confidence} confidence
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Orchestrator Verdict */}
              {bullBearResult.orchestratorVerdict && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <h4 className="text-sm font-bold text-foreground mb-1.5 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" /> AI Verdict for {userSector} professionals
                  </h4>
                  <p className="text-sm text-muted-foreground">{bullBearResult.orchestratorVerdict}</p>
                </div>
              )}
            </div>
          ) : activeTool === 'summary' && summary ? (
            <div className="py-2">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{summary}</p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

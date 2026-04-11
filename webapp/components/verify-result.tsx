'use client'

import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  RotateCcw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { VerificationResult } from '@/app/actions/verifyMisinformation'

interface VerifyResultProps {
  result: VerificationResult
  onReset: () => void
}

export function VerifyResult({ result, onReset }: VerifyResultProps) {
  const isAccurate = result.status === 'TRUE_ACCURATE'
  const isMisleading = result.status === 'FALSE_MISLEADING'
  const isPartial = result.status === 'PARTIAL_CONTEXT'
  const isInsufficient = result.status === 'INSUFFICIENT_DATA'

  const getStatusDisplay = () => {
    if (isAccurate) {
      return {
        icon: <CheckCircle2 className="w-6 h-6" />,
        label: 'ACCURATE',
        bgColor: 'bg-green-50 dark:bg-green-950',
        borderColor: 'border-green-200 dark:border-green-800',
        badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
        textColor: 'text-green-900 dark:text-green-100',
      }
    }
    if (isMisleading) {
      return {
        icon: <AlertCircle className="w-6 h-6" />,
        label: 'FALSE / MISLEADING',
        bgColor: 'bg-red-50 dark:bg-red-950',
        borderColor: 'border-red-200 dark:border-red-800',
        badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
        textColor: 'text-red-900 dark:text-red-100',
      }
    }
    if (isPartial) {
      return {
        icon: <AlertCircle className="w-6 h-6" />,
        label: 'PARTIALLY ACCURATE',
        bgColor: 'bg-amber-50 dark:bg-amber-950',
        borderColor: 'border-amber-200 dark:border-amber-800',
        badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
        textColor: 'text-amber-900 dark:text-amber-100',
      }
    }
    return {
      icon: <HelpCircle className="w-6 h-6" />,
      label: 'INSUFFICIENT DATA',
      bgColor: 'bg-slate-50 dark:bg-slate-950',
      borderColor: 'border-slate-200 dark:border-slate-800',
      badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100',
      textColor: 'text-slate-900 dark:text-slate-100',
    }
  }

  const statusDisplay = getStatusDisplay()

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Main Result Card */}
      <div
        className={`rounded-2xl border-2 p-8 ${statusDisplay.bgColor} ${statusDisplay.borderColor} transition-all`}
      >
        <div className="flex gap-4 mb-6">
          <div className={`flex-shrink-0 ${statusDisplay.textColor}`}>
            {statusDisplay.icon}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className={`text-2xl font-bold ${statusDisplay.textColor}`}>
                {statusDisplay.label}
              </h2>
              <Badge className={statusDisplay.badgeColor}>
                {Math.round(result.confidence * 100)}% confident
              </Badge>
            </div>
            <p className={`text-base leading-relaxed ${statusDisplay.textColor}`}>
              {result.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Citations */}
      {result.citations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">
            Authoritative Sources
          </h3>
          <div className="grid gap-3">
            {result.citations.map((citation, index) => (
              <a
                key={index}
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="p-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {citation.title}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {citation.url}
                      </p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors mt-1" />
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button onClick={onReset} variant="outline" className="flex-1">
          <RotateCcw className="w-4 h-4 mr-2" />
          Verify Another Claim
        </Button>
      </div>
    </div>
  )
}

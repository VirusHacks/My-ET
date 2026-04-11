'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, TrendingUp } from 'lucide-react'

export function ImpactCalculator() {
  const [salary, setSalary] = useState<string>('')
  const [impact, setImpact] = useState<number | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const handleCalculate = async () => {
    if (!salary || isNaN(Number(salary))) {
      return
    }

    setIsCalculating(true)
    // Simulate calculation
    await new Promise(r => setTimeout(r, 800))

    const salaryNum = Number(salary)
    // Mock impact calculation: 2-5% of annual salary
    const impactPercentage = 2 + Math.random() * 3
    const impactAmount = (salaryNum * impactPercentage) / 100
    setImpact(impactAmount)
    setIsCalculating(false)
  }

  const handleReset = () => {
    setSalary('')
    setImpact(null)
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 p-6 my-8">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground mb-4">
            Impact Calculator
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="salary" className="text-sm font-medium">
                Annual Salary ($)
              </Label>
              <Input
                id="salary"
                type="number"
                placeholder="Enter your annual salary"
                value={salary}
                onChange={e => setSalary(e.target.value)}
                disabled={isCalculating}
                className="bg-background/50 border-border/50"
              />
            </div>

            {impact !== null && (
              <div className="bg-background/50 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">
                  Estimated Annual Impact
                </p>
                <p className="text-2xl font-bold text-primary">
                  ${impact.toLocaleString('en-US', {
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on industry trends and market movements
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleCalculate}
                disabled={!salary || isNaN(Number(salary)) || isCalculating}
                className="flex-1"
                size="sm"
              >
                {isCalculating ? 'Calculating...' : 'Calculate Impact'}
              </Button>
              {impact !== null && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  disabled={isCalculating}
                >
                  Reset
                </Button>
              )}
            </div>

            <div className="flex gap-2 text-xs text-muted-foreground bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <span>
                This is a mock calculator for demonstration. Actual impact depends on many factors.
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts'
import { motion } from 'framer-motion'
import { Info, TrendingUp, AlertTriangle } from 'lucide-react'

interface MarketMoodGaugeProps {
  score: number           // 0 - 100 (Fear to Greed)
  label: string           // e.g. "Greed"
  loading?: boolean
}

const GAUGE_COLORS = [
  '#ef4444', // Fear (Red)
  '#f59e0b', // Neutral (Amber)
  '#10b981'  // Greed (Emerald)
]

const PIE_DATA = [
  { name: 'Fear',    value: 33.3 },
  { name: 'Neutral', value: 33.3 },
  { name: 'Greed',   value: 33.4 }
]

export function MarketMoodGauge({ score, label, loading }: MarketMoodGaugeProps) {
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Calculate the needle rotation (180deg is left/fear, 0deg is right/greed)
  // Recharts Pie starts at 0 (top) and goes clockwise?
  // Actually Recharts Pie startAngle={180} endAngle={0} 
  // 180 is left, 90 is top (50 score), 0 is right.
  const needleRotation = useMemo(() => {
    // 0 score -> 180deg
    // 100 score -> 0deg
    return 180 - (score * 1.8)
  }, [score])

  const sentimentColor = useMemo(() => {
    if (score < 33) return 'text-red-500'
    if (score < 66) return 'text-amber-500'
    return 'text-emerald-500'
  }, [score])

  if (loading || !isMounted) {
    return (
      <div className="bg-card border border-border/40 rounded-2xl p-6 h-[220px] flex flex-col items-center justify-center animate-pulse">
        <div className="w-32 h-16 rounded-t-full bg-muted/60" />
        <div className="w-20 h-4 bg-muted/60 rounded mt-4" />
      </div>
    )
  }

  return (
    <div className="bg-card border border-border/40 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
      {/* Background glow */}
       <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[40px] opacity-10 rounded-full transition-colors duration-500 ${
        score > 66 ? 'bg-emerald-500' : score < 33 ? 'bg-red-500' : 'bg-amber-500'
      }`} />

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          Market Mood
        </h3>
        <Info className="w-3.5 h-3.5 text-muted-foreground/40" />
      </div>

      <div className="h-[120px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={PIE_DATA}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              isAnimationActive={false}
            >
              {PIE_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={GAUGE_COLORS[index]} opacity={0.6 + (index === (score > 66 ? 2 : score < 33 ? 0 : 1) ? 0.4 : 0)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Needle */}
        <motion.div 
          initial={{ rotate: 180 }}
          animate={{ rotate: needleRotation }}
          transition={{ type: 'spring', stiffness: 60, damping: 15 }}
          style={{ 
            position: 'absolute', 
            bottom: '0', 
            left: '50%', 
            width: '2px', 
            height: '80px', 
            backgroundColor: 'hsl(var(--foreground))',
            transformOrigin: 'bottom center',
            marginLeft: '-1px'
          }}
        >
          <div className="absolute top-0 left-1/2 -ml-1 w-2 h-2 rounded-full bg-foreground shadow-sm" />
        </motion.div>
        
        {/* Pivot */}
        <div className="absolute bottom-0 left-1/2 -ml-2 w-4 h-4 rounded-full bg-background border-2 border-foreground z-10" />
      </div>

      <div className="text-center mt-2">
        <p className={`text-2xl font-black tracking-tight ${sentimentColor}`}>
          {label}
        </p>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-1.5 mt-1">
          Index: <span className="text-foreground">{score}</span>
          {score < 25 && <AlertTriangle className="w-3 h-3 text-red-500" />}
        </p>
      </div>

      {/* Labels */}
      <div className="flex justify-between px-2 mt-2">
        <span className="text-[9px] font-bold text-red-500/60 uppercase">Ext. Fear</span>
        <span className="text-[9px] font-bold text-emerald-500/60 uppercase">Ext. Greed</span>
      </div>
    </div>
  )
}

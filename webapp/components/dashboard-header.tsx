'use client'

import { UserButton } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Zap, Shield, Globe2 } from 'lucide-react'

interface DashboardHeaderProps {
  userId: string
  userProfile: {
    id: string
    sector: string
    watchlist: string[]
    location: string
    preferredLanguage?: string
    experienceLevel?: string
  } | null
}

export function DashboardHeader({ userProfile }: DashboardHeaderProps) {
  const sectorColors: Record<string, string> = {
    Finance: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    Law:     'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25',
    Founder: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/25',
    Student: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25',
  }

  const sector = userProfile?.sector ?? 'Finance'
  const sectorCls = sectorColors[sector] ?? sectorColors.Finance

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <nav className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
            <span className="text-white font-black text-sm">ET</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-base font-bold text-foreground tracking-tight">
              My<span className="text-primary">ET</span>
            </span>
          </div>
        </Link>

        {/* Centre: Sector, AI Studio, Truth Engine */}
        <div className="flex items-center gap-2">
          {userProfile?.sector && (
            <Badge variant="outline" className={`hidden sm:flex text-xs font-semibold ${sectorCls}`}>
              {userProfile.sector}
            </Badge>
          )}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-xs font-semibold text-primary">AI Studio</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <Link href="/factcheck"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all">
            <Shield className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Truth Engine</span>
          </Link>
          <Link href="/globe"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all">
            <Globe2 className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Geo Intel</span>
          </Link>
        </div>

        {/* Right: user */}
        <div className="flex items-center gap-3 shrink-0">
          {userProfile?.location && (
            <span className="hidden lg:block text-xs text-muted-foreground">📍 {userProfile.location}</span>
          )}
          <UserButton />
        </div>
      </nav>
    </motion.header>
  )
}

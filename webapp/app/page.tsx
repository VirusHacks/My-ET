'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { ArrowRight, Zap, TrendingUp, Globe, ShieldCheck, BarChart2, BookOpen } from 'lucide-react'

const FEATURES = [
  { icon: Zap,         color: 'from-primary/20 to-primary/5  border-primary/20',  iconCls: 'text-primary',   title: 'AI Studio',       desc: 'Executive briefs, Bull/Bear debates, Story Arcs and Flashcards — all powered by Gemini.' },
  { icon: TrendingUp,  color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20', iconCls: 'text-emerald-500', title: 'Live ET Feed',  desc: 'Real-time RSS ingestion from Economic Times across finance, markets, policy and more.' },
  { icon: Globe,       color: 'from-blue-500/20 to-blue-500/5 border-blue-500/20', iconCls: 'text-blue-500',  title: 'Vernacular AI',   desc: 'Read news in Hindi, Tamil, Bengali or 8 other Indian languages with cultural context.' },
  { icon: BarChart2,   color: 'from-violet-500/20 to-violet-500/5 border-violet-500/20', iconCls: 'text-violet-500', title: 'Truth Engine', desc: 'Verify misinformation using multimodal AI — paste a claim, upload a screenshot, get facts.' },
  { icon: ShieldCheck, color: 'from-amber-500/20 to-amber-500/5 border-amber-500/20', iconCls: 'text-amber-500', title: 'Personalized',    desc: 'Sector-specific curation for Finance, Law, Founders and Students with watchlist tracking.' },
  { icon: BookOpen,    color: 'from-pink-500/20 to-pink-500/5 border-pink-500/20',   iconCls: 'text-pink-500',  title: 'Contrarian View', desc: 'Every article includes a Devil\'s Advocate analysis to challenge your confirmation bias.' },
]

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export default function HomePage() {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && userId) router.push('/dashboard')
  }, [isLoaded, userId, router])

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="w-8 h-8" />
      </main>
    )
  }

  return (
    <main className="relative min-h-screen bg-background overflow-x-hidden">
      {/* ── Ambient orbs ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] animate-blob" />
        <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] rounded-full bg-blue-500/8 blur-[100px] animate-blob animation-delay-4000" />
        <div className="absolute -bottom-32 right-1/3 w-[400px] h-[400px] rounded-full bg-violet-500/8 blur-[80px] animate-blob animation-delay-2000" />
      </div>

      {/* ── Nav ── */}
      <nav className="relative z-10 mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/30">
            <span className="text-white font-black text-base tracking-tight">ET</span>
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">My<span className="text-primary">ET</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="shadow-md shadow-primary/20">
            <Link href="/sign-up">Get started <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
          </Button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-20 pb-28 text-center">
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-8">
              <Zap className="w-3.5 h-3.5" /> Powered by Gemini AI
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp}
            className="text-6xl md:text-7xl lg:text-8xl font-black text-foreground leading-[0.95] tracking-tight mb-6">
            The Economic Times<br />
            <span className="text-gradient">reimagined.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            An AI-native news operating system that reads, debates, verifies, and explains India's financial world — in real time, tailored to you.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="h-14 px-8 text-base shadow-xl shadow-primary/25 animate-glow">
              <Link href="/sign-up">
                Start for free <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base border-border/60 hover:bg-muted/50">
              <Link href="/sign-in">Sign in to dashboard</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* ── Floating dashboard mockup ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="glass rounded-2xl border border-border/40 p-6 shadow-2xl mx-auto max-w-3xl animate-float">
            {/* Mock header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-white font-black text-xs">ET</span>
                </div>
                <span className="text-sm font-bold text-foreground">MyET Dashboard</span>
              </div>
              <div className="flex gap-1.5">
                {['Finance', 'Markets', 'Policy'].map(t => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">{t}</span>
                ))}
              </div>
            </div>
            {/* Mock news cards */}
            {[
              { cat: 'Markets', title: 'Nifty 50 hits all-time high as FII inflows surge in Q1 2026', time: '2m ago', bull: true },
              { cat: 'Policy',  title: 'RBI holds rates; MPC signals pivot possible in June meeting', time: '8m ago', bull: false },
              { cat: 'Finance', title: 'Vedanta demerger: Five companies to list on exchanges by April', time: '15m ago', bull: true },
            ].map((item, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl mb-2 last:mb-0 bg-muted/30 border border-border/30 animate-slide-up delay-${(i + 1) * 150}`}>
                <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold shrink-0 mt-0.5">{item.cat}</span>
                <p className="text-sm text-foreground font-medium leading-snug flex-1">{item.title}</p>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                  <span className={`text-xs font-bold ${item.bull ? 'text-emerald-500' : 'text-red-500'}`}>{item.bull ? '▲ Bull' : '▼ Bear'}</span>
                </div>
              </div>
            ))}
            {/* Mock AI Studio pill */}
            <div className="mt-4 flex items-center gap-2 p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs text-primary font-semibold">AI Studio active — 3 tools ready</span>
              <div className="ml-auto flex gap-1">
                {['Brief', 'Bull/Bear', 'Story'].map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Features grid ── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-32">
        <motion.div
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
        >
          <motion.div variants={fadeUp} className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Everything your analyst team does —
              <span className="text-gradient"> in seconds.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Six AI-native tools that turn any news article into deep, actionable intelligence.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <motion.div key={f.title} variants={fadeUp}
                  className={`relative rounded-2xl bg-gradient-to-br ${f.color} border p-6 card-hover overflow-hidden`}>
                  <div className={`w-10 h-10 rounded-xl bg-white/80 dark:bg-white/10 flex items-center justify-center mb-4 shadow-sm`}>
                    <Icon className={`w-5 h-5 ${f.iconCls}`} />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="relative z-10 mx-auto max-w-2xl px-6 pb-24 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration: 0.5 }}>
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to read smarter?</h2>
          <p className="text-muted-foreground mb-8">Join thousands of finance professionals who start their day with MyET.</p>
          <Button asChild size="lg" className="h-13 px-10 text-base shadow-xl shadow-primary/25">
            <Link href="/sign-up">Create free account <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </motion.div>
      </section>
    </main>
  )
}

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock, ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react'
import type { RSSArticle } from '@/lib/rss'

interface NewsCardProps { article: RSSArticle }

function encodeArticleId(id: string): string {
  return encodeURIComponent(Buffer.from(id).toString('base64'))
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Finance:  { bg: 'bg-emerald-500/12 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
  Markets:  { bg: 'bg-blue-500/12 dark:bg-blue-500/15',    text: 'text-blue-600 dark:text-blue-400' },
  Policy:   { bg: 'bg-violet-500/12 dark:bg-violet-500/15', text: 'text-violet-600 dark:text-violet-400' },
  Startups: { bg: 'bg-amber-500/12 dark:bg-amber-500/15',   text: 'text-amber-600 dark:text-amber-400' },
  Banking:  { bg: 'bg-sky-500/12 dark:bg-sky-500/15',       text: 'text-sky-600 dark:text-sky-400' },
  Default:  { bg: 'bg-primary/10',                           text: 'text-primary' },
}

export function NewsCard({ article }: NewsCardProps) {
  const articlePath = `/article/${encodeArticleId(article.id)}`
  const wordCount = article.excerpt.split(/\s+/).length
  const readTime = Math.max(2, Math.ceil(wordCount / 40))
  const catStyle = CATEGORY_COLORS[article.category] ?? CATEGORY_COLORS.Default

  return (
    <Link href={articlePath} className="block h-full group">
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="h-full rounded-2xl border border-border/50 bg-card overflow-hidden flex flex-col
                   hover:border-primary/30 hover:shadow-xl hover:shadow-black/8
                   transition-[border-color,box-shadow] duration-300"
      >
        {/* ── Image ── */}
        {article.imageUrl ? (
          <div className="relative w-full h-44 overflow-hidden bg-muted shrink-0">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {/* Gradient fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            {/* Category badge on image */}
            <div className="absolute top-3 left-3">
              <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm bg-black/40 text-white`}>
                {article.category}
              </span>
            </div>
          </div>
        ) : (
          /* No-image placeholder with category colour */
          <div className={`h-2 w-full shrink-0 ${catStyle.bg.replace('/12', '').replace('/15', '')} bg-primary/20`} />
        )}

        {/* ── Body ── */}
        <div className="flex flex-col flex-1 p-5">
          {/* Category (no image case) */}
          {!article.imageUrl && (
            <div className="mb-3">
              <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg ${catStyle.bg} ${catStyle.text}`}>
                {article.category}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="font-bold text-[0.95rem] leading-snug text-foreground mb-2.5 flex-1
                         group-hover:text-primary transition-colors duration-200 line-clamp-3">
            {article.title}
          </h3>

          {/* Excerpt */}
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
            {article.excerpt}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-auto">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />{readTime} min
              </span>
              <span>{timeAgo(article.timestamp)}</span>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Read <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

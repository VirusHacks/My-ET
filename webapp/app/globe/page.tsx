'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  Globe2, ArrowLeft, ExternalLink, AlertTriangle,
  TrendingUp, Shield, Zap, Fuel, Handshake, Landmark,
  RefreshCw, X, PanelRightClose, PanelRightOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Types ──────────────────────────────────────────────────
interface Hotspot {
  id: string
  title: string
  summary: string
  lat: number
  lng: number
  region: string
  country: string
  category: 'conflict' | 'trade' | 'policy' | 'markets' | 'energy' | 'diplomacy'
  severity: number
  sourceUrl?: string
}

interface HotspotsResponse {
  hotspots: Hotspot[]
  marketContext: string | null
  generatedAt: string
}

// ─── Category Config ────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string; badgeCls: string; markerColor: string }> = {
  conflict:   { icon: AlertTriangle, label: 'Conflict',   color: 'text-red-600',     badgeCls: 'bg-red-100 text-red-700 border-red-200',       markerColor: '#dc2626' },
  trade:      { icon: TrendingUp,    label: 'Trade',      color: 'text-blue-600',    badgeCls: 'bg-blue-100 text-blue-700 border-blue-200',     markerColor: '#2563eb' },
  policy:     { icon: Landmark,      label: 'Policy',     color: 'text-violet-600',  badgeCls: 'bg-violet-100 text-violet-700 border-violet-200', markerColor: '#7c3aed' },
  markets:    { icon: TrendingUp,    label: 'Markets',    color: 'text-emerald-600', badgeCls: 'bg-emerald-100 text-emerald-700 border-emerald-200', markerColor: '#059669' },
  energy:     { icon: Fuel,          label: 'Energy',     color: 'text-amber-600',   badgeCls: 'bg-amber-100 text-amber-700 border-amber-200',   markerColor: '#d97706' },
  diplomacy:  { icon: Handshake,     label: 'Diplomacy',  color: 'text-cyan-600',    badgeCls: 'bg-cyan-100 text-cyan-700 border-cyan-200',     markerColor: '#0891b2' },
}

const SEVERITY_LABELS = ['', 'Minor', 'Low', 'Moderate', 'High', 'Critical']
const SEVERITY_CLS    = ['', 'text-muted-foreground', 'text-muted-foreground', 'text-amber-600', 'text-orange-600', 'text-red-600']

// ─── Marker element creator ─────────────────────────────────
function createMarkerEl(severity: number, color: string): HTMLDivElement {
  const el = document.createElement('div')
  const size = 14 + severity * 3
  el.style.width = `${size}px`
  el.style.height = `${size}px`
  el.style.borderRadius = '50%'
  el.style.background = color
  el.style.border = '2.5px solid white'
  el.style.cursor = 'pointer'
  el.style.boxShadow = `0 2px 8px ${color}60, 0 0 0 2px ${color}20`
  el.style.transition = 'transform 0.2s, box-shadow 0.2s'
  el.style.position = 'relative'
  el.className = 'hotspot-marker'

  // Pulse ring
  const ring = document.createElement('div')
  ring.style.position = 'absolute'
  ring.style.inset = '-5px'
  ring.style.borderRadius = '50%'
  ring.style.border = `1.5px solid ${color}30`
  ring.style.animation = 'marker-pulse 2.5s ease-out infinite'
  el.appendChild(ring)

  return el
}

// ─── News Card ──────────────────────────────────────────────
function HotspotCard({ hotspot, isActive, onClick }: { hotspot: Hotspot; isActive: boolean; onClick: () => void }) {
  const conf = CATEGORY_CONFIG[hotspot.category] ?? CATEGORY_CONFIG.policy
  const Icon = conf.icon

  return (
    <motion.div
      layout
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        isActive
          ? 'bg-primary/5 border-primary/20 shadow-sm'
          : 'bg-card border-border/60 hover:bg-muted/40 hover:border-border'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${conf.badgeCls}`}>
          <Icon className={`w-3.5 h-3.5`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${conf.badgeCls} border`}>
              {conf.label}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{hotspot.country}</span>
            {hotspot.severity >= 4 && (
              <span className={`text-[10px] font-bold ml-auto ${SEVERITY_CLS[hotspot.severity]}`}>
                {SEVERITY_LABELS[hotspot.severity]}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-foreground leading-snug mb-1">{hotspot.title}</p>
          <AnimatePresence>
            {isActive && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">{hotspot.summary}</p>
                {hotspot.sourceUrl && (
                  <a href={hotspot.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 font-medium transition-colors">
                    Read source <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Page ───────────────────────────────────────────────────
export default function GlobePage() {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  const [data, setData] = useState<HotspotsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (isSignedIn === false) router.push('/sign-in')
  }, [isSignedIn, router])

  const fetchHotspots = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/globe/hotspots')
      if (!res.ok) throw new Error('Failed')
      const json = await res.json() as HotspotsResponse
      setData(json)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return

    mapboxgl.accessToken = token

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [30, 20],
      zoom: 1.6,
      projection: 'mercator',
      attributionControl: false,
    })

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')

    // Wait for the full style + tiles to be ready before rendering markers
    map.current.on('load', () => {
      map.current?.resize()
      setMapReady(true)
    })

    fetchHotspots()

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [fetchHotspots])

  // Render markers only after map is fully loaded AND data is available
  useEffect(() => {
    if (!map.current || !data || !mapReady) return

    // Remove old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    data.hotspots.forEach(h => {
      const conf = CATEGORY_CONFIG[h.category] ?? CATEGORY_CONFIG.policy
      const el = createMarkerEl(h.severity, conf.markerColor)

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.25)'
        el.style.boxShadow = `0 4px 16px ${conf.markerColor}80, 0 0 0 3px ${conf.markerColor}30`
      })
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)'
        el.style.boxShadow = `0 2px 8px ${conf.markerColor}60, 0 0 0 2px ${conf.markerColor}20`
      })
      el.addEventListener('click', () => {
        setActiveId(h.id)
        setSidebarOpen(true)
        map.current?.flyTo({ center: [h.lng, h.lat], zoom: 4, duration: 1200 })
      })

      // Tooltip popup
      const popup = new mapboxgl.Popup({ offset: 15, closeButton: false, className: 'globe-popup' })
        .setHTML(`<div style="font-size:12px;font-weight:600;color:#1a1a1a;max-width:200px">${h.title}</div><div style="font-size:10px;color:#666;margin-top:3px">${h.country} · ${conf.label}</div>`)

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([h.lng, h.lat])
        .setPopup(popup)
        .addTo(map.current!)

      markersRef.current.push(marker)
    })
  }, [data, mapReady])

  const filteredHotspots = data?.hotspots.filter(h => !filterCategory || h.category === filterCategory) ?? []
  const categories = [...new Set(data?.hotspots.map(h => h.category) ?? [])]

  return (
    <div className="fixed inset-0 bg-background text-foreground flex flex-col">
      {/* ── Top Bar ── */}
      <header className="h-14 px-5 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5 h-8 px-2">
            <Link href="/dashboard"><ArrowLeft className="w-3.5 h-3.5" />Dashboard</Link>
          </Button>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold tracking-tight text-foreground">Geopolitical Intelligence</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {data?.marketContext && (
            <p className="hidden lg:block text-[11px] text-muted-foreground max-w-md truncate italic">
              {data.marketContext}
            </p>
          )}
          <button onClick={() => fetchHotspots()} disabled={loading}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/60">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setSidebarOpen(o => !o)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/60">
            {sidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex-1 flex overflow-hidden relative" style={{ height: 'calc(100vh - 56px)' }}>
        {/* Map */}
        <div className="flex-1 relative" style={{ minHeight: 0 }}>
          <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }} />

          {/* Category filter chips (floating over map) */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterCategory(null)}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all shadow-sm ${
                !filterCategory
                  ? 'bg-foreground text-background border-foreground shadow-md'
                  : 'bg-card/90 backdrop-blur-sm text-muted-foreground border-border hover:bg-card hover:text-foreground'
              }`}>
              All
            </button>
            {categories.map(cat => {
              const c = CATEGORY_CONFIG[cat]
              return (
                <button key={cat} onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all shadow-sm flex items-center gap-1.5 ${
                    filterCategory === cat
                      ? `${c.badgeCls} shadow-md`
                      : 'bg-card/90 backdrop-blur-sm text-muted-foreground border-border hover:bg-card hover:text-foreground'
                  }`}>
                  {c.label}
                </button>
              )
            })}
          </div>

          {/* Hotspot count */}
          {data && (
            <div className="absolute bottom-4 left-4 z-10 bg-card/90 backdrop-blur-md rounded-xl px-3 py-2 border border-border shadow-sm">
              <p className="text-[11px] text-muted-foreground">
                <span className="text-foreground font-bold">{filteredHotspots.length}</span> hotspots tracked globally
              </p>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="h-full border-l border-border bg-background flex flex-col overflow-hidden shrink-0"
            >
              {/* Sidebar Header */}
              <div className="px-5 py-4 border-b border-border shrink-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h2 className="text-sm font-bold text-foreground">Live Intelligence Feed</h2>
                  <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">Click a marker or card to explore</p>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="p-4 rounded-xl bg-card border border-border space-y-2.5">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  ))
                ) : filteredHotspots.length === 0 ? (
                  <div className="text-center py-16">
                    <Globe2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No hotspots found</p>
                  </div>
                ) : (
                  filteredHotspots.map(h => (
                    <HotspotCard
                      key={h.id}
                      hotspot={h}
                      isActive={activeId === h.id}
                      onClick={() => {
                        setActiveId(activeId === h.id ? null : h.id)
                        map.current?.flyTo({ center: [h.lng, h.lat], zoom: 4, duration: 1200 })
                      }}
                    />
                  ))
                )}
              </div>

              {/* Market Context Footer */}
              {data?.marketContext && (
                <div className="px-5 py-3 border-t border-border shrink-0 bg-muted/30">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Market Context</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{data.marketContext}</p>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ── Pulse animation keyframes + Mapbox style overrides ── */}
      <style jsx global>{`
        @keyframes marker-pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        .mapboxgl-popup-content {
          background: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 12px !important;
          padding: 10px 14px !important;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12) !important;
        }
        .mapboxgl-popup-tip {
          border-top-color: white !important;
        }
        .mapboxgl-ctrl-group {
          border-radius: 10px !important;
          border: 1px solid #e5e7eb !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.07) !important;
        }
      `}</style>
    </div>
  )
}

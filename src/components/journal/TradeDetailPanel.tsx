import { useEffect, useRef, useState } from 'react'
import { X, ExternalLink, Clock, Calendar, TrendingUp, TrendingDown, Activity, Eye, EyeOff, Download, Loader2 } from 'lucide-react'
import { toPng } from 'html-to-image'
import { toast } from 'sonner'
import { formatET } from '@/lib/formatET'
import { sanitizeUrl } from '@/lib/security/url'
import { PairBadge } from './PairBadge'
import { OutcomeBadge } from './OutcomeBadge'
import { SessionBadge } from './SessionBadge'
import { ConfirmationChips } from './ConfirmationChips'
import { useS } from '@/lib/i18n'
import type { TradeWithRelations } from '@/types'

interface Props {
  trade: TradeWithRelations | null
  open:  boolean
  onClose: () => void
}

export function TradeDetailPanel({ trade, open, onClose }: Props) {
  const S = useS()
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [hidePnl,    setHidePnl]    = useState(false)
  const [hideNotes,  setHideNotes]  = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Reset toggles when opening a new trade
  useEffect(() => {
    if (open) { setHidePnl(false); setHideNotes(false) }
  }, [open, trade?.id])

  if (!open || !trade) return null

  const entryRaw = trade.entry_time_et ?? null
  const pnl = trade.pnl_usd
  const pnlPositive = pnl !== null && pnl > 0
  const pnlNegative = pnl !== null && pnl < 0
  const pnlColor =
    pnlPositive ? 'text-emerald-400' : pnlNegative ? 'text-rose-400' : 'text-slate-400'

  const durationStr = trade.duration_sec != null
    ? `${Math.floor(trade.duration_sec / 60)}m ${trade.duration_sec % 60}s`
    : '—'

  const handleDownload = async () => {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      // Yüksek DPI export — sosyal medyada keskin görünsün
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2.5,
        backgroundColor: '#0a0a0c',
        cacheBust: true,
        // Avoid CORS issues on external images by skipping them in clone
        skipFonts: false,
      })
      const a = document.createElement('a')
      const dt = entryRaw ? formatET(entryRaw, 'yyyyMMdd-HHmm') : 'trade'
      a.download = `qt-${(trade.symbol ?? 'trade').toLowerCase()}-${dt}.png`
      a.href = dataUrl
      a.click()
      toast.success('Trade card downloaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-xl max-h-screen sm:max-h-[92vh] overflow-y-auto sm:rounded-2xl shadow-2xl"
      >
        {/* ─── Sticky toolbar (download bar üstünde toggles) ─── */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-[#16161a] border-b border-white/10 sm:rounded-t-2xl">
          <div className="flex items-center gap-1">
            <ToolbarToggle
              active={!hidePnl}
              icon={hidePnl ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              label="PnL"
              onClick={() => setHidePnl(h => !h)}
            />
            <ToolbarToggle
              active={!hideNotes}
              icon={hideNotes ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              label={S.journal.notes}
              onClick={() => setHideNotes(h => !h)}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-60 transition"
            >
              {downloading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Download className="h-3.5 w-3.5" />}
              Download PNG
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ─── Trade Card (downloadable area) ─── */}
        <div
          ref={cardRef}
          className="relative bg-gradient-to-br from-[#0a0a0c] via-[#101013] to-[#16161a] text-white"
        >
          {/* Brand header — always visible in download */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-white/10 bg-gradient-to-r from-white/[0.02] via-transparent to-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md text-white shadow-sm font-bold text-xs"
                style={{ background: 'linear-gradient(135deg, #415dff 0%, #8a9eff 100%)' }}
              >
                Q
              </div>
              <div>
                <p className="text-xs font-bold tracking-tight text-white">Quarterly Journal</p>
                <p className="text-[10px] text-slate-400 font-mono tracking-wider">quarterlyjournal.org</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PairBadge symbol={trade.symbol} />
              <OutcomeBadge outcome={trade.outcome} />
              {trade.direction && (
                <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.06] border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-200">
                  {trade.direction === 'long'
                    ? <TrendingUp className="h-3 w-3" />
                    : <TrendingDown className="h-3 w-3" />}
                  {trade.direction}
                </span>
              )}
            </div>
          </div>

          {/* Hero KPIs */}
          <div className="grid grid-cols-3 gap-px bg-white/5">
            <Kpi label="P&L" valueClass={pnlColor}>
              {pnl === null ? '—' : hidePnl
                ? <span className="text-slate-500 tracking-widest">••••</span>
                : `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`}
            </Kpi>
            <Kpi label="R Multiple">
              {trade.r_multiple != null ? `${trade.r_multiple}R` : '—'}
            </Kpi>
            <Kpi label="Duration" icon={<Clock className="h-3 w-3" />}>
              {durationStr}
            </Kpi>
          </div>

          {/* Timing strip */}
          <div className="grid grid-cols-2 gap-px bg-white/5">
            <Cell>
              <CellLabel icon={<Calendar className="h-3 w-3" />}>Date (ET)</CellLabel>
              <p className="mt-1 text-sm font-medium text-white">
                {entryRaw ? formatET(entryRaw, 'MMM d, yyyy HH:mm') : '—'}
              </p>
            </Cell>
            <Cell>
              <CellLabel icon={<Activity className="h-3 w-3" />}>Session</CellLabel>
              <div className="mt-1.5"><SessionBadge session={trade.session} /></div>
            </Cell>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
            <SmallMetric label="Qty"         value={trade.qty ?? '—'} />
            <SmallMetric label="Entry"       value={trade.entry_price ?? '—'} />
            <SmallMetric label="Exit"        value={trade.exit_price ?? '—'} />
            <SmallMetric label="Session Q"   value={trade.session_quarter ?? '—'} />
            <SmallMetric label="Micro Q 90m" value={trade.micro_quarter_90m ?? '—'} />
            <SmallMetric label="Year Q"      value={trade.year_quarter ?? '—'} />
            <SmallMetric label="Month Q"     value={trade.month_quarter ?? '—'} />
            <SmallMetric label="Day"         value={trade.day_of_week != null ? dayName(trade.day_of_week) : '—'} />
          </div>

          {/* Confluences */}
          {trade.trade_confirmations?.length > 0 && (
            <Section title="Entries">
              <ConfirmationChips confirmations={trade.trade_confirmations} />
            </Section>
          )}

          {/* Mistakes */}
          {trade.trade_mistakes?.length > 0 && (
            <Section title="Mistakes">
              <div className="flex flex-wrap gap-1.5">
                {trade.trade_mistakes.map(m => (
                  <span
                    key={m.id}
                    className="inline-flex items-center rounded-md border border-rose-400/30 bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-300"
                  >
                    {m.mistake_type}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Notes */}
          {trade.notes && !hideNotes && (
            <Section title={S.journal.notes}>
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {trade.notes}
              </p>
            </Section>
          )}

          {/* Footer watermark — extra branding for download */}
          <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between text-[10px] tracking-wider">
            <span className="font-mono text-slate-500">
              {entryRaw ? formatET(entryRaw, 'yyyy-MM-dd HH:mm \'ET\'') : ''}
            </span>
            <span className="font-semibold text-slate-300">
              quarterlyjournal.org
            </span>
          </div>
        </div>

        {/* Chart link — separated from card (not in download) */}
        {sanitizeUrl(trade.chart_link) && (
          <div className="px-4 sm:px-6 py-3 bg-[#16161a] border-t border-white/10 sm:rounded-b-2xl">
            <a
              href={sanitizeUrl(trade.chart_link) ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8a9eff] hover:underline"
            >
              {S.journal.chart} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────── */

function ToolbarToggle({ active, icon, label, onClick }: {
  active: boolean; icon: React.ReactNode; label: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
        active
          ? 'text-slate-300 hover:bg-white/5 hover:text-white'
          : 'bg-white/[0.06] text-slate-500 hover:bg-white/[0.1]'
      }`}
    >
      {icon} {label}
    </button>
  )
}

function Kpi({ label, children, valueClass = 'text-white', icon }: {
  label: string; children: React.ReactNode; valueClass?: string; icon?: React.ReactNode
}) {
  return (
    <div className="bg-[#0d0d10] px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1">
        {icon}{label}
      </p>
      <p className={`mt-1 text-xl sm:text-2xl font-bold font-mono truncate ${valueClass}`}>
        {children}
      </p>
    </div>
  )
}

function Cell({ children }: { children: React.ReactNode }) {
  return <div className="bg-[#0d0d10] px-4 py-3">{children}</div>
}

function CellLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1">
      {icon}{children}
    </p>
  )
}

function SmallMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-[#0d0d10] px-3 py-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-mono text-white truncate">{value}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-4 border-t border-white/5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
        {title}
      </p>
      {children}
    </div>
  )
}

function dayName(d: number): string {
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d] ?? '—'
}

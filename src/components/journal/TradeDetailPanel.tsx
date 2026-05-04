import { useEffect, useRef, useState } from 'react'
import { X, ExternalLink, Clock, Calendar, TrendingUp, TrendingDown, Activity, Eye, EyeOff, Download, Loader2 } from 'lucide-react'
import { toPng } from 'html-to-image'
import { toast } from 'sonner'
import { formatET } from '@/lib/formatET'
import { sanitizeUrl } from '@/lib/security/url'
import { ConfirmationChips } from './ConfirmationChips'
import { useS } from '@/lib/i18n'
import { useThemeStore } from '@/stores/useThemeStore'
import { SESSION_LABELS } from '@/lib/constants/colors'
import type { Outcome, TradeWithRelations } from '@/types'

interface Props {
  trade: TradeWithRelations | null
  open:  boolean
  onClose: () => void
}

export function TradeDetailPanel({ trade, open, onClose }: Props) {
  const S = useS()
  const theme = useThemeStore(s => s.theme)
  const isDark = theme === 'dark'
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

  useEffect(() => {
    if (open) { setHidePnl(false); setHideNotes(false) }
  }, [open, trade?.id])

  if (!open || !trade) return null

  const entryRaw = trade.entry_time_et ?? null
  const pnl = trade.pnl_usd
  const pnlPositive = pnl !== null && pnl > 0
  const pnlNegative = pnl !== null && pnl < 0

  const durationStr = trade.duration_sec != null
    ? `${Math.floor(trade.duration_sec / 60)}m ${trade.duration_sec % 60}s`
    : '—'

  const handleDownload = async () => {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2.5,
        backgroundColor: isDark ? '#0a0a0c' : '#ffffff',
        cacheBust: true,
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

  // Theme-aware tokens
  const t = isDark
    ? {
        cardBg:        'bg-gradient-to-br from-[#0e0e11] via-[#0a0a0c] to-[#0e0e11]',
        cardBorder:    'border border-white/[0.06]',
        accent:        'bg-white/[0.03]',
        divider:       'border-white/[0.06]',
        kpiBg:         'bg-white/[0.02]',
        cellBg:        'bg-white/[0.015]',
        labelText:     'text-slate-500',
        valueText:     'text-white',
        subtleText:    'text-slate-400',
        toolbar:       'bg-[#101013] border-white/10',
        toolbarBtn:    'text-slate-400 hover:text-white hover:bg-white/5',
        toolbarBtnDim: 'bg-white/[0.04] text-slate-500 hover:bg-white/[0.08]',
        downloadBtn:   'bg-white text-slate-900 hover:bg-slate-100',
        closeBtn:      'text-slate-400 hover:text-white hover:bg-white/10',
        pnlPos:        'text-emerald-400',
        pnlNeg:        'text-rose-400',
        pnlZero:       'text-slate-400',
        pnlMask:       'text-slate-600',
        chartLink:     'text-[#8a9eff]',
        rosePill:      'border-rose-400/30 bg-rose-500/10 text-rose-300',
        footerText:    'text-slate-500',
      }
    : {
        cardBg:        'bg-gradient-to-br from-white via-slate-50 to-white',
        cardBorder:    'border border-slate-200/70',
        accent:        'bg-slate-50',
        divider:       'border-slate-100',
        kpiBg:         'bg-white',
        cellBg:        'bg-white',
        labelText:     'text-slate-500',
        valueText:     'text-slate-900',
        subtleText:    'text-slate-600',
        toolbar:       'bg-slate-50 border-slate-200',
        toolbarBtn:    'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50',
        toolbarBtnDim: 'bg-slate-200/50 text-slate-400 hover:bg-slate-200',
        downloadBtn:   'bg-slate-900 text-white hover:bg-slate-800',
        closeBtn:      'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
        pnlPos:        'text-emerald-600',
        pnlNeg:        'text-rose-600',
        pnlZero:       'text-slate-500',
        pnlMask:       'text-slate-400',
        chartLink:     'text-[#415dff]',
        rosePill:      'border-rose-200 bg-rose-50 text-rose-700',
        footerText:    'text-slate-400',
      }

  const pnlColor =
    pnl === null ? t.pnlZero : pnlPositive ? t.pnlPos : pnlNegative ? t.pnlNeg : t.pnlZero

  // Subtle accent gradient stripe based on outcome
  const accentBar =
    pnlPositive ? 'from-emerald-500 via-emerald-400 to-transparent'
    : pnlNegative ? 'from-rose-500 via-rose-400 to-transparent'
    : 'from-slate-400 via-slate-300 to-transparent'

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/60 backdrop-blur-md sm:p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-xl max-h-screen sm:max-h-[92vh] overflow-y-auto sm:rounded-3xl shadow-2xl"
      >
        {/* ─── Toolbar (downloaded alana DAHİL DEĞİL) ─── */}
        <div className={`sticky top-0 z-20 flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 ${t.toolbar} border-b sm:rounded-t-3xl`}>
          <div className="flex items-center gap-1">
            <ToolbarToggle
              active={!hidePnl}
              icon={hidePnl ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              label="PnL"
              onClick={() => setHidePnl(h => !h)}
              activeCls={t.toolbarBtn}
              inactiveCls={t.toolbarBtnDim}
            />
            <ToolbarToggle
              active={!hideNotes}
              icon={hideNotes ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              label={S.journal.notes}
              onClick={() => setHideNotes(h => !h)}
              activeCls={t.toolbarBtn}
              inactiveCls={t.toolbarBtnDim}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold disabled:opacity-60 transition ${t.downloadBtn}`}
            >
              {downloading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Download className="h-3.5 w-3.5" />}
              Download PNG
            </button>
            <button
              onClick={onClose}
              className={`rounded-md p-1.5 transition-colors ${t.closeBtn}`}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ─── Trade Card (downloadable area) ─── */}
        <div ref={cardRef} className={`relative ${t.cardBg} ${t.valueText}`}>

          {/* Top accent bar — outcome rengi */}
          <div className={`h-1 w-full bg-gradient-to-r ${accentBar}`} />

          {/* Brand header — logo sol, outcome pill sağ */}
          <div className={`flex items-center justify-between gap-3 px-6 pt-6 pb-5 border-b ${t.divider}`}>
            <img
              src="/qt-full.png"
              alt="Quarterly Journal"
              className="h-14 w-auto object-contain"
              crossOrigin="anonymous"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
            <OutcomePill outcome={trade.outcome} isDark={isDark} />
          </div>

          {/* HERO — PnL */}
          <div className="px-6 py-6 text-center">
            <p className={`text-[10px] font-semibold uppercase tracking-[0.25em] ${t.labelText}`}>
              Profit / Loss
            </p>
            <p
              className={`mt-2 text-3xl sm:text-4xl font-bold font-mono tracking-tight inline-block ${pnlColor} ${
                hidePnl && pnl !== null ? 'blur-sm select-none' : ''
              }`}
            >
              {pnl === null
                ? '—'
                : `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`}
            </p>
            {trade.r_multiple != null && !hidePnl && (
              <p className={`mt-2 text-sm font-mono ${t.subtleText}`}>
                {trade.r_multiple > 0 ? '+' : ''}{trade.r_multiple}R
              </p>
            )}
          </div>

          {/* Pair / Direction / Session */}
          <div className={`grid grid-cols-3 border-y divide-x ${t.divider}`}>
            <Cell theme={t}>
              <CellLabel theme={t}>Pair</CellLabel>
              <p className={`mt-1 text-sm font-semibold font-mono ${t.valueText}`}>
                {trade.symbol ?? '—'}
              </p>
            </Cell>
            <Cell theme={t}>
              <CellLabel theme={t}>Direction</CellLabel>
              <p className={`mt-1 text-sm font-medium uppercase tracking-wide flex items-center justify-center gap-1 ${t.valueText}`}>
                {trade.direction === 'long' && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
                {trade.direction === 'short' && <TrendingDown className="h-3.5 w-3.5 text-rose-500" />}
                {trade.direction ?? '—'}
              </p>
            </Cell>
            <Cell theme={t}>
              <CellLabel theme={t}>Session</CellLabel>
              <p className={`mt-1 text-sm font-medium ${t.valueText}`}>
                {trade.session ? SESSION_LABELS[trade.session] : '—'}
              </p>
            </Cell>
          </div>

          {/* Date / Time / Duration row */}
          <div className={`grid grid-cols-3 border-b divide-x ${t.divider}`}>
            <Cell theme={t}>
              <CellLabel theme={t} icon={<Calendar className="h-3 w-3" />}>Date</CellLabel>
              <p className={`mt-1 text-sm font-medium ${t.valueText}`}>
                {entryRaw ? formatET(entryRaw, 'MMM d, yyyy') : '—'}
              </p>
            </Cell>
            <Cell theme={t}>
              <CellLabel theme={t} icon={<Clock className="h-3 w-3" />}>Time (ET)</CellLabel>
              <p className={`mt-1 text-sm font-medium font-mono ${t.valueText}`}>
                {entryRaw ? formatET(entryRaw, 'HH:mm') : '—'}
              </p>
            </Cell>
            <Cell theme={t}>
              <CellLabel theme={t} icon={<Activity className="h-3 w-3" />}>Duration</CellLabel>
              <p className={`mt-1 text-sm font-medium font-mono ${t.valueText}`}>
                {durationStr}
              </p>
            </Cell>
          </div>

          {/* Qty / Entry / Exit */}
          <div className={`grid grid-cols-3 border-b divide-x ${t.divider}`}>
            <Cell theme={t}>
              <CellLabel theme={t}>Qty</CellLabel>
              <p className={`mt-1 text-sm font-mono ${t.valueText}`}>{trade.qty ?? '—'}</p>
            </Cell>
            <Cell theme={t}>
              <CellLabel theme={t}>Entry</CellLabel>
              <p className={`mt-1 text-sm font-mono ${t.valueText}`}>{trade.entry_price ?? '—'}</p>
            </Cell>
            <Cell theme={t}>
              <CellLabel theme={t}>Exit</CellLabel>
              <p className={`mt-1 text-sm font-mono ${t.valueText}`}>{trade.exit_price ?? '—'}</p>
            </Cell>
          </div>

          {/* Confluences */}
          {trade.trade_confirmations?.length > 0 && (
            <Section theme={t} title="Entries">
              <ConfirmationChips confirmations={trade.trade_confirmations} size="md" />
            </Section>
          )}

          {/* Mistakes */}
          {trade.trade_mistakes?.length > 0 && (
            <Section theme={t} title="Mistakes">
              <div className="flex flex-wrap gap-1.5 justify-center">
                {trade.trade_mistakes.map(m => (
                  <span
                    key={m.id}
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${t.rosePill}`}
                  >
                    {m.mistake_type}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Notes */}
          {trade.notes && !hideNotes && (
            <Section theme={t} title={S.journal.notes}>
              <p className={`text-sm whitespace-pre-wrap leading-relaxed ${t.subtleText}`}>
                {trade.notes}
              </p>
            </Section>
          )}

          {/* Footer — sadece domain */}
          <div className={`px-6 py-4 border-t ${t.divider} flex items-center justify-center`}>
            <span className={`text-xs font-semibold tracking-wider ${t.footerText}`}>
              quarterlyjournal.org
            </span>
          </div>
        </div>

        {/* Chart link — kart dışında */}
        {sanitizeUrl(trade.chart_link) && (
          <div className={`px-4 sm:px-6 py-3 border-t ${t.toolbar} sm:rounded-b-3xl`}>
            <a
              href={sanitizeUrl(trade.chart_link) ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 text-xs font-medium hover:underline ${t.chartLink}`}
            >
              {S.journal.chart} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Sub-components ───────────────────────────────────────── */

interface ThemeTokens {
  labelText: string
  valueText: string
  subtleText: string
  divider: string
  cellBg: string
  rosePill: string
  footerText: string
}

function ToolbarToggle({ active, icon, label, onClick, activeCls, inactiveCls }: {
  active: boolean; icon: React.ReactNode; label: string; onClick: () => void
  activeCls: string; inactiveCls: string
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
        active ? activeCls : inactiveCls
      }`}
    >
      {icon} {label}
    </button>
  )
}

function Cell({ children, theme }: { children: React.ReactNode; theme: ThemeTokens }) {
  return (
    <div className={`px-4 py-3 text-center ${theme.cellBg}`}>
      {children}
    </div>
  )
}

function CellLabel({ icon, children, theme }: { icon?: React.ReactNode; children: React.ReactNode; theme: ThemeTokens }) {
  return (
    <p className={`text-[10px] font-semibold uppercase tracking-widest flex items-center justify-center gap-1 ${theme.labelText}`}>
      {icon}{children}
    </p>
  )
}

function Section({ title, children, theme }: { title: string; children: React.ReactNode; theme: ThemeTokens }) {
  return (
    <div className={`px-6 py-4 border-t text-center ${theme.divider}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${theme.labelText}`}>
        {title}
      </p>
      {children}
    </div>
  )
}

const OUTCOME_LABEL: Record<Outcome, string> = {
  win:       'WIN',
  loss:      'STOP',
  breakeven: 'B/E',
}

function OutcomePill({ outcome, isDark }: { outcome: Outcome | null; isDark: boolean }) {
  if (!outcome) {
    return (
      <span className={`inline-flex items-center rounded-full px-3.5 py-1 text-xs font-bold tracking-widest ${
        isDark ? 'bg-white/[0.04] text-slate-500 border border-white/10' : 'bg-slate-100 text-slate-500 border border-slate-200'
      }`}>—</span>
    )
  }
  const tone =
    outcome === 'win'
      ? (isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
      : outcome === 'loss'
        ? (isDark ? 'bg-rose-500/15 text-rose-300 border-rose-400/30' : 'bg-rose-50 text-rose-700 border-rose-200')
        : (isDark ? 'bg-amber-500/15 text-amber-300 border-amber-400/30' : 'bg-amber-50 text-amber-700 border-amber-200')
  return (
    <span className={`inline-flex items-center rounded-full border px-3.5 py-1 text-xs font-bold tracking-[0.2em] ${tone}`}>
      {OUTCOME_LABEL[outcome]}
    </span>
  )
}

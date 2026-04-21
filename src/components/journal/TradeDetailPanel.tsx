import { format } from 'date-fns'
import { ExternalLink } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PairBadge } from './PairBadge'
import { OutcomeBadge } from './OutcomeBadge'
import { SessionBadge } from './SessionBadge'
import { ConfirmationChips } from './ConfirmationChips'
import { OUTCOME_COLORS } from '@/lib/constants/colors'
import type { TradeWithRelations } from '@/types'

interface Props {
  trade: TradeWithRelations | null
  open: boolean
  onClose: () => void
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 dark:border-white/5 last:border-0">
      <span className="text-xs text-gray-500 dark:text-[#9ca3af] shrink-0 w-32">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white text-right">{children}</span>
    </div>
  )
}

export function TradeDetailPanel({ trade, open, onClose }: Props) {
  if (!trade) return null

  const entryTime = trade.entry_time_et ? new Date(trade.entry_time_et) : null
  const exitTime  = trade.exit_time_et  ? new Date(trade.exit_time_et)  : null

  const pnlColor = trade.outcome
    ? OUTCOME_COLORS[trade.outcome]
    : '#9ca3af'

  const durationStr = trade.duration_sec != null
    ? `${Math.floor(trade.duration_sec / 60)}m ${trade.duration_sec % 60}s`
    : '—'

  return (
    <Sheet open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-[400px] bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 overflow-y-auto"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2 text-white">
            <PairBadge symbol={trade.symbol} />
            <OutcomeBadge outcome={trade.outcome} />
            {!trade.is_complete && (
              <span className="text-xs text-yellow-400">⚠ Eksik</span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-0">
          <Row label="Yön">{trade.direction ?? '—'}</Row>
          <Row label="Adet">{trade.qty ?? '—'}</Row>
          <Row label="Giriş Fiyatı">{trade.entry_price ?? '—'}</Row>
          <Row label="Çıkış Fiyatı">{trade.exit_price ?? '—'}</Row>
          <Row label="P&L">
            <span style={{ color: pnlColor }}>
              {trade.pnl_usd != null
                ? `${trade.pnl_usd >= 0 ? '+' : ''}$${trade.pnl_usd.toFixed(2)}`
                : '—'}
            </span>
          </Row>
          <Row label="R Multiple">
            {trade.r_multiple != null ? `${trade.r_multiple}R` : '—'}
          </Row>
          <Row label="Süre">{durationStr}</Row>
          <Row label="Giriş (ET)">
            {entryTime ? format(entryTime, 'MMM d, yyyy HH:mm') : '—'}
          </Row>
          <Row label="Çıkış (ET)">
            {exitTime ? format(exitTime, 'HH:mm') : '—'}
          </Row>
          <Row label="Session"><SessionBadge session={trade.session} /></Row>
          <Row label="Session Quarter">{trade.session_quarter ?? '—'}</Row>
          <Row label="Micro Quarter">{trade.micro_quarter_90m ?? '—'}</Row>
          <Row label="Yıl Çeyreği">{trade.year_quarter ?? '—'}</Row>
          <Row label="Ay Çeyreği">{trade.month_quarter ?? '—'}</Row>
          <Row label="Kaynak">
            {trade.source === 'csv' ? '📥 CSV' : '✏️ Manuel'}
          </Row>
        </div>

        {trade.trade_confirmations?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 dark:text-[#9ca3af] mb-2">Konfirmasyonlar</p>
            <ConfirmationChips confirmations={trade.trade_confirmations} />
          </div>
        )}

        {trade.trade_mistakes?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 dark:text-[#9ca3af] mb-2">Hatalar</p>
            <div className="flex flex-wrap gap-1">
              {trade.trade_mistakes.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center rounded-md bg-red-500/20 px-2 py-0.5 text-xs text-red-400"
                >
                  {m.mistake_type}
                </span>
              ))}
            </div>
          </div>
        )}

        {trade.chart_link && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 dark:text-[#9ca3af] mb-2">Chart</p>
            <a
              href={trade.chart_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-400 hover:underline"
            >
              TradingView <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {trade.notes && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 dark:text-[#9ca3af] mb-2">Notlar</p>
            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{trade.notes}</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

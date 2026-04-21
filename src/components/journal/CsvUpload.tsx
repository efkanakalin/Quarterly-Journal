import { useRef, useState } from 'react'
import { Upload, Info } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { parseCsvFile } from '@/lib/csv/parser'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTradesStore } from '@/stores/useTradesStore'
import { useS } from '@/lib/i18n'
import type { ImportResult, TradeWithRelations } from '@/types'

interface Props { compact?: boolean }

export function CsvUpload({ compact = false }: Props) {
  const [loading, setLoading] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const user = useAuthStore(s => s.user)
  const addTrade = useTradesStore(s => s.addTrade)
  const S = useS()

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error(S.journal.wrongCsvError)
      return
    }
    if (!user) return

    setLoading(true)
    try {
      const parsed = await parseCsvFile(file)
      const result = await importTrades(parsed, user.id, addTrade)
      toast.success(`${result.imported} trades imported`, {
        description: result.skipped > 0 ? `${result.skipped} duplicates skipped` : undefined,
      })
    } catch (err) {
      console.error(err)
      const msg = err instanceof Error ? err.message : String(err)
      // Eksik sütunlar hatası → Performance.csv uyarısı
      const isWrongFile = msg.includes('Eksik sütunlar') || msg.includes('missing')
      toast.error(
        isWrongFile ? S.journal.wrongCsvError : 'CSV parse error',
        { description: isWrongFile ? undefined : msg }
      )
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  if (compact) {
    return (
      <div className="relative">
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        <button
          onClick={() => !loading && inputRef.current?.click()}
          disabled={loading}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-3 py-2 text-xs font-medium text-gray-600 dark:text-[#9ca3af] hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          {loading ? '...' : S.journal.importCsv}
          <Info className="h-3 w-3 text-gray-400" />
        </button>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute top-full right-0 mt-2 w-72 z-50 rounded-lg bg-gray-900 dark:bg-[#0a0a0a] border border-gray-700 dark:border-white/10 px-3 py-2.5 shadow-xl">
            <p className="text-xs text-white leading-relaxed">{S.journal.importCsvTooltip}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      onClick={() => !loading && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault() }}
      onDrop={onDrop}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-colors border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5 ${loading ? 'pointer-events-none opacity-50' : ''}`}
    >
      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      <Upload className="h-6 w-6 text-gray-400 dark:text-[#9ca3af]" />
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-white">{loading ? 'Importing...' : S.journal.importCsv}</p>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-[#9ca3af]">Tradovate Performance.csv — drag & drop or click</p>
      </div>
    </div>
  )
}

async function importTrades(
  parsed: ReturnType<typeof parseCsvFile> extends Promise<infer T> ? T : never,
  userId: string,
  addTrade: (trade: TradeWithRelations) => void,
): Promise<ImportResult> {
  let imported = 0; let skipped = 0
  for (const trade of parsed) {
    const { data, error } = await supabase.from('trades').insert({ ...trade, user_id: userId }).select().single()
    if (error) { if (error.code === '23505') skipped++; else console.error(error); continue }
    if (data) { addTrade({ ...data, trade_confirmations: [], trade_mistakes: [] } as TradeWithRelations); imported++ }
  }
  return { imported, skipped }
}

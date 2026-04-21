import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { parseCsvFile } from '@/lib/csv/parser'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTradesStore } from '@/stores/useTradesStore'
import { useS } from '@/lib/i18n'
import type { ImportResult, TradeWithRelations } from '@/types'

interface Props {
  compact?: boolean
}

export function CsvUpload({ compact = false }: Props) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const user = useAuthStore(s => s.user)
  const addTrade = useTradesStore(s => s.addTrade)
  const S = useS()

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Only .csv files are supported.')
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
      toast.error('CSV parse error', { description: msg })
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  // Kompakt mod: sağ üstte küçük buton (Madde 7)
  if (compact) {
    return (
      <>
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        <button
          onClick={() => !loading && inputRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-3 py-2 text-xs font-medium text-gray-600 dark:text-[#9ca3af] hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          {loading ? '...' : S.journal.importCsv}
        </button>
      </>
    )
  }

  // Normal mod: drag-drop alan
  return (
    <div className="space-y-2">
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={[
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-colors',
          dragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5',
          loading ? 'pointer-events-none opacity-50' : '',
        ].join(' ')}
      >
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        <Upload className="h-6 w-6 text-gray-400 dark:text-[#9ca3af]" />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-white">
            {loading ? 'Importing...' : S.journal.importCsv}
          </p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-[#9ca3af]">
            Tradovate Performance.csv — drag & drop or click
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-400 dark:text-[#9ca3af] px-1">{S.journal.tzInfo}</p>
    </div>
  )
}

async function importTrades(
  parsed: ReturnType<typeof parseCsvFile> extends Promise<infer T> ? T : never,
  userId: string,
  addTrade: (trade: TradeWithRelations) => void,
): Promise<ImportResult> {
  let imported = 0
  let skipped = 0
  for (const trade of parsed) {
    const { data, error } = await supabase.from('trades').insert({ ...trade, user_id: userId }).select().single()
    if (error) { if (error.code === '23505') skipped++; else console.error(error); continue }
    if (data) { addTrade({ ...data, trade_confirmations: [], trade_mistakes: [] } as TradeWithRelations); imported++ }
  }
  return { imported, skipped }
}

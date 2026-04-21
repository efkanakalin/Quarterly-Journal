import { useRef, useState } from 'react'
import { Upload, Info } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { parseCsvFile } from '@/lib/csv/parser'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTradesStore } from '@/stores/useTradesStore'
import { S } from '@/lib/constants/strings'
import type { ImportResult, TradeWithRelations } from '@/types'

export function CsvUpload() {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const user = useAuthStore(s => s.user)
  const addTrade = useTradesStore(s => s.addTrade)

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Sadece .csv dosyası yükleyebilirsiniz.')
      return
    }
    if (!user) return

    setLoading(true)
    try {
      const parsed = await parseCsvFile(file)
      const result = await importTrades(parsed, user.id, addTrade)
      toast.success(`${result.imported} işlem içe aktarıldı`, {
        description: result.skipped > 0 ? `${result.skipped} tekrar atlandı` : undefined,
      })
    } catch (err) {
      console.error(err)
      const msg = err instanceof Error ? err.message : String(err)
      toast.error('CSV parse hatası', { description: msg })
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

  return (
    <div className="space-y-2">
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={[
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-colors',
          dragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
            : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5',
          loading ? 'pointer-events-none opacity-50' : '',
        ].join(' ')}
      >
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        <Upload className="h-6 w-6 text-gray-400 dark:text-[#9ca3af]" />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-white">
            {loading ? 'İçe aktarılıyor...' : S.journal.importCsv}
          </p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-[#9ca3af]">
            Tradovate Performance.csv — sürükle bırak veya tıkla
          </p>
        </div>
      </div>

      {/* CR-05: Timezone info */}
      <div className="flex items-start gap-2 px-1">
        <Info className="h-3.5 w-3.5 text-gray-400 dark:text-[#9ca3af] shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400 dark:text-[#9ca3af]">{S.journal.tzInfo}</p>
      </div>
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
    const { data, error } = await supabase
      .from('trades')
      .insert({ ...trade, user_id: userId })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') skipped++
      else console.error('Insert error:', error)
      continue
    }

    if (data) {
      addTrade({ ...data, trade_confirmations: [], trade_mistakes: [] } as TradeWithRelations)
      imported++
    }
  }

  return { imported, skipped }
}

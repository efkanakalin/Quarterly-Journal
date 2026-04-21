import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { parseCsvFile } from '@/lib/csv/parser'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTradesStore } from '@/stores/useTradesStore'
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
      toast.success(`${result.imported} trade import edildi`, {
        description: result.skipped > 0 ? `${result.skipped} duplikasyon atlandı` : undefined,
      })
    } catch (err) {
      console.error(err)
      toast.error('CSV parse edilirken hata oluştu.')
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

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div
      onClick={() => !loading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`
        flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors
        ${dragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}
        ${loading ? 'pointer-events-none opacity-50' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={onInputChange}
      />
      <Upload className="h-8 w-8 text-[#9ca3af]" />
      <div className="text-center">
        <p className="text-sm font-medium text-white">
          {loading ? 'Import ediliyor...' : 'CSV yükle'}
        </p>
        <p className="mt-1 text-xs text-[#9ca3af]">
          Tradovate Performance.csv — sürükle bırak veya tıkla
        </p>
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
      // Unique constraint violation = duplicate
      if (error.code === '23505') {
        skipped++
      } else {
        console.error('Insert error:', error)
      }
      continue
    }

    if (data) {
      addTrade({ ...data, trade_confirmations: [], trade_mistakes: [] } as TradeWithRelations)
      imported++
    }
  }

  return { imported, skipped }
}

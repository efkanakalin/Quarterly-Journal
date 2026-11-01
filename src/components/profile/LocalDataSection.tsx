import { useRef } from 'react'
import { toast } from 'sonner'
import { Download, HardDrive, Upload } from 'lucide-react'
import { exportLocalData, importLocalData } from '@/lib/localClient'
import { useTradesStore } from '@/stores/useTradesStore'

/**
 * Local mode keeps every trade in this browser. This card lets the user move
 * that data between browsers or keep a safety copy as a single JSON file.
 */
export function LocalDataSection() {
  const fileRef = useRef<HTMLInputElement>(null)
  const fetchTrades = useTradesStore(s => s.fetchTrades)

  const download = () => {
    const backup = exportLocalData()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quarterly-journal-backup-${backup.exportedAt.slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Backup downloaded.')
  }

  const restore = async (file: File) => {
    try {
      const count = importLocalData(JSON.parse(await file.text()))
      await fetchTrades()
      toast.success(`Restored ${count} trades.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not read this file.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center gap-2.5">
        <HardDrive className="h-4.5 w-4.5 text-[#415dff]" />
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Your data</h2>
          <p className="text-xs text-gray-500 dark:text-[#9ca3af]">
            Stored only in this browser — no account, no server. Download a backup to keep it safe.
          </p>
        </div>
      </div>
      <div className="px-4 sm:px-6 py-4 flex flex-wrap gap-2">
        <button
          onClick={download}
          className="inline-flex items-center gap-2 rounded-lg bg-[#415dff] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2f4ae6]"
        >
          <Download className="h-3.5 w-3.5" /> Download backup
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
        >
          <Upload className="h-3.5 w-3.5" /> Restore from file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) void restore(f) }}
        />
      </div>
    </div>
  )
}

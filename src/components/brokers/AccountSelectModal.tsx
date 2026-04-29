import { useState } from 'react'
import { useS } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { TradovateAccount } from '@/lib/brokers/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: TradovateAccount[]
  loading?: boolean
  onConfirm: (selected: TradovateAccount[]) => void
}

export function AccountSelectModal({ open, onOpenChange, accounts, loading, onConfirm }: Props) {
  const S = useS()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const submit = () => {
    const picked = accounts.filter(a => selected.has(String(a.id)))
    if (picked.length === 0) return
    onConfirm(picked)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{S.brokers.accountSelectTitle}</DialogTitle>
          <DialogDescription>{S.brokers.accountSelectHint}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {accounts.length === 0 && !loading && (
            <p className="text-sm text-gray-500 dark:text-[#9ca3af]">No accounts found.</p>
          )}
          {accounts.map(a => {
            const id = String(a.id)
            const checked = selected.has(id)
            const isDemo = (a.legalStatus ?? '').toLowerCase().includes('demo')
            return (
              <label
                key={id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                  checked
                    ? 'border-[#415dff] bg-[#415dff]/5 dark:border-[#8a9eff] dark:bg-[#415dff]/10'
                    : 'border-gray-200 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(id)}
                  className="h-4 w-4 rounded border-gray-300 text-[#415dff] focus:ring-[#415dff] dark:border-white/20 dark:bg-[#0f0f0f]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {a.nickname || a.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-[#9ca3af]">
                    {a.name}
                  </p>
                </div>
                {isDemo && (
                  <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-bold text-yellow-800 dark:bg-yellow-400/15 dark:text-yellow-300">
                    {S.brokers.badgeDemo}
                  </span>
                )}
              </label>
            )
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {S.brokers.cancelButton}
          </Button>
          <Button onClick={submit} disabled={selected.size === 0 || loading}>
            {S.brokers.connectButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

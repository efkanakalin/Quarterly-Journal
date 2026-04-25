import { useState, useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useS } from '@/lib/i18n'

interface Props {
  open: boolean
  onConfirm: (snoozeToday: boolean) => void
  onCancel: () => void
}

export function DeleteTradeDialog({ open, onConfirm, onCancel }: Props) {
  const S = useS()
  const [snooze, setSnooze] = useState(false)

  useEffect(() => { if (open) setSnooze(false) }, [open])

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900 dark:text-white">
            {S.journal.deleteTitle}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-500 dark:text-[#9ca3af]">
            {S.journal.deleteBody}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <label className="flex items-center gap-2 cursor-pointer select-none mt-1">
          <input
            type="checkbox"
            checked={snooze}
            onChange={e => setSnooze(e.target.checked)}
            className="h-4 w-4 rounded accent-red-500"
          />
          <span className="text-sm text-gray-700 dark:text-[#9ca3af]">
            {S.journal.deleteSnooze}
          </span>
        </label>

        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onCancel}
            className="bg-transparent border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
          >
            {S.journal.cancelButton}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(snooze)}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            {S.journal.deleteButton}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

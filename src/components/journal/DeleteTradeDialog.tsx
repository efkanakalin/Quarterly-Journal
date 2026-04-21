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

interface Props {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteTradeDialog({ open, onConfirm, onCancel }: Props) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="bg-[#1a1a1a] border-white/10 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Trade'i sil</AlertDialogTitle>
          <AlertDialogDescription className="text-[#9ca3af]">
            Bu trade kalıcı olarak silinecek. Bu işlem geri alınamaz.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onCancel}
            className="bg-transparent border-white/10 text-white hover:bg-white/10"
          >
            İptal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

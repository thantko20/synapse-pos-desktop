import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog"

interface ArchiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productName: string
  onConfirm: () => void
  isPending: boolean
}

export function ArchiveDialog({
  open,
  onOpenChange,
  productName,
  onConfirm,
  isPending,
}: ArchiveDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive Product</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to archive "{productName}"? It will be hidden
            from active product lists.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? "Archiving..." : "Archive"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

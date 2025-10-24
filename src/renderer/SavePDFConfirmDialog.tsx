"use client"

import { Button } from "../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog"
import { Save, X } from "lucide-react"

interface SavePDFConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  folderName?: string
  title?: string
  description?: string
}

export default function SavePDFConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  folderName,
  title = "Salvare PDF",
  description,
}: SavePDFConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const dialogDescription =
    description ||
    (folderName
      ? `Doriți să salvați documentul PDF în folderul ${folderName} de pe Desktop?`
      : "Doriți să salvați documentul PDF?")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="text-base pt-2">{dialogDescription}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button onClick={handleCancel} className="bg-red-600 hover:bg-red-700 text-white">
            <X className="mr-2 h-4 w-4" />
            Anulează
          </Button>
          <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 text-white">
            <Save className="mr-2 h-4 w-4" />
            Da
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

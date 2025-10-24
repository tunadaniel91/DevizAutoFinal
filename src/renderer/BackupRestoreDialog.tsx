"use client"

import { useState } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Save, Upload, CheckCircle, AlertCircle, Database } from "lucide-react"

interface BackupRestoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function BackupRestoreDialog({ open, onOpenChange }: BackupRestoreDialogProps) {
  const [activeTab, setActiveTab] = useState("backup")
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const handleBackup = async () => {
    setIsProcessing(true)
    setStatus({ type: null, message: "" })

    try {
      const result = await window.electronAPI.backupDatabase()
      if (result.success) {
        setStatus({
          type: "success",
          message: `Backup creat cu succes la: ${result.path}`,
        })
      } else {
        setStatus({
          type: "error",
          message: result.message || "A apărut o eroare la crearea backup-ului.",
        })
      }
    } catch (error) {
      console.error("Backup error:", error)
      setStatus({
        type: "error",
        message: "A apărut o eroare neașteptată la crearea backup-ului.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRestore = async () => {
    setIsProcessing(true)
    setStatus({ type: null, message: "" })

    try {
      const result = await window.electronAPI.restoreDatabase()
      if (result.success) {
        setStatus({
          type: "success",
          message: "Baza de date a fost restaurată cu succes. Aplicația va fi repornită.",
        })

        // Delay restart to show the success message
        setTimeout(() => {
          window.electronAPI.restartApp()
        }, 2000)
      } else {
        setStatus({
          type: "error",
          message: result.message || "A apărut o eroare la restaurarea bazei de date.",
        })
      }
    } catch (error) {
      console.error("Restore error:", error)
      setStatus({
        type: "error",
        message: "A apărut o eroare neașteptată la restaurarea bazei de date.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup și Restaurare
          </DialogTitle>
          <DialogDescription>
            Creați backup pentru datele dvs. sau restaurați dintr-un backup anterior.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="restore">Restaurare</TabsTrigger>
          </TabsList>

          <TabsContent value="backup" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Creați un backup</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Salvați toate datele dvs. într-un fișier de backup. Acest fișier poate fi folosit pentru a restaura
                  datele pe acest calculator sau pe altul.
                </p>
                <Button onClick={handleBackup} disabled={isProcessing} className="w-full bg-blue-600 hover:bg-blue-700">
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Se creează backup...
                    </div>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Creează backup
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="restore" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Restaurați din backup</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  <strong className="text-amber-600">Atenție:</strong> Restaurarea va înlocui toate datele curente cu
                  cele din fișierul de backup. Această acțiune nu poate fi anulată.
                </p>
                <Button onClick={handleRestore} disabled={isProcessing} variant="destructive" className="w-full">
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Se restaurează...
                    </div>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Restaurează din backup
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {status.type && (
          <div
            className={`mt-4 p-3 rounded-md flex items-start gap-2 ${
              status.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm">{status.message}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Key, AlertCircle, CheckCircle } from "lucide-react"

interface ActivationDialogProps {
  onActivationSuccess: () => void
}

export default function ActivationDialog({ onActivationSuccess }: ActivationDialogProps) {
  const [activationKey, setActivationKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleActivation = async () => {
    if (!activationKey.trim()) {
      setError("Vă rugăm să introduceți o cheie de activare")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      console.log("Sending activation key:", activationKey)
      const result = await window.electronAPI.activateApp(activationKey)
      console.log("Activation result:", result)

      if (result.success) {
        setSuccess(result.message)
        setTimeout(() => {
          onActivationSuccess()
        }, 1500)
      } else {
        setError(result.message)
      }
    } catch (error) {
      console.error("Activation error:", error)
      setError("A apărut o eroare în timpul activării. Vă rugăm să încercați din nou.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleActivation()
    }
  }

  const formatKey = (value: string) => {
    // Remove any non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Z0-9]/gi, "").toUpperCase()

    // Add hyphens every 5 characters
    const formatted = cleaned.match(/.{1,5}/g)?.join("-") || cleaned

    // Limit to the expected format length
    return formatted.substring(0, 29) // DEVIZ-K7X9P-LQ38D-AUTOO-MZ2RT = 29 chars
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatKey(e.target.value)
    setActivationKey(formatted)
    setError("")
    setSuccess("")
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Key className="h-6 w-6" />
            Activare Deviz Auto
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center text-gray-600 mb-6">
              <p>Vă rugăm să introduceți cheia de activare pentru a continua utilizarea aplicației.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activationKey" className="text-sm font-medium">
                Cheie de activare
              </Label>
              <Input
                id="activationKey"
                type="text"
                value={activationKey}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                className="text-center font-mono text-lg tracking-wider"
                disabled={isLoading}
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{success}</span>
              </div>
            )}

            <Button
              onClick={handleActivation}
              disabled={isLoading || !activationKey.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Se activează...
                </div>
              ) : (
                "Activează aplicația"
              )}
            </Button>

            <div className="text-xs text-gray-500 text-center mt-4">
              <p>Contactați suportul dacă aveți nevoie de asistență cu activarea.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

declare var global: typeof globalThis

if (typeof window !== "undefined") {
  window.global = window
}

declare global {
  interface Window {
    electronAPI: {
      getClosedReminders: () => Promise<string[]>
      addClosedReminder: (reminderId: string) => Promise<void>
      loadData: () => Promise<any>
      saveData: (data: any) => Promise<void>
      updateData: (entry: any) => Promise<void>
      deleteData: (numarInmatriculare: string, date: string) => Promise<void>
      saveEntries: (entries: any[]) => Promise<void>
      exportPDF: (data: any) => Promise<{ success: boolean; message: string }>
      exportLicensePlatePDF: (data: any) => Promise<{ success: boolean; message: string }>
      printPreview: (data: any) => Promise<{ success: boolean; message: string }>
      print: () => void
      initDatabase: () => Promise<void>
      checkActivation: () => Promise<boolean>
      activateApp: (key: string) => Promise<{ success: boolean; message: string }>
      // Adăugați aceste metode noi
      backupDatabase: () => Promise<{ success: boolean; path?: string; message?: string }>
      restoreDatabase: () => Promise<{ success: boolean; message: string }>
      restartApp: () => void
    }
  }
}

export {}

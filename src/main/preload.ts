// Adăugați aceste metode noi în obiectul expus
import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("electronAPI", {
  initDatabase: () => ipcRenderer.invoke("init-database"),
  loadData: () => ipcRenderer.invoke("load-data"),
  saveData: (entry: any) => ipcRenderer.invoke("save-data", entry),
  updateData: (entry: any) => ipcRenderer.invoke("update-data", entry),
  deleteData: (numarInmatriculare: string, date: string) => ipcRenderer.invoke("delete-data", numarInmatriculare, date),
  saveEntries: (entries: any[]) => ipcRenderer.invoke("save-entries", entries),
  exportPDF: (data: any) => ipcRenderer.invoke("export-pdf", data),
  printPreview: (data: any) => ipcRenderer.invoke("print-preview", data),
  getClosedReminders: () => ipcRenderer.invoke("getClosedReminders"),
  addClosedReminder: (reminderId: string) => ipcRenderer.invoke("addClosedReminder", reminderId),
  exportLicensePlatePDF: (data: any) => ipcRenderer.invoke("export-license-plate-pdf", data),
  checkActivation: () => ipcRenderer.invoke("check-activation"),
  activateApp: (key: string) => ipcRenderer.invoke("activate-app", key),
  // Adăugați aceste metode noi
  backupDatabase: () => ipcRenderer.invoke("backup-database"),
  restoreDatabase: () => ipcRenderer.invoke("restore-database"),
  restartApp: () => ipcRenderer.invoke("restart-app"),
})

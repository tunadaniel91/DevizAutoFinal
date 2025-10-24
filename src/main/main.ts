import { app, BrowserWindow, ipcMain, dialog } from "electron"
import path from "path"
import {
  initDatabase,
  saveEntry,
  getEntries,
  deleteEntry,
  saveEntries,
  getClosedReminders,
  addClosedReminder,
  checkActivationStatus,
  setActivationStatus,
  validateActivationKey,
  closeDatabase,
} from "./database"
import * as fs from "fs"
import { generateDevizPDF, generateIstoricDevizPDF } from "./pdf-generator-electron"
import { generateDevizHTML } from "./pdf-template-html"

// Adăugăm codul pentru single instance lock
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Cineva a încercat să pornească o a doua instanță
    // Aducem fereastra existentă în prim-plan
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  let mainWindow: BrowserWindow | null = null

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    })

    // Maximize the window
    mainWindow.maximize()

    if (process.env.NODE_ENV === "development") {
      mainWindow.loadURL("http://localhost:3000")
    } else {
      mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"))
    }

    mainWindow.on("closed", () => {
      mainWindow = null
    })

    // Eliminăm codul pentru verificarea reminder-urilor din main.ts
    // Funcție îmbunătățită pentru verificarea reminder-urilor
    function checkReminders() {
      try {
        const entries = getEntries()
        const closedReminders = getClosedReminders()
        const today = new Date()

        // Creează un Map pentru a ține evidența celui mai recent reminder pentru fiecare vehicul
        const latestReminders = new Map<string, { date: string; reminderDate: string; daysUntilReminder: number }>()

        // Găsește cel mai recent reminder pentru fiecare vehicul
        Object.entries(entries).forEach(([numarInmatriculare, entriesForPlate]) => {
          // Sortează intrările după dată (cea mai recentă prima) și filtrează doar cele cu reminder
          const sortedEntries = entriesForPlate
            .filter((entry) => entry.data.schimbUleiReminder)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

          if (sortedEntries.length > 0) {
            const latestEntry = sortedEntries[0]
            const reminderDate = new Date(latestEntry.data.schimbUleiReminder!)
            const timeDiff = reminderDate.getTime() - today.getTime()
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

            // Verifică dacă reminder-ul este în intervalul de 10 zile
            if (daysDiff <= 10 && daysDiff > 0) {
              latestReminders.set(numarInmatriculare, {
                date: latestEntry.date,
                reminderDate: latestEntry.data.schimbUleiReminder!,
                daysUntilReminder: daysDiff,
              })
            }
          }
        })

        // Afișează doar reminder-urile care nu sunt închise
        latestReminders.forEach((reminderInfo, numarInmatriculare) => {
          const reminderId = `${numarInmatriculare}-${reminderInfo.date}`

          if (!closedReminders.includes(reminderId)) {
            console.log("Sending latest oil change reminder:", {
              id: reminderId,
              numarInmatriculare,
              date: reminderInfo.date,
              daysUntilReminder: reminderInfo.daysUntilReminder,
              reminderDate: reminderInfo.reminderDate,
            })

            mainWindow?.webContents.send("show-reminder", {
              id: reminderId,
              numarInmatriculare,
              date: reminderInfo.date,
              daysUntilReminder: reminderInfo.daysUntilReminder,
            })
          }
        })
      } catch (error) {
        console.error("Error checking reminders:", error)
      }
    }

    mainWindow.webContents.on("did-finish-load", () => {
      checkReminders()
    })

    // Check reminders on app start and every 24 hours
    // checkReminders();
    // setInterval(checkReminders, 24 * 60 * 60 * 1000);
  }

  app.on("ready", () => {
    initDatabase()
    createWindow()
  })

  ipcMain.handle("getClosedReminders", async () => {
    try {
      return getClosedReminders()
    } catch (error) {
      console.error("Error getting closed reminders:", error)
      return []
    }
  })

  // Adăugați aceste handlere noi pentru backup și restaurare

  // Adăugați această funcție pentru a obține calea către baza de date
  function getDatabasePath() {
    return path.join(app.getPath("userData"), "database.sqlite")
  }

  // Handler îmbunătățit pentru backup
  ipcMain.handle("backup-database", async () => {
    try {
      const dbPath = getDatabasePath()

      // Verificați dacă baza de date există
      if (!fs.existsSync(dbPath)) {
        return { success: false, message: "Baza de date nu a fost găsită." }
      }

      // Forțează sincronizarea datelor înainte de backup
      try {
        // Asigură-te că toate tranzacțiile sunt finalizate
        const entries = getEntries()
        console.log(`Found ${Object.keys(entries).length} license plates in database before backup`)

        // Forțează un checkpoint WAL pentru a sincroniza toate datele
        const Database = require("better-sqlite3")
        const tempDb = new Database(dbPath)
        tempDb.pragma("wal_checkpoint(FULL)")
        tempDb.close()

        console.log("Database synchronized before backup")
      } catch (syncError) {
        console.error("Error synchronizing database before backup:", syncError)
        // Continuă cu backup-ul chiar dacă sincronizarea eșuează
      }

      // Deschideți dialogul pentru a alege locația de backup
      const { filePath } = await dialog.showSaveDialog({
        title: "Salvați backup-ul bazei de date",
        defaultPath: path.join(
          app.getPath("documents"),
          `deviz-auto-backup-${new Date().toISOString().split("T")[0]}.sqlite`,
        ),
        filters: [{ name: "SQLite Database", extensions: ["sqlite"] }],
      })

      if (!filePath) {
        return { success: false, message: "Operațiunea a fost anulată." }
      }

      // Verifică dimensiunea fișierului sursă
      const sourceStats = fs.statSync(dbPath)
      console.log(`Source database size: ${sourceStats.size} bytes`)

      if (sourceStats.size === 0) {
        return { success: false, message: "Baza de date sursă este goală." }
      }

      // Copiați fișierul bazei de date
      fs.copyFileSync(dbPath, filePath)

      // Verifică dimensiunea fișierului de backup
      const backupStats = fs.statSync(filePath)
      console.log(`Backup database size: ${backupStats.size} bytes`)

      if (backupStats.size === 0) {
        return { success: false, message: "Backup-ul creat este gol. Încercați din nou." }
      }

      // Verifică integritatea backup-ului prin încărcarea datelor
      try {
        const Database = require("better-sqlite3")
        const testDb = new Database(filePath, { readonly: true })

        // Testează dacă putem citi datele din backup
        const entriesCount = testDb.prepare("SELECT COUNT(*) as count FROM entries").get()
        const lucrariCount = testDb.prepare("SELECT COUNT(*) as count FROM lucrari").get()

        testDb.close()

        console.log(`Backup verification: ${entriesCount.count} entries, ${lucrariCount.count} lucrari`)

        if (entriesCount.count === 0 && lucrariCount.count === 0) {
          return {
            success: false,
            message: "Backup-ul a fost creat dar pare să fie gol. Verificați dacă aveți date salvate în aplicație.",
          }
        }

        return {
          success: true,
          path: filePath,
          message: `Backup creat cu succes! Conține ${entriesCount.count} înregistrări.`,
        }
      } catch (verifyError) {
        console.error("Error verifying backup:", verifyError)
        return {
          success: false,
          message: "Backup-ul a fost creat dar nu poate fi verificat. Fișierul poate fi corupt.",
        }
      }
    } catch (error) {
      console.error("Error creating backup:", error)
      return {
        success: false,
        message: `Eroare la crearea backup-ului: ${error instanceof Error ? error.message : "Eroare necunoscută"}`,
      }
    }
  })

  ipcMain.handle("restore-database", async () => {
    try {
      // Deschideți dialogul pentru a alege fișierul de backup
      const { filePaths } = await dialog.showOpenDialog({
        title: "Selectați fișierul de backup",
        filters: [{ name: "SQLite Database", extensions: ["sqlite"] }],
        properties: ["openFile"],
      })

      if (!filePaths || filePaths.length === 0) {
        return { success: false, message: "Nu a fost selectat niciun fișier." }
      }

      const backupPath = filePaths[0]
      const dbPath = getDatabasePath()

      // Verificați dacă fișierul de backup există
      if (!fs.existsSync(backupPath)) {
        return { success: false, message: "Fișierul de backup nu a fost găsit." }
      }

      // Verifică dimensiunea fișierului de backup
      const backupStats = fs.statSync(backupPath)
      console.log(`Backup file size: ${backupStats.size} bytes`)

      if (backupStats.size === 0) {
        return { success: false, message: "Fișierul de backup este gol." }
      }

      // Verifică integritatea fișierului de backup înainte de restaurare
      try {
        const Database = require("better-sqlite3")
        const testDb = new Database(backupPath, { readonly: true })

        // Testează dacă putem citi datele din backup
        const entriesCount = testDb.prepare("SELECT COUNT(*) as count FROM entries").get()
        const lucrariCount = testDb.prepare("SELECT COUNT(*) as count FROM lucrari").get()

        testDb.close()

        console.log(`Backup contains: ${entriesCount.count} entries, ${lucrariCount.count} lucrari`)

        if (entriesCount.count === 0 && lucrariCount.count === 0) {
          return {
            success: false,
            message: "Fișierul de backup pare să fie gol (nu conține date).",
          }
        }
      } catch (verifyError) {
        console.error("Error verifying backup file:", verifyError)
        return {
          success: false,
          message: "Fișierul de backup nu poate fi citit sau este corupt.",
        }
      }

      // Închideți conexiunea la baza de date curentă
      try {
        closeDatabase()
        console.log("Current database connection closed")
      } catch (closeError) {
        console.error("Error closing current database:", closeError)
        // Continuă cu restaurarea chiar dacă închiderea eșuează
      }

      // Creați un backup al bazei de date curente înainte de a o înlocui
      const currentBackupPath = path.join(
        app.getPath("userData"),
        `database-backup-before-restore-${new Date().toISOString().replace(/:/g, "-")}.sqlite`,
      )

      if (fs.existsSync(dbPath)) {
        try {
          fs.copyFileSync(dbPath, currentBackupPath)
          console.log(`Current database backed up to: ${currentBackupPath}`)
        } catch (backupError) {
          console.error("Error backing up current database:", backupError)
          // Continuă cu restaurarea chiar dacă backup-ul curent eșuează
        }
      }

      // Înlocuiți baza de date
      fs.copyFileSync(backupPath, dbPath)

      // Verifică că restaurarea a reușit
      const restoredStats = fs.statSync(dbPath)
      console.log(`Restored database size: ${restoredStats.size} bytes`)

      // Reinițializează baza de date
      try {
        initDatabase()
        console.log("Database reinitialized after restore")
      } catch (initError) {
        console.error("Error reinitializing database after restore:", initError)
        return {
          success: false,
          message: "Restaurarea a eșuat la reinițializarea bazei de date.",
        }
      }

      return {
        success: true,
        message: "Baza de date a fost restaurată cu succes. Aplicația va fi repornită.",
      }
    } catch (error) {
      console.error("Error restoring database:", error)
      return {
        success: false,
        message: `Eroare la restaurarea bazei de date: ${error instanceof Error ? error.message : "Eroare necunoscută"}`,
      }
    }
  })

  // Adăugați un handler pentru repornirea aplicației
  ipcMain.handle("restart-app", () => {
    app.relaunch()
    app.exit()
  })

  ipcMain.handle("addClosedReminder", async (_, reminderId: string) => {
    try {
      addClosedReminder(reminderId)
    } catch (error) {
      console.error("Error adding closed reminder:", error)
    }
  })

  ipcMain.on("dismiss-reminder", (_event, _data) => {
    // Handle reminder dismissal if needed
  })

  ipcMain.handle("init-database", async () => {
    await initDatabase()
  })

  ipcMain.handle("save-entries", async (_, entries) => {
    try {
      await saveEntries(entries)
    } catch (error) {
      console.error("Error saving entries:", error)
      throw error
    }
  })

  ipcMain.handle("load-data", async () => {
    try {
      return await getEntries()
    } catch (error) {
      console.error("Error loading data:", error)
      throw error
    }
  })

  ipcMain.handle("save-data", async (_, entry) => {
    try {
      await saveEntry(entry)
    } catch (error) {
      console.error("Error saving data:", error)
      throw error
    }
  })

  ipcMain.handle("delete-data", async (_, numarInmatriculare, dataIntrareService) => {
    try {
      await deleteEntry(numarInmatriculare, dataIntrareService)
    } catch (error) {
      console.error("Error deleting data:", error)
      throw error
    }
  })

  ipcMain.handle("export-pdf", async (_event, data) => {
    try {
      const folderName = data.folderName || "Extreme Service"
      const desktopPath = app.getPath("desktop")
      const targetFolder = path.join(desktopPath, folderName)

      // Create folder if it doesn't exist
      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true })
      }

      // Formatează data pentru numele fișierului (YYYY-MM-DD)
      const formattedDate = data.date || new Date().toISOString().split("T")[0]
      const fileName = `deviz-auto-${data.numarInmatriculare}-${formattedDate}.pdf`
      const filePath = path.join(targetFolder, fileName)

      await generateDevizPDF(data, filePath)
      return { success: true, message: `PDF salvat cu succes în ${folderName}` }
    } catch (error) {
      console.error("Error exporting PDF:", error)
      return { success: false, message: "Eroare la exportul PDF: " + (error as Error).message }
    }
  })

  ipcMain.handle("export-license-plate-pdf", async (_event, data) => {
    try {
      const folderName = data.folderName || "Istoric Service"
      const desktopPath = app.getPath("desktop")
      const targetFolder = path.join(desktopPath, folderName)

      // Create folder if it doesn't exist
      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true })
      }

      const fileName = `istoric-deviz-${data.numarInmatriculare}.pdf`
      const filePath = path.join(targetFolder, fileName)

      await generateIstoricDevizPDF(data, filePath)
      return { success: true, message: `Istoric PDF salvat cu succes în ${folderName}` }
    } catch (error) {
      console.error("Error exporting license plate PDF:", error)
      return { success: false, message: "Eroare la exportul PDF: " + (error as Error).message }
    }
  })

  // Handler pentru printare
  ipcMain.on("print", () => {
    if (mainWindow) {
      mainWindow.webContents.print({}, (success, errorType) => {
        if (!success) {
          console.error("Print failed:", errorType)
        }
      })
    }
  })

  ipcMain.handle("print-preview", async (_event, data) => {
    try {
      const tempDir = app.getPath("temp")
      const tempPdfPath = path.join(tempDir, `deviz-preview-${Date.now()}.pdf`)

      // Create a hidden window to generate PDF
      let pdfWindow: BrowserWindow | null = new BrowserWindow({
        show: false,
        webPreferences: {
          offscreen: true,
        },
      })

      // Generate HTML content
      const htmlContent = generateDevizHTML(data)

      // Load HTML content
      await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

      // Wait for content to render
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Generate PDF
      const pdfData = await pdfWindow.webContents.printToPDF({
        pageSize: "A4",
        printBackground: true,
        margins: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
      })

      // Write PDF to temp file
      fs.writeFileSync(tempPdfPath, pdfData)

      // Close the PDF generation window
      if (pdfWindow && !pdfWindow.isDestroyed()) {
        pdfWindow.close()
        pdfWindow = null
      }

      // Create preview window with PDF viewer capabilities
      const previewWindow = new BrowserWindow({
        width: 900,
        height: 1200,
        title: "Print Preview - Deviz Auto",
        webPreferences: {
          plugins: true,
        },
      })

      // Load PDF in preview window using file:// protocol
      previewWindow.loadFile(tempPdfPath)

      // Clean up temp file when preview window is closed
      previewWindow.on("closed", () => {
        try {
          if (fs.existsSync(tempPdfPath)) {
            fs.unlinkSync(tempPdfPath)
          }
        } catch (error) {
          console.error("Error deleting temp PDF:", error)
        }
      })

      return { success: true, message: "Print preview opened" }
    } catch (error) {
      console.error("Error opening print preview:", error)
      return { success: false, message: "Error opening print preview: " + (error as Error).message }
    }
  })

  // Activation system handlers
  ipcMain.handle("check-activation", async () => {
    try {
      return checkActivationStatus()
    } catch (error) {
      console.error("Error checking activation:", error)
      return false
    }
  })

  // Improve the activate-app handler with better error handling and logging
  ipcMain.handle("activate-app", async (_, key: string) => {
    try {
      console.log("Received activation request with key:", key)

      const isValid = validateActivationKey(key)
      console.log("Key validation result:", isValid)

      if (isValid) {
        try {
          setActivationStatus(true)
          console.log("Activation status set successfully")
          return { success: true, message: "Aplicația a fost activată cu succes!" }
        } catch (error) {
          console.error("Error setting activation status:", error)
          return {
            success: false,
            message: "Eroare la salvarea stării de activare. Verificați permisiunile aplicației.",
          }
        }
      } else {
        return { success: false, message: "Cheie de activare invalidă. Vă rugăm să încercați din nou." }
      }
    } catch (error) {
      console.error("Error in activate-app handler:", error)
      return {
        success: false,
        message: `A apărut o eroare în timpul activării: ${error instanceof Error ? error.message : "Eroare necunoscută"}`,
      }
    }
  })

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      // Închide baza de date înainte de a ieși din aplicație
      try {
        console.log("[v0] Closing database before app quit")
        closeDatabase()
      } catch (error) {
        console.error("Error closing database on app exit:", error)
      }
      app.quit()
    }
  })

  app.on("before-quit", () => {
    try {
      console.log("[v0] App is quitting, ensuring database is closed")
      closeDatabase()
    } catch (error) {
      console.error("Error closing database before quit:", error)
    }
  })

  app.on("activate", () => {
    if (mainWindow === null) {
      createWindow()
    }
  })
}

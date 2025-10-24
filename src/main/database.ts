import path from "path"
import { app } from "electron"
import Database from "better-sqlite3"
import * as fs from "fs"

const dbPath = path.join(app.getPath("userData"), "database.sqlite")
let db: Database.Database | null = null

console.log("[v0] Database path:", dbPath)
console.log("[v0] User data path:", app.getPath("userData"))

// Funcție pentru a obține instanța bazei de date
function getDatabase(): Database.Database {
  if (!db) {
    try {
      console.log("[v0] Initializing database at:", dbPath)

      // Ensure the directory exists
      const dbDir = path.dirname(dbPath)
      if (!fs.existsSync(dbDir)) {
        console.log("[v0] Creating database directory:", dbDir)
        fs.mkdirSync(dbDir, { recursive: true })
      }

      db = new Database(dbPath)
      console.log("[v0] Database initialized successfully")

      // Aplică optimizările la prima deschidere
      optimizeDatabase()
    } catch (error) {
      console.error("[v0] Error initializing database:", error)
      throw error
    }
  }
  return db
}

// Funcție pentru închiderea bazei de date
export const closeDatabase = (): void => {
  if (db) {
    try {
      // Forțează sincronizarea datelor înainte de închidere
      db.pragma("wal_checkpoint(FULL)")
      db.close()
      db = null
      console.log("Database connection closed successfully")
    } catch (error) {
      console.error("Error closing database:", error)
      db = null
    }
  }
}

// Activation file stored in app installation directory instead of userData
const activationFilePath = path.join(process.resourcesPath || __dirname, "activation.json")

export interface Lucrare {
  lucrare: string
  pret: number
}

export interface Material {
  material: string
  cantitate: number
  pret: number
}

export interface EntryData {
  marcaAuto: string
  modelAuto: string
  motorizare: string
  anFabricatie: string
  kilometri: string
  serieSasiu: string
  numeProprietar: string
  numarTelefon: string
  materiale: Material[]
  lucrari: Lucrare[]
  includeTVA: boolean // Added toggle for VAT display
  schimbUleiReminder: string | null
}

export interface Entry {
  numarInmatriculare: string
  date: string
  data: EntryData
}

// Database optimization functions
const optimizeDatabase = (): void => {
  try {
    const database = getDatabase()

    // Enable WAL mode for better concurrency
    database.pragma("journal_mode = WAL")

    // Increase cache size (in KB)
    database.pragma("cache_size = 10000")

    // Enable memory-mapped I/O
    database.pragma("mmap_size = 268435456") // 256MB

    // Optimize for faster writes
    database.pragma("synchronous = NORMAL")

    // Create indexes for better query performance
    database.exec(`
      CREATE INDEX IF NOT EXISTS idx_entries_numar ON entries(numarInmatriculare);
      CREATE INDEX IF NOT EXISTS idx_entries_data ON entries(dataIntrareService);
      CREATE INDEX IF NOT EXISTS idx_entries_numar_data ON entries(numarInmatriculare, dataIntrareService);
      CREATE INDEX IF NOT EXISTS idx_entries_reminder ON entries(schimbUleiReminder);
      CREATE INDEX IF NOT EXISTS idx_lucrari_entry ON lucrari(entryId);
      CREATE INDEX IF NOT EXISTS idx_material_entry ON materiale(entryId);
      CREATE INDEX IF NOT EXISTS idx_closed_reminders_id ON closed_reminders(id);
    `)

    console.log("Database optimizations applied successfully")
  } catch (error) {
    console.error("Error applying database optimizations:", error)
  }
}

const analyzeDatabase = (): void => {
  try {
    const database = getDatabase()
    // Update table statistics for better query planning
    database.exec("ANALYZE")
    console.log("Database analysis completed")
  } catch (error) {
    console.error("Error analyzing database:", error)
  }
}

export const initDatabase = (): void => {
  const database = getDatabase()

  database.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numarInmatriculare TEXT NOT NULL,
      dataIntrareService TEXT NOT NULL,
      marcaAuto TEXT NOT NULL,
      modelAuto TEXT NOT NULL,
      motorizare TEXT NOT NULL,
      anFabricatie TEXT NOT NULL,
      kilometri TEXT NOT NULL,
      serieSasiu TEXT NOT NULL,
      numeProprietar TEXT NOT NULL,
      numarTelefon TEXT NOT NULL,
      includeTVA INTEGER DEFAULT 1,
      schimbUleiReminder TEXT,
      UNIQUE(numarInmatriculare, dataIntrareService)
    );

    CREATE TABLE IF NOT EXISTS materiale (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entryId INTEGER,
      material TEXT NOT NULL,
      cantitate REAL NOT NULL,
      pret REAL NOT NULL,
      FOREIGN KEY (entryId) REFERENCES entries (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lucrari (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entryId INTEGER,
      lucrare TEXT NOT NULL,
      pret REAL NOT NULL,
      FOREIGN KEY (entryId) REFERENCES entries (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS closed_reminders (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Apply database optimizations
  optimizeDatabase()

  // Analyze database for better query planning
  analyzeDatabase()
}

export const getClosedReminders = (): string[] => {
  const database = getDatabase()
  const stmt = database.prepare("SELECT id FROM closed_reminders")
  const rows = stmt.all() as Array<{ id: string }>
  return rows.map((row) => row.id)
}

export const addClosedReminder = (reminderId: string): void => {
  const database = getDatabase()
  const stmt = database.prepare("INSERT OR IGNORE INTO closed_reminders (id) VALUES (?)")
  stmt.run(reminderId)
}

// Funcție pentru a anula reminder-urile anterioare de schimb ulei pentru un vehicul
export const cancelPreviousOilChangeReminders = (numarInmatriculare: string, currentDate: string): void => {
  try {
    const database = getDatabase()

    // Găsește toate intrările pentru acest vehicul care au reminder de schimb ulei
    const stmt = database.prepare(`
      SELECT id, dataIntrareService 
      FROM entries 
      WHERE numarInmatriculare = ? AND schimbUleiReminder IS NOT NULL AND dataIntrareService != ? 
      ORDER BY dataIntrareService DESC
    `)

    const previousEntries = stmt.all(numarInmatriculare, currentDate) as Array<{
      id: number
      dataIntrareService: string
    }>

    // Adaugă toate reminder-urile anterioare în lista de reminder-uri închise
    const insertClosedReminder = database.prepare("INSERT OR IGNORE INTO closed_reminders (id) VALUES (?)")

    previousEntries.forEach((entry) => {
      const reminderId = `${numarInmatriculare}-${entry.dataIntrareService}`
      insertClosedReminder.run(reminderId)
      console.log(`Cancelled previous oil change reminder: ${reminderId}`)
    })
  } catch (error) {
    console.error("Error cancelling previous oil change reminders:", error)
  }
}

// Funcție pentru a obține cel mai recent reminder de schimb ulei pentru un vehicul
export const getLatestOilChangeReminder = (
  numarInmatriculare: string,
): { date: string; reminderDate: string } | null => {
  try {
    const database = getDatabase()
    const stmt = database.prepare(`
      SELECT dataIntrareService, schimbUleiReminder 
      FROM entries 
      WHERE numarInmatriculare = ? AND schimbUleiReminder IS NOT NULL 
      ORDER BY dataIntrareService DESC 
      LIMIT 1
    `)

    const result = stmt.get(numarInmatriculare) as
      | { dataIntrareService: string; schimbUleiReminder: string }
      | undefined

    if (result) {
      return {
        date: result.dataIntrareService,
        reminderDate: result.schimbUleiReminder,
      }
    }

    return null
  } catch (error) {
    console.error("Error getting latest oil change reminder:", error)
    return null
  }
}

// Optimized getEntries function with better query
export const getEntries = (): { [key: string]: Entry[] } => {
  const database = getDatabase()

  // Forțează sincronizarea datelor din WAL
  database.pragma("wal_checkpoint(PASSIVE)")

  const stmt = database.prepare(`
    SELECT 
      e.id,
      e.numarInmatriculare,
      e.dataIntrareService,
      e.marcaAuto,
      e.modelAuto,
      e.motorizare,
      e.anFabricatie,
      e.kilometri,
      e.serieSasiu,
      e.numeProprietar,
      e.numarTelefon,
      e.includeTVA,
      e.schimbUleiReminder
    FROM entries e
    ORDER BY e.numarInmatriculare, e.dataIntrareService DESC
  `)

  const rawEntries = stmt.all()
  const groupedEntries: { [key: string]: Entry[] } = {}
  const entryIdMap = new Map<Entry, number>()

  console.log(`Retrieved ${rawEntries.length} entries from database`)

  rawEntries.forEach((entry: any) => {
    const entryObj: Entry = {
      numarInmatriculare: entry.numarInmatriculare,
      date: entry.dataIntrareService,
      data: {
        marcaAuto: entry.marcaAuto,
        modelAuto: entry.modelAuto,
        motorizare: entry.motorizare,
        anFabricatie: entry.anFabricatie,
        kilometri: entry.kilometri,
        serieSasiu: entry.serieSasiu,
        numeProprietar: entry.numeProprietar,
        numarTelefon: entry.numarTelefon,
        includeTVA: entry.includeTVA === 1,
        schimbUleiReminder: entry.schimbUleiReminder,
        materiale: [],
        lucrari: [],
      },
    }

    entryIdMap.set(entryObj, entry.id)

    if (!groupedEntries[entry.numarInmatriculare]) {
      groupedEntries[entry.numarInmatriculare] = []
    }
    groupedEntries[entry.numarInmatriculare].push(entryObj)
  })

  // Fetch materiale and lucrari separately
  const getMaterialsStmt = database.prepare("SELECT * FROM materiale WHERE entryId = ?")
  const getWorksStmt = database.prepare("SELECT * FROM lucrari WHERE entryId = ?")

  Object.keys(groupedEntries).forEach((numarInmatriculare) => {
    groupedEntries[numarInmatriculare].forEach((entry) => {
      const entryId = entryIdMap.get(entry)

      if (!entryId) {
        console.error(`No database ID found for entry: ${entry.numarInmatriculare} - ${entry.date}`)
        return
      }

      const materials = getMaterialsStmt.all(entryId)
      const works = getWorksStmt.all(entryId)

      entry.data.materiale = materials.map((material: any) => {
        return {
          material: material.material,
          cantitate: Number.parseFloat(material.cantitate),
          pret: Number.parseFloat(material.pret),
        }
      })

      entry.data.lucrari = works.map((work: any) => {
        return {
          lucrare: work.lucrare,
          pret: Number.parseFloat(work.pret),
        }
      })

      console.log(
        `Loaded ${entry.data.materiale.length} materials and ${entry.data.lucrari.length} works for entry ${entryId}`,
      )
    })
  })

  console.log(`Grouped into ${Object.keys(groupedEntries).length} license plates`)
  return groupedEntries
}

// Optimized saveEntry function with transaction
export const saveEntry = (entry: Entry): void => {
  console.log("[v0] saveEntry called for:", entry.numarInmatriculare, entry.date)
  console.log("[v0] Materials count:", entry.data.materiale.length)
  console.log("[v0] Works count:", entry.data.lucrari.length)

  const database = getDatabase()

  const insertOrReplaceEntry = database.prepare(`
    INSERT OR REPLACE INTO entries (
      numarInmatriculare, dataIntrareService, marcaAuto, modelAuto, motorizare, 
      anFabricatie, kilometri, serieSasiu, numeProprietar, numarTelefon, includeTVA, schimbUleiReminder
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertMaterial = database.prepare(`
    INSERT INTO materiale (entryId, material, cantitate, pret)
    VALUES (?, ?, ?, ?)
  `)

  const insertLucrare = database.prepare(`
    INSERT INTO lucrari (entryId, lucrare, pret)
    VALUES (?, ?, ?)
  `)

  const deleteMateriale = database.prepare(`
    DELETE FROM materiale WHERE entryId = ?
  `)

  const deleteLucrari = database.prepare(`
    DELETE FROM lucrari WHERE entryId = ?
  `)

  const transaction = database.transaction(() => {
    // Dacă această intrare are un reminder de schimb ulei, anulează reminder-urile anterioare
    if (entry.data.schimbUleiReminder) {
      cancelPreviousOilChangeReminders(entry.numarInmatriculare, entry.date)
    }

    const info = insertOrReplaceEntry.run(
      entry.numarInmatriculare,
      entry.date,
      entry.data.marcaAuto,
      entry.data.modelAuto,
      entry.data.motorizare,
      entry.data.anFabricatie,
      entry.data.kilometri,
      entry.data.serieSasiu,
      entry.data.numeProprietar,
      entry.data.numarTelefon,
      entry.data.includeTVA ? 1 : 0,
      entry.data.schimbUleiReminder,
    )

    const entryId = info.lastInsertRowid
    console.log("[v0] Entry saved with ID:", entryId)

    // Delete existing materiale and lucrari for this entry (if any)
    deleteMateriale.run(entryId)
    deleteLucrari.run(entryId)

    // Insert new materiale
    for (const material of entry.data.materiale) {
      insertMaterial.run(entryId, material.material, material.cantitate, material.pret)
    }
    console.log("[v0] Saved", entry.data.materiale.length, "materials")

    // Insert new lucrari
    for (const lucrare of entry.data.lucrari) {
      insertLucrare.run(entryId, lucrare.lucrare, lucrare.pret)
    }
    console.log("[v0] Saved", entry.data.lucrari.length, "works")
  })

  try {
    transaction()

    database.pragma("wal_checkpoint(FULL)")
    console.log("[v0] Entry saved and checkpointed successfully")
  } catch (error) {
    console.error("[v0] Error saving entry:", error)
    throw error
  }
}

export const deleteEntry = (numarInmatriculare: string, dataIntrareService: string): void => {
  const database = getDatabase()

  const deleteEntryStmt = database.prepare(
    "DELETE FROM entries WHERE numarInmatriculare = ? AND dataIntrareService = ?",
  )
  const deleteMaterialeStmt = database.prepare(
    "DELETE FROM materiale WHERE entryId = (SELECT id FROM entries WHERE numarInmatriculare = ? AND dataIntrareService = ?)",
  )
  const deleteLucrariStmt = database.prepare(
    "DELETE FROM lucrari WHERE entryId = (SELECT id FROM entries WHERE numarInmatriculare = ? AND dataIntrareService = ?)",
  )

  const transaction = database.transaction(() => {
    deleteMaterialeStmt.run(numarInmatriculare, dataIntrareService)
    deleteLucrariStmt.run(numarInmatriculare, dataIntrareService)
    deleteEntryStmt.run(numarInmatriculare, dataIntrareService)
  })

  transaction()

  // Forțează sincronizarea după ștergere
  database.pragma("wal_checkpoint(PASSIVE)")
  console.log(`Deleted entry for ${numarInmatriculare} on ${dataIntrareService}`)
}

// Optimized saveEntries function with better transaction handling
export const saveEntries = (entries: Entry[]): void => {
  const database = getDatabase()

  const insertOrUpdateEntry = database.prepare(`
    INSERT OR REPLACE INTO entries (
      numarInmatriculare, dataIntrareService, marcaAuto, modelAuto, motorizare, 
      anFabricatie, kilometri, serieSasiu, numeProprietar, numarTelefon, includeTVA, schimbUleiReminder
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertMaterial = database.prepare(`
    INSERT INTO materiale (entryId, material, cantitate, pret)
    VALUES (?, ?, ?, ?)
  `)

  const insertLucrare = database.prepare(`
    INSERT INTO lucrari (entryId, lucrare, pret)
    VALUES (?, ?, ?)
  `)

  const deleteMateriale = database.prepare(`
    DELETE FROM materiale 
    WHERE entryId = ?
  `)

  const deleteLucrari = database.prepare(`
    DELETE FROM lucrari 
    WHERE entryId = ?
  `)

  const transaction = database.transaction((entries: Entry[]) => {
    for (const entry of entries) {
      const info = insertOrUpdateEntry.run(
        entry.numarInmatriculare,
        entry.date,
        entry.data.marcaAuto,
        entry.data.modelAuto,
        entry.data.motorizare,
        entry.data.anFabricatie,
        entry.data.kilometri,
        entry.data.serieSasiu,
        entry.data.numeProprietar,
        entry.data.numarTelefon,
        entry.data.includeTVA ? 1 : 0,
        entry.data.schimbUleiReminder,
      )

      const entryId = info.lastInsertRowid

      // Delete existing materiale and lucrari for this entry (if any)
      deleteMateriale.run(entryId)
      deleteLucrari.run(entryId)

      // Insert new materiale
      for (const material of entry.data.materiale) {
        insertMaterial.run(entryId, material.material, material.cantitate, material.pret)
      }

      // Insert new lucrari
      for (const lucrare of entry.data.lucrari) {
        insertLucrare.run(entryId, lucrare.lucrare, lucrare.pret)
      }
    }
  })

  transaction(entries)

  // Forțează sincronizarea după salvarea în masă
  database.pragma("wal_checkpoint(PASSIVE)")
  console.log(`Saved ${entries.length} entries in batch`)
}

// Activation system - now using file system instead of database
export const checkActivationStatus = (): boolean => {
  try {
    if (fs.existsSync(activationFilePath)) {
      console.log("Found activation file at:", activationFilePath)
      const activationData = JSON.parse(fs.readFileSync(activationFilePath, "utf8"))
      return activationData.activated === true
    }

    // Check alternative location
    const alternativeFilePath = path.join(app.getPath("userData"), "activation.json")
    if (fs.existsSync(alternativeFilePath)) {
      console.log("Found activation file at alternative location:", alternativeFilePath)
      const activationData = JSON.parse(fs.readFileSync(alternativeFilePath, "utf8"))
      return activationData.activated === true
    }

    console.log("No activation file found")
    return false
  } catch (error) {
    console.error("Error checking activation status:", error)
    return false
  }
}

export const setActivationStatus = (activated: boolean): void => {
  try {
    const activationData = {
      activated,
      activatedAt: new Date().toISOString(),
    }

    // Ensure the directory exists
    const dir = path.dirname(activationFilePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Log the path where we're trying to write
    console.log("Writing activation status to:", activationFilePath)

    // Try to write the file
    fs.writeFileSync(activationFilePath, JSON.stringify(activationData, null, 2))

    console.log("Activation status written successfully")
  } catch (error) {
    console.error("Error setting activation status:", error)

    // Try an alternative location if the resources path is not writable
    try {
      const alternativeFilePath = path.join(app.getPath("userData"), "activation.json")
      console.log("Trying alternative location:", alternativeFilePath)

      const activationData = {
        activated,
        activatedAt: new Date().toISOString(),
      }

      fs.writeFileSync(alternativeFilePath, JSON.stringify(activationData, null, 2))
      console.log("Activation status written to alternative location")
    } catch (alternativeError) {
      console.error("Error writing to alternative location:", alternativeError)
      throw new Error("Nu se poate salva starea de activare. Verificați permisiunile aplicației.")
    }
  }
}

// Find the validateActivationKey function and check its implementation
export const validateActivationKey = (key: string): boolean => {
  // Make sure we're doing a case-insensitive comparison and removing any extra spaces
  const validKey = "DEVIZ-K7X9P-LQ38D-AUTOO-MZ2RT"
  const normalizedKey = key.trim().toUpperCase()
  const normalizedValidKey = validKey.trim().toUpperCase()

  console.log("Comparing keys:", normalizedKey, normalizedValidKey)
  console.log("Keys match:", normalizedKey === normalizedValidKey)

  return normalizedKey === normalizedValidKey
}

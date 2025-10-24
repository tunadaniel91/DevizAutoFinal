"use client"

import React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import {
  ChevronDown,
  ChevronRight,
  Search,
  X,
  Save,
  FileText,
  Plus,
  Trash2,
  Database,
  BarChart3,
  Edit,
  Printer,
} from "lucide-react"
// import { FixedSizeList as List } from "react-window"
import SchimbUleiButton from "./SchimbUleiButton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"
import { DatePicker } from "../components/ui/date-picker"
import { DateRangePicker } from "../components/ui/date-range-picker"
import { Switch } from "../components/ui/switch"
import ActivationDialog from "./ActivationDialog"
import BackupRestoreDialog from "./BackupRestoreDialog"
import DashboardDialog from "./DashboardDialog"
import SavePDFConfirmDialog from "./SavePDFConfirmDialog" // Import the new dialog

// ============ HOOKS OPTIMIZATE DOAR PENTRU CĂUTARE/FILTRARE ============

// Hook pentru debouncing DOAR pentru căutare
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Hook pentru căutare optimizată (DOAR pentru lista din stânga)
function useOptimizedSearch(entries: { [key: string]: Entry[] }, searchTerm: string, delay = 300) {
  const debouncedSearchTerm = useDebounce(searchTerm, delay)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true)
    } else {
      setIsSearching(false)
    }
  }, [searchTerm, debouncedSearchTerm])

  const filteredEntries = useMemo(() => {
    if (!debouncedSearchTerm) return entries

    const filtered: { [key: string]: Entry[] } = {}
    Object.entries(entries).forEach(([numarInmatriculare, entriesForPlate]) => {
      if (numarInmatriculare.includes(debouncedSearchTerm)) {
        filtered[numarInmatriculare] = entriesForPlate
      }
    })
    return filtered
  }, [entries, debouncedSearchTerm])

  return { filteredEntries, isSearching }
}

// Hook pentru filtrare după dată optimizată (DOAR pentru lista din stânga)
function useOptimizedDateFilter(
  entries: { [key: string]: Entry[] },
  dateFilterMode: "single" | "range",
  singleDateFilter: string,
  dateRangeFilter: { start: string; end: string } | null,
) {
  return useMemo(() => {
    const matchesDateFilter = (entryDate: string) => {
      if (dateFilterMode === "single") {
        return !singleDateFilter || entryDate === singleDateFilter
      } else {
        if (!dateRangeFilter) return true
        const entryDateObj = new Date(entryDate)
        const startDate = new Date(dateRangeFilter.start)
        const endDate = new Date(dateRangeFilter.end)
        return entryDateObj >= startDate && entryDateObj <= endDate
      }
    }

    const filtered: { [key: string]: Entry[] } = {}
    Object.entries(entries).forEach(([numarInmatriculare, entriesForPlate]) => {
      const filteredEntriesForPlate = entriesForPlate.filter((entry) => matchesDateFilter(entry.date))
      if (filteredEntriesForPlate.length > 0) {
        filtered[numarInmatriculare] = filteredEntriesForPlate
      }
    })
    return filtered
  }, [entries, dateFilterMode, singleDateFilter, dateRangeFilter])
}

// Hook pentru schimburi de ulei optimizate (DOAR pentru Dashboard)
function useOptimizedOilChanges(entries: { [key: string]: Entry[] }, closedReminders: string[]) {
  return useMemo(() => {
    const groupedOilChanges: { [key: string]: Array<{ date: string; reminderDate: string; isActive: boolean }> } = {}

    Object.entries(entries).forEach(([numarInmatriculare, entriesForPlate]) => {
      const oilChanges: Array<{ date: string; reminderDate: string }> = []

      entriesForPlate.forEach((entry) => {
        if (entry.data.schimbUleiReminder) {
          oilChanges.push({
            date: entry.date,
            reminderDate: entry.data.schimbUleiReminder,
          })
        }
      })

      if (oilChanges.length > 0) {
        oilChanges.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        const oilChangesWithStatus = oilChanges
          .map((change, index) => ({
            ...change,
            isActive: index === 0,
          }))
          .filter((change) => change.isActive)

        if (oilChangesWithStatus.length > 0) {
          groupedOilChanges[numarInmatriculare] = oilChangesWithStatus
        }
      }
    })

    return groupedOilChanges
  }, [entries, closedReminders])
}

// ============ COMPONENTE OPTIMIZATE DOAR PENTRU LISTA DE ÎNREGISTRĂRI ============

// Componentă optimizată pentru cardurile de înregistrări (DOAR pentru lista din stânga)
const OptimizedEntryCard = React.memo<{
  numarInmatriculare: string
  entries: Entry[]
  isExpanded: boolean
  onToggleExpand: (numarInmatriculare: string) => void
  onEntryClick: (entry: Entry) => void
  onDeleteClick: (numarInmatriculare: string, date?: string) => void
  onExportClick: (numarInmatriculare: string) => void
  formatDateForDisplay: (dateString: string) => string
}>(
  ({
    numarInmatriculare,
    entries,
    isExpanded,
    onToggleExpand,
    onEntryClick,
    onDeleteClick,
    onExportClick,
    formatDateForDisplay,
  }) => {
    const handleToggleExpand = useCallback(() => {
      onToggleExpand(numarInmatriculare)
    }, [numarInmatriculare, onToggleExpand])

    const handleDeleteAll = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        onDeleteClick(numarInmatriculare)
      },
      [numarInmatriculare, onDeleteClick],
    )

    const handleExport = useCallback(() => {
      onExportClick(numarInmatriculare)
    }, [numarInmatriculare, onExportClick])

    return (
      <div className="bg-white rounded-lg shadow p-3">
        <div className="flex items-center cursor-pointer" onClick={handleToggleExpand}>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="ml-2 font-medium">{numarInmatriculare}</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-red-500 hover:text-red-700 hover:bg-red-100"
            onClick={handleDeleteAll}
          >
            <Trash2 size={16} />
          </Button>
        </div>
        {isExpanded && (
          <div className="mt-2 ml-6 space-y-1">
            {entries.map((entry, index) => (
              <EntryItem
                key={`${entry.numarInmatriculare}-${entry.date}`}
                entry={entry}
                onEntryClick={onEntryClick}
                onDeleteClick={onDeleteClick}
                formatDateForDisplay={formatDateForDisplay}
              />
            ))}
            <Button onClick={handleExport} className="mt-2 bg-green-500 hover:bg-green-600 text-white">
              <FileText className="w-4 h-4 mr-2" />
              Istoric Deviz PDF
            </Button>
          </div>
        )}
      </div>
    )
  },
)

// Componentă simplă pentru itemii individuali de înregistrări (fără optimizări excesive)
const EntryItem: React.FC<{
  entry: Entry
  onEntryClick: (entry: Entry) => void
  onDeleteClick: (numarInmatriculare: string, date: string) => void
  formatDateForDisplay: (dateString: string) => string
}> = ({ entry, onEntryClick, onDeleteClick, formatDateForDisplay }) => {
  const handleEntryClick = () => {
    onEntryClick(entry)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDeleteClick(entry.numarInmatriculare, entry.date)
  }

  return (
    <div className="flex items-center text-sm cursor-pointer hover:bg-gray-100 p-1 rounded" onClick={handleEntryClick}>
      <span className="flex-grow">{formatDateForDisplay(entry.date)}</span>
      <Button
        variant="ghost"
        size="icon"
        className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-100"
        onClick={handleDeleteClick}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  )
}

// ============ COMPONENTE SIMPLE PENTRU FORMULAR (FĂRĂ OPTIMIZĂRI) ============

// Componentă simplă pentru input-urile de materiale (FĂRĂ React.memo sau optimizări)
const MaterialInput: React.FC<{
  material: Material
  index: number
  onMaterialChange: (index: number, field: "material" | "cantitate" | "pret", value: string | number) => void
  onRemoveMaterial: (index: number) => void
  readOnly: boolean
  showValidationErrors: boolean
  isInvalidMaterial: (material: Material) => boolean
  isInvalidCantitate: (material: Material) => boolean
  isInvalidPret: (material: Material) => boolean
  includeTVA: boolean
  tempPriceValue?: string // Adăugat prop pentru valoarea temporară
  onPriceBlur?: (index: number) => void // Adăugat prop pentru onBlur
}> = ({
  material,
  index,
  onMaterialChange,
  onRemoveMaterial,
  readOnly,
  showValidationErrors,
  isInvalidMaterial,
  isInvalidCantitate,
  isInvalidPret,
  includeTVA,
  tempPriceValue, // Destructurat prop nou
  onPriceBlur, // Destructurat prop nou
}) => {
  const handleMaterialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMaterialChange(index, "material", e.target.value)
  }

  const handleCantitateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMaterialChange(index, "cantitate", e.target.value)
  }

  const handlePretChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMaterialChange(index, "pret", e.target.value)
  }

  const handleRemove = () => {
    onRemoveMaterial(index)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.select()
  }

  const tvaAmount = material.pret * 0.21

  return (
    <div className="grid grid-cols-5 gap-4 relative group">
      <Input
        value={material.material}
        onChange={handleMaterialChange}
        readOnly={readOnly}
        placeholder="Materiale"
        className={`bg-white col-span-2 ${
          isInvalidMaterial(material) ? "border-red-500 border-2 focus:border-red-500 focus:ring-red-500" : ""
        }`}
      />
      <Input
        type="text"
        value={material.cantitate === 0 ? "" : material.cantitate.toString()}
        onChange={handleCantitateChange}
        onFocus={handleFocus}
        readOnly={readOnly}
        placeholder="Cantitate"
        className={`bg-white ${
          isInvalidCantitate(material) ? "border-red-500 border-2 focus:border-red-500 focus:ring-red-500" : ""
        }`}
      />
      <Input
        type="text"
        value={tempPriceValue !== undefined ? tempPriceValue : material.pret === 0 ? "" : material.pret.toString()}
        onChange={handlePretChange}
        onFocus={handleFocus}
        onBlur={() => onPriceBlur?.(index)}
        readOnly={readOnly}
        placeholder="Pret"
        className={`bg-white ${
          isInvalidPret(material) ? "border-red-500 border-2 focus:border-red-500 focus:ring-red-500" : ""
        }`}
      />
      <div className="flex items-center relative">
        {includeTVA ? (
          <Input
            type="text"
            value={tvaAmount.toFixed(2)}
            readOnly
            placeholder="TVA"
            className="bg-gray-100 flex-grow"
          />
        ) : (
          <div className="flex-grow"></div>
        )}
        {!readOnly && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="ml-1 text-red-500 hover:text-red-700 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

// Componentă simplă pentru input-urile de lucrări (FĂRĂ React.memo sau optimizări)
const LucrareInput: React.FC<{
  lucrare: Lucrare
  index: number
  onLucrareChange: (index: number, field: "lucrare" | "pret", value: string | number) => void
  onRemoveLucrare: (index: number) => void
  readOnly: boolean
  showValidationErrors: boolean
  isInvalidDescription: (lucrare: Lucrare) => boolean
  isInvalidCost: (lucrare: Lucrare) => boolean
  includeTVA: boolean
  tempPriceValue?: string // Adăugat prop pentru valoarea temporară
  onPriceBlur?: (index: number) => void // Adăugat prop pentru onBlur
}> = ({
  lucrare,
  index,
  onLucrareChange,
  onRemoveLucrare,
  readOnly,
  showValidationErrors,
  isInvalidDescription,
  isInvalidCost,
  includeTVA,
  tempPriceValue, // Destructurat prop nou
  onPriceBlur, // Destructurat prop nou
}) => {
  const handleLucrareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onLucrareChange(index, "lucrare", e.target.value)
  }

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onLucrareChange(index, "pret", e.target.value)
  }

  const handleRemove = () => {
    onRemoveLucrare(index)
  }

  const handleCostFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.select()
  }

  const tvaAmount = lucrare.pret * 0.21

  return (
    <div className="grid grid-cols-4 gap-4 relative group">
      <Input
        value={lucrare.lucrare}
        onChange={handleLucrareChange}
        readOnly={readOnly}
        placeholder="Lucrari"
        className={`bg-white col-span-2 ${
          isInvalidDescription(lucrare) ? "border-red-500 border-2 focus:border-red-500 focus:ring-red-500" : ""
        }`}
      />
      <Input
        type="text"
        value={tempPriceValue !== undefined ? tempPriceValue : lucrare.pret === 0 ? "" : lucrare.pret.toString()}
        onChange={handleCostChange}
        onFocus={handleCostFocus}
        onBlur={() => onPriceBlur?.(index)}
        readOnly={readOnly}
        placeholder="Pret"
        className={`bg-white ${
          isInvalidCost(lucrare) ? "border-red-500 border-2 focus:border-red-500 focus:ring-red-500" : ""
        }`}
      />
      <div className="flex items-center relative">
        {includeTVA ? (
          <Input
            type="text"
            value={tvaAmount.toFixed(2)}
            readOnly
            placeholder="TVA"
            className="bg-gray-100 flex-grow"
          />
        ) : (
          <div className="flex-grow"></div>
        )}
        {!readOnly && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="ml-1 text-red-500 hover:text-red-700 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

// ============ TIPURI ============

function isWindow(obj: any): obj is Window {
  return obj !== null && obj !== undefined && obj.document !== undefined
}

type Material = {
  material: string
  cantitate: number
  pret: number
}

type Lucrare = {
  lucrare: string
  pret: number // Renamed from 'cost' to 'pret' to align with updates
}

type EntryData = {
  [x: string]: any
  marcaAuto: string
  modelAuto: string
  motorizare: string
  anFabricatie: string
  kilometri: string
  serieSasiu: string
  numeProprietar: string
  numarTelefon: string
  materiale: Material[] // Added materiale
  lucrari: Lucrare[]
  includeTVA: boolean // Added VAT toggle
  schimbUleiReminder: string | null
}

type Entry = {
  numarInmatriculare: string
  date: string
  data: EntryData
}

type CurrentEntry = EntryData & {
  numarInmatriculare: string
  dataIntrareService: string
}

type ReminderInfo = {
  id: string
  numarInmatriculare: string
  date: string
  daysUntilReminder: number
}

// ============ FUNCȚII HELPER ============

const formatDateForDisplay = (dateString: string) => {
  if (!dateString) return ""
  const [year, month, day] = dateString.split("-")
  return `${day}-${month}-${year}`
}

/*
const VirtualList = React.memo<{
  items: Array<[string, Entry[]]>
  itemHeight: number
  containerHeight: number
  renderItem: (item: [string, Entry[]], index: number) => React.ReactNode
}>(({ items, itemHeight, containerHeight, renderItem }) => {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const { visibleItems, offsetY, totalHeight } = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(startIndex + Math.ceil(containerHeight / itemHeight) + 1, items.length)

    const visibleItems = items.slice(startIndex, endIndex).map((item, i) => ({
      item,
      index: startIndex + i,
    }))

    return {
      visibleItems,
      offsetY: startIndex * itemHeight,
      totalHeight: items.length * itemHeight,
    }
  }, [items, itemHeight, containerHeight, scrollTop])

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflow: "auto",
        position: "relative",
      }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div key={item[0]} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

VirtualList.displayName = "VirtualList"
*/

/*
const VirtualizedRow = React.memo<{
  index: number
  style: React.CSSProperties
  data: {
    entries: Array<[string, Entry[]]>
    expandedEntries: string[]
    onToggleExpand: (numarInmatriculare: string) => void
    onEntryClick: (entry: Entry) => void
    onDeleteClick: (numarInmatriculare: string, date?: string) => void
    onExportClick: (numarInmatriculare: string) => void
    formatDateForDisplay: (dateString: string) => string
  }
}>(({ index, style, data }) => {
  const [numarInmatriculare, entriesForPlate] = data.entries[index]

  return (
    <div style={style}>
      <div className="px-1 pb-2">
        <OptimizedEntryCard
          numarInmatriculare={numarInmatriculare}
          entries={entriesForPlate}
          isExpanded={data.expandedEntries.includes(numarInmatriculare)}
          onToggleExpand={data.onToggleExpand}
          onEntryClick={data.onEntryClick}
          onDeleteClick={data.onDeleteClick}
          onExportClick={data.onExportClick}
          formatDateForDisplay={data.formatDateForDisplay}
        />
      </div>
    </div>
  )
})
*/

// ============ COMPONENTA PRINCIPALĂ ============

export default function DevizAuto() {
  const buttonStyle = "bg-blue-400 hover:bg-blue-600 text-white transition-colors duration-200"

  // ============ STATE SEPARAT PENTRU FORMULAR ============
  const [entries, setEntries] = useState<{ [key: string]: Entry[] }>({})
  const [currentEntry, setCurrentEntry] = useState<CurrentEntry>({
    numarInmatriculare: "",
    marcaAuto: "",
    modelAuto: "",
    motorizare: "",
    anFabricatie: "",
    kilometri: "",
    serieSasiu: "",
    dataIntrareService: new Date().toISOString().split("T")[0],
    numeProprietar: "",
    numarTelefon: "",
    materiale: [
      { material: "", cantitate: 0, pret: 0 },
      { material: "", cantitate: 0, pret: 0 },
      { material: "", cantitate: 0, pret: 0 },
    ],
    lucrari: [
      { lucrare: "", pret: 0 },
      { lucrare: "", pret: 0 },
      { lucrare: "", pret: 0 },
    ],
    includeTVA: true, // Default VAT toggle to ON
    schimbUleiReminder: null,
  })

  // ============ STATE SEPARAT PENTRU CĂUTARE/FILTRARE ============
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilterMode, setDateFilterMode] = useState<"single" | "range">("single")
  const [singleDateFilter, setSingleDateFilter] = useState("")
  const [dateRangeFilter, setDateRangeFilter] = useState<{ start: string; end: string } | null>(null)

  // UI states
  const [viewMode, setViewMode] = useState<"edit" | "view">("edit")
  const [partialEditMode, setPartialEditMode] = useState(false)
  const [expandedEntries, setExpandedEntries] = useState<string[]>([])

  // Dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<{ numarInmatriculare: string; date?: string } | null>(null)
  const [costValidationOpen, setCostValidationOpen] = useState(false)
  const [descriptionValidationOpen, setDescriptionValidationOpen] = useState(false)
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const [backupDialogOpen, setBackupDialogOpen] = useState(false)
  const [dashboardOpen, setDashboardOpen] = useState(false)
  const [savePDFDialogOpen, setSavePDFDialogOpen] = useState(false) // State for PDF save confirmation dialog
  const [pendingPDFAction, setPendingPDFAction] = useState<"single" | "istoric" | null>(null) // State for pending PDF action
  const [pendingPDFFolderName, setPendingPDFFolderName] = useState<string>("")
  const [pendingIstoricLicensePlate, setPendingIstoricLicensePlate] = useState<string>("")

  // Status states
  const [exportStatus, setExportStatus] = useState<{ show: boolean; success: boolean; message: string }>({
    show: false,
    success: false,
    message: "",
  })
  const [isActivated, setIsActivated] = useState<boolean | null>(null)
  const [closedReminders, setClosedReminders] = useState<string[]>([])

  // State pentru input-urile temporare de preț
  const [tempPriceInputs, setTempPriceInputs] = useState<{
    materiale: { [key: number]: string }
    lucrari: { [key: number]: string }
  }>({
    materiale: {},
    lucrari: {},
  })

  const printContentRef = useRef<HTMLDivElement>(null)

  // ============ HOOKS OPTIMIZATE DOAR PENTRU CĂUTARE ============

  const { filteredEntries: searchFilteredEntries, isSearching } = useOptimizedSearch(entries, searchTerm, 300)
  const dateFilteredEntries = useOptimizedDateFilter(
    searchFilteredEntries,
    dateFilterMode,
    singleDateFilter,
    dateRangeFilter,
  )

  // Hook pentru schimburi de ulei (DOAR pentru Dashboard)
  const groupedOilChanges = useOptimizedOilChanges(entries, closedReminders)

  // ============ CALCULE SIMPLE PENTRU FORMULAR ============

  // Funcții simple pentru formular (fără useCallback excesiv)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCurrentEntry((prev) => ({ ...prev, [name]: value.toUpperCase() }))

    if (name === "numarInmatriculare") {
      const existingEntry = entries[value.toUpperCase()]?.[0]
      if (existingEntry) {
        setCurrentEntry((prev) => ({
          ...prev,
          marcaAuto: existingEntry.data.marcaAuto,
          modelAuto: existingEntry.data.modelAuto,
          motorizare: existingEntry.data.motorizare,
          anFabricatie: existingEntry.data.anFabricatie,
          serieSasiu: existingEntry.data.serieSasiu,
          numeProprietar: existingEntry.data.numeProprietar,
          numarTelefon: existingEntry.data.numarTelefon,
        }))
      }
    }
  }

  // Modificat pentru a gestiona valorile temporare
  const handleMaterialChange = (index: number, field: "material" | "cantitate" | "pret", value: string | number) => {
    setCurrentEntry((prev) => {
      const newMateriale = [...prev.materiale]
      if (field === "material") {
        newMateriale[index].material = value.toString().toUpperCase()
      } else if (field === "cantitate") {
        let numericValue = 0
        if (typeof value === "string") {
          const cleanedValue = value.replace(/[^0-9.]/g, "")
          numericValue = cleanedValue === "" ? 0 : Number.parseFloat(cleanedValue)
        } else {
          numericValue = Math.max(0, value || 0)
        }
        newMateriale[index].cantitate = numericValue
      } else if (field === "pret") {
        let numericValue = 0
        if (typeof value === "string") {
          // Permite atât punct (.) cât și virgulă (,)
          const cleanedValue = value.replace(/[^0-9.,]/g, "").replace(",", ".")

          // Salvează string-ul temporar pentru a păstra punctul în timpul editării
          setTempPriceInputs((prev) => ({
            ...prev,
            materiale: { ...prev.materiale, [index]: cleanedValue },
          }))

          // Convertește la număr doar dacă este valid
          numericValue = cleanedValue === "" ? 0 : Number.parseFloat(cleanedValue) || 0
        } else {
          numericValue = Math.max(0, value || 0)
        }
        newMateriale[index].pret = numericValue
      }
      return { ...prev, materiale: newMateriale }
    })

    if (showValidationErrors) {
      setShowValidationErrors(false)
    }
  }

  const addMaterial = () => {
    setCurrentEntry((prev) => ({
      ...prev,
      materiale: [...prev.materiale, { material: "", cantitate: 0, pret: 0 }],
    }))
  }

  const removeMaterial = (indexToRemove: number) => {
    setCurrentEntry((prev) => ({
      ...prev,
      materiale: prev.materiale.filter((_, index) => index !== indexToRemove),
    }))
    // Șterge și din tempPriceInputs dacă este cazul
    setTempPriceInputs((prev) => {
      const newMaterialeInputs = { ...prev.materiale }
      delete newMaterialeInputs[indexToRemove]
      return { ...prev, materiale: newMaterialeInputs }
    })
  }

  // Modificat pentru a gestiona valorile temporare
  const handleLucrareChange = (index: number, field: "lucrare" | "pret", value: string | number) => {
    setCurrentEntry((prev) => {
      const newLucrari = [...prev.lucrari]
      if (field === "lucrare") {
        newLucrari[index].lucrare = value.toString().toUpperCase()
      } else {
        let numericValue = 0
        if (typeof value === "string") {
          // Permite atât punct (.) cât și virgulă (,)
          const cleanedValue = value.replace(/[^0-9.,]/g, "").replace(",", ".")

          // Salvează string-ul temporar pentru a păstra punctul în timpul editării
          setTempPriceInputs((prev) => ({
            ...prev,
            lucrari: { ...prev.lucrari, [index]: cleanedValue },
          }))

          // Convertește la număr doar dacă este valid
          numericValue = cleanedValue === "" ? 0 : Number.parseFloat(cleanedValue) || 0
        } else {
          numericValue = Math.max(0, value || 0)
        }
        newLucrari[index].pret = numericValue
      }
      return { ...prev, lucrari: newLucrari }
    })

    if (showValidationErrors) {
      setShowValidationErrors(false)
    }
  }

  const addLucrare = () => {
    setCurrentEntry((prev) => ({
      ...prev,
      lucrari: [...prev.lucrari, { lucrare: "", pret: 0 }],
    }))
  }

  const removeLucrare = (indexToRemove: number) => {
    setCurrentEntry((prev) => ({
      ...prev,
      lucrari: prev.lucrari.filter((_, index) => index !== indexToRemove),
    }))
    // Șterge și din tempPriceInputs dacă este cazul
    setTempPriceInputs((prev) => {
      const newLucrariInputs = { ...prev.lucrari }
      delete newLucrariInputs[indexToRemove]
      return { ...prev, lucrari: newLucrariInputs }
    })
  }

  const handleSchimbUleiChange = (checked: boolean) => {
    setCurrentEntry((prev) => ({
      ...prev,
      schimbUleiReminder: checked
        ? new Date(new Date(prev.dataIntrareService).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        : null,
    }))
  }

  useEffect(() => {
    // If oil change checkbox is checked, recalculate the reminder date when service date changes
    if (currentEntry.schimbUleiReminder) {
      const newReminderDate = new Date(new Date(currentEntry.dataIntrareService).getTime() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]

      // Only update if the calculated date is different from current reminder
      if (newReminderDate !== currentEntry.schimbUleiReminder) {
        setCurrentEntry((prev) => ({
          ...prev,
          schimbUleiReminder: newReminderDate,
        }))
      }
    }
  }, [currentEntry.dataIntrareService])

  const isPrintButtonEnabled = useMemo(() => {
    // If viewing an existing Deviz, Print button is active
    if (viewMode === "view") {
      return true
    }

    // For new Deviz, check if license plate is filled AND at least one material OR labor is complete
    const hasLicensePlate = currentEntry.numarInmatriculare.trim() !== ""

    const hasCompleteMaterial = currentEntry.materiale.some((material) => {
      return material.material.trim() !== "" && material.cantitate > 0 && material.pret > 0
    })

    const hasCompleteLucrare = currentEntry.lucrari.some((lucrare) => {
      return lucrare.lucrare.trim() !== "" && lucrare.pret > 0
    })

    return hasLicensePlate && (hasCompleteMaterial || hasCompleteLucrare)
  }, [viewMode, currentEntry.numarInmatriculare, currentEntry.materiale, currentEntry.lucrari])

  // ============ FUNCȚII CALLBACK OPTIMIZATE DOAR PENTRU LISTE ============

  const toggleExpand = useCallback((numarInmatriculare: string) => {
    setExpandedEntries((prev) =>
      prev.includes(numarInmatriculare)
        ? prev.filter((item) => item !== numarInmatriculare)
        : [...prev, numarInmatriculare],
    )
  }, [])

  const handleEntryClick = useCallback((entry: Entry) => {
    setCurrentEntry({
      ...entry.data,
      numarInmatriculare: entry.numarInmatriculare,
      dataIntrareService: entry.date,
    })
    setViewMode("view")
    setPartialEditMode(false)
    // Reset tempPriceInputs when selecting an existing entry
    setTempPriceInputs({ materiale: {}, lucrari: {} })
  }, [])

  const handleDeleteClick = useCallback((numarInmatriculare: string, date?: string) => {
    setEntryToDelete({ numarInmatriculare, date })
    setDeleteConfirmOpen(true)
  }, [])

  const handleCloseReminder = useCallback(async (reminderId: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.addClosedReminder(reminderId)
        setClosedReminders((prev) => [...prev, reminderId])
      }
    } catch (error) {
      console.error("Error closing reminder:", error)
    }
  }, [])

  // ============ FUNCȚII HELPER ============

  const clearAllFilters = useCallback(() => {
    setSearchTerm("")
    setSingleDateFilter("")
    setDateRangeFilter(null)
  }, [])

  // Funcții simple de validare (fără useCallback)
  const validateMateriale = () => {
    const hasInvalidMateriale = currentEntry.materiale.some((material) => {
      const hasMaterial = material.material.trim() !== ""
      const hasCantitate = material.cantitate > 0
      const hasPret = material.pret > 0

      // If any field is filled, all fields must be filled
      const anyFieldFilled = hasMaterial || hasCantitate || hasPret
      const allFieldsFilled = hasMaterial && hasCantitate && hasPret

      return anyFieldFilled && !allFieldsFilled
    })
    return !hasInvalidMateriale
  }

  const isInvalidMaterial = (material: Material) => {
    if (!showValidationErrors) return false
    const hasCantitate = material.cantitate > 0
    const hasPret = material.pret > 0
    return material.material.trim() === "" && (hasCantitate || hasPret)
  }

  const isInvalidCantitate = (material: Material) => {
    if (!showValidationErrors) return false
    const hasMaterial = material.material.trim() !== ""
    const hasPret = material.pret > 0
    return material.cantitate <= 0 && (hasMaterial || hasPret)
  }

  const isInvalidPret = (material: Material) => {
    if (!showValidationErrors) return false
    const hasMaterial = material.material.trim() !== ""
    const hasCantitate = material.cantitate > 0
    return material.pret <= 0 && (hasMaterial || hasCantitate)
  }

  const validateLucrari = () => {
    const hasInvalidLucrari = currentEntry.lucrari.some((lucrare) => {
      const hasLucrare = lucrare.lucrare.trim() !== ""
      const hasPret = lucrare.pret > 0

      // If any field is filled, all fields must be filled
      const anyFieldFilled = hasLucrare || hasPret
      const allFieldsFilled = hasLucrare && hasPret

      return anyFieldFilled && !allFieldsFilled
    })
    return !hasInvalidLucrari
  }

  const isInvalidCost = (lucrare: Lucrare) => {
    if (!showValidationErrors) return false
    const hasLucrare = lucrare.lucrare.trim() !== ""
    return hasLucrare && lucrare.pret <= 0
  }

  const isInvalidDescription = (lucrare: Lucrare) => {
    if (!showValidationErrors) return false
    const hasCost = lucrare.pret > 0
    return lucrare.lucrare.trim() === "" && hasCost
  }

  // Adăugat handler pentru blur pe input-ul de preț
  const handlePriceBlur = (type: "materiale" | "lucrari", index: number) => {
    setTempPriceInputs((prev) => {
      const inputs = { ...prev[type] }
      delete inputs[index] // Șterge valoarea temporară după procesare
      return { ...prev, [type]: inputs }
    })
  }

  // ============ EFECTE ============

  // Load closed reminders on mount
  useEffect(() => {
    const loadClosedReminders = async () => {
      try {
        if (window.electronAPI) {
          const reminders = await window.electronAPI.getClosedReminders()
          setClosedReminders(reminders)
        }
      } catch (error) {
        console.error("Error loading closed reminders:", error)
      }
    }

    loadClosedReminders()
  }, [])

  const handleActivationSuccess = async () => {
    setIsActivated(true)
    await loadDataFromStorage()
  }

  useEffect(() => {
    const initApp = async () => {
      if (window.electronAPI) {
        try {
          await window.electronAPI.initDatabase()
          const activationStatus = await window.electronAPI.checkActivation()
          setIsActivated(activationStatus)

          if (activationStatus) {
            await loadDataFromStorage()
          }
        } catch (error) {
          console.error("Error initializing app:", error)
          setIsActivated(false)
        }
      } else {
        console.error("Electron API not available")
        setIsActivated(false)
      }
    }

    initApp()
  }, [])

  const loadDataFromStorage = async () => {
    if (window.electronAPI && window.electronAPI.loadData) {
      const savedData = await window.electronAPI.loadData()
      if (savedData) {
        setEntries(savedData)
      }
    } else {
      console.error("Electron API not available")
    }
  }

  const saveEntry = () => {
    if (!validateMateriale()) {
      setShowValidationErrors(true)
      setCostValidationOpen(true)
      return
    }

    if (!validateLucrari()) {
      setShowValidationErrors(true)
      setCostValidationOpen(true)
      return
    }

    const filteredMateriale = currentEntry.materiale.filter((material) => {
      // Keep row if any field is filled
      return material.material.trim() !== "" || material.cantitate > 0 || material.pret > 0
    })

    const filteredLucrari = currentEntry.lucrari.filter((lucrare) => {
      // Keep row if any field is filled
      return lucrare.lucrare.trim() !== "" || lucrare.pret > 0
    })

    const newEntry: Entry = {
      numarInmatriculare: currentEntry.numarInmatriculare,
      date: currentEntry.dataIntrareService,
      data: {
        marcaAuto: currentEntry.marcaAuto,
        modelAuto: currentEntry.modelAuto,
        motorizare: currentEntry.motorizare,
        anFabricatie: currentEntry.anFabricatie,
        kilometri: currentEntry.kilometri,
        serieSasiu: currentEntry.serieSasiu,
        numeProprietar: currentEntry.numeProprietar,
        numarTelefon: currentEntry.numarTelefon,
        materiale: filteredMateriale,
        lucrari: filteredLucrari,
        includeTVA: currentEntry.includeTVA,
        schimbUleiReminder: currentEntry.schimbUleiReminder,
      },
    }

    if (window.electronAPI && window.electronAPI.saveData) {
      window.electronAPI.saveData(newEntry)
    }

    setEntries((prevEntries) => {
      const updatedEntries = { ...prevEntries }
      if (!updatedEntries[newEntry.numarInmatriculare]) {
        updatedEntries[newEntry.numarInmatriculare] = []
      }

      const existingEntryIndex = updatedEntries[newEntry.numarInmatriculare].findIndex(
        (entry) => entry.date === newEntry.date,
      )

      if (existingEntryIndex !== -1) {
        updatedEntries[newEntry.numarInmatriculare][existingEntryIndex] = newEntry
      } else {
        updatedEntries[newEntry.numarInmatriculare].push(newEntry)
      }

      updatedEntries[newEntry.numarInmatriculare].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )

      return updatedEntries
    })

    if (partialEditMode) {
      setPartialEditMode(false)
      setViewMode("view")
    } else {
      // Stay in edit mode with the current entry
      setViewMode("view")
    }
    // Reset tempPriceInputs after saving
    setTempPriceInputs({ materiale: {}, lucrari: {} })
  }

  const handleDeleteConfirm = async () => {
    if (entryToDelete) {
      try {
        if (entryToDelete.date) {
          await window.electronAPI.deleteData(entryToDelete.numarInmatriculare, entryToDelete.date)
          setEntries((prevEntries) => {
            const updatedEntries = { ...prevEntries }
            updatedEntries[entryToDelete.numarInmatriculare] = updatedEntries[entryToDelete.numarInmatriculare].filter(
              (entry) => entry.date !== entryToDelete.date,
            )
            if (updatedEntries[entryToDelete.numarInmatriculare].length === 0) {
              delete updatedEntries[entryToDelete.numarInmatriculare]
            }
            return updatedEntries
          })
        } else {
          const entriesToDelete = entries[entryToDelete.numarInmatriculare]
          for (const entry of entriesToDelete) {
            await window.electronAPI.deleteData(entryToDelete.numarInmatriculare, entry.date)
          }
          setEntries((prevEntries) => {
            const updatedEntries = { ...prevEntries }
            delete updatedEntries[entryToDelete.numarInmatriculare]
            return updatedEntries
          })
        }
        setDeleteConfirmOpen(false)
        setEntryToDelete(null)
      } catch (error) {
        console.error("Error deleting entry:", error)
        alert("A apărut o eroare la ștergerea înregistrării")
      }
    }
  }

  const handleExportPDF = async () => {
    const folderName = currentEntry.includeTVA ? "Extreme Service" : "Service"
    setPendingPDFFolderName(folderName)
    setPendingPDFAction("single")
    setSavePDFDialogOpen(true)
  }

  const handleConfirmSavePDF = async () => {
    if (pendingPDFAction === "single") {
      try {
        // Use the stored folder name
        const folderName = pendingPDFFolderName

        const result = await window.electronAPI.exportPDF({
          numarInmatriculare: currentEntry.numarInmatriculare,
          date: currentEntry.dataIntrareService,
          folderName,
          data: {
            marcaAuto: currentEntry.marcaAuto,
            modelAuto: currentEntry.modelAuto,
            motorizare: currentEntry.motorizare,
            anFabricatie: currentEntry.anFabricatie,
            kilometri: currentEntry.kilometri,
            serieSasiu: currentEntry.serieSasiu,
            numeProprietar: currentEntry.numeProprietar,
            numarTelefon: currentEntry.numarTelefon,
            materiale: currentEntry.materiale.filter((material) => {
              return material.material.trim() !== "" || material.cantitate > 0 || material.pret > 0
            }),
            lucrari: currentEntry.lucrari.filter((l) => l.lucrare.trim() !== "" || l.pret > 0),
            includeTVA: currentEntry.includeTVA,
            schimbUleiReminder: currentEntry.schimbUleiReminder,
          },
        })

        setExportStatus({
          show: true,
          success: result.success,
          message: result.message,
        })

        setTimeout(() => {
          setExportStatus({ show: false, success: false, message: "" })
        }, 3000)
      } catch (error) {
        console.error("Error exporting PDF:", error)
        setExportStatus({
          show: true,
          success: false,
          message: "Eroare la exportul PDF",
        })

        setTimeout(() => {
          setExportStatus({ show: false, success: false, message: "" })
        }, 3000)
      }
    } else if (pendingPDFAction === "istoric") {
      await handleConfirmIstoricPDF()
    }

    setPendingPDFAction(null) // Reset pending action after confirmation
  }

  const handleExport = useCallback(
    async (numarInmatriculare: string) => {
      const entriesToExport = entries[numarInmatriculare]
      if (entriesToExport && entriesToExport.length > 0) {
        setPendingIstoricLicensePlate(numarInmatriculare)
        setPendingPDFFolderName("Istoric Service")
        setPendingPDFAction("istoric")
        setSavePDFDialogOpen(true)
      }
    },
    [entries],
  )

  const handleConfirmIstoricPDF = async () => {
    const licensePlate = pendingIstoricLicensePlate
    if (!licensePlate) return

    const entriesToExport = entries[licensePlate]
    if (entriesToExport && entriesToExport.length > 0) {
      try {
        const result = await window.electronAPI.exportLicensePlatePDF({
          numarInmatriculare: licensePlate,
          folderName: "Istoric Service", // Use the already set folder name
          entries: entriesToExport,
        })
        if (result.success) {
          setExportStatus({
            show: true,
            success: true,
            message: "PDF exportat cu succes",
          })
        } else {
          setExportStatus({
            show: true,
            success: false,
            message: "Eroare la exportul PDF: " + result.message,
          })
        }

        setTimeout(() => {
          setExportStatus({ show: false, success: false, message: "" })
        }, 3000)
      } catch (error) {
        console.error("Error exporting PDF:", error)
        setExportStatus({
          show: true,
          success: false,
          message: "A apărut o eroare la exportul PDF",
        })

        setTimeout(() => {
          setExportStatus({ show: false, success: false, message: "" })
        }, 3000)
      }
    }
  }

  // </CHANGE> Use Electron API for print preview instead of window.print()
  const handlePrint = async () => {
    try {
      const data = {
        numarInmatriculare: currentEntry.numarInmatriculare,
        date: currentEntry.dataIntrareService,
        data: {
          marcaAuto: currentEntry.marcaAuto,
          modelAuto: currentEntry.modelAuto,
          motorizare: currentEntry.motorizare,
          anFabricatie: currentEntry.anFabricatie,
          kilometri: currentEntry.kilometri,
          serieSasiu: currentEntry.serieSasiu,
          numeProprietar: currentEntry.numeProprietar,
          numarTelefon: currentEntry.numarTelefon,
          materiale: currentEntry.materiale.filter((material) => {
            return material.material.trim() !== "" || material.cantitate > 0 || material.pret > 0
          }),
          lucrari: currentEntry.lucrari.filter((l) => l.lucrare.trim() !== "" || l.pret > 0),
          includeTVA: currentEntry.includeTVA,
          schimbUleiReminder: currentEntry.schimbUleiReminder,
        },
      }

      const result = await window.electronAPI.printPreview(data)

      if (!result.success) {
        console.error("Print preview error:", result.message)
        setExportStatus({
          show: true,
          success: false,
          message: result.message || "Eroare la deschiderea preview-ului de printare",
        })

        setTimeout(() => {
          setExportStatus({ show: false, success: false, message: "" })
        }, 3000)
      }
    } catch (error) {
      console.error("Error opening print preview:", error)
      setExportStatus({
        show: true,
        success: false,
        message: "Eroare la deschiderea preview-ului de printare",
      })

      setTimeout(() => {
        setExportStatus({ show: false, success: false, message: "" })
      }, 3000)
    }
  }

  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-content, .print-content * {
          visibility: visible;
        }
        .print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
        .print-only {
          display: block !important;
        }
      }
      @media screen {
        .print-only {
          display: none;
        }
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // ============ CALCULATE TOTALS ============
  const totalMateriale = useMemo(() => {
    return currentEntry.materiale.reduce((sum, material) => sum + material.pret, 0)
  }, [currentEntry.materiale])

  const totalLucrari = useMemo(() => {
    return currentEntry.lucrari.reduce((sum, lucrare) => sum + lucrare.pret, 0)
  }, [currentEntry.lucrari])

  const totalCost = useMemo(() => {
    return totalMateriale + totalLucrari
  }, [totalMateriale, totalLucrari])

  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm !== "" || singleDateFilter !== "" || (dateRangeFilter?.start !== "" && dateRangeFilter?.end !== "")
    )
  }, [searchTerm, singleDateFilter, dateRangeFilter])

  const isFormValid = useMemo(() => {
    return (
      currentEntry.numarInmatriculare.trim() !== "" &&
      validateMateriale() &&
      validateLucrari() &&
      currentEntry.materiale.every((m) => m.material.trim() !== "" || m.cantitate === 0 || m.pret === 0) &&
      currentEntry.lucrari.every((l) => l.lucrare.trim() !== "" || l.pret === 0)
    )
  }, [currentEntry])

  const listContainerRef = useRef<HTMLDivElement>(null)
  const [listHeight, setListHeight] = useState(600)

  useEffect(() => {
    const updateListHeight = () => {
      if (listContainerRef.current) {
        const rect = listContainerRef.current.getBoundingClientRect()
        setListHeight(rect.height)
      }
    }

    updateListHeight()
    window.addEventListener("resize", updateListHeight)
    return () => window.removeEventListener("resize", updateListHeight)
  }, [])

  const entriesArray = useMemo(() => {
    return Object.entries(dateFilteredEntries)
  }, [dateFilteredEntries])

  const renderListItem = useCallback(
    (item: [string, Entry[]], index: number) => {
      const [numarInmatriculare, entriesForPlate] = item
      return (
        <div className="px-1 pb-2" key={numarInmatriculare}>
          <OptimizedEntryCard
            numarInmatriculare={numarInmatriculare}
            entries={entriesForPlate}
            isExpanded={expandedEntries.includes(numarInmatriculare)}
            onToggleExpand={toggleExpand}
            onEntryClick={handleEntryClick}
            onDeleteClick={handleDeleteClick}
            onExportClick={handleExport}
            formatDateForDisplay={formatDateForDisplay}
          />
        </div>
      )
    },
    [expandedEntries, toggleExpand, handleEntryClick, handleDeleteClick, handleExport, formatDateForDisplay],
  )

  // ============ RENDER ============

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Show loading state while checking activation */}
      {isActivated === null && (
        <div className="fixed inset-0 bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Se încarcă...</p>
          </div>
        </div>
      )}

      {/* Show activation dialog if not activated */}
      {isActivated === false && <ActivationDialog onActivationSuccess={handleActivationSuccess} />}

      {/* Show main app if activated */}
      {isActivated === true && (
        <>
          <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-blue-400 shadow-lg">
            <div className="w-full max-w-5xl mx-auto px-6 py-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">EXTREME SERVICE</h1>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setDashboardOpen(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-white text-blue-600 border-white hover:bg-blue-50"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button
                    onClick={() => setBackupDialogOpen(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-white text-blue-600 border-white hover:bg-blue-50"
                  >
                    <Database className="h-4 w-4" />
                    Backup
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-24 pb-24">
            <div className="w-full max-w-5xl mx-auto px-6">
              <div className="flex gap-6">
                <div
                  className="w-1/4 fixed left-0 top-24 bottom-24 overflow-hidden no-print"
                  style={{
                    width: "calc((100vw - 1280px) / 2 + 320px)",
                    maxWidth: "320px",
                    left: "max(24px, calc((100vw - 1280px) / 2))",
                  }}
                >
                  <div className="h-full flex flex-col pl-6 pr-6 border-r border-gray-200">
                    <h2 className="text-xl font-semibold mb-4">Lista înregistrări</h2>

                    <div className="relative mb-3">
                      <Input
                        type="text"
                        placeholder="Căutare după număr..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                        className="pl-10 pr-10"
                      />
                      <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      {isSearching && (
                        <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="mb-2">
                      <div className="flex gap-2">
                        <Button
                          variant={dateFilterMode === "single" ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setDateFilterMode("single")
                            setDateRangeFilter(null)
                          }}
                          className="flex-1 text-xs"
                        >
                          Dată unică
                        </Button>
                        <Button
                          variant={dateFilterMode === "range" ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setDateFilterMode("range")
                            setSingleDateFilter("")
                          }}
                          className="flex-1 text-xs"
                        >
                          Interval
                        </Button>
                      </div>
                    </div>

                    <div className="mb-3">
                      {dateFilterMode === "single" ? (
                        <DatePicker
                          value={singleDateFilter}
                          onChange={setSingleDateFilter}
                          placeholder="Selectează data..."
                        />
                      ) : (
                        <DateRangePicker
                          value={dateRangeFilter}
                          onChange={setDateRangeFilter}
                          placeholder="Selectează intervalul..."
                        />
                      )}
                    </div>

                    {hasActiveFilters && (
                      <div className="mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearAllFilters}
                          className="w-full text-red-600 border-red-300 hover:bg-red-50 bg-transparent"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Șterge toate filtrele
                        </Button>
                      </div>
                    )}

                    <div ref={listContainerRef} className="flex-1 overflow-y-auto space-y-2">
                      {entriesArray.length > 0 ? (
                        entriesArray.map((item, index) => renderListItem(item, index))
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          {hasActiveFilters
                            ? "Nu s-au găsit înregistrări care să corespundă filtrelor"
                            : "Nu există înregistrări"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-3/4 ml-auto overflow-y-auto pr-6 pl-6" style={{ maxHeight: "calc(100vh - 192px)" }}>
                  <div className="print-content" ref={printContentRef}>
                    <h1 className="text-2xl font-bold text-center text-blue-600 mb-6 print-only">EXTREME SERVICE</h1>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-group">
                        <Label htmlFor="numarInmatriculare" className="text-sm font-medium text-gray-700">
                          Număr înmatriculare
                        </Label>
                        <Input
                          id="numarInmatriculare"
                          name="numarInmatriculare"
                          value={currentEntry.numarInmatriculare}
                          onChange={handleInputChange}
                          maxLength={60}
                          readOnly={viewMode === "view" || partialEditMode}
                          className="mt-1"
                        />
                      </div>
                      <div className="form-group">
                        <Label htmlFor="marcaAuto" className="text-sm font-medium text-gray-700">
                          Marcă Auto
                        </Label>
                        <Input
                          id="marcaAuto"
                          name="marcaAuto"
                          value={currentEntry.marcaAuto}
                          onChange={handleInputChange}
                          maxLength={60}
                          readOnly={viewMode === "view"}
                          className="mt-1"
                        />
                      </div>
                      <div className="form-group">
                        <Label htmlFor="modelAuto" className="text-sm font-medium text-gray-700">
                          Model Auto
                        </Label>
                        <Input
                          id="modelAuto"
                          name="modelAuto"
                          value={currentEntry.modelAuto}
                          onChange={handleInputChange}
                          maxLength={60}
                          readOnly={viewMode === "view"}
                          className="mt-1"
                        />
                      </div>
                      <div className="form-group">
                        <Label htmlFor="motorizare" className="text-sm font-medium text-gray-700">
                          Motorizare
                        </Label>
                        <Input
                          id="motorizare"
                          name="motorizare"
                          value={currentEntry.motorizare}
                          onChange={handleInputChange}
                          maxLength={60}
                          readOnly={viewMode === "view"}
                          className="mt-1"
                        />
                      </div>
                      <div className="form-group">
                        <Label htmlFor="anFabricatie" className="text-sm font-medium text-gray-700">
                          An fabricație
                        </Label>
                        <Input
                          id="anFabricatie"
                          name="anFabricatie"
                          value={currentEntry.anFabricatie}
                          onChange={handleInputChange}
                          maxLength={60}
                          readOnly={viewMode === "view"}
                          className="mt-1"
                        />
                      </div>
                      <div className="form-group">
                        <Label htmlFor="kilometri" className="text-sm font-medium text-gray-700">
                          Kilometri
                        </Label>
                        <Input
                          id="kilometri"
                          name="kilometri"
                          value={currentEntry.kilometri}
                          onChange={handleInputChange}
                          maxLength={60}
                          readOnly={viewMode === "view"}
                          className="mt-1"
                        />
                      </div>
                      <div className="form-group">
                        <Label htmlFor="serieSasiu" className="text-sm font-medium text-gray-700">
                          Serie șasiu
                        </Label>
                        <Input
                          id="serieSasiu"
                          name="serieSasiu"
                          value={currentEntry.serieSasiu}
                          onChange={handleInputChange}
                          maxLength={60}
                          readOnly={viewMode === "view"}
                          className="mt-1"
                        />
                      </div>
                      <div className="form-group">
                        <Label htmlFor="dataIntrareService" className="text-sm font-medium text-gray-700">
                          Data intrare în service
                        </Label>
                        <DatePicker
                          value={currentEntry.dataIntrareService}
                          onChange={(date: string) =>
                            setCurrentEntry((prev) => ({ ...prev, dataIntrareService: date }))
                          }
                          disabled={viewMode === "view" || partialEditMode}
                          className="mt-1"
                        />
                      </div>
                      <div className="form-group">
                        <Label htmlFor="numeProprietar" className="text-sm font-medium text-gray-700">
                          Nume proprietar
                        </Label>
                        <Input
                          id="numeProprietar"
                          name="numeProprietar"
                          value={currentEntry.numeProprietar}
                          onChange={handleInputChange}
                          maxLength={60}
                          readOnly={viewMode === "view"}
                          className="mt-1"
                        />
                      </div>
                      <div className="form-group">
                        <Label htmlFor="numarTelefon" className="text-sm font-medium text-gray-700">
                          Număr telefon
                        </Label>
                        <Input
                          id="numarTelefon"
                          name="numarTelefon"
                          value={currentEntry.numarTelefon}
                          onChange={handleInputChange}
                          maxLength={60}
                          readOnly={viewMode === "view"}
                          className="mt-1"
                        />
                      </div>
                      <SchimbUleiButton
                        isChecked={!!currentEntry.schimbUleiReminder}
                        onChange={handleSchimbUleiChange}
                        readOnly={viewMode === "view"}
                      />
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-2 no-print">
                      <Label htmlFor="vat-toggle" className="text-sm font-medium">
                        Afișează TVA (21%)
                      </Label>
                      <Switch
                        checked={currentEntry.includeTVA}
                        onCheckedChange={(checked) => setCurrentEntry((prev) => ({ ...prev, includeTVA: checked }))}
                        disabled={viewMode === "view" && !partialEditMode}
                      />
                    </div>

                    <div className="mt-6 bg-blue-500 rounded-lg overflow-hidden shadow-lg">
                      <div className="p-4">
                        <h2 className="text-xl font-semibold text-white mb-4">Detaliere Materiale</h2>
                        <div className="space-y-4">
                          <div className="grid grid-cols-5 gap-4 text-white font-semibold text-sm">
                            <div className="col-span-2">Materiale</div>
                            <div>Cantitate</div>
                            <div>Preț</div>
                            {currentEntry.includeTVA && <div>TVA</div>}
                          </div>
                          {currentEntry.materiale.map((material, index) => (
                            <MaterialInput
                              key={index}
                              material={material}
                              index={index}
                              onMaterialChange={handleMaterialChange}
                              onRemoveMaterial={removeMaterial}
                              readOnly={viewMode === "view"}
                              showValidationErrors={showValidationErrors}
                              isInvalidMaterial={isInvalidMaterial}
                              isInvalidCantitate={isInvalidCantitate}
                              isInvalidPret={isInvalidPret}
                              includeTVA={currentEntry.includeTVA}
                              tempPriceValue={tempPriceInputs.materiale[index]}
                              onPriceBlur={(idx) => {
                                setTempPriceInputs((prev) => {
                                  const newMateriale = { ...prev.materiale }
                                  delete newMateriale[idx]
                                  return { ...prev, materiale: newMateriale }
                                })
                              }}
                            />
                          ))}
                        </div>
                        {(viewMode === "edit" || partialEditMode) && (
                          <div className="mt-4">
                            <Button onClick={addMaterial} variant="secondary" className="flex items-center">
                              <Plus className="w-4 h-4 mr-2" />
                              Adaugă Material
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 bg-green-500 rounded-lg overflow-hidden shadow-lg">
                      <div className="p-4">
                        <h2 className="text-xl font-semibold text-white mb-4">Detaliere Manoperă</h2>
                        <div className="space-y-4">
                          <div className="grid grid-cols-4 gap-4 text-white font-semibold text-sm">
                            <div className="col-span-2">Lucrări</div>
                            <div>Preț</div>
                            {currentEntry.includeTVA && <div>TVA</div>}
                          </div>
                          {currentEntry.lucrari.map((lucrare, index) => (
                            <LucrareInput
                              key={index}
                              lucrare={lucrare}
                              index={index}
                              onLucrareChange={handleLucrareChange}
                              onRemoveLucrare={removeLucrare}
                              readOnly={viewMode === "view"}
                              showValidationErrors={showValidationErrors}
                              isInvalidDescription={isInvalidDescription}
                              isInvalidCost={isInvalidCost}
                              includeTVA={currentEntry.includeTVA}
                              tempPriceValue={tempPriceInputs.lucrari[index]}
                              onPriceBlur={(idx) => {
                                setTempPriceInputs((prev) => {
                                  const newLucrari = { ...prev.lucrari }
                                  delete newLucrari[idx]
                                  return { ...prev, lucrari: newLucrari }
                                })
                              }}
                            />
                          ))}
                        </div>
                        {(viewMode === "edit" || partialEditMode) && (
                          <div className="mt-4">
                            <Button onClick={addLucrare} variant="secondary" className="flex items-center">
                              <Plus className="w-4 h-4 mr-2" />
                              Adaugă Lucrare
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                      <div className="p-6">
                        <table className="w-full text-white">
                          <thead>
                            <tr className="border-b border-gray-600">
                              <th className="text-left pb-3"></th>
                              <th className="text-right pb-3 px-4">Preț</th>
                              {currentEntry.includeTVA && <th className="text-right pb-3 px-4">TVA</th>}
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-gray-700">
                              <td className="py-3 font-semibold">Total materiale:</td>
                              <td className="text-right py-3 px-4 font-semibold">{totalMateriale.toFixed(2)} RON</td>
                              {currentEntry.includeTVA && (
                                <td className="text-right py-3 px-4 font-semibold">
                                  {(totalMateriale * 0.21).toFixed(2)} RON
                                </td>
                              )}
                            </tr>
                            <tr className="border-b border-gray-700">
                              <td className="py-3 font-semibold">Total manoperă:</td>
                              <td className="text-right py-3 px-4 font-semibold">{totalLucrari.toFixed(2)} RON</td>
                              {currentEntry.includeTVA && (
                                <td className="text-right py-3 px-4 font-semibold">
                                  {(totalLucrari * 0.21).toFixed(2)} RON
                                </td>
                              )}
                            </tr>
                            <tr className="border-t-2 border-gray-500">
                              <td className="py-3 font-bold text-xl">TOTAL:</td>
                              <td className="text-right py-3 px-4 font-bold text-xl">{totalCost.toFixed(2)} RON</td>
                              {currentEntry.includeTVA && (
                                <td className="text-right py-3 px-4 font-bold text-xl">
                                  {(totalCost * 1.21).toFixed(2)} RON
                                </td>
                              )}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mt-4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg no-print">
            <div className="w-full max-w-5xl mx-auto px-6 py-4">
              <div className="flex justify-center gap-4">
                {viewMode === "edit" ? (
                  <>
                    <Button
                      onClick={saveEntry}
                      disabled={!isFormValid}
                      className={`
                        text-white
                        ${isFormValid ? "bg-blue-400 hover:bg-blue-600" : "bg-gray-600 cursor-not-allowed"}
                      `}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvează
                    </Button>

                    {/* Vertical separator */}
                    <div className="border-l-2 border-gray-300 h-10 self-center"></div>

                    <Button
                      onClick={handleExportPDF}
                      disabled={!isPrintButtonEnabled}
                      className={`
                        text-white
                        ${isPrintButtonEnabled ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-400 cursor-not-allowed"}
                      `}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Deviz PDF
                    </Button>
                    <Button
                      onClick={handlePrint}
                      disabled={!isPrintButtonEnabled}
                      className={`
                        text-white
                        ${isPrintButtonEnabled ? "bg-orange-600 hover:bg-orange-700" : "bg-gray-400 cursor-not-allowed"}
                      `}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Printează
                    </Button>
                  </>
                ) : partialEditMode ? (
                  <>
                    <Button
                      onClick={() => {
                        setPartialEditMode(false)
                        const foundEntries = entries[currentEntry.numarInmatriculare]
                        if (foundEntries) {
                          const entry = foundEntries.find((e) => e.date === currentEntry.dataIntrareService)
                          if (entry) {
                            setCurrentEntry({
                              ...entry.data,
                              numarInmatriculare: entry.numarInmatriculare,
                              dataIntrareService: entry.date,
                            })
                          }
                        }
                        // Reset tempPriceInputs when cancelling edit
                        setTempPriceInputs({ materiale: {}, lucrari: {} })
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Anulează
                    </Button>
                    <Button
                      onClick={saveEntry}
                      disabled={!isFormValid}
                      className={`
                        text-white
                        ${isFormValid ? "bg-blue-400 hover:bg-blue-600" : "bg-gray-600 cursor-not-allowed"}
                      `}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvează
                    </Button>

                    {/* Vertical separator */}
                    <div className="border-l-2 border-gray-300 h-10 self-center"></div>

                    <Button
                      onClick={handleExportPDF}
                      disabled={!isPrintButtonEnabled}
                      className={`
                        text-white
                        ${isPrintButtonEnabled ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-400 cursor-not-allowed"}
                      `}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Deviz PDF
                    </Button>
                    <Button
                      onClick={handlePrint}
                      disabled={!isPrintButtonEnabled}
                      className={`
                        text-white
                        ${isPrintButtonEnabled ? "bg-orange-600 hover:bg-orange-700" : "bg-gray-400 cursor-not-allowed"}
                      `}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Printează
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        setViewMode("edit")
                        setCurrentEntry({
                          numarInmatriculare: "",
                          marcaAuto: "",
                          modelAuto: "",
                          motorizare: "",
                          anFabricatie: "",
                          kilometri: "",
                          serieSasiu: "",
                          dataIntrareService: new Date().toISOString().split("T")[0],
                          numeProprietar: "",
                          numarTelefon: "",
                          materiale: [
                            { material: "", cantitate: 0, pret: 0 },
                            { material: "", cantitate: 0, pret: 0 },
                            { material: "", cantitate: 0, pret: 0 },
                          ],
                          lucrari: [
                            { lucrare: "", pret: 0 },
                            { lucrare: "", pret: 0 },
                            { lucrare: "", pret: 0 },
                          ],
                          includeTVA: true,
                          schimbUleiReminder: null,
                        })
                        setSearchTerm("")
                        setShowValidationErrors(false)
                        // Reset tempPriceInputs when creating a new entry
                        setTempPriceInputs({ materiale: {}, lucrari: {} })
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Deviz nou
                    </Button>
                    <Button
                      onClick={() => setPartialEditMode(true)}
                      className="bg-blue-400 hover:bg-blue-600 text-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editează
                    </Button>

                    {/* Vertical separator */}
                    <div className="border-l-2 border-gray-300 h-10 self-center"></div>

                    <Button
                      onClick={handleExportPDF}
                      disabled={!isPrintButtonEnabled}
                      className={`
                        text-white
                        ${isPrintButtonEnabled ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-400 cursor-not-allowed"}
                      `}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Deviz PDF
                    </Button>
                    <Button
                      onClick={handlePrint}
                      disabled={!isPrintButtonEnabled}
                      className={`
                        text-white
                        ${isPrintButtonEnabled ? "bg-orange-600 hover:bg-orange-700" : "bg-gray-400 cursor-not-allowed"}
                      `}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Printează
                    </Button>
                  </>
                )}
              </div>

              {/* Export Status Notification */}
              {exportStatus.show && (
                <div
                  className={`mt-4 p-3 rounded-md text-center ${
                    exportStatus.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {exportStatus.message}
                </div>
              )}
            </div>
          </div>

          {/* Dialogs */}
          <Dialog open={costValidationOpen} onOpenChange={setCostValidationOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Câmpuri incomplete</DialogTitle>
                <DialogDescription>
                  Există câmpuri goale în tabelele de materiale sau lucrări. Câmpurile marcate cu roșu trebuie
                  completate sau rândurile goale trebuie șterse pentru a putea salva.
                  <br />
                  <br />
                  <strong>Opțiuni:</strong>
                  <ul className="list-disc list-inside mt-2">
                    <li>Completați toate câmpurile marcate cu roșu</li>
                    <li>Sau ștergeți rândurile care au câmpuri goale</li>
                  </ul>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setCostValidationOpen(false)}>OK</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={descriptionValidationOpen} onOpenChange={setDescriptionValidationOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Descriere invalidă</DialogTitle>
                <DialogDescription>
                  Descrierea lucrării este goală. Adaugă o descriere sau șterge rândul pentru a putea salva.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setDescriptionValidationOpen(false)}>OK</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmare ștergere</DialogTitle>
                <DialogDescription>
                  {entryToDelete?.date
                    ? `Doriți să ștergeți această înregistrare: '${entryToDelete.numarInmatriculare} - ${entryToDelete.date}'?`
                    : `Doriți să ștergeți toate înregistrările pentru numărul de înmatriculare: '${entryToDelete?.numarInmatriculare}'?`}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                  Înapoi
                </Button>
                <Button variant="destructive" onClick={handleDeleteConfirm}>
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add SavePDFConfirmDialog here */}
          <SavePDFConfirmDialog
            open={savePDFDialogOpen}
            onOpenChange={setSavePDFDialogOpen}
            onConfirm={handleConfirmSavePDF}
            folderName={pendingPDFFolderName}
          />

          <DashboardDialog
            open={dashboardOpen}
            onOpenChange={setDashboardOpen}
            entries={entries}
            groupedOilChanges={groupedOilChanges}
            closedReminders={closedReminders}
            onCloseReminder={handleCloseReminder}
          />
          <BackupRestoreDialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen} />
        </>
      )}
    </div>
  )
}

"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Button } from "../components/ui/button"
import {
  BarChart3,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Target,
  Award,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  Trash2,
} from "lucide-react"
import { Input } from "../components/ui/input"

interface Entry {
  numarInmatriculare: string
  date: string
  data: {
    materiale?: { material: string; cantitate: number; pret: number }[]
    lucrari: { lucrare: string; pret: number }[]
    includeTVA?: boolean
    [key: string]: any
  }
}

interface DashboardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entries: { [key: string]: Entry[] }
  groupedOilChanges: { [key: string]: Array<{ date: string; reminderDate: string; isActive: boolean }> }
  closedReminders: string[]
  onCloseReminder: (reminderId: string) => void
}

// Modificăm interfața OilChangeListProps pentru a include entries
interface OilChangeListProps {
  groupedOilChanges: { [key: string]: Array<{ date: string; reminderDate: string; isActive: boolean }> }
  entries: { [key: string]: Entry[] }
  type: "active" | "overdue"
  closedReminders: string[]
  onCloseReminder: (reminderId: string) => void
}

// Modificăm funcția OilChangeList pentru a include numele proprietarului și numărul de telefon
function OilChangeList({ groupedOilChanges, entries, type, closedReminders, onCloseReminder }: OilChangeListProps) {
  // Extrage toate schimburile de ulei din groupedOilChanges
  const oilChanges = useMemo(() => {
    const today = new Date()
    const allOilChanges: Array<{
      numarInmatriculare: string
      dateChanged: string
      reminderDate: string
      daysRemaining: number
      reminderId: string
      numeProprietar: string
      numarTelefon: string
    }> = []

    Object.entries(groupedOilChanges).forEach(([numarInmatriculare, oilChangesForPlate]) => {
      // Filtrăm doar schimburile active și care nu sunt închise
      oilChangesForPlate
        .filter((change) => change.isActive)
        .forEach((change) => {
          const reminderDate = new Date(change.reminderDate)
          const timeDiff = reminderDate.getTime() - today.getTime()
          const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24))
          const reminderId = `${numarInmatriculare}-${change.date}`

          // Găsim înregistrarea corespunzătoare pentru a obține numele proprietarului și numărul de telefon
          const plateEntries = entries[numarInmatriculare] || []
          const matchingEntry = plateEntries.find((entry) => entry.date === change.date)
          const numeProprietar = matchingEntry?.data.numeProprietar || "N/A"
          const numarTelefon = matchingEntry?.data.numarTelefon || "N/A"

          // Verificăm dacă reminderul nu este închis
          if (!closedReminders.includes(reminderId)) {
            // Pentru tab-ul "Active", includem TOATE reminder-urile viitoare (daysRemaining > 0), nu doar următoarele 30 zile
            if ((type === "overdue" && daysRemaining <= 0) || (type === "active" && daysRemaining > 0)) {
              allOilChanges.push({
                numarInmatriculare,
                dateChanged: change.date,
                reminderDate: change.reminderDate,
                daysRemaining,
                reminderId,
                numeProprietar,
                numarTelefon,
              })
            }
          }
        })
    })

    // Sortăm după zilele rămase (crescător pentru active, descrescător pentru întârziate)
    return allOilChanges.sort(
      (a, b) =>
        type === "active"
          ? a.daysRemaining - b.daysRemaining // Cele mai urgente primele pentru active
          : b.daysRemaining - a.daysRemaining, // Cele mai întârziate primele pentru overdue
    )
  }, [groupedOilChanges, entries, type, closedReminders])

  // Formatare dată pentru afișare
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ro-RO")
  }

  return (
    <div className="space-y-4">
      {oilChanges.length > 0 ? (
        oilChanges.map((oilChange, index) => (
          <div
            key={`${oilChange.numarInmatriculare}-${oilChange.dateChanged}`}
            className={`p-4 rounded-lg border ${
              type === "active" ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{oilChange.numarInmatriculare}</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Schimb efectuat:</span>
                    <span>{formatDate(oilChange.dateChanged)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Următorul schimb:</span>
                    <span className="font-medium">{formatDate(oilChange.reminderDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Proprietar:</span>
                    <span>{oilChange.numeProprietar}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Telefon:</span>
                    <span>{oilChange.numarTelefon}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div
                  className={`px-3 py-2 rounded-full ${
                    type === "active" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {type === "active" ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      <span>Peste {oilChange.daysRemaining} zile</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>Întârziat cu {Math.abs(oilChange.daysRemaining)} zile</span>
                    </div>
                  )}
                </div>
                {type === "overdue" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                    onClick={() => onCloseReminder(oilChange.reminderId)}
                    title="Șterge din lista de întârzieri"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          Nu există schimburi de ulei {type === "active" ? "active" : "întârziate"}.
        </div>
      )}
    </div>
  )
}

function PriceDisplay({ amount, className = "" }: { amount: number; className?: string }) {
  const pretFaraTVA = amount
  const pretCuTVA = amount * 1.21

  return (
    <div className={`text-right ${className}`}>
      <div className="font-semibold text-green-600">{pretFaraTVA.toFixed(2)} RON</div>
      <div className="text-xs text-gray-500">fără TVA</div>
      <div className="font-semibold text-green-700 mt-1">{pretCuTVA.toFixed(2)} RON</div>
      <div className="text-xs text-gray-500">cu TVA</div>
    </div>
  )
}

export default function DashboardDialog({
  open,
  onOpenChange,
  entries,
  groupedOilChanges,
  closedReminders,
  onCloseReminder,
}: DashboardDialogProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState("")
  const [overviewSelectedYear, setOverviewSelectedYear] = useState(new Date().getFullYear())
  const [comparisonYear1, setComparisonYear1] = useState<number | null>(null)
  const [comparisonYear2, setComparisonYear2] = useState<number | null>(null)
  const [workSearchTerm, setWorkSearchTerm] = useState("")

  const statistics = useMemo(() => {
    const allEntries = Object.values(entries).flat()
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()
    const currentWeek = getWeekNumber(today)

    // Helper function pentru săptămâna curentă
    function getWeekNumber(date: Date) {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
      const dayNum = d.getUTCDay() || 7
      d.setUTCDate(d.getUTCDate() + 4 - dayNum)
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
      return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
    }

    function isInCurrentWeek(date: Date) {
      const entryWeek = getWeekNumber(date)
      const entryYear = date.getFullYear()
      return entryWeek === currentWeek && entryYear === currentYear
    }

    // Statistici pentru ziua curentă
    const todayEntries = allEntries.filter((entry) => {
      const entryDate = new Date(entry.date)
      return entryDate.toDateString() === today.toDateString()
    })

    // Statistici pentru săptămâna curentă
    const weekEntries = allEntries.filter((entry) => {
      const entryDate = new Date(entry.date)
      return isInCurrentWeek(entryDate)
    })

    // Statistici pentru luna curentă
    const monthEntries = allEntries.filter((entry) => {
      const entryDate = new Date(entry.date)
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear
    })

    // Statistici pentru anul selectat în overview
    const overviewYearEntries = allEntries.filter((entry) => {
      const entryDate = new Date(entry.date)
      return entryDate.getFullYear() === overviewSelectedYear
    })

    // Calculare venituri
    const calculateRevenue = (entries: Entry[]) => {
      return entries.reduce((total, entry) => {
        const lucrariTotal = entry.data.lucrari.reduce((sum, lucrare) => sum + lucrare.pret, 0)
        const materialeTotal = entry.data.materiale?.reduce((sum, material) => sum + material.pret, 0) || 0
        return total + lucrariTotal + materialeTotal
      }, 0)
    }

    // Statistici pe luni pentru anul selectat
    const monthlyStats = Array.from({ length: 12 }, (_, monthIndex) => {
      const monthEntries = allEntries.filter((entry) => {
        const entryDate = new Date(entry.date)
        return entryDate.getMonth() === monthIndex && entryDate.getFullYear() === selectedYear
      })

      return {
        month: new Date(selectedYear, monthIndex).toLocaleDateString("ro-RO", { month: "long" }),
        devize: monthEntries.length,
        venit: calculateRevenue(monthEntries),
      }
    })

    // Statistici vehicule
    const vehicleStats: {
      [key: string]: { count: number; totalCost: number; lastVisit: string; daysSinceLastVisit: number }
    } = {}
    Object.entries(entries).forEach(([numarInmatriculare, entriesForPlate]) => {
      const sortedEntries = entriesForPlate.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      const lastVisit = sortedEntries[0]?.date || ""
      const daysSinceLastVisit = lastVisit
        ? Math.floor((today.getTime() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      vehicleStats[numarInmatriculare] = {
        count: entriesForPlate.length,
        totalCost: calculateRevenue(entriesForPlate),
        lastVisit,
        daysSinceLastVisit,
      }
    })

    const sortedVehicles = Object.entries(vehicleStats).sort((a, b) => b[1].count - a[1].count)

    // Analiza lucrărilor - TOP lucrări
    const workAnalysis: { [key: string]: { count: number; totalRevenue: number; avgCost: number } } = {}
    allEntries.forEach((entry) => {
      entry.data.lucrari.forEach((lucrare) => {
        if (lucrare.lucrare.trim() !== "") {
          const workName = lucrare.lucrare.trim().toUpperCase()
          if (!workAnalysis[workName]) {
            workAnalysis[workName] = { count: 0, totalRevenue: 0, avgCost: 0 }
          }
          workAnalysis[workName].count++
          workAnalysis[workName].totalRevenue += lucrare.pret
          workAnalysis[workName].avgCost = workAnalysis[workName].totalRevenue / workAnalysis[workName].count
        }
      })
    })

    const topWorksByRevenue = Object.entries(workAnalysis)
      .sort((a, b) => b[1].totalRevenue - a[1].totalRevenue)
      .slice(0, 10)

    const topWorksByFrequency = Object.entries(workAnalysis)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)

    // Analiza zilelor săptămânii
    const dayOfWeekStats = Array.from({ length: 7 }, (_, dayIndex) => {
      const dayEntries = allEntries.filter((entry) => {
        const entryDate = new Date(entry.date)
        return entryDate.getDay() === dayIndex
      })

      const dayNames = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"]

      return {
        day: dayNames[dayIndex],
        devize: dayEntries.length,
        venit: calculateRevenue(dayEntries),
        avgPerDay: dayEntries.length > 0 ? calculateRevenue(dayEntries) / dayEntries.length : 0,
      }
    }).sort((a, b) => b.venit - a.venit)

    // Clienți fideli (vehicule cu multe vizite)
    const loyalCustomers = Object.entries(vehicleStats)
      .filter(([_, stats]) => stats.count >= 3)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)

    // Vehicule care nu au mai venit de mult timp
    const inactiveCustomers = Object.entries(vehicleStats)
      .filter(([_, stats]) => stats.daysSinceLastVisit > 180) // 6 luni
      .sort((a, b) => b[1].daysSinceLastVisit - a[1].daysSinceLastVisit)
      .slice(0, 10)

    // Obține anii disponibili
    const availableYears = [...new Set(allEntries.map((entry) => new Date(entry.date).getFullYear()))].sort(
      (a, b) => b - a,
    )

    // Calculează veniturile pe ani
    const yearlyRevenues = availableYears.map((year) => {
      const yearEntries = allEntries.filter((entry) => {
        const entryDate = new Date(entry.date)
        return entryDate.getFullYear() === year
      })
      return {
        year,
        revenue: calculateRevenue(yearEntries),
      }
    })

    // Găsește anul cu cel mai mare venit
    const bestYear = yearlyRevenues.reduce((best, current) => (current.revenue > best.revenue ? current : best), {
      year: 0,
      revenue: 0,
    })

    // Calculează diferența de venit între anii selectați pentru comparație
    let revenueDifference = 0
    let comparisonData = null
    if (comparisonYear1 && comparisonYear2) {
      const year1Revenue = yearlyRevenues.find((y) => y.year === comparisonYear1)?.revenue || 0
      const year2Revenue = yearlyRevenues.find((y) => y.year === comparisonYear2)?.revenue || 0
      revenueDifference = year1Revenue - year2Revenue
      comparisonData = {
        year1: comparisonYear1,
        year2: comparisonYear2,
        year1Revenue,
        year2Revenue,
        difference: revenueDifference,
      }
    }

    return {
      today: {
        devize: todayEntries.length,
        venit: calculateRevenue(todayEntries),
      },
      week: {
        devize: weekEntries.length,
        venit: calculateRevenue(weekEntries),
      },
      month: {
        devize: monthEntries.length,
        venit: calculateRevenue(monthEntries),
      },
      overviewYear: {
        devize: overviewYearEntries.length,
        venit: calculateRevenue(overviewYearEntries),
      },
      monthlyStats,
      vehicleStats: sortedVehicles,
      totalEntries: allEntries.length,
      totalRevenue: calculateRevenue(allEntries),
      availableYears,
      yearlyRevenues,
      bestYear,
      comparisonData,
      workAnalysis: {
        topByRevenue: topWorksByRevenue,
        topByFrequency: topWorksByFrequency,
      },
      dayOfWeekStats,
      loyalCustomers,
      inactiveCustomers,
    }
  }, [entries, selectedYear, overviewSelectedYear, comparisonYear1, comparisonYear2])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dashboard - Statistici Service
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="overview">Prezentare generală</TabsTrigger>
            <TabsTrigger value="monthly">Statistici lunare</TabsTrigger>
            <TabsTrigger value="analysis">Analiză vehicule</TabsTrigger>
            <TabsTrigger value="works">Analiză lucrări</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="oilchange">Schimb ulei</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Statistici pentru astăzi */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Astăzi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Devize:</span>
                      <span className="font-semibold">{statistics.today.devize}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-gray-600">Venit:</span>
                      <PriceDisplay amount={statistics.today.venit} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistici pentru săptămâna curentă */}
              <Card className="bg-indigo-50 border-indigo-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-indigo-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Săptămâna curentă
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Devize:</span>
                      <span className="font-semibold">{statistics.week.devize}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-gray-600">Venit:</span>
                      <PriceDisplay amount={statistics.week.venit} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistici pentru luna curentă */}
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Luna curentă
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Devize:</span>
                      <span className="font-semibold">{statistics.month.devize}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-gray-600">Venit:</span>
                      <PriceDisplay amount={statistics.month.venit} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card pentru anul selectat în overview */}
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-purple-600 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Anul {overviewSelectedYear}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOverviewSelectedYear((prev) => prev - 1)}
                        disabled={!statistics.availableYears.includes(overviewSelectedYear - 1)}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOverviewSelectedYear((prev) => prev + 1)}
                        disabled={!statistics.availableYears.includes(overviewSelectedYear + 1)}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Devize:</span>
                      <span className="font-semibold">{statistics.overviewYear.devize}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-gray-600">Venit:</span>
                      <PriceDisplay amount={statistics.overviewYear.venit} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Statistici generale */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Statistici generale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total devize:</span>
                    <span className="font-semibold">{statistics.totalEntries}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Venit total:</span>
                    <PriceDisplay amount={statistics.totalRevenue} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicule unice:</span>
                    <span className="font-semibold">{Object.keys(entries).length}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Venit mediu/deviz:</span>
                    <PriceDisplay
                      amount={statistics.totalEntries > 0 ? statistics.totalRevenue / statistics.totalEntries : 0}
                    />
                  </div>
                  {statistics.bestYear.year > 0 && (
                    <div className="flex justify-between items-start col-span-2">
                      <span className="text-gray-600">Cel mai profitabil an:</span>
                      <div className="text-right">
                        <div className="font-semibold text-yellow-600 mb-2">{statistics.bestYear.year}</div>
                        <PriceDisplay amount={statistics.bestYear.revenue} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Secțiunea de comparație între ani */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-md font-semibold mb-3">Comparație între ani</h3>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Primul an:</label>
                      <select
                        value={comparisonYear1 || ""}
                        onChange={(e) => setComparisonYear1(e.target.value ? Number.parseInt(e.target.value) : null)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">Selectează anul</option>
                        {statistics.availableYears.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Al doilea an:</label>
                      <select
                        value={comparisonYear2 || ""}
                        onChange={(e) => setComparisonYear2(e.target.value ? Number.parseInt(e.target.value) : null)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">Selectează anul</option>
                        {statistics.availableYears.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {statistics.comparisonData && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-600">Venit {statistics.comparisonData.year1}:</span>
                        <PriceDisplay amount={statistics.comparisonData.year1Revenue} />
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-600">Venit {statistics.comparisonData.year2}:</span>
                        <PriceDisplay amount={statistics.comparisonData.year2Revenue} />
                      </div>
                      <div className="flex justify-between items-start border-t pt-2">
                        <span className="text-gray-600">
                          Diferența ({statistics.comparisonData.year1} vs {statistics.comparisonData.year2}):
                        </span>
                        <div className="text-right">
                          <div
                            className={`font-semibold ${
                              statistics.comparisonData.difference >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {statistics.comparisonData.difference >= 0 ? "+" : ""}
                            {(statistics.comparisonData.difference / 1.21).toFixed(2)} RON
                          </div>
                          <div className="text-xs text-gray-500">fără TVA</div>
                          <div
                            className={`font-semibold mt-1 ${
                              statistics.comparisonData.difference >= 0 ? "text-green-700" : "text-red-700"
                            }`}
                          >
                            {statistics.comparisonData.difference >= 0 ? "+" : ""}
                            {statistics.comparisonData.difference.toFixed(2)} RON
                          </div>
                          <div className="text-xs text-gray-500">cu TVA</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistici pe luni</CardTitle>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">Ani disponibili: {statistics.availableYears.join(", ")}</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedYear((prev) => prev - 1)}
                      disabled={!statistics.availableYears.includes(selectedYear - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold text-lg min-w-[80px] text-center">{selectedYear}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedYear((prev) => prev + 1)}
                      disabled={!statistics.availableYears.includes(selectedYear + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statistics.monthlyStats.map((month, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium capitalize">{month.month}</span>
                      <div className="flex gap-6">
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Devize</div>
                          <div className="font-semibold">{month.devize}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-1">Venit</div>
                          <PriceDisplay amount={month.venit} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistici vehicule</CardTitle>
                <div className="text-sm text-gray-600">
                  Lista tuturor vehiculelor sortate după frecvența înregistrărilor
                </div>
                <div className="mt-3">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Căutare după număr de înmatriculare..."
                      value={vehicleSearchTerm}
                      onChange={(e) => setVehicleSearchTerm(e.target.value.toUpperCase())}
                      className="pl-10"
                    />
                    <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {statistics.vehicleStats
                    .filter(([numarInmatriculare]) => numarInmatriculare.includes(vehicleSearchTerm))
                    .map(([numarInmatriculare, stats], index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <span className="font-medium text-lg">{numarInmatriculare}</span>
                            <div className="text-xs text-gray-500">
                              Ultima vizită: {new Date(stats.lastVisit).toLocaleDateString("ro-RO")} (
                              {stats.daysSinceLastVisit} zile în urmă)
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-6">
                          <div className="text-center">
                            <div className="text-sm text-gray-600">Înregistrări</div>
                            <div className="font-semibold">{stats.count}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-1">Cheltuială totală</div>
                            <PriceDisplay amount={stats.totalCost} />
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-1">Cheltuială medie</div>
                            <PriceDisplay amount={stats.totalCost / stats.count} />
                          </div>
                        </div>
                      </div>
                    ))}
                  {statistics.vehicleStats.length === 0 && (
                    <div className="text-center text-gray-500 py-8">Nu există vehicule înregistrate</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="works" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top lucrări după venit */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Top 10 - Cele mai profitabile lucrări
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {statistics.workAnalysis.topByRevenue.map(([workName, stats], index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <span className="font-medium text-sm">{workName}</span>
                            <div className="text-xs text-gray-500">
                              {stats.count} lucrări • Preț mediu: {(stats.avgCost / 1.21).toFixed(2)} RON (fără TVA) /{" "}
                              {stats.avgCost.toFixed(2)} RON (cu TVA)
                            </div>
                          </div>
                        </div>
                        <PriceDisplay amount={stats.totalRevenue} className="text-sm" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top lucrări după frecvență */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Top 10 - Cele mai frecvente lucrări
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {statistics.workAnalysis.topByFrequency.map(([workName, stats], index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <span className="font-medium text-sm">{workName}</span>
                            <div className="text-xs text-gray-500">
                              Preț mediu: {(stats.avgCost / 1.21).toFixed(2)} RON (fără TVA) /{" "}
                              {stats.avgCost.toFixed(2)} RON (cu TVA) • Total: {(stats.totalRevenue / 1.21).toFixed(2)}{" "}
                              RON (fără TVA) / {stats.totalRevenue.toFixed(2)} RON (cu TVA)
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-blue-600">{stats.count}</div>
                          <div className="text-xs text-gray-500">lucrări</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Analiza zilelor săptămânii */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-500" />
                    Performanța pe zile
                  </CardTitle>
                  <div className="text-sm text-gray-600">Cele mai profitabile zile ale săptămânii</div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statistics.dayOfWeekStats.map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <span className="font-medium">{day.day}</span>
                        <div className="flex gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-gray-600">Devize</div>
                            <div className="font-semibold">{day.devize}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600 mb-1">Venit total</div>
                            <PriceDisplay amount={day.venit} className="text-xs" />
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600 mb-1">Mediu/deviz</div>
                            <PriceDisplay amount={day.avgPerDay} className="text-xs" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Clienți fideli */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-500" />
                    Clienți fideli
                  </CardTitle>
                  <div className="text-sm text-gray-600">Vehicule cu 3+ vizite</div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[520px] overflow-y-auto">
                    {statistics.loyalCustomers.map(([numarInmatriculare, stats], index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <span className="font-medium">{numarInmatriculare}</span>
                          <div className="text-xs text-gray-500">
                            Ultima vizită: {new Date(stats.lastVisit).toLocaleDateString("ro-RO")}
                          </div>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-gray-600">Vizite</div>
                            <div className="font-semibold">{stats.count}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600 mb-1">Total</div>
                            <PriceDisplay amount={stats.totalCost} className="text-xs" />
                          </div>
                        </div>
                      </div>
                    ))}
                    {statistics.loyalCustomers.length === 0 && (
                      <div className="text-center text-gray-500 py-4">Nu există clienți cu 3+ vizite</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Clienți inactivi */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    Clienți inactivi
                  </CardTitle>
                  <div className="text-sm text-gray-600">Vehicule care nu au mai venit de peste 6 luni</div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                    {statistics.inactiveCustomers.map(([numarInmatriculare, stats], index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                      >
                        <div>
                          <span className="font-medium">{numarInmatriculare}</span>
                          <div className="text-xs text-gray-500">
                            Ultima vizită: {new Date(stats.lastVisit).toLocaleDateString("ro-RO")}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-orange-600">{stats.daysSinceLastVisit} zile</div>
                          <div className="text-xs text-gray-500">{stats.count} vizite totale</div>
                        </div>
                      </div>
                    ))}
                    {statistics.inactiveCustomers.length === 0 && (
                      <div className="text-center text-gray-500 py-4 col-span-2">Nu există clienți inactivi</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="oilchange" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Programări schimb ulei
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="active" className="w-full">
                  <TabsList className="grid grid-cols-2 w-full mb-4">
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="overdue">Întârziate</TabsTrigger>
                  </TabsList>

                  <TabsContent value="active">
                    <OilChangeList
                      groupedOilChanges={groupedOilChanges}
                      entries={entries}
                      type="active"
                      closedReminders={closedReminders}
                      onCloseReminder={onCloseReminder}
                    />
                  </TabsContent>

                  <TabsContent value="overdue">
                    <OilChangeList
                      groupedOilChanges={groupedOilChanges}
                      entries={entries}
                      type="overdue"
                      closedReminders={closedReminders}
                      onCloseReminder={onCloseReminder}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

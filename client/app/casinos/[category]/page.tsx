"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import {
  getCasinos,
  type Casino,
} from "@/lib/casino-data"
import { LoadingScreen } from "@/components/loading-screen"
import { SiteHeader } from "@/components/site-header"
import { CasinoCard } from "@/components/casino-card"
import { CasinoFilters, type FilterState } from "@/components/casino-filters"

export default function CategoryCasinosPage() {
  const params = useParams()
  const router = useRouter()
  const categoryParam = params.category as string
  const validCategory = categoryParam === "general" ? "general" : "cs2"
  
  const [casinoCategory, setCasinoCategory] = useState<"cs2" | "general">(validCategory)
  const [selectedCountry, setSelectedCountry] = useState<"all" | "latvia" | "usa">("all")
  const [casinos, setCasinos] = useState<Casino[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    selectedTags: [],
    selectedPaymentMethods: [],
    selectedGameModes: [],
    selectedLicenses: [],
    minRating: 0,
    maxRating: 5,
    minDeposit: "",
  })

  useEffect(() => {
    if (categoryParam === "general") {
      setCasinoCategory("general")
    } else if (categoryParam === "cs2") {
      setCasinoCategory("cs2")
    } else {
      router.replace("/casinos/cs2")
    }
  }, [categoryParam, router])

  useEffect(() => {
    getCasinos().then((allCasinos) => {
      const published = allCasinos.filter((c: Casino) => c.status === "published")
      setCasinos(published)
      
      // Initialize rating range
      if (published.length > 0) {
        const ratings = published.map(c => c.rating)
        const minRating = Math.min(...ratings)
        const maxRating = Math.max(...ratings)
        setFilters(prev => ({
          ...prev,
          minRating,
          maxRating,
        }))
      }
      
      setIsLoading(false)
    }).catch((error) => {
      console.error('Failed to load casinos:', error)
      setIsLoading(false)
    })
  }, [])

  const handleCategoryChange = (category: "cs2" | "general") => {
    setCasinoCategory(category)
    router.push(`/casinos/${category}`)
  }

  // Filter casinos based on category, country, and filters
  const filteredCasinos = useMemo(() => {
    let filtered = casinos.filter((casino) => {
      // Category filter
      if (casinoCategory === "cs2") {
        if (casino.category !== "cs2") return false
      } else {
        if (casino.category !== "general") return false
        // Country filter for general casinos
        if (selectedCountry !== "all" && casino.country !== selectedCountry) {
          return false
        }
      }

      // Tag filter
      if (filters.selectedTags.length > 0) {
        const hasAllTags = filters.selectedTags.every(tagId =>
          casino.tagIds?.includes(tagId)
        )
        if (!hasAllTags) return false
      }

      // Payment method filter
      if (filters.selectedPaymentMethods.length > 0) {
        const hasAnyPaymentMethod = filters.selectedPaymentMethods.some(methodId =>
          casino.paymentMethodIds?.includes(methodId)
        )
        if (!hasAnyPaymentMethod) return false
      }

      // Game mode filter
      if (filters.selectedGameModes.length > 0) {
        const hasAnyGameMode = filters.selectedGameModes.some(modeId =>
          casino.gameModeIds?.includes(modeId)
        )
        if (!hasAnyGameMode) return false
      }

      // License filter
      if (filters.selectedLicenses.length > 0) {
        if (!casino.license || !filters.selectedLicenses.includes(casino.license)) {
          return false
        }
      }

      // Rating filter
      if (casino.rating < filters.minRating || casino.rating > filters.maxRating) {
        return false
      }

      // Min deposit filter
      if (filters.minDeposit && filters.minDeposit.trim() !== "") {
        if (!casino.minDeposit) return false
        
        // Parse the filter value (remove currency symbols and extract number)
        const filterValue = parseFloat(filters.minDeposit.replace(/[$,\s]/g, "").trim())
        if (isNaN(filterValue)) return true // If invalid, don't filter
        
        // Parse casino minDeposit (convert all currencies to $ and extract number)
        const casinoValue = parseFloat(casino.minDeposit.replace(/[€$£,\s]/g, "").trim())
        if (isNaN(casinoValue)) return true // If invalid, include it
        
        // Filter: show casinos with minDeposit >= filter value
        if (casinoValue < filterValue) return false
      }

      return true
    })

    // Sort: featured first
    return filtered.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1
      if (!a.isFeatured && b.isFeatured) return 1
      return 0
    })
  }, [casinos, casinoCategory, selectedCountry, filters])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-white relative">
      <div className="absolute top-0 left-0 w-full h-[260px] bg-gradient-to-b from-purple-600/30 via-fuchsia-500/15 to-transparent pointer-events-none z-0"></div>

      <SiteHeader />

      {/* Page Header */}
      <section className="pt-32 pb-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <Link href="/" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold">Back to Home</span>
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-3 font-display">
            All Casino Bonuses
          </h1>
          <p className="text-lg text-muted-foreground">
            Browse all available casino bonuses and find the perfect match for you.
          </p>
        </div>
      </section>

      <section className="py-8 px-4" id="casinos">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar - Category Selector & Filters */}
            <aside className="lg:w-64 shrink-0 space-y-4">
              {/* Category Selector */}
              <div className="bg-white rounded-2xl border border-purple-200 p-4">
                <h3 className="text-sm font-bold text-foreground mb-4">Category</h3>
                <div className={`flex items-center gap-1 p-1 rounded-full bg-slate-100 border border-purple-100 shadow-sm relative sliding-bg ${casinoCategory === "general" ? "active-right" : ""}`}>
                  <button
                    onClick={() => handleCategoryChange("cs2")}
                    className={`flex-1 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-300 relative z-10 outline-none focus:outline-none min-w-0 ${
                      casinoCategory === "cs2"
                        ? "text-white"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    CS2
                  </button>
                  <button
                    onClick={() => handleCategoryChange("general")}
                    className={`flex-1 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-300 relative z-10 outline-none focus:outline-none min-w-0 ${
                      casinoCategory === "general"
                        ? "text-white"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    General
                  </button>
                </div>

                {/* Country Filter - Only show for general casinos */}
                {casinoCategory === "general" && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Country</h4>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setSelectedCountry("all")}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-300 text-left ${
                          selectedCountry === "all"
                            ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-purple-50 hover:border-purple-200"
                        }`}
                      >
                        All Countries
                      </button>
                      <button
                        onClick={() => setSelectedCountry("latvia")}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-300 text-left ${
                          selectedCountry === "latvia"
                            ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-purple-50 hover:border-purple-200"
                        }`}
                      >
                        🇱🇻 Latvia
                      </button>
                      <button
                        onClick={() => setSelectedCountry("usa")}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-300 text-left ${
                          selectedCountry === "usa"
                            ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-purple-50 hover:border-purple-200"
                        }`}
                      >
                        🇺🇸 USA
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Filters */}
              <CasinoFilters
                filters={filters}
                onFiltersChange={setFilters}
                casinos={casinos}
              />
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {filteredCasinos.length} casino{filteredCasinos.length !== 1 ? 's' : ''}
              </div>
              <div className="grid grid-cols-1 gap-4">
                {filteredCasinos.map((casino: Casino, index: number) => (
                  <div key={casino.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                    <CasinoCard casino={casino} />
                  </div>
                ))}
              </div>

              {filteredCasinos.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">No casinos found for the selected filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

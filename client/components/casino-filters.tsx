"use client"

import { useState } from "react"
import { Filter, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Casino } from "@/lib/casino-data"

export interface FilterState {
  selectedTags: string[]
  selectedPaymentMethods: string[]
  selectedGameModes: string[]
  selectedLicenses: string[]
  minRating: number
  maxRating: number
  minDeposit: string
}

interface CasinoFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  casinos: Casino[]
}

export function CasinoFilters({ filters, onFiltersChange, casinos }: CasinoFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const availableLicenses = Array.from(new Set(casinos.map(c => c.license).filter(Boolean))) as string[]
  const availableTagIds = Array.from(new Set(casinos.flatMap(c => c.tagIds || [])))
  const availablePaymentMethodIds = Array.from(new Set(casinos.flatMap(c => c.paymentMethodIds || [])))
  const availableGameModeIds = Array.from(new Set(casinos.flatMap(c => c.gameModeIds || [])))
  const availableRatings = casinos.map(c => c.rating)
  const minAvailableRating = availableRatings.length > 0 ? Math.min(...availableRatings) : 0
  const maxAvailableRating = availableRatings.length > 0 ? Math.max(...availableRatings) : 5

  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const toggleTag = (tagId: string) => {
    const newTags = filters.selectedTags.includes(tagId)
      ? filters.selectedTags.filter(id => id !== tagId)
      : [...filters.selectedTags, tagId]
    updateFilters({ selectedTags: newTags })
  }

  const togglePaymentMethod = (methodId: string) => {
    const newMethods = filters.selectedPaymentMethods.includes(methodId)
      ? filters.selectedPaymentMethods.filter(id => id !== methodId)
      : [...filters.selectedPaymentMethods, methodId]
    updateFilters({ selectedPaymentMethods: newMethods })
  }

  const toggleGameMode = (modeId: string) => {
    const newModes = filters.selectedGameModes.includes(modeId)
      ? filters.selectedGameModes.filter(id => id !== modeId)
      : [...filters.selectedGameModes, modeId]
    updateFilters({ selectedGameModes: newModes })
  }

  const toggleLicense = (license: string) => {
    const newLicenses = filters.selectedLicenses.includes(license)
      ? filters.selectedLicenses.filter(l => l !== license)
      : [...filters.selectedLicenses, license]
    updateFilters({ selectedLicenses: newLicenses })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      selectedTags: [],
      selectedPaymentMethods: [],
      selectedGameModes: [],
      selectedLicenses: [],
      minRating: minAvailableRating,
      maxRating: maxAvailableRating,
      minDeposit: "",
    })
  }

  const hasActiveFilters = 
    filters.selectedTags.length > 0 ||
    filters.selectedPaymentMethods.length > 0 ||
    filters.selectedGameModes.length > 0 ||
    filters.selectedLicenses.length > 0 ||
    filters.minRating > minAvailableRating ||
    filters.maxRating < maxAvailableRating ||
    filters.minDeposit !== ""

  return (
    <div className="bg-white rounded-2xl border border-purple-200 p-4 sticky top-24">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="mb-6">
        <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Tags</h4>
        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
          {availableTagIds.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No tags available yet.</p>
          ) : (
            availableTagIds.map((tagId) => {
              const label = tagId
                .split("-")
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(" ")

              const selected = filters.selectedTags.includes(tagId)
              return (
                <button
                  key={tagId}
                  onClick={() => toggleTag(tagId)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-300 text-left ${
                    selected
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-purple-50 hover:border-purple-200"
                  }`}
                >
                  {label}
                </button>
              )
            })
          )}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Payment Methods</h4>
        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto overflow-x-hidden">
          {availablePaymentMethodIds.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No payment methods available yet.</p>
          ) : (
            availablePaymentMethodIds.map((id) => {
              const label = id
                .split("-")
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(" ")
              const isSelected = filters.selectedPaymentMethods.includes(id)

              return (
                <button
                  key={id}
                  onClick={() => togglePaymentMethod(id)}
                  className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all duration-300 text-left flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] min-w-0 ${
                    isSelected
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-purple-50 hover:border-purple-200"
                  }`}
                >
                  <span className={`flex-shrink-0 ${isSelected ? "text-white" : "text-purple-600"}`}>
                    <Wallet className="w-4 h-4" />
                  </span>
                  <span className="truncate flex-1 min-w-0">{label}</span>
                </button>
              )
            })
          )}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Game Modes</h4>
        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
          {availableGameModeIds.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No game modes available yet.</p>
          ) : (
            availableGameModeIds.map((id) => {
              const label = id
                .split("-")
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(" ")

              const selected = filters.selectedGameModes.includes(id)
              return (
                <button
                  key={id}
                  onClick={() => toggleGameMode(id)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-300 text-left ${
                    selected
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-purple-50 hover:border-purple-200"
                  }`}
                >
                  {label}
                </button>
              )
            })
          )}
        </div>
      </div>

      {availableLicenses.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">License</h4>
          <div className="flex flex-col gap-2">
            {availableLicenses.map((license) => (
              <button
                key={license}
                onClick={() => toggleLicense(license)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-300 text-left ${
                  filters.selectedLicenses.includes(license)
                    ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-purple-50 hover:border-purple-200"
                }`}
              >
                {license}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Min Deposit</h4>
        <div className="space-y-2">
          <div className="relative">
            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. $10, $20"
              value={filters.minDeposit}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9$ ]/g, "")
                updateFilters({ minDeposit: value })
              }}
              onKeyDown={(e) => {
                if (!/[0-9$]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key) && !(e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                }
              }}
              className="w-full pl-10 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Filter by minimum deposit amount (e.g., $10, $20, 5)
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Rating</h4>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600">Min Rating</label>
              <span className="text-xs font-bold text-purple-600 min-w-[3rem] text-right">
                {filters.minRating.toFixed(1)}
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={minAvailableRating}
                max={maxAvailableRating}
                step="0.1"
                value={filters.minRating}
                onChange={(e) => updateFilters({ minRating: parseFloat(e.target.value) })}
                className="custom-range-slider w-full"
                style={{
                  background: `linear-gradient(to right, rgb(147, 51, 234) 0%, rgb(147, 51, 234) ${((filters.minRating - minAvailableRating) / (maxAvailableRating - minAvailableRating)) * 100}%, #e2e8f0 ${((filters.minRating - minAvailableRating) / (maxAvailableRating - minAvailableRating)) * 100}%, #e2e8f0 100%)`
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600">Max Rating</label>
              <span className="text-xs font-bold text-purple-600 min-w-[3rem] text-right">
                {filters.maxRating.toFixed(1)}
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={minAvailableRating}
                max={maxAvailableRating}
                step="0.1"
                value={filters.maxRating}
                onChange={(e) => updateFilters({ maxRating: parseFloat(e.target.value) })}
                className="custom-range-slider w-full"
                style={{
                  background: `linear-gradient(to right, rgb(147, 51, 234) 0%, rgb(147, 51, 234) ${((filters.maxRating - minAvailableRating) / (maxAvailableRating - minAvailableRating)) * 100}%, #e2e8f0 ${((filters.maxRating - minAvailableRating) / (maxAvailableRating - minAvailableRating)) * 100}%, #e2e8f0 100%)`
                }}
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-center pt-2 border-t border-slate-200">
            Range: {filters.minRating.toFixed(1)} - {filters.maxRating.toFixed(1)} stars
          </div>
        </div>
      </div>
    </div>
  )
}


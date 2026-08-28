'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, X } from 'lucide-react'

type Props = {
  searchQuery: string
  onSearchChange: (query: string) => void
  placeholder?: string
  filterOptions?: Array<{ label: string; value: string }>
  selectedFilter?: string
  onFilterChange?: (value: string) => void
}

export default function SearchAndFilterBar({
  searchQuery,
  onSearchChange,
  placeholder = 'Cari data...',
  filterOptions,
  selectedFilter = '',
  onFilterChange,
}: Props) {
  const [searchTerm, setSearchTerm] = useState(searchQuery)

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearchChange(searchTerm)
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm, onSearchChange])

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-9 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Selector */}
      {filterOptions && filterOptions.length > 0 && onFilterChange && (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="w-full sm:w-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
          >
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

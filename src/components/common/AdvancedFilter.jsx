// src/components/common/AdvancedFilter.jsx
import { useState } from 'react';
import { Filter, X, ChevronDown, SlidersHorizontal } from 'lucide-react';

/**
 * AdvancedFilter Component
 * Enhanced filter panel with multiple options (NO category filter - already separate pages)
 */
export default function AdvancedFilter({ onFilterChange, onSearchChange, initialFilters = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [filters, setFilters] = useState({
    difficulty: initialFilters.difficulty || '',
    sortBy: initialFilters.sortBy || 'created_at',
    order: initialFilters.order || 'desc',
    prepTimeMax: initialFilters.prepTimeMax || '',
  });

  // Debounce search
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (onSearchChange) {
      // Simple debounce
      setTimeout(() => {
        onSearchChange(value);
      }, 300);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Call parent callback
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleReset = () => {
    const resetFilters = {
      difficulty: '',
      sortBy: 'created_at',
      order: 'desc',
      prepTimeMax: '',
    };
    setFilters(resetFilters);
    setSearchQuery('');
    
    if (onFilterChange) {
      onFilterChange(resetFilters);
    }
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  const activeFilterCount = Object.values(filters).filter(v => 
    v && v !== 'created_at' && v !== 'desc'
  ).length + (searchQuery ? 1 : 0);

  return (
    <div className="mb-6 space-y-4">
      {/* Search Bar - Always Visible */}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Cari resep..."
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
        />
      </div>

      {/* Filter & Sort Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
      >
        <SlidersHorizontal className="w-5 h-5 text-slate-600" />
        <span className="font-medium text-slate-700">Filter & Sort</span>
        {activeFilterCount > 0 && (
          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter & Sorting
            </h3>
            <button
              onClick={handleReset}
              className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Reset
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">

            {/* Difficulty */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tingkat Kesulitan
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Semua Tingkat</option>
                <option value="mudah">Mudah</option>
                <option value="sedang">Sedang</option>
                <option value="sulit">Sulit</option>
              </select>
            </div>

            {/* Prep Time */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Waktu Persiapan (maks)
              </label>
              <select
                value={filters.prepTimeMax}
                onChange={(e) => handleFilterChange('prepTimeMax', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Semua Durasi</option>
                <option value="15">≤ 15 menit</option>
                <option value="30">≤ 30 menit</option>
                <option value="60">≤ 60 menit</option>
                <option value="120">≤ 2 jam</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Urutkan Berdasarkan
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="created_at">Terbaru</option>
                <option value="name">Nama (A-Z)</option>
                <option value="prep_time">Waktu Persiapan</option>
                <option value="cook_time">Waktu Masak</option>
                <option value="difficulty">Kesulitan</option>
              </select>
            </div>

            {/* Order */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Urutan
              </label>
              <select
                value={filters.order}
                onChange={(e) => handleFilterChange('order', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="desc">Descending (Besar → Kecil)</option>
                <option value="asc">Ascending (Kecil → Besar)</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600 mb-2">Filter Aktif:</p>
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    Search: "{searchQuery}"
                    <button onClick={() => handleSearchChange('')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.difficulty && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    {filters.difficulty}
                    <button onClick={() => handleFilterChange('difficulty', '')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.prepTimeMax && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                    ≤ {filters.prepTimeMax} min
                    <button onClick={() => handleFilterChange('prepTimeMax', '')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
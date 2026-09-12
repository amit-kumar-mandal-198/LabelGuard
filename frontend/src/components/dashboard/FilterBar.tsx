'use client';

import { useState, useCallback, useEffect } from 'react';
import { Filter, MapPin, AlertTriangle, Clock, X } from 'lucide-react';

interface Filters {
  zone: string;
  violationType: string;
  timeRange: string;
}

interface FilterBarProps {
  onFilterChange: (filters: Filters) => void;
}

const ZONES = [
  'All Zones',
  'Gautam Buddha Nagar',
  'Kanpur Central',
  'Ghaziabad Industrial',
  'Delhi NCR',
  'Western UP',
];

const VIOLATION_TYPES = [
  'All Types',
  'Dual MRP (Critical)',
  'Font Height (Rule 9)',
  'Missing Expiry',
  'Smudged / Tampered',
  'Compliant Only',
];

const TIME_RANGES = ['Today', 'Last 7 Days', 'Last 30 Days', 'All Time'];

const DEFAULTS: Filters = {
  zone: 'All Zones',
  violationType: 'All Types',
  timeRange: 'Today',
};

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [filters, setFilters] = useState<Filters>({ ...DEFAULTS });

  // Notify parent whenever filters change
  useEffect(() => {
    onFilterChange(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const updateFilter = useCallback(
    <K extends keyof Filters>(key: K, value: Filters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters({ ...DEFAULTS });
  }, []);

  // Count how many filters differ from defaults
  const activeCount = (Object.keys(DEFAULTS) as (keyof Filters)[]).reduce(
    (count, key) => (filters[key] !== DEFAULTS[key] ? count + 1 : count),
    0,
  );

  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 shadow-sm">
      {/* ── Header row ─────────────────────────────────────── */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
          <Filter className="h-4 w-4 text-emerald-600" />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              {activeCount} {activeCount === 1 ? 'filter' : 'filters'} active
            </span>
          )}
        </div>

        {activeCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" />
            Clear Filters
          </button>
        )}
      </div>

      {/* ── Filter groups ──────────────────────────────────── */}
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        {/* 1 · Zone / Tehsil pills ─────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            <MapPin className="h-3 w-3" />
            Zone / Tehsil
          </span>
          <div className="flex flex-wrap gap-1.5">
            {ZONES.map((zone) => {
              const isActive = filters.zone === zone;
              return (
                <button
                  key={zone}
                  onClick={() => updateFilter('zone', zone)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {zone}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2 · Violation Type dropdown ─────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            <AlertTriangle className="h-3 w-3" />
            Violation Type
          </span>
          <div className="relative">
            <select
              value={filters.violationType}
              onChange={(e) => updateFilter('violationType', e.target.value)}
              className={`appearance-none rounded-lg border py-1.5 pl-3 pr-8 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                filters.violationType !== DEFAULTS.violationType
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-zinc-200 bg-white text-zinc-700'
              }`}
            >
              {VIOLATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {/* custom chevron */}
            <svg
              className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* 3 · Time Range button group ─────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            <Clock className="h-3 w-3" />
            Time Range
          </span>
          <div className="inline-flex overflow-hidden rounded-lg border border-zinc-200 bg-white">
            {TIME_RANGES.map((range, idx) => {
              const isActive = filters.timeRange === range;
              return (
                <button
                  key={range}
                  onClick={() => updateFilter('timeRange', range)}
                  className={`px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                    idx > 0 ? 'border-l border-zinc-200' : ''
                  } ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  {range}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

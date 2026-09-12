'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Target } from 'lucide-react';

/* ── data ─────────────────────────────────────────────────────────── */

const TOTAL_VIOLATIONS = 19;

const violationCategories = [
  { label: 'Dual MRP / Price Tampering', pct: 35, color: 'bg-rose-600', textColor: 'text-rose-600', count: 7 },
  { label: 'Font Height & Legibility', pct: 28, color: 'bg-amber-500', textColor: 'text-amber-500', count: 5 },
  { label: 'Missing Expiry / Date', pct: 18, color: 'bg-purple-500', textColor: 'text-purple-500', count: 3 },
  { label: 'Net Quantity Shortfall', pct: 12, color: 'bg-blue-500', textColor: 'text-blue-500', count: 2 },
  { label: 'Other (Country of Origin, etc)', pct: 7, color: 'bg-zinc-400', textColor: 'text-zinc-500', count: 2 },
];

const tehsilData = [
  { name: 'Noida Urban', pct: 94, trend: 'up' as const, delta: '+4.2%', tier: 'emerald' as const },
  { name: 'Greater Noida', pct: 87, trend: 'up' as const, delta: '+2.8%', tier: 'emerald' as const },
  { name: 'Sahibabad Industrial', pct: 71, trend: 'up' as const, delta: '+1.5%', tier: 'amber' as const },
  { name: 'Kanpur Central', pct: 62, trend: 'down' as const, delta: '-3.1%', tier: 'amber' as const },
];

const TARGET_PCT = 95;

/* ── component ────────────────────────────────────────────────────── */

export default function AnalyticsCards() {
  const [animatedWidths, setAnimatedWidths] = useState<number[]>(tehsilData.map(() => 0));
  const [activeSegment, setActiveSegment] = useState<number | null>(null);

  // Animate tehsil bars on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidths(tehsilData.map((t) => t.pct));
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ─── CARD 1 : Violation Distribution ────────────────────────── */}
      <div className="bg-white rounded-xl shadow-xs border border-zinc-100 p-6 transition-shadow duration-200 hover:shadow-md">
        {/* header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50">
              <BarChart3 className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-800">Violation Category Distribution</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Total violations&nbsp;
                <span className="font-semibold text-zinc-700">{TOTAL_VIOLATIONS}</span>
              </p>
            </div>
          </div>
        </div>

        {/* stacked horizontal bar */}
        <div className="relative mb-6">
          <div className="flex h-9 rounded-lg overflow-hidden">
            {violationCategories.map((cat, idx) => (
              <div
                key={cat.label}
                className={`relative ${cat.color} cursor-pointer transition-opacity duration-150`}
                style={{ width: `${cat.pct}%` }}
                onMouseEnter={() => setActiveSegment(idx)}
                onMouseLeave={() => setActiveSegment(null)}
              >
                {/* tooltip */}
                {activeSegment === idx && (
                  <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap bg-zinc-800 text-white text-xs font-medium rounded-md px-2.5 py-1.5 shadow-lg pointer-events-none">
                    {cat.count} violations &middot; {cat.pct}%
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-zinc-800" />
                  </div>
                )}
                {/* label inside segment if wide enough */}
                {cat.pct >= 15 && (
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-white/90 select-none">
                    {cat.pct}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* individual rows */}
        <ul className="space-y-3">
          {violationCategories.map((cat) => (
            <li key={cat.label} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${cat.color}`} />
                  <span className="text-xs text-zinc-600 truncate">{cat.label}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-medium text-zinc-500">{cat.count}</span>
                  <span className={`text-xs font-semibold ${cat.textColor}`}>{cat.pct}%</span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${cat.color} transition-all duration-500 group-hover:opacity-80`}
                  style={{ width: `${cat.pct}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ─── CARD 2 : Tehsil-Wise Compliance Velocity ───────────────── */}
      <div className="bg-white rounded-xl shadow-xs border border-zinc-100 p-6 transition-shadow duration-200 hover:shadow-md">
        {/* header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50">
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-800">Compliance Recovery by Tehsil</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Target&nbsp;
                <span className="font-semibold text-emerald-600">{TARGET_PCT}%</span>
              </p>
            </div>
          </div>
        </div>

        {/* tehsil bars */}
        <ul className="space-y-5">
          {tehsilData.map((t, idx) => {
            const barBg =
              t.tier === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500';
            const trackBg =
              t.tier === 'emerald' ? 'bg-emerald-50' : 'bg-amber-50';
            const pctColor =
              t.tier === 'emerald' ? 'text-emerald-600' : 'text-amber-600';
            const trendColor =
              t.trend === 'up' ? 'text-emerald-500' : 'text-rose-500';

            return (
              <li key={t.name}>
                {/* label row */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-zinc-700">{t.name}</span>
                  <div className="flex items-center gap-2">
                    {/* trend indicator */}
                    <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${trendColor}`}>
                      {t.trend === 'up' ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {t.delta}
                    </span>
                    <span className={`text-sm font-bold ${pctColor}`}>{t.pct}%</span>
                  </div>
                </div>

                {/* bar + target line */}
                <div className="relative">
                  <div className={`h-3 w-full rounded-full ${trackBg} overflow-hidden`}>
                    <div
                      className={`h-full rounded-full ${barBg}`}
                      style={{
                        width: `${animatedWidths[idx]}%`,
                        transition: 'width 0.9s cubic-bezier(0.25,1,0.5,1)',
                      }}
                    />
                  </div>
                  {/* target reference line */}
                  <div
                    className="absolute top-0 h-full border-l-2 border-dashed border-zinc-300"
                    style={{ left: `${TARGET_PCT}%` }}
                  >
                    {idx === 0 && (
                      <span className="absolute -top-4 -translate-x-1/2 text-[10px] font-medium text-zinc-400 whitespace-nowrap">
                        Target
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* legend */}
        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-zinc-100">
          <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            Above 80%
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            Below 80%
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className="w-2 border-t-2 border-dashed border-zinc-300" />
            Target ({TARGET_PCT}%)
          </span>
        </div>
      </div>
    </div>
  );
}

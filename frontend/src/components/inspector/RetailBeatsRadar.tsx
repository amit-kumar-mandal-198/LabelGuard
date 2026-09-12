'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Store,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Camera,
  Search,
  ExternalLink,
} from 'lucide-react';

interface RetailBeat {
  id: string;
  name: string;
  address: string;
  coords: string;
  distance: string;
  risk: 'critical' | 'warning' | 'routine';
  riskLabel: string;
  gstin: string;
  lastChecked: string;
  checkedIn: boolean;
}

const INITIAL_BEATS: RetailBeat[] = [
  {
    id: 'b1',
    name: 'Reliance Smart Superstore, Sector 18',
    address: 'Pocket G, Sector 18, Noida',
    coords: '28.5708° N, 77.3261° E',
    distance: '65m away',
    risk: 'routine',
    riskLabel: 'Routine Shelf Audit',
    gstin: '09AABCR1234F1Z5',
    lastChecked: 'Today, 08:00 AM',
    checkedIn: true,
  },
  {
    id: 'b2',
    name: 'Kalyan Provision Stores, Market Complex',
    address: 'Near Atta Market Metro, Noida',
    coords: '28.5714° N, 77.3275° E',
    distance: '180m away',
    risk: 'critical',
    riskLabel: 'High Priority: Dual-MRP Alert',
    gstin: '09AAKPS9821H1Z2',
    lastChecked: '2 days ago',
    checkedIn: false,
  },
  {
    id: 'b3',
    name: 'Arogya Medical & General Store',
    address: 'Shop 14, Main Market, Sector 18',
    coords: '28.5699° N, 77.3248° E',
    distance: '240m away',
    risk: 'warning',
    riskLabel: 'Rule 9(6) Font Watchlist',
    gstin: '09AABAM7741C1Z8',
    lastChecked: 'Yesterday',
    checkedIn: false,
  },
  {
    id: 'b4',
    name: 'Modern Bazaar Departmental Store',
    address: 'Ground Floor, Center Stage Mall',
    coords: '28.5722° N, 77.3289° E',
    distance: '420m away',
    risk: 'routine',
    riskLabel: 'Periodic Packaged Audit',
    gstin: '09AABMD4492K1Z9',
    lastChecked: '4 days ago',
    checkedIn: false,
  },
];

export default function RetailBeatsRadar() {
  const [beats, setBeats] = useState<RetailBeat[]>(INITIAL_BEATS);
  const [activeTab, setActiveTab] = useState<'all' | 'priority'>('all');

  const handleCheckIn = (id: string) => {
    setBeats((prev) =>
      prev.map((b) => (b.id === id ? { ...b, checkedIn: !b.checkedIn } : b))
    );
  };

  const displayedBeats =
    activeTab === 'priority'
      ? beats.filter((b) => b.risk === 'critical' || b.risk === 'warning')
      : beats;

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-zinc-100 pb-3">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-600" />
            <span>Assigned Retail Corridor Beats (Sector 18 Duty Radar)</span>
          </h2>
          <p className="text-xs text-zinc-500">
            Geofenced licensed retail merchants scheduled for statutory spot inspection today.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              activeTab === 'all'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            All Beats ({beats.length})
          </button>
          <button
            onClick={() => setActiveTab('priority')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              activeTab === 'priority'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Priority Queue (2)
          </button>
        </div>
      </div>

      {/* Beats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {displayedBeats.map((beat) => (
          <div
            key={beat.id}
            className={`p-4 rounded-xl border transition-all ${
              beat.risk === 'critical'
                ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                : beat.risk === 'warning'
                ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                : 'bg-zinc-50/60 border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-900 text-sm">{beat.name}</span>
                  {beat.checkedIn && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3" /> Checked In
                    </span>
                  )}
                </div>
                <p className="text-zinc-500 text-[11px] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span>{beat.address} • <strong className="text-zinc-700">{beat.distance}</strong></span>
                </p>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                  beat.risk === 'critical'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : beat.risk === 'warning'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-zinc-200 text-zinc-700'
                }`}
              >
                {beat.riskLabel}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-zinc-200/80 flex items-center justify-between gap-2 text-[11px]">
              <span className="font-mono text-zinc-500 text-[10px]">
                GSTIN: {beat.gstin}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCheckIn(beat.id)}
                  className={`px-2.5 py-1 rounded font-semibold transition ${
                    beat.checkedIn
                      ? 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                  }`}
                >
                  {beat.checkedIn ? 'Check Out' : 'Check In at Store'}
                </button>

                <Link
                  href="/inspector/camera"
                  className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-semibold flex items-center gap-1 transition"
                  title="Open Camera Scanner for this merchant"
                >
                  <Camera className="w-3 h-3" />
                  <span>Scan</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import {
  Shield,
  MapPin,
  Clock,
  Wifi,
  Target,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

interface TelemetryProps {
  totalScans: number;
  violationCount: number;
  tamperCount: number;
}

export default function InspectorTelemetryRibbon({
  totalScans = 18,
  violationCount = 3,
  tamperCount = 1,
}: TelemetryProps) {
  const targetQuota = 25;
  const progressPercent = Math.min(100, Math.round((totalScans / targetQuota) * 100));

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Top Officer Credentials & Beat Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 text-blue-800 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-zinc-900">Inspector V. Sharma</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                Badge #LM-INS-2026-0447
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                ON ACTIVE DUTY
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Legal Metrology Department • Gautam Buddha Nagar Circle, Uttar Pradesh
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-600 flex-wrap">
          <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1.5 rounded-lg border border-zinc-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Shift B (10:00 - 18:00 IST)</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-800">
            <Wifi className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="font-semibold">MeghRaj Cloud: Connected</span>
          </div>
        </div>
      </div>

      {/* 4 Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Metric 1: Daily Target */}
        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="font-semibold flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-blue-600" />
              Daily Sweep Quota
            </span>
            <span className="font-mono font-bold text-zinc-700">{totalScans}/{targetQuota}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-200 overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>{progressPercent}% completed</span>
            <span>{Math.max(0, targetQuota - totalScans)} remaining</span>
          </div>
        </div>

        {/* Metric 2: Assigned Beat */}
        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
          <span className="font-semibold text-zinc-500 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            Assigned Beat Corridor
          </span>
          <p className="font-bold text-zinc-900 text-sm truncate">Sector 18 Retail Hub</p>
          <p className="text-[10px] text-emerald-700 font-mono">Geofence: Inside (±4m accuracy)</p>
        </div>

        {/* Metric 3: Violations Logged */}
        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
          <span className="font-semibold text-zinc-500 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Defects Logged Today
          </span>
          <p className="font-bold text-rose-600 text-lg">{violationCount} Infractions</p>
          <p className="text-[10px] text-zinc-500">Auto-routed to Controller queue</p>
        </div>

        {/* Metric 4: Dual-MRP Tamper */}
        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
          <span className="font-semibold text-amber-900 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-amber-700" />
            Sticker Tamper Seizures
          </span>
          <p className="font-bold text-amber-800 text-lg">{tamperCount} Active Flag</p>
          <p className="text-[10px] text-amber-700 font-semibold">Section 15 Panchnama Ready</p>
        </div>
      </div>
    </div>
  );
}

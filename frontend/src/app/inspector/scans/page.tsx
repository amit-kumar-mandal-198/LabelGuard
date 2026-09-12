'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ScanLine,
  PlusCircle,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  Filter,
  Camera,
} from 'lucide-react';
import { ApiClient } from '@/lib/api-client';

export default function InspectorScansPage() {
  const inspections = ApiClient.getInspections();
  const [filter, setFilter] = useState<'all' | 'compliant' | 'violation' | 'tamper'>('all');

  const filtered = inspections.filter((i) => {
    if (filter === 'compliant') return i.status === 'COMPLIANT';
    if (filter === 'violation') return i.status === 'NON_COMPLIANT';
    if (filter === 'tamper') return i.tamperDetected;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
              Field Enforcement
            </span>
            <span className="text-xs text-zinc-500 font-mono">Inspector ID: LM-OFF-4892</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mt-1">Field Inspection & Shelf Scans</h1>
          <p className="text-xs text-zinc-500">
            Rapid mobile packaging audit feed with GPS coordinates, on-device OCR, and tamper verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/inspector/camera"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Camera className="w-4 h-4" />
            <span>Open Camera Scanner</span>
          </Link>
          <Link
            href="/inspector/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <ScanLine className="w-4 h-4" />
            <span>Launch Field Scan Simulator</span>
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-xs text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-semibold text-zinc-700">Filter Scans:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md transition ${filter === 'all' ? 'bg-zinc-900 text-white font-semibold' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}
          >
            All ({inspections.length})
          </button>
          <button
            onClick={() => setFilter('compliant')}
            className={`px-3 py-1 rounded-md transition ${filter === 'compliant' ? 'bg-emerald-600 text-white font-semibold' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}
          >
            Compliant
          </button>
          <button
            onClick={() => setFilter('violation')}
            className={`px-3 py-1 rounded-md transition ${filter === 'violation' ? 'bg-rose-600 text-white font-semibold' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'}`}
          >
            Violations
          </button>
          <button
            onClick={() => setFilter('tamper')}
            className={`px-3 py-1 rounded-md transition ${filter === 'tamper' ? 'bg-amber-600 text-white font-semibold' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}`}
          >
            Dual-MRP Tamper
          </button>
        </div>

        <span className="text-zinc-500 text-[11px]">
          Showing <strong>{filtered.length}</strong> recorded inspection audits
        </span>
      </div>

      {/* Scans Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-x-auto shadow-xs">
        <table className="w-full min-w-[700px] text-left text-xs">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
              <th className="py-3 px-6">Product / Brand</th>
              <th className="py-3 px-4">Retail Shop & GPS Location</th>
              <th className="py-3 px-4 font-center">Score</th>
              <th className="py-3 px-4">Compliance Status</th>
              <th className="py-3 px-4">Tamper Check</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-6 text-right">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-zinc-700">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50/80 transition">
                <td className="py-4 px-6">
                  <div className="font-semibold text-zinc-900">{item.productName}</div>
                  <div className="text-[11px] text-zinc-500">{item.brand} • SKU: {item.sku}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="font-medium text-zinc-900">{item.storeName || 'Wholesale Depot'}</div>
                  <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{item.location || '28.5708° N, 77.3261° E'}</span>
                  </div>
                </td>
                <td className="py-4 px-4 font-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded font-mono font-bold ${
                      item.complianceScore >= 90
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.complianceScore >= 60
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {item.complianceScore}%
                  </span>
                </td>
                <td className="py-4 px-4">
                  {item.status === 'COMPLIANT' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3" /> COMPLIANT
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                      <AlertTriangle className="w-3 h-3" /> VIOLATIONS ({item.violations.length})
                    </span>
                  )}
                </td>
                <td className="py-4 px-4">
                  {item.tamperDetected ? (
                    <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase bg-rose-100 text-rose-900 border border-rose-300 animate-pulse">
                      TAMPER FLAG
                    </span>
                  ) : (
                    <span className="text-zinc-400 font-mono text-[11px]">Normal</span>
                  )}
                </td>
                <td className="py-4 px-4 text-zinc-500 font-mono text-[11px]">
                  {new Date(item.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </td>
                <td className="py-4 px-6 text-right">
                  <Link
                    href={`/scan/${item.id}`}
                    className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded font-medium text-[11px] transition inline-flex items-center gap-1"
                  >
                    <span>View Report</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, ArrowUpRight, CheckCircle2, AlertTriangle, FileText, QrCode } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';

export default function UniversalSearchPage() {
  const [query, setQuery] = useState('');
  const inspections = ApiClient.getInspections();

  const filtered = inspections.filter((i) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      i.productName.toLowerCase().includes(q) ||
      i.brand.toLowerCase().includes(q) ||
      i.sku.toLowerCase().includes(q) ||
      (i.barcode && i.barcode.includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-4">
        <h1 className="text-2xl font-bold text-zinc-900">Universal Commodity Repository & Search</h1>
        <p className="text-xs text-zinc-500">
          Query national packaged commodity records by GTIN barcode, registered SKU, brand name, or manufacturer.
        </p>
      </div>

      {/* Big Search Bar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by EAN-13 Barcode (e.g. 8901030829143), Brand (NutriRich), SKU, or Commodity..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="font-semibold text-zinc-700">Quick Searches:</span>
          <button
            onClick={() => setQuery('NutriRich')}
            className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-mono"
          >
            NutriRich
          </button>
          <button
            onClick={() => setQuery('8901030829143')}
            className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-mono"
          >
            8901030829143
          </button>
          <button
            onClick={() => setQuery('Chips')}
            className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-mono"
          >
            Chips (Tampered)
          </button>
          <button
            onClick={() => setQuery('Hair Oil')}
            className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-mono"
          >
            Hair Oil (Font Defect)
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden overflow-x-auto shadow-xs space-y-4">
        <div className="p-4 border-b border-zinc-200 flex justify-between items-center text-xs">
          <span className="font-bold text-zinc-700">Repository Matches ({filtered.length})</span>
          <span className="text-zinc-500">GS1 India & Legal Metrology Central Registry Synchronized</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase">
              <th className="py-3 px-6">Commodity / Brand</th>
              <th className="py-3 px-4">SKU / Barcode</th>
              <th className="py-3 px-4">Declared MRP</th>
              <th className="py-3 px-4">Latest Audit Score</th>
              <th className="py-3 px-4">Compliance Status</th>
              <th className="py-3 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-zinc-700">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50 transition">
                <td className="py-4 px-6">
                  <div className="font-bold text-zinc-900">{item.productName}</div>
                  <div className="text-[11px] text-zinc-500">{item.brand} • {item.category}</div>
                </td>
                <td className="py-4 px-4 font-mono">
                  <div className="text-zinc-800">{item.sku}</div>
                  <div className="text-[11px] text-zinc-400">{item.barcode || 'Verified'}</div>
                </td>
                <td className="py-4 px-4 font-mono font-medium">₹ {item.declaredMrp.toFixed(2)}</td>
                <td className="py-4 px-4">
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
                      <CheckCircle2 className="w-3 h-3" /> PASS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                      <AlertTriangle className="w-3 h-3" /> VIOLATION
                    </span>
                  )}
                </td>
                <td className="py-4 px-6 text-right">
                  <Link
                    href={`/scan/${item.id}`}
                    className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded font-medium text-[11px] transition inline-flex items-center gap-1"
                  >
                    <span>Inspect Profile</span>
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

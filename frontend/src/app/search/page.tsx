'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  BadgeAlert,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { ApiClient } from '@/lib/api-client';

export default function UniversalSearchPage() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'tamper' | 'compliant' | 'violations'>('all');
  const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null);
  const inspections = ApiClient.getInspections();

  const filtered = useMemo(() => {
    return inspections.filter((i) => {
      // Filter tab
      if (activeFilter === 'tamper' && !i.tamperDetected) return false;
      if (activeFilter === 'compliant' && i.status !== 'COMPLIANT') return false;
      if (activeFilter === 'violations' && i.status !== 'NON_COMPLIANT') return false;

      // Query
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        i.productName.toLowerCase().includes(q) ||
        i.brand.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        (i.barcode && i.barcode.includes(q)) ||
        (i.storeName && i.storeName.toLowerCase().includes(q))
      );
    });
  }, [inspections, query, activeFilter]);

  const handleCopyBarcode = (barcode: string) => {
    navigator.clipboard.writeText(barcode);
    setCopiedBarcode(barcode);
    setTimeout(() => setCopiedBarcode(null), 2000);
  };

  const handleExportDossier = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> National GTIN & SKU Repository
            </span>
            <span className="text-xs text-zinc-500 font-mono">Central Legal Metrology Database</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight mt-1">
            Universal Commodity Repository & Search
          </h1>
          <p className="text-xs text-zinc-500">
            Query national packaged commodity records by GTIN barcode, registered SKU, brand name, or manufacturer.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportDossier}
            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Print Intelligence Dossier</span>
          </button>
        </div>
      </div>

      {/* Big Search Bar & Omni-Filters */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by EAN-13 Barcode (e.g. 8901030829143), Brand (NutriRich), SKU, or Commodity..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm bg-zinc-50 focus:bg-white transition"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-sm"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-zinc-700 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-zinc-500" /> Category Filter:
            </span>
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                activeFilter === 'all' ? 'bg-zinc-900 text-white font-semibold' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              All Records ({inspections.length})
            </button>
            <button
              onClick={() => setActiveFilter('tamper')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                activeFilter === 'tamper' ? 'bg-rose-600 text-white font-semibold' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              Dual-MRP Tamper Flags
            </button>
            <button
              onClick={() => setActiveFilter('violations')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                activeFilter === 'violations' ? 'bg-amber-600 text-white font-semibold' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Non-Compliant SKUs
            </button>
            <button
              onClick={() => setActiveFilter('compliant')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                activeFilter === 'compliant' ? 'bg-emerald-600 text-white font-semibold' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Verified Compliant
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
            <span>Quick:</span>
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
              Chips
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs space-y-4">
        <div className="p-4 border-b border-zinc-200 flex justify-between items-center text-xs">
          <span className="font-bold text-zinc-800">
            Repository Matches ({filtered.length})
          </span>
          <span className="text-zinc-500 font-mono text-[11px]">
            GS1 India & Legal Metrology Central Registry Synchronized
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase text-[11px]">
                <th className="py-3 px-6">Commodity / Brand</th>
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4">Declared MRP</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4">Compliance Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-700">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/80 transition">
                  {/* Thumbnail & Product */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-10 h-10 rounded-lg object-cover border border-zinc-200 shrink-0"
                        />
                      )}
                      <div>
                        <div className="font-bold text-zinc-900 text-xs sm:text-sm">{item.productName}</div>
                        <div className="text-[11px] text-zinc-500">{item.brand} • {item.category}</div>
                      </div>
                    </div>
                  </td>

                  {/* SKU & Barcode */}
                  <td className="py-4 px-4 font-mono">
                    <div className="text-zinc-800 font-semibold">{item.sku}</div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                      <span>{item.barcode || 'Verified'}</span>
                      {item.barcode && (
                        <button
                          onClick={() => handleCopyBarcode(item.barcode!)}
                          className="hover:text-zinc-700 transition"
                          title="Copy barcode"
                        >
                          {copiedBarcode === item.barcode ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="py-4 px-4 font-mono font-medium">₹ {item.declaredMrp.toFixed(2)}</td>

                  {/* Score */}
                  <td className="py-4 px-4 text-center">
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

                  {/* Status */}
                  <td className="py-4 px-4">
                    {item.tamperDetected ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase bg-rose-100 text-rose-900 border border-rose-300 animate-pulse">
                        <BadgeAlert className="w-3 h-3" /> DUAL MRP TAMPER
                      </span>
                    ) : item.status === 'COMPLIANT' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3" /> COMPLIANT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                        <AlertTriangle className="w-3 h-3" /> VIOLATIONS ({item.violations.length})
                      </span>
                    )}
                  </td>

                  {/* Action */}
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

    </div>
  );
}

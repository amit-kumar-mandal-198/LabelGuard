'use client';

import React from 'react';
import Link from 'next/link';
import { PlusCircle, FileCheck2, ArrowUpRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';

export default function VendorProductsPage() {
  const inspections = ApiClient.getInspections();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Registered Products & Packaging SKUs</h1>
          <p className="text-xs text-zinc-500">
            Catalog of packaging artworks, historical audit verdicts, and certification records.
          </p>
        </div>
        <Link
          href="/vendor/audit/new"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Audit New SKU</span>
        </Link>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
              <th className="py-3 px-6">Product Name</th>
              <th className="py-3 px-4">SKU / Code</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Declared MRP</th>
              <th className="py-3 px-4 text-center">Last Score</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-zinc-700">
            {inspections.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50/80 transition">
                <td className="py-4 px-6 font-semibold text-zinc-900">{item.productName}</td>
                <td className="py-4 px-4 font-mono text-zinc-500">{item.sku}</td>
                <td className="py-4 px-4">{item.category}</td>
                <td className="py-4 px-4 font-mono font-medium">₹ {item.declaredMrp.toFixed(2)}</td>
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
                <td className="py-4 px-4">
                  {item.status === 'COMPLIANT' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3" /> PASS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                      <AlertTriangle className="w-3 h-3" /> VIOLATIONS
                    </span>
                  )}
                </td>
                <td className="py-4 px-6 text-right">
                  <Link
                    href={`/scan/${item.id}`}
                    className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded font-medium text-[11px] transition inline-flex items-center gap-1"
                  >
                    <span>View Audit</span>
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

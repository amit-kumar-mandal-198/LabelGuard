'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, PlusCircle } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';

export default function RepeatOffendersPage() {
  const offenders = ApiClient.getRepeatOffenders();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <Link
            href="/dashboard/district"
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to District Controller Hub
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">
            Repeat Offender Escalation Engine
          </h1>
          <p className="text-xs text-zinc-500">
            Systematic pattern tracking under Section 36(2) of the Legal Metrology Act for persistent non-compliant manufacturers.
          </p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-x-auto shadow-xs">
        <table className="w-full min-w-[650px] text-left text-xs">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase">
              <th className="py-3 px-6">Brand & Manufacturer</th>
              <th className="py-3 px-4">Total Scans</th>
              <th className="py-3 px-4">Violations</th>
              <th className="py-3 px-4">Critical Fails</th>
              <th className="py-3 px-4">Risk Tier</th>
              <th className="py-3 px-4">Primary Defect</th>
              <th className="py-3 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-zinc-700">
            {offenders.map((off, idx) => (
              <tr key={idx} className="hover:bg-zinc-50 transition">
                <td className="py-4 px-6">
                  <div className="font-bold text-zinc-900">{off.brand}</div>
                  <div className="text-[11px] text-zinc-500">{off.companyName}</div>
                </td>
                <td className="py-4 px-4 font-mono">{off.totalScans}</td>
                <td className="py-4 px-4 font-mono font-bold text-rose-700">{off.violationCount}</td>
                <td className="py-4 px-4 font-mono font-bold text-rose-800">{off.criticalCount}</td>
                <td className="py-4 px-4">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-rose-100 text-rose-800 border border-rose-300">
                    RISK {off.riskScore}/100
                  </span>
                </td>
                <td className="py-4 px-4 text-zinc-700">{off.topViolationRule}</td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => alert(`Brand '${off.brand}' dispatched to field inspection squad.`)}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold text-[11px] transition"
                  >
                    Dispatch Sweep
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

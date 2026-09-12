'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  MapPin,
  ShoppingBag,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  Download,
  Building,
} from 'lucide-react';

export default function NationalAdminDashboard() {
  const ecommRankings = [
    { platform: 'Blinkit (Quick Commerce)', scans: 1420, violations: 58, rate: '4.1%', status: 'Leading' },
    { platform: 'Amazon India', scans: 4890, violations: 320, rate: '6.5%', status: 'Compliant' },
    { platform: 'Flipkart', scans: 4100, violations: 390, rate: '9.5%', status: 'Warning' },
    { platform: 'Zepto', scans: 1100, violations: 140, rate: '12.7%', status: 'Audit Ordered' },
  ];

  const stateData = [
    { state: 'Uttar Pradesh', totalScans: 12400, compliance: '89.2%', activeInspectors: 480 },
    { state: 'Maharashtra', totalScans: 18200, compliance: '91.8%', activeInspectors: 620 },
    { state: 'Delhi NCR', totalScans: 9800, compliance: '86.4%', activeInspectors: 340 },
    { state: 'Karnataka', totalScans: 11500, compliance: '92.1%', activeInspectors: 410 },
    { state: 'Tamil Nadu', totalScans: 13900, compliance: '90.7%', activeInspectors: 490 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
              National Metrology Directorate
            </span>
            <span className="text-xs text-zinc-500 font-mono">Department of Consumer Affairs</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mt-1">National Compliance & Market Governance</h1>
          <p className="text-xs text-zinc-500">
            Cross-state packaging compliance choropleth, e-commerce marketplace leaderboards, and national compounding revenue tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/rules"
            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Layers className="w-4 h-4" />
            <span>Manage Codified Rules</span>
          </Link>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">National Scans This Month</p>
          <p className="text-3xl font-extrabold text-zinc-900 mt-1">65,800</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">92.4% storage purged @90d</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Average National Compliance</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1">90.2%</p>
          <p className="text-[11px] text-zinc-500 mt-1">Target: &gt;95% by Q4</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Section 36 Compounding Penalties</p>
          <p className="text-3xl font-extrabold text-zinc-900 mt-1">₹ 4.82 Cr</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">System payback period &lt; 6 mos</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Active Field Inspectors</p>
          <p className="text-3xl font-extrabold text-blue-600 mt-1">2,340</p>
          <p className="text-[11px] text-zinc-500 mt-1">Across 28 States & UTs</p>
        </div>
      </div>

      {/* State-by-State Breakdown */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-x-auto shadow-xs">
        <div className="p-5 border-b border-zinc-200">
          <div>
            <h2 className="text-sm font-bold text-zinc-900">State-Wise Legal Metrology Performance</h2>
            <p className="text-xs text-zinc-500">Monthly aggregate data ingested from state inspector apps</p>
          </div>
        </div>

        <table className="w-full min-w-[550px] text-left text-xs">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase">
              <th className="py-3 px-6">State / Union Territory</th>
              <th className="py-3 px-4">Total Scans</th>
              <th className="py-3 px-4">Compliance Rate</th>
              <th className="py-3 px-4">Active Inspectors</th>
              <th className="py-3 px-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-zinc-700">
            {stateData.map((st, i) => (
              <tr key={i} className="hover:bg-zinc-50 transition">
                <td className="py-4 px-6 font-bold text-zinc-900">{st.state}</td>
                <td className="py-4 px-4 font-mono">{st.totalScans.toLocaleString()}</td>
                <td className="py-4 px-4 font-mono font-bold text-emerald-700">{st.compliance}</td>
                <td className="py-4 px-4 font-mono">{st.activeInspectors}</td>
                <td className="py-4 px-6 text-right">
                  <span className="inline-block px-2 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800 text-[10px]">
                    OPTIMAL
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* E-Commerce Marketplaces Ranking */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-x-auto shadow-xs">
        <div className="p-5 border-b border-zinc-200">
          <h2 className="text-sm font-bold text-zinc-900">
            E-Commerce Digital Marketplace Compliance Leaderboard
          </h2>
          <p className="text-xs text-zinc-500">
            Verification under Legal Metrology (Packaged Commodities) Amendment Rules, 2022 for digital product listings.
          </p>
        </div>

        <table className="w-full min-w-[550px] text-left text-xs">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase">
              <th className="py-3 px-6">Marketplace Platform</th>
              <th className="py-3 px-4">Audited Listings</th>
              <th className="py-3 px-4">Violations Flagged</th>
              <th className="py-3 px-4">Defect Rate</th>
              <th className="py-3 px-6 text-right">Regulatory Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-zinc-700">
            {ecommRankings.map((e, i) => (
              <tr key={i} className="hover:bg-zinc-50 transition">
                <td className="py-4 px-6 font-bold text-zinc-900">{e.platform}</td>
                <td className="py-4 px-4 font-mono">{e.scans.toLocaleString()}</td>
                <td className="py-4 px-4 font-mono font-bold text-rose-700">{e.violations}</td>
                <td className="py-4 px-4 font-mono font-bold">{e.rate}</td>
                <td className="py-4 px-6 text-right">
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      e.status === 'Leading'
                        ? 'bg-emerald-100 text-emerald-800'
                        : e.status === 'Compliant'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

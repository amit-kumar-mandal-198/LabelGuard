'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-zinc-500 bg-zinc-100 animate-pulse">Loading GIS Map...</div>
});

import {
  Scale,
  AlertTriangle,
  FileCheck2,
  Users,
  MapPin,
  FileText,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Download,
  ShieldAlert,
} from 'lucide-react';
import { ApiClient } from '@/lib/api-client';

export default function DistrictControllerDashboard() {
  const notices = ApiClient.getNotices();
  const offenders = ApiClient.getRepeatOffenders();
  const inspections = ApiClient.getInspections();

  const [activeTab, setActiveTab] = useState<'map' | 'notices' | 'inspectors' | 'offenders'>('map');

  const pendingNoticesCount = notices.filter((n) => n.status === 'draft').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
              District Administration
            </span>
            <span className="text-xs text-zinc-500 font-mono">Jurisdiction: Gautam Buddha Nagar & Kanpur Zone</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mt-1">District Controller Enforcement Center</h1>
          <p className="text-xs text-zinc-500">
            Statutory oversight, Section 36 notice approvals, repeat offender monitoring, and GIS violation hotspots.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/notices/pending"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <FileText className="w-4 h-4" />
            <span>Review Pending Notices ({pendingNoticesCount})</span>
          </Link>
        </div>
      </div>

      {/* Top 5 KPI Cards (Matching PDF Flow 4) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <span className="text-zinc-500 font-medium">Today's Field Scans</span>
          <p className="text-2xl font-extrabold text-zinc-900 mt-1">142</p>
          <span className="text-[10px] text-emerald-700 font-semibold">+18% vs yesterday</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <span className="text-zinc-500 font-medium">Violations Found</span>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">19</p>
          <span className="text-[10px] text-rose-700 font-semibold">13.3% defect rate</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <span className="text-zinc-500 font-medium">Critical Violations</span>
          <p className="text-2xl font-extrabold text-rose-700 mt-1">6</p>
          <span className="text-[10px] text-rose-700 font-semibold">Dual MRP / Tampering</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs border-l-4 border-l-amber-500">
          <span className="text-zinc-500 font-medium">Pending Section 36 Notices</span>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingNoticesCount}</p>
          <span className="text-[10px] text-amber-800 font-semibold">Controller Action Required</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-zinc-500 font-medium">Active Inspectors</span>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">18 / 20</p>
          <span className="text-[10px] text-blue-700 font-semibold">On-field across 4 tehsils</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto border-b border-zinc-200 text-xs font-semibold gap-3 sm:gap-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('map')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'map' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>District GIS Violation Map</span>
        </button>

        <button
          onClick={() => setActiveTab('notices')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'notices' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Section 36 Notices Queue ({notices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('offenders')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'offenders' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Repeat Offenders Engine ({offenders.length})</span>
        </button>
      </div>

      {/* TAB 1: GIS Violation Map (Interactive Simulation) */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
              <span className="font-bold text-zinc-800">
                Spatial Density Hotspot Map (Noida, Greater Noida, Kanpur Retail Corridors)
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 text-[11px] text-rose-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                  High Violation Cluster
                </span>
                <span className="flex items-center gap-1 text-[11px] text-amber-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Watchlist / Warning
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Compliant Baseline
                </span>
              </div>
            </div>

            {/* Real Interactive Leaflet/GIS Map Container */}
            <div className="relative h-64 sm:h-96 w-full rounded-xl overflow-hidden border border-zinc-200 shadow-sm z-0">
              <LeafletMap />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Section 36 Notices Quick Table */}
      {activeTab === 'notices' && (
        <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-x-auto">
          <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span className="font-bold text-xs text-zinc-800">Section 36 Compounding & Prosecution Notices</span>
            <Link href="/notices/pending" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
              Open Full Approval Drawer &rarr;
            </Link>
          </div>

          <table className="w-full min-w-[650px] text-left text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase">
                <th className="py-3 px-6">Notice Number</th>
                <th className="py-3 px-4">Brand & Company</th>
                <th className="py-3 px-4">Violations Cited</th>
                <th className="py-3 px-4">Drafted Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-700">
              {notices.map((n) => (
                <tr key={n.id} className="hover:bg-zinc-50 transition">
                  <td className="py-4 px-6 font-mono font-bold text-zinc-900">{n.noticeNumber}</td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-zinc-900">{n.brand}</div>
                    <div className="text-[11px] text-zinc-500">{n.companyName}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-rose-700">{n.violations.length} statutory count(s)</span>
                  </td>
                  <td className="py-4 px-4 text-zinc-500 font-mono text-[11px]">
                    {new Date(n.draftedAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                        n.status === 'draft'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {n.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href="/notices/pending"
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold text-[11px] transition"
                    >
                      Review & Issue
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Repeat Offenders Engine (from code-3.vbnet) */}
      {activeTab === 'offenders' && (
        <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-x-auto">
          <div className="p-4 border-b border-zinc-200">
            <h2 className="text-sm font-bold text-zinc-900">
              Repeat Offender Escalation Engine (Brands &ge; 3 Violations)
            </h2>
            <p className="text-xs text-zinc-500">
              Pursuant to Section 36(2) repeat offence sentencing, automated priority risk queue flags brands with chronic packaging defects.
            </p>
          </div>

          <table className="w-full min-w-[650px] text-left text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase">
                <th className="py-3 px-6">Brand Name</th>
                <th className="py-3 px-4">Total Scans</th>
                <th className="py-3 px-4">Violation Count</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Top Recurring Defect</th>
                <th className="py-3 px-6 text-right">Priority Queue</th>
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
                  <td className="py-4 px-4 font-mono">
                    <span className="px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800">
                      {off.riskScore} / 100
                    </span>
                  </td>
                  <td className="py-4 px-4 text-zinc-700">{off.topViolationRule}</td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => alert(`Brand '${off.brand}' added to field inspector priority sweep queue.`)}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium text-[11px] transition"
                    >
                      Add to Priority Queue
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  MapPin,
  FileText,
  ShieldAlert,
  BarChart3,
  Siren,
  Radio,
  Landmark,
} from 'lucide-react';
import { ApiClient } from '@/lib/api-client';

import FilterBar from '@/components/dashboard/FilterBar';
import HotspotDrawer from '@/components/dashboard/HotspotDrawer';
import LiveFeed from '@/components/dashboard/LiveFeed';
import AnalyticsCards from '@/components/dashboard/AnalyticsCards';
import NoticeApprovalModal from '@/components/dashboard/NoticeApprovalModal';
import EnforcementSweepModal from '@/components/dashboard/EnforcementSweepModal';
import PatrolRadarOverlay from '@/components/dashboard/PatrolRadarOverlay';
import TreasuryLedgerView from '@/components/dashboard/TreasuryLedgerView';

const LeafletMap = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-zinc-500 bg-zinc-100 animate-pulse">
      Loading GIS Map...
    </div>
  ),
});

export default function DistrictControllerDashboard() {
  const notices = ApiClient.getNotices();
  const offenders = ApiClient.getRepeatOffenders();
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    ApiClient.fetchDistrictAnalytics().then((data) => {
      if (data) setAnalytics(data);
    });
  }, []);

  const [activeTab, setActiveTab] = useState<
    'map' | 'notices' | 'offenders' | 'analytics' | 'treasury'
  >('map');

  // Filter state
  const [filters, setFilters] = useState({
    zone: 'all',
    violationType: 'all',
    timeRange: 'today',
  });

  // Hotspot drawer state
  const [selectedHotspot, setSelectedHotspot] = useState<{
    id: string;
    name: string;
    location: string;
    coords: [number, number];
    type: 'critical' | 'warning' | 'compliant';
    details: string;
    scans: number;
    rate?: string;
  } | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Notice approval modal state
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);

  // Enforcement sweep modal state
  const [isSweepModalOpen, setIsSweepModalOpen] = useState(false);

  // Live feed visibility
  const [showLiveFeed, setShowLiveFeed] = useState(true);

  const pendingNoticesCount = notices.filter(
    (n) => n.status === 'draft'
  ).length;

  const handleHotspotClick = (hotspot: typeof selectedHotspot) => {
    setSelectedHotspot(hotspot);
    setIsDrawerOpen(true);
  };

  const handleNoticeReview = (notice: any) => {
    setSelectedNotice(notice);
    setIsNoticeModalOpen(true);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
              District Administration
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              Jurisdiction: Gautam Buddha Nagar & Kanpur Zone
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mt-1">
            District Controller Enforcement Center
          </h1>
          <p className="text-xs text-zinc-500">
            Statutory oversight, Section 36 notice approvals, repeat offender
            monitoring, and GIS violation hotspots.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsSweepModalOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Siren className="w-4 h-4" />
            <span>Initiate Enforcement Sweep</span>
          </button>
          <Link
            href="/notices/pending"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <FileText className="w-4 h-4" />
            <span>Review Pending Notices ({pendingNoticesCount})</span>
          </Link>
          <button
            onClick={() => setShowLiveFeed(!showLiveFeed)}
            className={`px-4 py-2 font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition border ${
              showLiveFeed
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-300'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>{showLiveFeed ? 'Live Feed ON' : 'Live Feed OFF'}</span>
          </button>
        </div>
      </div>

      {/* Top 5 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-shadow cursor-pointer">
          <span className="text-zinc-500 font-medium">
            Recorded Database Scans
          </span>
          <p className="text-2xl font-extrabold text-zinc-900 mt-1">
            {analytics ? analytics.totalInspections : 14}
          </p>
          <span className="text-[10px] text-emerald-700 font-semibold">
            Real-time DB dossiers
          </span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-shadow cursor-pointer">
          <span className="text-zinc-500 font-medium">Violations Found</span>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">
            {analytics ? analytics.nonCompliantCount : 13}
          </p>
          <span className="text-[10px] text-rose-700 font-semibold">
            {analytics ? `${(100 - analytics.complianceRatePercent).toFixed(1)}% defect rate` : '92.9% defect rate'}
          </span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-shadow cursor-pointer">
          <span className="text-zinc-500 font-medium">
            Critical Violations
          </span>
          <p className="text-2xl font-extrabold text-rose-700 mt-1">
            {analytics ? analytics.dualMrpTamperCount : 12}
          </p>
          <span className="text-[10px] text-rose-700 font-semibold">
            Dual MRP / Sticker Tampering
          </span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs border-l-4 border-l-amber-500 hover:shadow-md transition-shadow cursor-pointer">
          <span className="text-zinc-500 font-medium">
            Pending Section 36 Notices
          </span>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">
            {pendingNoticesCount}
          </p>
          <span className="text-[10px] text-amber-800 font-semibold">
            Controller Action Required
          </span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs col-span-2 lg:col-span-1 hover:shadow-md transition-shadow cursor-pointer">
          <span className="text-zinc-500 font-medium">Assessed Penalties</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">
            {analytics ? `₹ ${(analytics.totalCompoundingAssessedInr / 100000).toFixed(2)} L` : '₹ 6.25 L'}
          </p>
          <span className="text-[10px] text-emerald-800 font-semibold">
            Statutory Compounding Assessed
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto border-b border-zinc-200 text-xs font-semibold gap-3 sm:gap-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('map')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'map'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>District GIS Violation Map</span>
        </button>

        <button
          onClick={() => setActiveTab('notices')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'notices'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Section 36 Notices Queue ({notices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('offenders')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'offenders'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Repeat Offenders Engine ({offenders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics & Breakdown</span>
        </button>

        <button
          onClick={() => setActiveTab('treasury')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'treasury'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Treasury Recovery & Adjudication</span>
        </button>
      </div>

      {/* Main Content Area with optional Live Feed sidebar */}
      <div className="flex gap-6">
        {/* Main Content */}
        <div className={`${showLiveFeed ? 'flex-1 min-w-0' : 'w-full'}`}>
          {/* TAB 1: GIS Violation Map */}
          {activeTab === 'map' && (
            <div className="space-y-4">
              {/* Live Inspector Patrol Radar */}
              <PatrolRadarOverlay />

              {/* Filter Bar */}
              <FilterBar onFilterChange={setFilters} />

              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                  <span className="font-bold text-zinc-800">
                    Spatial Density Hotspot Map (Noida, Greater Noida, Kanpur
                    Retail Corridors)
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

                {/* Map Container */}
                <div className="relative h-[500px] w-full rounded-xl overflow-hidden border border-zinc-200 shadow-sm z-0">
                  <LeafletMap onHotspotClick={handleHotspotClick} />
                </div>

                <p className="text-[10px] text-zinc-400 text-center">
                  Click any marker on the map to open the Jurisdiction Dossier
                  with inspector details and recent scan history.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Section 36 Notices Quick Table */}
          {activeTab === 'notices' && (
            <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-x-auto">
              <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="font-bold text-xs text-zinc-800">
                  Section 36 Compounding & Prosecution Notices
                </span>
                <Link
                  href="/notices/pending"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
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
                    <tr
                      key={n.id}
                      className="hover:bg-zinc-50 transition cursor-pointer"
                      onClick={() => handleNoticeReview(n)}
                    >
                      <td className="py-4 px-6 font-mono font-bold text-zinc-900">
                        {n.noticeNumber}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-zinc-900">
                          {n.brand}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {n.companyName}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-rose-700">
                          {n.violations.length} statutory count(s)
                        </span>
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNoticeReview(n);
                          }}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold text-[11px] transition"
                        >
                          Review & Sign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: Repeat Offenders Engine */}
          {activeTab === 'offenders' && (
            <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-x-auto">
              <div className="p-4 border-b border-zinc-200">
                <h2 className="text-sm font-bold text-zinc-900">
                  Repeat Offender Escalation Engine (Brands &ge; 3 Violations)
                </h2>
                <p className="text-xs text-zinc-500">
                  Pursuant to Section 36(2) repeat offence sentencing, automated
                  priority risk queue flags brands with chronic packaging
                  defects.
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
                    <tr
                      key={idx}
                      className="hover:bg-zinc-50 transition"
                    >
                      <td className="py-4 px-6">
                        <div className="font-bold text-zinc-900">
                          {off.brand}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {off.companyName}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono">{off.totalScans}</td>
                      <td className="py-4 px-4 font-mono font-bold text-rose-700">
                        {off.violationCount}
                      </td>
                      <td className="py-4 px-4 font-mono">
                        <span className="px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800">
                          {off.riskScore} / 100
                        </span>
                      </td>
                      <td className="py-4 px-4 text-zinc-700">
                        {off.topViolationRule}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() =>
                            alert(
                              `Brand '${off.brand}' added to field inspector priority sweep queue.`
                            )
                          }
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

          {/* TAB 4: Analytics & Breakdown */}
          {activeTab === 'analytics' && <AnalyticsCards />}

          {/* TAB 5: Treasury Recovery & Adjudication Ledger */}
          {activeTab === 'treasury' && <TreasuryLedgerView />}
        </div>

        {/* Live Feed Sidebar */}
        {showLiveFeed && (
          <div className="hidden xl:block w-80 flex-shrink-0">
            <div className="sticky top-24">
              <LiveFeed />
            </div>
          </div>
        )}
      </div>

      {/* Hotspot Drawer */}
      <HotspotDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        hotspot={selectedHotspot}
      />

      {/* Notice Approval Modal */}
      <NoticeApprovalModal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        notice={selectedNotice}
      />

      {/* Enforcement Sweep Modal */}
      <EnforcementSweepModal
        isOpen={isSweepModalOpen}
        onClose={() => setIsSweepModalOpen(false)}
      />
    </div>
  );
}

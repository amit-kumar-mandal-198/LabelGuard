'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ScanLine,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Camera,
  Download,
  Search,
  Zap,
  FileSpreadsheet,
  FileText,
  Eye,
  BadgeAlert,
  ChevronRight,
  ShieldCheck,
  Building
} from 'lucide-react';
import { ApiClient, resolveImageUrl } from '@/lib/api-client';
import { InspectionRecord } from '@/lib/types';
import InspectorTelemetryRibbon from '@/components/inspector/InspectorTelemetryRibbon';
import RetailBeatsRadar from '@/components/inspector/RetailBeatsRadar';
import FieldEvidenceDrawer from '@/components/inspector/FieldEvidenceDrawer';
import FormIVSeizureModal from '@/components/inspector/FormIVSeizureModal';
import RapidShelfSweepModal from '@/components/inspector/RapidShelfSweepModal';

export default function InspectorScansPage() {
  const initialInspections = ApiClient.getInspections();
  const [inspections, setInspections] = useState<InspectionRecord[]>(initialInspections);
  const [filter, setFilter] = useState<'all' | 'compliant' | 'violation' | 'tamper'>('all');
  const [selectedTehsil, setSelectedTehsil] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Drawer State
  const [selectedRecord, setSelectedRecord] = useState<InspectionRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isSeizureModalOpen, setIsSeizureModalOpen] = useState<boolean>(false);
  const [seizureTargetRecord, setSeizureTargetRecord] = useState<InspectionRecord | null>(null);
  const [isRapidSweepOpen, setIsRapidSweepOpen] = useState<boolean>(false);

  // Statistics for Telemetry
  const totalScans = inspections.length;
  const violationCount = inspections.filter((i) => i.status === 'NON_COMPLIANT').length;
  const tamperCount = inspections.filter((i) => i.tamperDetected).length;

  // Filtered Inspections
  const filtered = useMemo(() => {
    return inspections.filter((item) => {
      // Status filter
      if (filter === 'compliant' && item.status !== 'COMPLIANT') return false;
      if (filter === 'violation' && item.status !== 'NON_COMPLIANT') return false;
      if (filter === 'tamper' && !item.tamperDetected) return false;

      // Tehsil / Sector filter
      if (selectedTehsil !== 'all') {
        const loc = (item.location || '').toLowerCase();
        const store = (item.storeName || '').toLowerCase();
        if (!loc.includes(selectedTehsil.toLowerCase()) && !store.includes(selectedTehsil.toLowerCase())) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchProduct = (item.productName || '').toLowerCase().includes(q);
        const matchBrand = (item.brand || '').toLowerCase().includes(q);
        const matchBarcode = (item.barcode || '').toLowerCase().includes(q);
        const matchSku = (item.sku || '').toLowerCase().includes(q);
        const matchStore = (item.storeName || '').toLowerCase().includes(q);
        if (!matchProduct && !matchBrand && !matchBarcode && !matchSku && !matchStore) {
          return false;
        }
      }

      return true;
    });
  }, [inspections, filter, selectedTehsil, searchQuery]);

  // Drawer & Modal Handlers
  const handleOpenDrawer = (record: InspectionRecord) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleOpenSeizureFromDrawer = (record: InspectionRecord) => {
    setIsDrawerOpen(false);
    setSeizureTargetRecord(record);
    setIsSeizureModalOpen(true);
  };

  const handleOpenSeizureDirect = (e: React.MouseEvent, record: InspectionRecord) => {
    e.stopPropagation();
    setSeizureTargetRecord(record);
    setIsSeizureModalOpen(true);
  };

  // Rapid Batch Sweep integration
  const handleAddBatchToRegistry = (newItems: any[]) => {
    const formatted: InspectionRecord[] = newItems.map((item, index) => ({
      id: item.id,
      productName: item.productName,
      brand: item.brand,
      sku: `SWEEP-SKU-${index + 1}`,
      category: item.category,
      barcode: item.barcode,
      declaredMrp: 35.0,
      netQuantity: '45 g',
      mfgMonthYear: '08/2026',
      storeName: item.retailer,
      location: item.location,
      gpsCoords: { lat: 28.5708, lng: 77.3261 },
      status: item.status === 'compliant' ? 'COMPLIANT' : 'NON_COMPLIANT',
      complianceScore: item.status === 'compliant' ? 100 : 45,
      createdAt: new Date().toISOString(),
      imageUrl: item.image,
      tamperDetected: item.status !== 'compliant',
      scanSource: 'field_inspector',
      violations: item.status !== 'compliant' ? [{
        id: `VIO-${index + 1}`,
        ruleCode: 'LG-DEFECT',
        ruleTitle: 'Packaging Non-Compliance',
        legalCitation: 'Rule 6, Legal Metrology (PC) Rules 2011',
        fieldName: 'declaration',
        severity: 'major',
        status: 'open',
        message: item.defectReason || 'Packaging non-compliance identified during sweep',
        detectedValue: null,
        expectedValue: 'Compliant format',
        fixSuggestion: 'Rectify packaging declaration',
      }] : [],
      declarations: []
    }));

    setInspections((prev) => [...formatted, ...prev]);
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['ID', 'Product Name', 'Brand', 'SKU', 'Barcode', 'Store', 'Location', 'Status', 'Score', 'Tamper Detected', 'Created At'];
    const rows = filtered.map((i) => [
      i.id,
      `"${i.productName?.replace(/"/g, '""') || ''}"`,
      `"${i.brand?.replace(/"/g, '""') || ''}"`,
      i.sku || '',
      i.barcode || '',
      `"${i.storeName?.replace(/"/g, '""') || ''}"`,
      `"${i.location?.replace(/"/g, '""') || ''}"`,
      i.status,
      i.complianceScore,
      i.tamperDetected ? 'YES' : 'NO',
      i.createdAt
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LM_Inspector_Dossier_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Field Enforcement Division
            </span>
            <span className="text-xs text-zinc-500 font-mono">Tehsil Circle: Noida-NCR-Sector-18</span>
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight mt-1.5">
            Field Inspection & Shelf Audit Docket
          </h1>
          <p className="text-xs text-zinc-500 max-w-2xl">
            Real-time packaged commodity surveillance feed with cryptographic GPS EXIF geotagging, on-device OCR verification, and Legal Metrology Section 15 seizure protocol.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Rapid Batch Shelf Sweep Trigger */}
          <button
            onClick={() => setIsRapidSweepOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Zap className="w-4 h-4" />
            <span>Rapid Batch Shelf Sweep</span>
          </button>

          {/* Camera Scanner Link */}
          <Link
            href="/inspector/camera"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Camera className="w-4 h-4" />
            <span>Open Camera Scanner</span>
          </Link>

          {/* New Scan Simulator */}
          <Link
            href="/inspector/new"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <ScanLine className="w-4 h-4" />
            <span>Single SKU Scan</span>
          </Link>
        </div>
      </div>

      {/* Feature 1: Inspector Telemetry & Quota Ribbon */}
      <InspectorTelemetryRibbon
        totalScans={totalScans}
        violationCount={violationCount}
        tamperCount={tamperCount}
      />

      {/* Feature 2: Assigned Retail Beats & Geofenced Radar */}
      <RetailBeatsRadar />

      {/* Feature 6: Search, Filters & Export Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-3 text-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product, brand, barcode, SKU, or retail store..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-blue-500 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Action Tools: CSV Export */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-lg flex items-center gap-1.5 border border-zinc-300 transition"
              title="Export current table to CSV format"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV Dossier</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-zinc-500 font-semibold mr-1">
              <Filter className="w-3.5 h-3.5" /> Status:
            </div>
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                filter === 'all' ? 'bg-zinc-900 text-white font-semibold' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              All ({inspections.length})
            </button>
            <button
              onClick={() => setFilter('compliant')}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                filter === 'compliant' ? 'bg-emerald-600 text-white font-semibold' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Compliant ({inspections.filter(i => i.status === 'COMPLIANT').length})
            </button>
            <button
              onClick={() => setFilter('violation')}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                filter === 'violation' ? 'bg-rose-600 text-white font-semibold' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              Violations ({violationCount})
            </button>
            <button
              onClick={() => setFilter('tamper')}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                filter === 'tamper' ? 'bg-amber-600 text-white font-semibold' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Dual-MRP Tamper ({tamperCount})
            </button>
          </div>

          {/* Sector / Location Quick Pills */}
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <span className="font-semibold text-zinc-600">Location:</span>
            <select
              value={selectedTehsil}
              onChange={(e) => setSelectedTehsil(e.target.value)}
              className="bg-zinc-100 border border-zinc-300 rounded px-2 py-0.5 text-xs text-zinc-800 focus:outline-none"
            >
              <option value="all">All Beats & Sectors</option>
              <option value="Sector 18">Sector 18 Commercial</option>
              <option value="Atta Market">Atta Market Complex</option>
              <option value="Noida">Greater Noida / Noida Hub</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scans Table with Clickable Evidence Drawer Trigger */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-6">Product / Brand</th>
                <th className="py-3.5 px-4">Retail Shop & GPS Beat</th>
                <th className="py-3.5 px-4 text-center">Score</th>
                <th className="py-3.5 px-4">Compliance Status</th>
                <th className="py-3.5 px-4">Tamper Check</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-6 text-right">Field Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <ScanLine className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                    <p className="font-medium">No matching inspection scans found</p>
                    <p className="text-[11px] text-zinc-400 mt-1">Try resetting the filter pills or search terms.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenDrawer(item)}
                    className="hover:bg-blue-50/40 cursor-pointer transition group"
                  >
                    {/* Product / Brand */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img
                            src={resolveImageUrl(item.imageUrl)}
                            alt={item.productName}
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.src.includes('/samples/biscuits.jpg')) {
                                target.src = '/samples/biscuits.jpg';
                              }
                            }}
                            className="w-10 h-10 rounded-lg object-cover border border-zinc-200 shrink-0 shadow-xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 shrink-0">
                            <ScanLine className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-zinc-900 group-hover:text-blue-600 transition flex items-center gap-1.5">
                            <span>{item.productName}</span>
                            <ChevronRight className="w-3 h-3 text-zinc-300 opacity-0 group-hover:opacity-100 transition" />
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            {item.brand} • <span className="font-mono">{item.sku}</span>
                          </div>
                          {item.barcode && (
                            <div className="text-[10px] font-mono text-zinc-400">
                              Barcode: {item.barcode}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Store & Location */}
                    <td className="py-4 px-4">
                      <div className="font-medium text-zinc-900">{item.storeName || 'Wholesale Depot'}</div>
                      <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[180px]">{item.location || '28.5708° N, 77.3261° E'}</span>
                      </div>
                    </td>

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
                      {item.status === 'COMPLIANT' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> COMPLIANT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertTriangle className="w-3 h-3" /> VIOLATIONS ({item.violations?.length || 1})
                        </span>
                      )}
                    </td>

                    {/* Tamper Check */}
                    <td className="py-4 px-4">
                      {item.tamperDetected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase bg-rose-100 text-rose-900 border border-rose-300 animate-pulse">
                          <BadgeAlert className="w-3 h-3" /> TAMPER FLAG
                        </span>
                      ) : (
                        <span className="text-zinc-400 font-mono text-[11px]">Normal</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-zinc-500 font-mono text-[11px]">
                      {new Date(item.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {/* Open Evidence Drawer */}
                        <button
                          onClick={() => handleOpenDrawer(item)}
                          className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded font-medium text-[11px] transition flex items-center gap-1"
                          title="View forensic evidence and GPS cryptographic signatures"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Evidence</span>
                        </button>

                        {/* Seizure Memo Trigger if violation or tamper */}
                        {(item.status === 'NON_COMPLIANT' || item.tamperDetected) && (
                          <button
                            onClick={(e) => handleOpenSeizureDirect(e, item)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-medium text-[11px] transition flex items-center gap-1"
                            title="Generate Statutory Form IV Seizure Memo"
                          >
                            <FileText className="w-3 h-3 text-rose-600" />
                            <span>Form IV</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Displaying <strong>{filtered.length}</strong> of <strong>{inspections.length}</strong> records in active beat
          </span>
          <span className="text-[11px] font-mono text-zinc-400">
            MeghRaj Sync Node: NCR-DL-EAST-04 • SHA-256 Validated
          </span>
        </div>
      </div>

      {/* Feature 3: Interactive Field Evidence Drawer */}
      <FieldEvidenceDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        record={selectedRecord}
        onOpenSeizureModal={handleOpenSeizureFromDrawer}
      />

      {/* Feature 4: Statutory Form IV Spot Seizure Modal */}
      <FormIVSeizureModal
        isOpen={isSeizureModalOpen}
        onClose={() => setIsSeizureModalOpen(false)}
        record={seizureTargetRecord}
        onSuccess={(memoId) => {
          // Can mark the record as seized in local state
        }}
      />

      {/* Feature 5: Rapid Batch Shelf Sweep Modal */}
      <RapidShelfSweepModal
        isOpen={isRapidSweepOpen}
        onClose={() => setIsRapidSweepOpen(false)}
        onAddBatchToRegistry={handleAddBatchToRegistry}
      />

    </div>
  );
}

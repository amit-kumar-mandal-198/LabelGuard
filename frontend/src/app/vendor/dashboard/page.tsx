'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  AlertOctagon,
  ShieldCheck,
  TrendingUp,
  PackageCheck,
  PlusCircle,
  Clock,
  ArrowUpRight,
  Download,
  AlertTriangle,
  Award,
  ExternalLink,
  Wrench,
  Truck,
  Layers,
  ChevronRight,
  CheckCircle2,
  UploadCloud,
  FileSpreadsheet
} from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { InspectionRecord } from '@/lib/types';
import BulkArtworkDropzone from '@/components/vendor/BulkArtworkDropzone';
import FinancialRiskCalculator from '@/components/vendor/FinancialRiskCalculator';
import DeclarationHealthMatrix from '@/components/vendor/DeclarationHealthMatrix';
import ArtworkRemediationDrawer from '@/components/vendor/ArtworkRemediationDrawer';
import PreMarketClearanceModal from '@/components/vendor/PreMarketClearanceModal';
import EcommSyncGuard from '@/components/vendor/EcommSyncGuard';
import OfficialCertificateModal from '@/components/vendor/OfficialCertificateModal';

export default function VendorDashboard() {
  const initialInspections = ApiClient.getInspections();
  const [inspections, setInspections] = useState<InspectionRecord[]>(initialInspections);
  const certificate = ApiClient.getCertificate();

  // Modals & Drawer state
  const [showCertModal, setShowCertModal] = useState<boolean>(false);
  const [showClearanceModal, setShowClearanceModal] = useState<boolean>(false);
  const [clearanceRecord, setClearanceRecord] = useState<InspectionRecord | null>(null);
  const [showRemediationDrawer, setShowRemediationDrawer] = useState<boolean>(false);
  const [remediationRecord, setRemediationRecord] = useState<InspectionRecord | null>(null);

  // Overall compliance score across catalog
  const compliantCount = inspections.filter((i) => i.status === 'COMPLIANT').length;
  const violationCount = inspections.filter((i) => i.status === 'NON_COMPLIANT').length;
  const avgScore = inspections.length > 0 
    ? Math.round(inspections.reduce((acc, curr) => acc + curr.complianceScore, 0) / inspections.length) 
    : 88;

  // Handler for Batch Import from Bulk Dropzone
  const handleImportStagedArtworks = (stagedItems: any[]) => {
    const newRecords: InspectionRecord[] = stagedItems.map((item, idx) => ({
      id: `INSP-PROOF-${Date.now().toString().slice(-4)}-${idx + 1}`,
      productName: item.name.replace(/_/g, ' ').replace(/\.(pdf|ai|png|jpg)/, ''),
      brand: 'NutriRich Foods',
      sku: item.sku,
      category: item.category,
      barcode: item.barcode,
      declaredMrp: 65.0,
      netQuantity: '250 g',
      mfgMonthYear: '08/2026',
      storeName: 'Pre-Print Plate Engraving Lab',
      location: 'Ecotech III Plant, Greater Noida',
      status: item.readinessScore >= 90 ? 'COMPLIANT' : 'NON_COMPLIANT',
      complianceScore: item.readinessScore,
      createdAt: new Date().toISOString(),
      imageUrl: item.imageUrl,
      tamperDetected: false,
      scanSource: 'vendor_self_audit',
      violations: item.readinessScore < 90 ? [
        {
          id: `VIOL-STAGED-${idx}`,
          ruleCode: 'LG-CARE',
          ruleTitle: 'Rule 6(5) — Missing Mandatory Consumer Grievance Contact',
          legalCitation: 'LM(PC) Amendment Rules 2021, Rule 6(5)',
          fieldName: 'consumer_care',
          severity: 'major',
          status: 'open',
          message: 'Consumer care toll-free contact unverified on die-line layer.',
          detectedValue: 'Missing',
          expectedValue: 'Valid Toll-free + Email',
          confidence: 94.0,
          fixSuggestion: 'Incorporate official toll-free telephone and email.'
        }
      ] : [],
      declarations: []
    }));

    setInspections(prev => [...newRecords, ...prev]);
  };

  // Handler to apply remediation to a flagged record
  const handleApplyRemediation = (recordId: string) => {
    setInspections(prev => prev.map(item => {
      if (item.id === recordId) {
        return {
          ...item,
          status: 'COMPLIANT',
          complianceScore: 98,
          violations: []
        };
      }
      return item;
    }));
  };

  // Select SKU from Health Matrix for instant remediation
  const handleSelectSkuForRemediation = (sku: string) => {
    const target = inspections.find(i => i.sku === sku) || inspections.find(i => i.status === 'NON_COMPLIANT') || inspections[0];
    setRemediationRecord(target);
    setShowRemediationDrawer(true);
  };

  const handleOpenRemediation = (record: InspectionRecord) => {
    setRemediationRecord(record);
    setShowRemediationDrawer(true);
  };

  const handleOpenClearance = (record: InspectionRecord) => {
    setClearanceRecord(record);
    setShowClearanceModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Vendor Self-Audit Portal
            </span>
            <span className="text-xs text-zinc-500 font-mono">GSTIN: 09AAACN8841F1ZS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight mt-1">
            NutriRich Foods Compliance Command Center
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            Pre-print packaging artwork verification, mandatory Legal Metrology declarations monitoring, and quick-commerce catalog price sync.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Logistics Inbound Pass Trigger */}
          <button
            onClick={() => handleOpenClearance(inspections[0])}
            className="px-3.5 py-2 bg-white border border-zinc-300 text-zinc-800 hover:bg-zinc-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
          >
            <Truck className="w-4 h-4 text-zinc-600" />
            <span>Shipping QR Pass</span>
          </button>

          {/* Active Certificate Modal Trigger */}
          <button
            onClick={() => setShowCertModal(true)}
            className="px-3.5 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
          >
            <Award className="w-4 h-4 text-emerald-600" />
            <span>View Active Certificate</span>
          </button>

          {/* New Self-Audit */}
          <Link
            href="/vendor/audit/new"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Single Proof Audit</span>
          </Link>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compliance Score */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500">Catalog Compliance Score</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">{avgScore}%</p>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+4.2% vs last quarter</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-sm">
            A+
          </div>
        </div>

        {/* Audited SKUs */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Total Registered SKUs</p>
          <p className="text-3xl font-extrabold text-zinc-900 mt-1">{inspections.length + 20}</p>
          <p className="text-[11px] text-zinc-500 mt-1">Across 3 manufacturing plants</p>
        </div>

        {/* Compliant Labels */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Compliant (Pre-Approved)</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1">{compliantCount + 19}</p>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium">Zero penalties in market</p>
        </div>

        {/* Action Required */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Requires Revision</p>
          <p className="text-3xl font-extrabold text-amber-600 mt-1">{violationCount}</p>
          <p className="text-[11px] text-amber-700 mt-1 font-medium">Pre-print flags to resolve</p>
        </div>
      </div>

      {/* Prevention vs Penalty Value Highlight Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-emerald-900/50 shadow-md">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Value Proposition: Prevention &gt; Penalty
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Fixing an artwork typographic error digitally before plate engraving costs <strong className="text-white">₹10</strong>. Detecting a non-compliant label after market distribution incurs statutory compounding fines up to <strong className="text-amber-300">₹25,000+ per batch</strong> plus catastrophic product recall & repackaging losses.
          </p>
        </div>
        <Link
          href="/vendor/audit/new"
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs shrink-0 shadow-lg shadow-emerald-900/40 transition"
        >
          Audit New Artwork Now
        </Link>
      </div>

      {/* Feature 1: Bulk Artwork Pre-Print Staging Zone */}
      <BulkArtworkDropzone onImportToCatalog={handleImportStagedArtworks} />

      {/* Feature 2: Financial Penalty & Market Recall Risk Exposure Calculator */}
      <FinancialRiskCalculator />

      {/* Feature 3: Mandatory 8-Declaration Health Radar / Rule Breakdown Matrix */}
      <DeclarationHealthMatrix onSelectSkuForRemediation={handleSelectSkuForRemediation} />

      {/* Feature 6: E-Commerce & Quick-Commerce Catalog Price Sync Guard */}
      <EcommSyncGuard />

      {/* Recent Audits Table with One-Click Remediation & Shipping Pass triggers */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs space-y-4">
        <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Recent Packaging Audits</h2>
            <p className="text-xs text-zinc-500">History of label proofs, compliance scores, and status</p>
          </div>
          <Link
            href="/vendor/products"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>View All Products</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-6">Product / SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Declared MRP</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Audited Date</th>
                <th className="py-3 px-6 text-right">Action Tools</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-700">
              {inspections.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/80 transition">
                  {/* Product & Thumbnail */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-9 h-9 rounded-lg object-cover border border-zinc-200 shrink-0"
                        />
                      )}
                      <div>
                        <div className="font-semibold text-zinc-900">{item.productName}</div>
                        <div className="text-[11px] font-mono text-zinc-500">{item.sku}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4">{item.category}</td>
                  
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
                    {item.status === 'COMPLIANT' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3" /> PASS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                        <AlertTriangle className="w-3 h-3" /> VIOLATIONS ({item.violations.length})
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-4 text-zinc-500 font-mono text-[11px]">
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Action Tools */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Remediate Button if violations present */}
                      {item.status !== 'COMPLIANT' && (
                        <button
                          onClick={() => handleOpenRemediation(item)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded font-semibold text-[11px] transition flex items-center gap-1 shadow-2xs"
                          title="Open AI Artwork Remediation Assistant"
                        >
                          <Wrench className="w-3 h-3 text-amber-600" />
                          <span>Remediate</span>
                        </button>
                      )}

                      {/* Shipping Pass if compliant */}
                      {item.status === 'COMPLIANT' && (
                        <button
                          onClick={() => handleOpenClearance(item)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-semibold text-[11px] transition flex items-center gap-1 shadow-2xs"
                          title="Generate Pre-Market Warehouse Inbound Shipping Pass"
                        >
                          <Truck className="w-3 h-3 text-emerald-600" />
                          <span>QR Pass</span>
                        </button>
                      )}

                      {/* Full Report Link */}
                      <Link
                        href={`/scan/${item.id}`}
                        className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded font-medium text-[11px] transition inline-flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature 4: One-Click Artwork Remediation Assistant Drawer */}
      <ArtworkRemediationDrawer
        isOpen={showRemediationDrawer}
        onClose={() => setShowRemediationDrawer(false)}
        record={remediationRecord}
        onApplyRemediation={handleApplyRemediation}
      />

      {/* Feature 5: Pre-Market Warehouse Inbound Logistics Clearance Pass Modal */}
      <PreMarketClearanceModal
        isOpen={showClearanceModal}
        onClose={() => setShowClearanceModal(false)}
        record={clearanceRecord}
      />

      {/* Official Certificate Modal */}
      {showCertModal && (
        <OfficialCertificateModal
          isOpen={showCertModal}
          onClose={() => setShowCertModal(false)}
          record={inspections[0]}
        />
      )}

    </div>
  );
}

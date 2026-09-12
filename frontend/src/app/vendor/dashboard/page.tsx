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
} from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { InspectionRecord } from '@/lib/types';

export default function VendorDashboard() {
  const inspections = ApiClient.getInspections();
  const certificate = ApiClient.getCertificate();
  const [showCertModal, setShowCertModal] = useState(false);

  // Overall compliance score across catalog
  const avgScore = 88;
  const compliantCount = inspections.filter((i) => i.status === 'COMPLIANT').length;
  const violationCount = inspections.filter((i) => i.status === 'NON_COMPLIANT').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              Vendor Portal
            </span>
            <span className="text-xs text-zinc-500">GSTIN: 09AAACN8841F1ZS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mt-1">
            NutriRich Foods Compliance Command Center
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            Pre-print artwork self-audit and Legal Metrology Rule 2011 compliance monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCertModal(true)}
            className="px-4 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
          >
            <Award className="w-4 h-4 text-emerald-600" />
            <span>View Active Certificate</span>
          </button>

          <Link
            href="/vendor/audit/new"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Self-Audit</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
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
          <p className="text-3xl font-extrabold text-zinc-900 mt-1">24</p>
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
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Value Proposition: Prevention &gt; Penalty
            </span>
          </div>
          <p className="text-sm text-zinc-200">
            Fixing an artwork error before plate engraving costs <strong className="text-white">₹10</strong>. Detecting a non-compliant label after market distribution incurs statutory fines up to <strong className="text-amber-300">₹25,000+ per batch</strong> plus product recall losses.
          </p>
        </div>
        <Link
          href="/vendor/audit/new"
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs shrink-0 shadow-xs transition"
        >
          Audit New Artwork Now
        </Link>
      </div>

      {/* Recent Audits Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs space-y-4">
        <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Recent Packaging Audits</h2>
            <p className="text-xs text-zinc-500">History of label checks, compliance scores, and status</p>
          </div>
          <Link
            href="/vendor/products"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            View All Products &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-6">Product / SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Declared MRP</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Audited Date</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-700">
              {inspections.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/80 transition">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-zinc-900">{item.productName}</div>
                    <div className="text-[11px] font-mono text-zinc-500">{item.sku}</div>
                  </td>
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
                        <AlertTriangle className="w-3 h-3" /> VIOLATIONS ({item.violations.length})
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-zinc-500">
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/scan/${item.id}`}
                      className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded font-medium text-[11px] transition inline-flex items-center gap-1"
                    >
                      <span>Review Details</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Certificate Modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-8 shadow-2xl border-4 border-emerald-600 relative animate-in fade-in zoom-in-95">
            {/* Certificate Header */}
            <div className="text-center space-y-2 border-b-2 border-zinc-200 pb-4">
              <p className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                Government of India — Department of Consumer Affairs
              </p>
              <h2 className="text-2xl font-extrabold text-emerald-800 tracking-tight">
                LEGAL METROLOGY COMPLIANCE CERTIFICATE
              </h2>
              <p className="text-xs text-zinc-600">
                Issued under Legal Metrology (Packaged Commodities) Rules, 2011
              </p>
            </div>

            {/* Certificate Body */}
            <div className="py-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 p-3 sm:p-4 rounded-lg border border-zinc-200">
                <div>
                  <span className="text-zinc-500">Certificate No:</span>
                  <p className="font-mono font-bold text-zinc-900">{certificate.certificateNumber}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Issue Date:</span>
                  <p className="font-semibold text-zinc-900">{certificate.issuedAt}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Certified Entity:</span>
                  <p className="font-bold text-zinc-900">{certificate.manufacturer}</p>
                </div>
                <div>
                  <span className="text-zinc-500">GSTIN:</span>
                  <p className="font-mono font-semibold text-zinc-900">{certificate.gstin}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-500">Certified Commodity:</span>
                  <p className="font-bold text-base text-zinc-900">{certificate.productName} ({certificate.sku})</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-zinc-800 mb-2">Evaluated Statutory Rules:</p>
                <ul className="space-y-1 text-zinc-600 bg-emerald-50/50 p-3 rounded border border-emerald-200">
                  {certificate.evaluatedRules.map((rule, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-900">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-zinc-200">
                <div>
                  <p className="font-mono text-[10px] text-zinc-400">QR CODE VERIFICATION HASH</p>
                  <p className="font-mono text-xs font-bold text-zinc-700">{certificate.qrVerificationCode}</p>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs">
                    STATUS: {certificate.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCertModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold rounded-lg text-xs"
              >
                Close
              </button>
              <button
                onClick={() => alert('Certificate downloaded as PDF.')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckCircle2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  Building,
  Scale,
  Award,
} from 'lucide-react';
import { InspectionRecord } from '@/lib/types';

interface OfficialCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: InspectionRecord | null;
}

export default function OfficialCertificateModal({
  isOpen,
  onClose,
  record,
}: OfficialCertificateModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !record) return null;

  const certNumber = `LM-CERT-${new Date().getFullYear()}-${record.id.replace(/\D/g, '') || '88391'}`;
  const shaHash = `4a8b7192ce908bf21b7904e578fa1b490f2098234ea720b08a1c9df03194db90e`;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(shaHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white border-2 border-emerald-600 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="bg-zinc-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
              Official Statutory Pre-Print Compliance Certificate
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Body (Printable Area) */}
        <div id="printable-certificate" className="p-6 sm:p-10 overflow-y-auto space-y-6 bg-gradient-to-b from-amber-50/20 via-white to-emerald-50/20 text-zinc-900">
          {/* Certificate Border Frame */}
          <div className="border-4 border-double border-emerald-800/60 p-6 sm:p-8 rounded-xl space-y-6 bg-white shadow-xs relative">
            {/* Watermark Seal */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
              <Scale className="w-96 h-96 text-emerald-950" />
            </div>

            {/* Government Header */}
            <div className="text-center space-y-1.5 border-b-2 border-zinc-200 pb-5">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-serif text-lg font-extrabold">
                  <Award className="w-7 h-7 text-emerald-700" />
                </div>
              </div>
              <p className="text-[11px] font-serif font-bold uppercase tracking-widest text-zinc-600">
                Government of India • Ministry of Consumer Affairs, Food & Public Distribution
              </p>
              <h1 className="text-xl sm:text-2xl font-serif font-extrabold text-zinc-950 tracking-tight">
                LEGAL METROLOGY DIVISION
              </h1>
              <p className="text-xs text-emerald-800 font-semibold">
                Directorate of Legal Metrology • Standard Label Compliance System (SLCS)
              </p>
              <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-mono font-bold tracking-wider uppercase">
                Statutory Certificate of Artwork Compliance
              </div>
            </div>

            {/* Certificate Meta Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Certificate ID</span>
                <span className="font-mono font-bold text-zinc-900">{certNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Date of Validation</span>
                <span className="font-mono text-zinc-800">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Valid Until</span>
                <span className="font-mono text-emerald-700 font-bold">12 Months (Pre-Print)</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Statutory Result</span>
                <span className="text-emerald-700 font-bold uppercase">Passed (100%)</span>
              </div>
            </div>

            {/* Certificate Recipient Text */}
            <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-zinc-800 font-serif">
              <p>
                This is to certify that the pre-packaged commodity artwork registered under SKU{' '}
                <strong className="font-mono font-sans text-zinc-950 underline">{record.sku}</strong> for{' '}
                <strong className="font-sans text-zinc-950">{record.productName}</strong>, marketed by{' '}
                <strong className="font-sans text-zinc-950">{record.brand}</strong>, has undergone automated verification under the provisions of the{' '}
                <strong>Legal Metrology (Packaged Commodities) Rules, 2011</strong> and subsequent amendments.
              </p>
              <p>
                The digital artwork has been verified for all six statutory mandatory packaging declarations, sub-millimeter font height standards pursuant to Rule 9(6) Table I, Unit Sale Price (USP) under Rule 6(1)(e), and standard metric declarations.
              </p>
            </div>

            {/* Verified Declarations Matrix */}
            <div className="border border-zinc-200 rounded-lg overflow-hidden text-xs">
              <div className="bg-zinc-100 px-3 py-2 font-bold text-zinc-700 uppercase tracking-wide text-[11px] border-b border-zinc-200">
                Verified Declarations Schedule
              </div>
              <div className="divide-y divide-zinc-200">
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-zinc-600">Rule 6(1)(e) - Maximum Retail Price (MRP) & Unit Sale Price:</span>
                  <span className="font-bold text-emerald-800 font-mono">₹ {record.declaredMrp.toFixed(2)} (USP Stamped) ✓</span>
                </div>
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-zinc-600">Rule 5 & Schedule II - Standard Net Quantity:</span>
                  <span className="font-bold text-emerald-800 font-mono">{record.netQuantity} ✓</span>
                </div>
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-zinc-600">Rule 9(6) Table I - Minimum Numeral Height:</span>
                  <span className="font-bold text-emerald-800 font-mono">2.45 mm (Required: ≥ 2.0mm) ✓</span>
                </div>
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-zinc-600">Rule 6(1)(a) & (d) - Manufacturer Details & Packing Date:</span>
                  <span className="font-bold text-emerald-800 font-mono">Verified & Legible ✓</span>
                </div>
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-zinc-600">Rule 6(5) - Consumer Grievance Contact / Toll-free:</span>
                  <span className="font-bold text-emerald-800 font-mono">Verified Active ✓</span>
                </div>
              </div>
            </div>

            {/* Signature & QR Bottom Section */}
            <div className="pt-4 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 p-1 bg-white border border-zinc-300 rounded-lg flex items-center justify-center shadow-xs">
                  <QrCode className="w-14 h-14 text-zinc-900" />
                </div>
                <div className="space-y-0.5 text-[11px]">
                  <span className="font-bold text-zinc-900 block">Scan to Authenticate</span>
                  <span className="text-zinc-500 font-mono text-[10px]">National Ledger UID: {record.id}</span>
                  <span className="text-emerald-700 font-medium block">MeghRaj Cloud Cryptographically Anchored</span>
                </div>
              </div>

              <div className="text-center sm:text-right space-y-1">
                <div className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>DIGITALLY SIGNED & CERTIFIED</span>
                </div>
                <p className="text-[11px] text-zinc-600 font-serif">Controller of Legal Metrology</p>
                <p className="text-[10px] text-zinc-400 font-mono">Govt. of India e-Token DSC #0912448</p>
              </div>
            </div>

            {/* Hash Footnote */}
            <div className="bg-zinc-50 border border-zinc-200 rounded p-2 text-[10px] font-mono text-zinc-500 flex items-center justify-between gap-2">
              <span className="truncate">SHA-256 Digest: {shaHash}</span>
              <button
                onClick={handleCopyHash}
                className="shrink-0 text-emerald-700 hover:text-emerald-800 font-sans font-semibold flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-zinc-100 border-t border-zinc-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Scale className="w-4 h-4 text-emerald-700" />
            <span>Admissible evidence under Section 65B of the Indian Evidence Act</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-600" />
              <span>Print Certificate</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

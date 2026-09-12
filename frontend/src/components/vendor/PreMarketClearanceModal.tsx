'use client';

import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ShieldCheck, 
  QrCode, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  Truck,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { InspectionRecord } from '@/lib/types';

interface PreMarketClearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  record?: InspectionRecord | null;
}

export default function PreMarketClearanceModal({
  isOpen,
  onClose,
  record
}: PreMarketClearanceModalProps) {
  const [copiedHash, setCopiedHash] = useState(false);

  if (!isOpen) return null;

  const clearanceId = `LM-INBOUND-2026-NTR-${record?.id.replace(/\D/g, '') || '9042'}`;
  const shaSignature = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(shaSignature);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border-2 border-emerald-600 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="bg-zinc-950 text-white px-6 py-4 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">PRE-MARKET INBOUND LOGISTICS CLEARANCE PASS</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  RETAIL FAST-TRACK
                </span>
              </div>
              <p className="text-xs text-zinc-400">Automated legal compliance verification for retail distribution hubs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pass Paper Layout */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs bg-zinc-50/50">
          
          <div className="p-6 bg-white border-2 border-dashed border-zinc-300 rounded-xl space-y-5 shadow-xs">
            
            {/* Top Emblem & Docket */}
            <div className="text-center border-b border-zinc-200 pb-4">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                DEPARTMENT OF CONSUMER AFFAIRS • LEGAL METROLOGY DIVISION
              </span>
              <h4 className="text-base font-extrabold text-zinc-900 tracking-tight mt-0.5">
                WAREHOUSE INBOUND COMPLIANCE CLEARANCE PASS
              </h4>
              <p className="text-xs text-emerald-700 font-mono font-bold mt-1">
                PASS DOCKET: {clearanceId} • CERTIFIED ON: {today}
              </p>
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 space-y-1">
                <span className="text-zinc-500 font-semibold text-[10px] uppercase">Registered Entity</span>
                <p className="font-bold text-zinc-900 text-xs">NutriRich Foods Private Limited</p>
                <p className="font-mono text-zinc-600 text-[11px]">GSTIN: 09AAACN8841F1ZS</p>
                <p className="text-zinc-500 text-[11px]">Plot 42, Ecotech III, Greater Noida 201306</p>
              </div>

              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 space-y-1">
                <span className="text-zinc-500 font-semibold text-[10px] uppercase">Certified SKU Batch</span>
                <p className="font-bold text-zinc-900 text-xs truncate">
                  {record?.productName || 'NutriRich Digestive Biscuits 500g'}
                </p>
                <p className="font-mono text-zinc-600 text-[11px]">SKU: {record?.sku || 'NR-DIG-500G'}</p>
                <p className="font-mono text-emerald-700 font-bold text-[11px]">
                  Batch Lot: LOT-2026-09-B42 • 25,000 Units
                </p>
              </div>
            </div>

            {/* QR Code & Warehouse Verification Badge */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>100% Pre-Approved for Immediate Inbound Stacking</span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-snug">
                  This lot has passed automated pre-print computer vision verification. Retailers (Reliance, Blinkit, Zepto, DMart) can scan the QR code to bypass manual packaging audits at receiving docks.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-400">SHA-256 Hash: {shaSignature.slice(0, 16)}...</span>
                  <button
                    onClick={handleCopy}
                    className="text-emerald-700 hover:text-emerald-900 font-semibold text-[10px] flex items-center gap-1"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Simulated QR Box */}
              <div className="w-24 h-24 bg-white border-2 border-zinc-900 rounded-lg p-1.5 flex flex-col items-center justify-center shrink-0 shadow-xs">
                <QrCode className="w-16 h-16 text-zinc-900" />
                <span className="text-[9px] font-mono font-bold text-zinc-600 mt-0.5">VERIFIED</span>
              </div>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-zinc-900 text-zinc-300 px-6 py-3.5 flex items-center justify-between border-t border-zinc-800">
          <span className="text-[11px] font-mono text-zinc-400">
            Print and affix sticker on master corrugated shipping cartons
          </span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Shipping Pass</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

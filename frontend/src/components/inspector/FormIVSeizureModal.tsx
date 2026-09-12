'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  X, 
  Printer, 
  Send, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  Calendar,
  PenTool,
  BadgeAlert
} from 'lucide-react';

interface FormIVSeizureModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  onSuccess?: (memoId: string) => void;
}

export default function FormIVSeizureModal({ isOpen, onClose, record, onSuccess }: FormIVSeizureModalProps) {
  const [seizedUnits, setSeizedUnits] = useState<number>(12);
  const [witness1Name, setWitness1Name] = useState<string>('Rameshwar Prasad (Independent Witness)');
  const [witness1Phone, setWitness1Phone] = useState<string>('+91 98112 34901');
  const [merchantSigned, setMerchantSigned] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedMemoId, setSubmittedMemoId] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const memoNumber = `DL-LM/SEC15/2026/09/SZ-${String(record.id).padStart(4, '0')}`;

  const handleDispatch = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedMemoId(memoNumber);
      if (onSuccess) {
        onSuccess(memoNumber);
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">STATUTORY FORM IV - SPOT SEIZURE MEMO</h3>
                <span className="text-[11px] font-mono bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                  SEC. 15 LM ACT 2009
                </span>
              </div>
              <p className="text-xs text-slate-400">Rule 29 of Legal Metrology (Packaged Commodities) Rules, 2011</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Paper Preview */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm bg-slate-900/60">
          
          {submittedMemoId ? (
            <div className="p-8 text-center bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-emerald-300">Spot Seizure Memo Registered Successfully</h4>
                <p className="text-xs text-slate-300 mt-1 font-mono">Reference Docket: {submittedMemoId}</p>
                <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
                  Digital Panchnama signed and queued into the District Controller Sec. 36 Adjudication docket. 
                  Tamper hash stamped on MeghRaj audit blockchain.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-2 border border-slate-700"
                >
                  <Printer className="w-4 h-4" /> Print Panchnama Copy
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-900/30"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Paper Layout */}
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-5 text-slate-300">
                {/* Gov Emblem Header */}
                <div className="text-center border-b border-slate-800 pb-4">
                  <span className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">
                    GOVERNMENT OF NATIONAL CAPITAL TERRITORY OF DELHI
                  </span>
                  <h4 className="text-sm font-bold text-white tracking-wide mt-0.5">
                    DIRECTORATE OF LEGAL METROLOGY (WEIGHTS & MEASURES)
                  </h4>
                  <p className="text-[11px] text-amber-400 font-mono mt-1">
                    DOCKET REF: {memoNumber} • DATE: {today}
                  </p>
                </div>

                {/* Retailer & Location Details */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[11px]">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" /> RETAIL ESTABLISHMENT / PREMISES
                    </span>
                    <p className="font-semibold text-white">{record.retailer || 'Reliance Smart Bazaar, Sector 18'}</p>
                    <p className="text-slate-400 font-mono text-[11px]">DL-GST: 07AAACR4412K1ZQ</p>
                    <p className="text-slate-400 text-[11px]">Sector 18 Commercial Hub, Tehsil Noida / Delhi NCR</p>
                  </div>
                  <div className="space-y-1 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" /> INSPECTION OFFICER & JURISDICTION
                    </span>
                    <p className="font-semibold text-white">Insp. Rajesh Sharma (ID: LM-NCR-8492)</p>
                    <p className="text-slate-400 text-[11px]">Sub-Division: East Delhi / Noida Border Circle 4</p>
                    <p className="text-emerald-400 font-mono text-[11px]">Geofence Validated: 28.5708° N, 77.3261° E</p>
                  </div>
                </div>

                {/* Seized Item Details */}
                <div className="border border-slate-800 rounded-lg p-3 bg-slate-900/40 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Contraband / Seized Package Details</span>
                    <span className="text-rose-400 font-mono text-[11px] font-bold">BARCODE: {record.barcode || '8901030382910'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                    <div>
                      <p className="text-slate-500 text-[10px]">PRODUCT & BRAND</p>
                      <p className="font-semibold text-white truncate">{record.productName || 'CrispWave Kettle Chips'}</p>
                      <p className="text-slate-400 text-[11px]">{record.brand || 'CrispWave Foods'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px]">DETECTED IRREGULARITY</p>
                      <p className="font-semibold text-rose-400">{record.defectReason || 'Price Oversticker (Rs 50 over Rs 35)'}</p>
                      <p className="text-slate-400 text-[11px]">Defect Type: {record.defectType || 'Overcharging'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px]">QUANTITY SEIZED ON-SPOT</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={seizedUnits}
                          onChange={(e) => setSeizedUnits(Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-center text-xs font-bold text-white focus:border-rose-500 outline-none"
                        />
                        <span className="text-slate-400 text-[11px]">Units Sealed</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statutory Grounds of Seizure */}
                <div className="p-3 bg-rose-950/20 border border-rose-800/30 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4" /> STATUTORY CHARGES UNDER LM ACT 2009:
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                    <li><strong className="text-white">Section 18(1):</strong> Prohibition on sale of packaged commodity without mandatory statutory declarations.</li>
                    <li><strong className="text-white">Section 36(1):</strong> Penalty for selling commodity in packaged form at a price higher than Maximum Retail Price (MRP).</li>
                    <li><strong className="text-white">Section 15(1)(b):</strong> Seizure of goods alongside accompanying sale invoices and storage lots as physical evidence.</li>
                  </ul>
                </div>

                {/* Panchnama Witness & Merchant Signatures */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                  <div className="space-y-2 text-xs">
                    <label className="text-[11px] font-semibold text-slate-400">INDEPENDENT WITNESS (PANCH 1)</label>
                    <input
                      type="text"
                      value={witness1Name}
                      onChange={(e) => setWitness1Name(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white focus:border-slate-600 outline-none"
                    />
                    <input
                      type="text"
                      value={witness1Phone}
                      onChange={(e) => setWitness1Phone(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-300 focus:border-slate-600 outline-none"
                    />
                  </div>

                  <div className="space-y-2 text-xs flex flex-col justify-between">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400">MERCHANT / MANAGER ACKNOWLEDGMENT</label>
                      <p className="text-[10px] text-slate-500 mt-0.5">Copy of Panchnama Memo delivered to store manager on-spot.</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded bg-slate-900 border border-slate-800 hover:border-slate-700">
                      <input
                        type="checkbox"
                        checked={merchantSigned}
                        onChange={(e) => setMerchantSigned(e.target.checked)}
                        className="rounded border-slate-700 text-rose-600 focus:ring-0 w-4 h-4 bg-slate-800"
                      />
                      <span className="text-xs text-slate-200">
                        {merchantSigned ? '✓ Digital Acknowledgment Recorded' : 'Confirm Store Manager Service Copy'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-2 border border-slate-700 transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print Form IV PDF
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDispatch}
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-rose-900/30 transition-all"
                  >
                    {isSubmitting ? (
                      <>Transmitting to Sec 36 Court...</>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Issue Seizure Order & Seal Lot
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

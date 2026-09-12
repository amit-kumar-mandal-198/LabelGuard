'use client';

import React, { useState } from 'react';
import {
  X,
  Siren,
  ShieldAlert,
  Send,
  CheckCircle2,
  Calendar,
  Building2,
  MapPin,
  Clock,
  Printer
} from 'lucide-react';
import { RepeatOffender } from '@/lib/types';

interface RaidDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  offender: RepeatOffender | null;
  onSuccess?: (warrantId: string) => void;
}

export default function RaidDispatchModal({
  isOpen,
  onClose,
  offender,
  onSuccess,
}: RaidDispatchModalProps) {
  const [assignedOfficer, setAssignedOfficer] = useState('Insp. Rajesh Sharma (ID: LM-NCR-8492)');
  const [blitzWindow, setBlitzWindow] = useState('24 Hours');
  const [targetUnitsQuota, setTargetUnitsQuota] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warrantId, setWarrantId] = useState<string | null>(null);

  if (!isOpen || !offender) return null;

  const generatedWarrant = `WARR-SEC15-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const handleDispatch = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setWarrantId(generatedWarrant);
      if (onSuccess) onSuccess(generatedWarrant);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
              <Siren className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">SECTION 15 SPECIAL RAID SQUAD DISPATCH</h3>
                <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30 uppercase">
                  WARRANT DIRECTIVE
                </span>
              </div>
              <p className="text-xs text-zinc-400">Statutory inspection warrant under Section 15 of Legal Metrology Act 2009</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs bg-zinc-900/60">
          {warrantId ? (
            <div className="p-8 text-center bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-emerald-300">Enforcement Raid Squad Dispatched</h4>
                <p className="text-xs text-zinc-300 mt-1 font-mono">Warrant Reference: {warrantId}</p>
                <p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto">
                  Directive pushed live to field terminal of {assignedOfficer}. All regional retail beats placed on automated contraband alert.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-2 border border-zinc-700"
                >
                  <Printer className="w-4 h-4" /> Print Warrant Directive
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
            <div className="space-y-4">
              {/* Target Entity Summary */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Target Entity / Primary Offender</span>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm text-white">{offender.brand}</h4>
                    <p className="text-zinc-400 text-[11px]">{offender.companyName}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono font-bold text-xs">
                    Risk Score: {offender.riskScore}/100
                  </span>
                </div>
              </div>

              {/* Assignment Form */}
              <div className="space-y-3 bg-zinc-950/70 p-4 rounded-xl border border-zinc-800">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold text-[11px]">ASSIGNED FIELD ENFORCEMENT SQUAD / LEAD OFFICER</label>
                  <select
                    value={assignedOfficer}
                    onChange={(e) => setAssignedOfficer(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Insp. Rajesh Sharma (ID: LM-NCR-8492)">Insp. Rajesh Sharma (ID: LM-NCR-8492) • Circle 4</option>
                    <option value="Insp. V. Sharma (ID: LM-OFF-4892)">Insp. V. Sharma (ID: LM-OFF-4892) • Sector 18 Beat</option>
                    <option value="Insp. P. Verma (ID: LM-KNP-1049)">Insp. P. Verma (ID: LM-KNP-1049) • Kanpur Industrial</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-semibold text-[11px]">SWEEP QUOTA (PHYSICAL SAMPLES)</label>
                    <input
                      type="number"
                      value={targetUnitsQuota}
                      onChange={(e) => setTargetUnitsQuota(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400 font-semibold text-[11px]">OPERATION BLITZ TIMEFRAME</label>
                    <select
                      value={blitzWindow}
                      onChange={(e) => setBlitzWindow(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    >
                      <option value="24 Hours">24 Hours (Immediate Rapid Raid)</option>
                      <option value="48 Hours">48 Hours (Multi-Store Blitz)</option>
                      <option value="72 Hours">72 Hours (District-Wide Sweep)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-lg text-rose-300 text-[11px] space-y-1">
                  <p className="font-bold">Mandatory Statutory Order:</p>
                  <p className="text-zinc-300">
                    Officers are empowered under Section 15(1)(b) to enter and search premises, seize non-compliant packages, execute Form IV Panchnama on-spot, and issue summons to KMP under Section 49.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDispatch}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-rose-900/40 transition"
                >
                  {isSubmitting ? (
                    <>Transmitting Directive to Field Terminals...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Issue Raid Warrant & Dispatch Squad
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

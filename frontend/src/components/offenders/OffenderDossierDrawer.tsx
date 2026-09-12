'use client';

import React from 'react';
import {
  X,
  ShieldAlert,
  Building2,
  UserX,
  AlertTriangle,
  History,
  FileText,
  Scale,
  MapPin,
  ExternalLink,
  Calendar,
  Send
} from 'lucide-react';
import { RepeatOffender } from '@/lib/types';

interface OffenderDossierDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  offender: RepeatOffender | null;
  onDispatchRaid: (offender: RepeatOffender) => void;
}

export default function OffenderDossierDrawer({
  isOpen,
  onClose,
  offender,
  onDispatchRaid,
}: OffenderDossierDrawerProps) {
  if (!isOpen || !offender) return null;

  // Simulated Section 49 Directors & Key Managerial Personnel
  const directors = [
    {
      name: 'Vikramaditya Singhania',
      role: 'Managing Director & CEO',
      din: 'DIN-00928174',
      status: 'Personally Served Sec. 49 Show Cause',
    },
    {
      name: 'Dr. Anita Deshmukh',
      role: 'Head of Quality Assurance & Packaging',
      din: 'EMP-QA-8812',
      status: 'Technical Compliance Signatory',
    },
  ];

  const historicalIncidents = [
    {
      date: '09 Sept 2026',
      store: 'Kalyan Provision Stores, Kanpur',
      defect: 'Secondary Price Sticker (₹50 over ₹35)',
      rule: 'Rule 18(2) & Sec. 36(1)',
      fine: '₹ 25,000 (Compounding Pending)',
    },
    {
      date: '28 Aug 2026',
      store: 'Arogya Supermart, Noida Sector 18',
      defect: 'Omission of Consumer Care Contact Phone & Email',
      rule: 'Rule 6(5) Amendment 2021',
      fine: 'Compounded & Paid',
    },
    {
      date: '14 July 2026',
      store: 'Wholesale Mandi Depot, Lucknow',
      defect: 'Short-Net Weight font height lower than 2mm',
      rule: 'Rule 6(1)(c) & Sched. II',
      fine: 'Warning Notice Served',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 bg-zinc-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">{offender.brand}</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                  RISK {offender.riskScore}/100 • TIER 2 COURT PROSECUTION
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{offender.companyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1 text-xs bg-zinc-50/40">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-zinc-200 shadow-xs text-center">
            <div>
              <span className="text-zinc-400 uppercase font-semibold text-[10px]">Total Audits</span>
              <p className="font-mono font-extrabold text-base text-zinc-900 mt-0.5">{offender.totalScans}</p>
            </div>
            <div>
              <span className="text-zinc-400 uppercase font-semibold text-[10px]">Violations</span>
              <p className="font-mono font-extrabold text-base text-rose-600 mt-0.5">{offender.violationCount}</p>
            </div>
            <div>
              <span className="text-zinc-400 uppercase font-semibold text-[10px]">Critical Fails</span>
              <p className="font-mono font-extrabold text-base text-rose-700 mt-0.5">{offender.criticalCount}</p>
            </div>
            <div>
              <span className="text-zinc-400 uppercase font-semibold text-[10px]">Recidivism Index</span>
              <p className="font-mono font-extrabold text-base text-purple-700 mt-0.5">
                {Math.round((offender.violationCount / offender.totalScans) * 100)}%
              </p>
            </div>
          </div>

          {/* Section 49 Corporate Director Liability Card */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-purple-600" />
                <span className="font-bold text-zinc-900 text-xs uppercase tracking-wider">
                  Section 49 Legal Metrology Act — Corporate Officer Liability
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Personal Legal Service Active</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Under Section 49(1) of the Act, when an offence is committed by a company, every person in charge of and responsible for company conduct is deemed guilty and liable to be proceeded against.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {directors.map((dir, i) => (
                <div key={i} className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                    <UserX className="w-3.5 h-3.5 text-rose-600" />
                    <span>{dir.name}</span>
                  </div>
                  <p className="text-zinc-500 text-[11px]">{dir.role} • <span className="font-mono">{dir.din}</span></p>
                  <p className="text-purple-700 font-semibold text-[10px] pt-1">{dir.status}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recidivist Violation Timeline */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <History className="w-4 h-4 text-rose-600" />
              <span className="font-bold text-zinc-900 text-xs uppercase tracking-wider">
                Chronic Violation History & Evidence Dossier
              </span>
            </div>
            <div className="divide-y divide-zinc-100">
              {historicalIncidents.map((item, idx) => (
                <div key={idx} className="py-3 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-zinc-900">{item.defect}</span>
                    <span className="font-mono text-[10px] text-zinc-400">{item.date}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-zinc-400" /> {item.store}
                    </span>
                    <span className="font-mono text-rose-700 font-semibold">{item.fine}</span>
                  </div>
                  <p className="text-[10px] font-mono text-purple-700">{item.rule}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Statutory Escalation Warning */}
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-rose-900">
            <div className="flex items-center gap-2 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Statutory Escalation Threshold Breached (Section 36(2))</span>
            </div>
            <p className="text-[11px] text-zinc-700 leading-relaxed">
              This entity has exceeded 3 critical non-compliances within a rolling 60-day audit cycle. Compounding is no longer discretionary; mandatory prosecution proceedings under the Court of Metropolitan Magistrate are prepared.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-zinc-200 bg-zinc-900 text-white flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-xs font-semibold transition"
          >
            Close Dossier
          </button>
          <button
            onClick={() => {
              onClose();
              onDispatchRaid(offender);
            }}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-900/40 transition"
          >
            <Send className="w-4 h-4" />
            <span>Authorize Enforcement Raid Squad</span>
          </button>
        </div>
      </div>
    </div>
  );
}

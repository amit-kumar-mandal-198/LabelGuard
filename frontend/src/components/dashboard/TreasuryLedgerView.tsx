'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  ArrowUpRight, 
  Landmark, 
  Download,
  FileCheck,
  Scale
} from 'lucide-react';

interface CompoundingDocket {
  id: string;
  noticeRef: string;
  entityName: string;
  offence: string;
  issuedDate: string;
  daysRemaining: number;
  hearingDate: string;
  compoundingAmount: number;
  paymentStatus: 'pending' | 'deposited' | 'defaulted';
  treasuryReceiptNo?: string;
}

const DOCKETS: CompoundingDocket[] = [
  {
    id: 'DOCK-01',
    noticeRef: 'LM/DEL/CN/2026/0418',
    entityName: 'CrispWave Snacks Ltd (Kanpur Unit)',
    offence: 'Rule 18(2) Dual-MRP Adhesive Sticker Overprint',
    issuedDate: '09 Sept 2026',
    daysRemaining: 11,
    hearingDate: '24 Sept 2026 • 11:00 AM',
    compoundingAmount: 25000,
    paymentStatus: 'pending'
  },
  {
    id: 'DOCK-02',
    noticeRef: 'LM/UP/NOI/2026/0392',
    entityName: 'GlowHerb Ayurvedic Formulations Ltd',
    offence: 'Rule 9(6) Font Height Deficit (0.72mm vs 1.0mm)',
    issuedDate: '08 Sept 2026',
    daysRemaining: 10,
    hearingDate: '23 Sept 2026 • 02:30 PM',
    compoundingAmount: 25000,
    paymentStatus: 'deposited',
    treasuryReceiptNo: 'TR-UP-2026-98124'
  },
  {
    id: 'DOCK-03',
    noticeRef: 'LM/DEL/CN/2026/0281',
    entityName: 'Royal Spices & Condiments LLP',
    offence: 'Rule 5 Short-Net Quantity Delivery (Packaged Turmeric)',
    issuedDate: '28 Aug 2026',
    daysRemaining: 0,
    hearingDate: 'Defaulted — Escalated to ACMM Court',
    compoundingAmount: 50000,
    paymentStatus: 'defaulted'
  }
];

export default function TreasuryLedgerView() {
  const [dockets, setDockets] = useState<CompoundingDocket[]>(DOCKETS);

  const totalCollected = dockets
    .filter(d => d.paymentStatus === 'deposited')
    .reduce((acc, d) => acc + d.compoundingAmount, 0) + 175000; // Cumulative quarterly base

  const pendingCollection = dockets
    .filter(d => d.paymentStatus === 'pending')
    .reduce((acc, d) => acc + d.compoundingAmount, 0);

  return (
    <div className="space-y-6 text-xs">
      {/* Top Treasury Summary Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-zinc-500 font-semibold uppercase text-[10px]">Total Compounding Fines Collected</span>
            <p className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
              ₹ {totalCollected.toLocaleString('en-US')}
            </p>
            <span className="text-[11px] text-emerald-800 font-medium">Deposited to Consolidated Fund of State</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-600 flex items-center justify-center">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-zinc-500 font-semibold uppercase text-[10px]">Active Compounding Claims Pending</span>
            <p className="text-2xl font-extrabold text-amber-700 font-mono mt-1">
              ₹ {pendingCollection.toLocaleString('en-US')}
            </p>
            <span className="text-[11px] text-amber-800 font-medium">Within 15-Day Statutory Window</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl border border-amber-200 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-rose-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-zinc-500 font-semibold uppercase text-[10px]">Court Prosecutions Initiated</span>
            <p className="text-2xl font-extrabold text-rose-700 font-mono mt-1">
              1 Docket
            </p>
            <span className="text-[11px] text-rose-800 font-medium">ACMM Court Summons Drafted</span>
          </div>
          <div className="w-12 h-12 bg-rose-50 rounded-xl border border-rose-200 text-rose-600 flex items-center justify-center">
            <Scale className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 15-Day Countdown & Hearing Schedule Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs space-y-4">
        <div className="p-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-zinc-900">
              15-Day Statutory Compounding Window & Adjudication Calendar
            </h3>
            <p className="text-zinc-500 text-[11px]">
              Section 36 & Section 48 compounding ledger under Legal Metrology Act, 2009.
            </p>
          </div>
          <button 
            onClick={() => alert('Treasury challan reconciliation sheet downloaded.')}
            className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Treasury Report</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-5">Docket & Notice Ref</th>
                <th className="py-3 px-4">Entity & Offence</th>
                <th className="py-3 px-4">15-Day Statutory Countdown</th>
                <th className="py-3 px-4">Adjudication Hearing</th>
                <th className="py-3 px-4 font-mono">Fine Amount</th>
                <th className="py-3 px-4">Payment / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-700">
              {dockets.map((d) => (
                <tr key={d.id} className="hover:bg-zinc-50/70 transition">
                  <td className="py-4 px-5">
                    <span className="font-mono font-bold text-zinc-900">{d.noticeRef}</span>
                    <div className="text-[10px] font-mono text-zinc-400">Issued: {d.issuedDate}</div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="font-semibold text-zinc-900">{d.entityName}</div>
                    <div className="text-[11px] text-zinc-500">{d.offence}</div>
                  </td>

                  <td className="py-4 px-4">
                    {d.daysRemaining > 0 ? (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                          <Clock className="w-3 h-3" /> {d.daysRemaining} Days Left
                        </span>
                        <div className="w-24 bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full"
                            style={{ width: `${(d.daysRemaining / 15) * 100}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded text-[11px]">
                        Expired (15/15)
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-4">
                    <div className="font-medium text-zinc-900">{d.hearingDate}</div>
                    <div className="text-[10px] text-zinc-500">Chamber of District Controller</div>
                  </td>

                  <td className="py-4 px-4 font-mono font-bold text-zinc-900">
                    ₹ {d.compoundingAmount.toLocaleString('en-US')}
                  </td>

                  <td className="py-4 px-4">
                    {d.paymentStatus === 'deposited' ? (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> DEPOSITED
                        </span>
                        <div className="text-[10px] font-mono text-zinc-400 mt-0.5">{d.treasuryReceiptNo}</div>
                      </div>
                    ) : d.paymentStatus === 'pending' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[10px] bg-amber-100 text-amber-800 border border-amber-300">
                        <Clock className="w-3 h-3" /> AWAITING REMITTANCE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[10px] bg-rose-100 text-rose-800 border border-rose-300">
                        <AlertTriangle className="w-3 h-3" /> PROSECUTION INITIATED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

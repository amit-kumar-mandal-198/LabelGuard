'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ShieldAlert,
  Send,
  Printer,
  Download,
  Eye,
} from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { Section36Notice } from '@/lib/types';

export default function PendingNoticesPage() {
  const [notices, setNotices] = useState<Section36Notice[]>(ApiClient.getNotices());
  const [selectedNotice, setSelectedNotice] = useState<Section36Notice>(notices[0]);
  const [issuedStatus, setIssuedStatus] = useState<string | null>(null);

  useEffect(() => {
    ApiClient.fetchNotices().then((data) => {
      if (data && data.length > 0) {
        setNotices(data);
        setSelectedNotice(data[0]);
      }
    });
  }, []);

  const handleApprove = () => {
    setIssuedStatus('Notice officially signed, cryptographically stamped, and transmitted to registered vendor email.');
    ApiClient.updateNoticeStatus(selectedNotice.id, 'approved');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <Link
            href="/dashboard/district"
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to District Controller Hub
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">
            Section 36 Statutory Notice Approval Queue
          </h1>
          <p className="text-xs text-zinc-500">
            Enforcement workflow: System drafts legal compounding notice; Controller approves before official dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
            {notices.length} Notice(s) in Queue
          </span>
        </div>
      </div>

      {/* Split Layout: Notice Selector on Left, Official Document Viewer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Notice List (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <p className="text-xs font-bold text-zinc-600 uppercase tracking-wide">
            Select Notice for Review
          </p>
          {notices.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                setSelectedNotice(n);
                setIssuedStatus(null);
              }}
              className={`p-4 rounded-xl border cursor-pointer transition text-xs space-y-2 ${
                selectedNotice.id === n.id
                  ? 'bg-amber-50/70 border-amber-400 shadow-sm ring-1 ring-amber-300'
                  : 'bg-white border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-mono font-bold text-zinc-900">{n.noticeNumber}</span>
                <span
                  className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                    n.status === 'draft' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {n.status}
                </span>
              </div>
              <p className="font-semibold text-zinc-800">{n.productName}</p>
              <p className="text-zinc-500 text-[11px]">{n.companyName}</p>
              <div className="text-rose-700 font-medium text-[11px]">
                {n.violations.length} statutory violation count(s)
              </div>
            </div>
          ))}
        </div>

        {/* Notice Official Document Letterhead Viewer (8 Cols) */}
        <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-xl p-4 sm:p-8 shadow-xs space-y-6">
          {issuedStatus && (
            <div className="p-4 bg-emerald-100/80 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{issuedStatus}</span>
            </div>
          )}

          {/* Official Letterhead */}
          <div className="text-center border-b-2 border-zinc-300 pb-4 space-y-1">
            <p className="font-bold text-xs tracking-widest uppercase text-zinc-600">
              GOVERNMENT OF UTTAR PRADESH
            </p>
            <p className="font-bold text-sm tracking-wide text-zinc-900">
              OFFICE OF THE CONTROLLER OF LEGAL METROLOGY
            </p>
            <p className="text-[11px] text-zinc-500">
              Vigyan Bhawan, Sector 12, Lucknow / Gautam Buddha Nagar Division
            </p>
            <p className="text-[11px] font-mono font-bold text-amber-800 pt-1">
              NOTICE UNDER SECTION 36 OF LEGAL METROLOGY ACT, 2009
            </p>
          </div>

          {/* Notice Body */}
          <div className="space-y-4 text-xs leading-relaxed text-zinc-800">
            <div className="flex flex-col sm:flex-row justify-between font-mono text-[11px] bg-zinc-50 p-3 rounded border border-zinc-200 gap-1">
              <div>
                <span>Notice Ref: </span>
                <strong className="text-zinc-900">{selectedNotice.noticeNumber}</strong>
              </div>
              <div>
                <span>Dated: </span>
                <strong>{new Date(selectedNotice.draftedAt).toLocaleDateString()}</strong>
              </div>
            </div>

            <div>
              <p className="font-bold text-zinc-900">TO:</p>
              <p className="font-bold text-zinc-900">{selectedNotice.companyName}</p>
              <p className="text-zinc-600">{selectedNotice.companyAddress}</p>
              <p className="font-mono text-zinc-500">GSTIN: {selectedNotice.gstNumber || 'REGISTERED PACKER'}</p>
            </div>

            <p>
              <strong>SUBJECT:</strong> Notice of Inspection & Prima Facie Evidence of Packaging Non-Compliance regarding{' '}
              <span className="underline font-semibold">{selectedNotice.productName}</span>.
            </p>

            <p>
              WHEREAS, an on-site market inspection conducted by the Legal Metrology Field Enforcement Squad revealed statutory non-compliances under the Legal Metrology (Packaged Commodities) Rules, 2011, detailed as follows:
            </p>

            {/* Cited Violations Table */}
            <div className="border border-zinc-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 text-zinc-700 font-semibold">
                  <tr>
                    <th className="p-2.5">Statutory Rule</th>
                    <th className="p-2.5">Act Section</th>
                    <th className="p-2.5">Specific Finding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {selectedNotice.violations.map((v, i) => (
                    <tr key={i} className="bg-white">
                      <td className="p-2.5 font-bold text-rose-700">{v.rule}</td>
                      <td className="p-2.5 font-mono">{v.section}</td>
                      <td className="p-2.5 text-zinc-700">{v.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900">
              <strong>STATUTORY PENALTY CLAUSE:</strong> {selectedNotice.penaltyClause}
            </div>

            <p>
              You are hereby called upon to show cause within <strong>{selectedNotice.responseDeadlineDays} days</strong> of receipt of this notice as to why penal proceedings under Section 36 of the Legal Metrology Act, 2009 should not be initiated against you, or why the said offences should not be compounded upon payment of statutory fees.
            </p>

            {/* Signature & Audit Stamp */}
            <div className="pt-6 border-t border-zinc-200 flex justify-between items-end">
              <div>
                <p className="font-mono text-[10px] text-zinc-400 uppercase">Cryptographic Audit Stamp</p>
                <p className="font-mono text-[10px] text-zinc-600">{selectedNotice.digitalSignatureHash}</p>
              </div>

              <div className="text-right">
                <p className="font-bold text-zinc-900">{selectedNotice.issuingOfficer}</p>
                <p className="text-[11px] text-zinc-500">{selectedNotice.designation}</p>
                <p className="text-[10px] text-emerald-700 font-semibold">Signed digitally via SLCS portal</p>
              </div>
            </div>
          </div>

          {/* Controller Decision Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
            <button
              onClick={() => alert('Notice terms edited.')}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg font-semibold text-xs transition"
            >
              Edit Draft Terms
            </button>
            <button
              onClick={() => alert('Notice marked as Rejected. Inspector informed.')}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg font-semibold text-xs transition"
            >
              Reject Notice
            </button>
            <button
              onClick={handleApprove}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Approve & Issue Notice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ShieldAlert, ArrowUpRight, Send, Check } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';

export default function VendorAlertsPage() {
  const inspections = ApiClient.getInspections().filter((i) => i.status === 'NON_COMPLIANT');
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);

  const handleDispute = (e: React.FormEvent) => {
    e.preventDefault();
    setDisputeSubmitted(true);
    setTimeout(() => {
      setSelectedAlert(null);
      setDisputeSubmitted(false);
      setDisputeReason('');
      alert('Dispute submitted to District Controller review queue.');
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-zinc-200 pb-4">
        <h1 className="text-2xl font-bold text-zinc-900">Regulatory Alerts & Field Scan Notices</h1>
        <p className="text-xs text-zinc-500">
          Notices received from field inspector market scans, e-commerce web audits, and automated rule checks.
        </p>
      </div>

      <div className="space-y-4">
        {inspections.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-rose-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase bg-rose-100 text-rose-800 border border-rose-300">
                  CRITICAL NON-COMPLIANCE
                </span>
                <span className="text-xs text-zinc-400 font-mono">Scan Ref: {item.id}</span>
                <span className="text-xs text-zinc-400">•</span>
                <span className="text-xs text-zinc-500">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <h2 className="text-base font-bold text-zinc-900">{item.productName}</h2>
              <p className="text-xs text-zinc-600">
                Location: <span className="font-semibold text-zinc-800">{item.location || 'Retail Market Sample'}</span>
              </p>
              <div className="text-xs text-rose-800 font-medium">
                Top Defect: {item.violations[0]?.ruleTitle || 'Statutory packaging omission'}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/scan/${item.id}`}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded font-semibold text-xs transition"
              >
                Inspect Evidence
              </Link>
              <button
                onClick={() => setSelectedAlert(String(item.id))}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold text-xs transition"
              >
                Submit Dispute / Clarification
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dispute Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-zinc-200 space-y-4">
            <h2 className="text-lg font-bold text-zinc-900">Submit Dispute to District Controller</h2>
            <p className="text-xs text-zinc-500">
              File statutory clarification or submit Gazette exemption certificate for Scan Ref: {selectedAlert}.
            </p>

            <form onSubmit={handleDispute} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Reason for Dispute</label>
                <textarea
                  rows={4}
                  required
                  placeholder="State technical reasons, calibration tolerances, or prior batch approvals..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disputeSubmitted}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  {disputeSubmitted ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmit Dispute</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

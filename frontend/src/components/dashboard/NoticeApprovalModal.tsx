'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  FileCheck,
  Shield,
  Calendar,
  Mail,
  AlertTriangle,
  Stamp,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Hash,
  Building2,
  Scale,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Violation {
  rule: string;
  section: string;
  description: string;
  severity: string;
}

interface NoticeData {
  noticeNumber: string;
  brand: string;
  companyName: string;
  companyAddress: string;
  violations: Violation[];
  draftedAt: string;
  issuingOfficer: string;
  designation: string;
  penaltyClause: string;
  responseDeadlineDays: number;
  digitalSignatureHash?: string;
}

interface NoticeApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  notice: NoticeData | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function futureDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function generateSHA256(): string {
  const hex = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += hex[Math.floor(Math.random() * 16)];
  }
  return hash;
}

const severityColor: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  major: 'bg-orange-100 text-orange-800 border-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  moderate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-blue-100 text-blue-800 border-blue-300',
  minor: 'bg-blue-100 text-blue-800 border-blue-300',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NoticeApprovalModal({
  isOpen,
  onClose,
  notice,
}: NoticeApprovalModalProps) {
  /* ---- state ---- */
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  // signing
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signatureHash, setSignatureHash] = useState('');
  const [stampScale, setStampScale] = useState(0);

  // hearing scheduler
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hearingDate, setHearingDate] = useState('');

  // dispatch toggle
  const [dispatchEnabled, setDispatchEnabled] = useState(false);

  // rejection
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  /* ---- open / close transition ---- */
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      // reset state on open
      setSigning(false);
      setSigned(false);
      setSignatureHash('');
      setStampScale(0);
      setShowDatePicker(false);
      setHearingDate('');
      setDispatchEnabled(false);
      setShowRejectConfirm(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true));
      });
    } else {
      setAnimateIn(false);
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  /* ---- signing animation ---- */
  const handleSign = useCallback(() => {
    if (signed || signing) return;
    setSigning(true);
    const hash = generateSHA256();

    // phase 1: build the hash character by character (visual effect)
    let idx = 0;
    const interval = setInterval(() => {
      idx += 4;
      setSignatureHash(hash.slice(0, idx));
      if (idx >= hash.length) {
        clearInterval(interval);
        // phase 2: expand stamp
        requestAnimationFrame(() => {
          setStampScale(1);
          setTimeout(() => {
            setSigned(true);
            setSigning(false);
          }, 700);
        });
      }
    }, 30);
  }, [signed, signing]);

  /* ---- ESC key ---- */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!visible || !notice) return null;

  const issueDateFormatted = formatDate(notice.draftedAt);
  const deadlineFormatted = futureDate(
    notice.draftedAt,
    notice.responseDeadlineDays,
  );

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div
      className={`fixed inset-0 z-[100] flex items-start justify-center transition-all duration-300 ${
        animateIn ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-0'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* ---------- Modal Panel ---------- */}
      <div
        ref={scrollRef}
        className={`relative mx-4 my-6 flex max-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-300 ${
          animateIn
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-8 scale-95 opacity-0'
        }`}
      >
        {/* ---- Top bar ---- */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <Scale className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Notice Review &amp; Approval
              </h2>
              <p className="text-xs text-slate-500">
                Section 36 — The Legal Metrology Act, 2009
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ---- Scrollable body ---- */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* === OFFICIAL NOTICE PREVIEW === */}
          <div
            className="relative mx-auto rounded-sm border-2 border-slate-300 bg-[#fffef8] p-8 shadow-inner"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
          >
            {/* watermark */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035]">
              <span className="rotate-[-30deg] text-[6rem] font-black tracking-widest text-slate-800 select-none">
                DRAFT
              </span>
            </div>

            {/* GOI Header */}
            <div className="mb-6 border-b-2 border-double border-slate-700 pb-4 text-center">
              <p className="text-xs font-semibold tracking-[0.3em] text-slate-600 uppercase">
                भारत सरकार / Government of India
              </p>
              <p className="text-[0.7rem] tracking-wider text-slate-500 uppercase">
                Ministry of Consumer Affairs, Food &amp; Public Distribution
              </p>
              <h3 className="mt-2 text-base font-bold tracking-wide text-slate-800 uppercase">
                Office of the Controller of Legal Metrology
              </h3>
              <p className="mt-1 text-[0.7rem] text-slate-500">
                Department of Consumer Affairs — Weights &amp; Measures Division
              </p>
            </div>

            {/* Notice meta */}
            <div className="mb-6 flex items-start justify-between text-sm text-slate-700">
              <div>
                <p>
                  <span className="font-semibold">Notice No.:</span>{' '}
                  <span className="font-mono text-xs">{notice.noticeNumber}</span>
                </p>
                <p className="mt-0.5">
                  <span className="font-semibold">Issuing Officer:</span>{' '}
                  {notice.issuingOfficer}
                </p>
                <p className="text-xs text-slate-500">{notice.designation}</p>
              </div>
              <div className="text-right">
                <p>
                  <span className="font-semibold">Date:</span> {issueDateFormatted}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Response Deadline: {deadlineFormatted}
                </p>
              </div>
            </div>

            {/* Title */}
            <div className="mb-5 rounded border border-slate-400 bg-slate-50 px-4 py-2 text-center">
              <h4 className="text-sm font-bold tracking-wide text-slate-800 uppercase">
                Show Cause Notice Under Section 36
              </h4>
              <p className="text-[0.65rem] text-slate-500">
                The Legal Metrology Act, 2009 read with Legal Metrology (Packaged Commodities) Rules, 2011
              </p>
            </div>

            {/* Respondent */}
            <div className="mb-5 text-sm leading-relaxed text-slate-700">
              <p className="mb-1 font-semibold text-slate-800">To,</p>
              <div className="ml-4 border-l-2 border-amber-300 pl-3">
                <p className="font-semibold">{notice.companyName}</p>
                <p className="text-xs text-slate-500">
                  Brand: <span className="font-medium text-slate-700">{notice.brand}</span>
                </p>
                <p className="whitespace-pre-line text-xs text-slate-600">
                  {notice.companyAddress}
                </p>
              </div>
            </div>

            {/* Body intro */}
            <p className="mb-4 text-[0.82rem] leading-relaxed text-slate-700">
              Whereas an inspection / investigation was conducted by this office, it has come
              to the notice that the above-named respondent has contravened the following
              provisions of The Legal Metrology Act, 2009 and the rules made thereunder:
            </p>

            {/* Violations table */}
            <div className="mb-5 overflow-hidden rounded border border-slate-300">
              <table className="w-full text-left text-[0.78rem]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="border-b border-slate-300 px-3 py-2 font-semibold">
                      #
                    </th>
                    <th className="border-b border-slate-300 px-3 py-2 font-semibold">
                      Rule / Regulation
                    </th>
                    <th className="border-b border-slate-300 px-3 py-2 font-semibold">
                      Section
                    </th>
                    <th className="border-b border-slate-300 px-3 py-2 font-semibold">
                      Description of Violation
                    </th>
                    <th className="border-b border-slate-300 px-3 py-2 font-semibold">
                      Severity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {notice.violations.map((v, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                    >
                      <td className="border-b border-slate-200 px-3 py-2 text-center font-mono text-xs">
                        {i + 1}
                      </td>
                      <td className="border-b border-slate-200 px-3 py-2 font-mono text-xs">
                        {v.rule}
                      </td>
                      <td className="border-b border-slate-200 px-3 py-2 font-mono text-xs">
                        {v.section}
                      </td>
                      <td className="border-b border-slate-200 px-3 py-2">
                        {v.description}
                      </td>
                      <td className="border-b border-slate-200 px-3 py-2">
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold capitalize ${
                            severityColor[v.severity.toLowerCase()] ??
                            'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {v.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Penalty clause */}
            <div className="mb-5 rounded border border-amber-300 bg-amber-50/60 px-4 py-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase">
                <AlertTriangle className="h-3.5 w-3.5" />
                Penalty Clause
              </p>
              <p className="text-[0.78rem] leading-relaxed text-slate-700">
                {notice.penaltyClause}
              </p>
            </div>

            {/* Direction para */}
            <p className="mb-4 text-[0.82rem] leading-relaxed text-slate-700">
              You are hereby directed to show cause in writing within{' '}
              <strong>{notice.responseDeadlineDays} days</strong> from the date of
              receipt of this notice as to why action under the provisions of the said
              Act should not be taken against you. Failure to respond within the
              stipulated period shall be construed as acceptance of the charges and
              the matter shall be proceeded <em>ex parte</em>.
            </p>

            {/* Signature block */}
            <div className="mt-8 flex items-end justify-between">
              <div className="text-xs text-slate-500">
                <p>
                  Copy to: Director (Legal Metrology),{' '}
                  <span className="italic">for information and necessary action</span>
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold text-slate-800">
                  {notice.issuingOfficer}
                </p>
                <p className="text-xs text-slate-500">{notice.designation}</p>
                <p className="text-xs text-slate-500">
                  Controller of Legal Metrology
                </p>
              </div>
            </div>

            {/* ---- Digital Signature Stamp Overlay ---- */}
            {(signing || signed) && (
              <div className="absolute right-8 bottom-24 flex flex-col items-center">
                {/* Animated stamp */}
                <div
                  className="flex flex-col items-center transition-transform duration-700 ease-out"
                  style={{ transform: `scale(${stampScale})` }}
                >
                  <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 border-dashed border-green-600 bg-green-50/80">
                    <CheckCircle2 className="mb-1 h-8 w-8 text-green-600" />
                    <p className="text-[0.5rem] font-black leading-tight tracking-wider text-green-700 uppercase">
                      Digitally
                      <br />
                      Signed &amp;
                      <br />
                      Approved
                    </p>
                    <p className="mt-0.5 text-[0.4rem] font-bold text-green-600">
                      GOI
                    </p>
                  </div>
                </div>

                {/* SHA-256 hash */}
                {signatureHash && (
                  <div className="mt-2 max-w-[10rem] text-center">
                    <p className="text-[0.5rem] font-semibold text-slate-500 uppercase">
                      SHA-256 Hash
                    </p>
                    <p className="break-all font-mono text-[0.45rem] text-green-700">
                      {signatureHash}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ---- END NOTICE PREVIEW ---- */}
        </div>

        {/* ---- Action Bar ---- */}
        <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          {/* Hearing date picker inline */}
          {showDatePicker && (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50/50 px-4 py-3">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <label className="text-sm font-medium text-slate-700">
                Hearing Date:
              </label>
              <input
                type="date"
                value={hearingDate}
                onChange={(e) => setHearingDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="rounded-md border border-indigo-300 bg-white px-3 py-1.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {hearingDate && (
                <span className="ml-2 flex items-center gap-1 text-xs text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Scheduled
                </span>
              )}
              <button
                onClick={() => setShowDatePicker(false)}
                className="ml-auto text-xs text-slate-400 hover:text-slate-600"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Reject confirmation */}
          {showRejectConfirm && (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-800">
                Are you sure you want to return this notice for revision?
              </p>
              <button
                onClick={() => {
                  setShowRejectConfirm(false);
                  onClose();
                }}
                className="ml-auto rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => setShowRejectConfirm(false)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Button row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Approve & Sign */}
            <button
              onClick={handleSign}
              disabled={signed || signing}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 ${
                signed
                  ? 'cursor-default bg-green-600 text-white'
                  : signing
                    ? 'cursor-wait bg-green-500 text-white opacity-80'
                    : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md active:scale-[0.97]'
              }`}
            >
              {signed ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Signed ✓
                </>
              ) : signing ? (
                <>
                  <Shield className="h-4 w-4 animate-pulse" />
                  Signing…
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4" />
                  Approve &amp; Digitally Sign
                </>
              )}
            </button>

            {/* Schedule Hearing */}
            <button
              onClick={() => setShowDatePicker((prev) => !prev)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                showDatePicker
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Schedule Compounding Hearing
            </button>

            {/* Speed Post & Email toggle */}
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2">
              <Mail className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">
                Speed Post &amp; Email
              </span>
              <button
                role="switch"
                aria-checked={dispatchEnabled}
                onClick={() => setDispatchEnabled((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                  dispatchEnabled ? 'bg-green-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
                    dispatchEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Reject */}
            <button
              onClick={() => setShowRejectConfirm(true)}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-all duration-200 hover:border-red-400 hover:bg-red-50 active:scale-[0.97]"
            >
              <ArrowLeft className="h-4 w-4" />
              Reject / Return for Revision
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

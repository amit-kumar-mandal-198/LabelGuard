'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  Cpu,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Lock,
  Stamp,
  ExternalLink,
} from 'lucide-react';

interface LifecycleStep {
  id: number;
  title: string;
  tagline: string;
  legalCitation: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  bgLight: string;
  description: string;
  technicalDetails: { label: string; value: string }[];
  previewSnippet: {
    heading: string;
    details: string[];
    footerNote: string;
  };
}

const LIFECYCLE_STEPS: LifecycleStep[] = [
  {
    id: 1,
    title: 'Geotagged Field Ingestion',
    tagline: 'Tamper-proof camera acquisition with hardware EXIF & GPS lock',
    legalCitation: 'Section 15, Legal Metrology Act 2009 (Powers of Inspection)',
    icon: Camera,
    color: 'text-blue-600',
    borderColor: 'border-blue-500',
    bgLight: 'bg-blue-50',
    description:
      'Field inspectors capture product packaging on retail shelves using our lightweight PWA. Every photograph is cryptographically signed with device hardware ID, GPS coordinates, and timestamp.',
    technicalDetails: [
      { label: 'Camera Mode', value: 'Live shutter only (gallery uploads disabled)' },
      { label: 'Geolocation', value: 'High-accuracy GPS lock (Lat/Lng ±3m)' },
      { label: 'Offline Resilience', value: 'Local IndexedDB cache with auto-sync' },
      { label: 'Store Geofence', value: 'Matched with GSTIN retailer registry' },
    ],
    previewSnippet: {
      heading: 'EXIF Metadata & Field Telemetry Signature',
      details: [
        'Inspector: V. Sharma (Badge: LM-INS-2026-0447)',
        'Coordinates: 26.4499° N, 80.3319° E (Kanpur Central)',
        'Device Timestamp: 2026-09-09T09:40:12+05:30',
        'Hardware SHA-256: 8f4c21980be12c77d901bc0931df3324',
      ],
      footerNote: 'Chain-of-custody locked before transmission to MeghRaj Cloud.',
    },
  },
  {
    id: 2,
    title: 'Sub-Millimeter AI Verification',
    tagline: 'Real-time multilingual OCR & physical font height measurement',
    legalCitation: 'Rules 4, 5, 6, 9(6) & 18, LM (Packaged Commodities) Rules 2011',
    icon: Cpu,
    color: 'text-purple-600',
    borderColor: 'border-purple-500',
    bgLight: 'bg-purple-50',
    description:
      'Computer vision algorithms calculate physical letter heights based on packaging display dimensions, verify mandatory declarations across 12 Indian languages, and detect overlaid sticker seams.',
    technicalDetails: [
      { label: 'OCR Engine', value: 'Multilingual Tesseract + Vision Transformer' },
      { label: 'Font Precision', value: '±0.05mm calibrated physical height' },
      { label: 'Tamper Classifier', value: 'Edge-gradient adhesive seam detection' },
      { label: 'Rule Processing', value: '< 650ms deterministic evaluation' },
    ],
    previewSnippet: {
      heading: 'Statutory Defect Diagnostic Matrix',
      details: [
        'Rule 9(6) Font Height: 0.72mm vs mandatory 1.00mm [FAIL]',
        'Rule 18(2) Dual-MRP: Secondary sticker seam detected [CRITICAL]',
        'Rule 6(1)(e) Unit Sale Price: Present and verified [PASS]',
        'Rule 6(5) Grievance Contact: Tel + Email active [PASS]',
      ],
      footerNote: 'Zero hallucination guarantee via deterministic codified rules engine.',
    },
  },
  {
    id: 3,
    title: 'Automated Section 36 Notice Drafting',
    tagline: 'Cryptographic evidence bundling and compounding fee calculation',
    legalCitation: 'Section 36(1) & 36(2), Legal Metrology Act 2009',
    icon: FileText,
    color: 'text-amber-600',
    borderColor: 'border-amber-500',
    bgLight: 'bg-amber-50',
    description:
      'When violations are verified, the system auto-drafts an official Show Cause Notice citing specific gazette provisions, manufacturer addresses, and calculating statutory compounding amounts.',
    technicalDetails: [
      { label: 'Notice Format', value: 'Statutory Gazette Form under LM Rules' },
      { label: 'Evidence Bundle', value: 'Cropped violation bboxes + full artwork' },
      { label: 'Compounding Fee', value: 'Automated ₹25,000 first offense calculation' },
      { label: 'Response Period', value: '15 statutory calendar days' },
    ],
    previewSnippet: {
      heading: 'Draft Notice Preview — LM/DEL/CN/2026/0418',
      details: [
        'Respondent: CrispWave Agro & Snacks Private Limited',
        'Violations Cited: Section 36(1) & Rule 18(2) Dual Pricing',
        'Compounding Clause: Liable to fine up to ₹25,000 / prosecution',
        'Immutable Hash: SHA256:8f4c21980be12c77d901bc0931df3324',
      ],
      footerNote: 'Stored in draft queue pending District Controller authorization.',
    },
  },
  {
    id: 4,
    title: 'Controller Approval & Digital Signature',
    tagline: 'Human oversight with legal Aadhaar e-Sign & Speed Post tracking',
    legalCitation: 'Information Technology Act 2000 & Section 36(2) Sentencing',
    icon: ShieldCheck,
    color: 'text-emerald-600',
    borderColor: 'border-emerald-500',
    bgLight: 'bg-emerald-50',
    description:
      'AI never issues notices autonomously. Human District Controllers review the evidence dossier in one click, apply a digital cryptographic signature, and broadcast dispatch orders via Speed Post & registered email.',
    technicalDetails: [
      { label: 'Digital Sign', value: 'Aadhaar e-Sign / Token-based DSC' },
      { label: 'Delivery Tracking', value: 'India Post Speed Post API integrated' },
      { label: 'Hearing Scheduler', value: 'Automated compounding calendar queue' },
      { label: 'Repeat Escalation', value: 'Auto-flags brands with ≥3 offenses' },
    ],
    previewSnippet: {
      heading: 'Controller Dispatch & Enforcement Ledger',
      details: [
        'Authorized by: Rajesh Kumar Verma, District Controller',
        'Digital Certificate: VERIFIED (GOI National Root CA)',
        'Speed Post Consignment: ED489104812IN (Dispatched)',
        'Repeat Offender Engine: Flagged for Priority Sweep Queue',
      ],
      footerNote: 'Legally admissible evidence bundle ready for judicial compounding.',
    },
  },
];

export default function StatutoryLifecycleStepper() {
  const [activeStepId, setActiveStepId] = useState<number>(1);

  const currentStep =
    LIFECYCLE_STEPS.find((s) => s.id === activeStepId) || LIFECYCLE_STEPS[0];

  return (
    <section className="w-full bg-white py-16 px-4 sm:px-6 lg:px-8 border-b border-zinc-200">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Section Heading */}
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
            End-to-End Regulatory Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
            From Retail Shelf to Legal Metrology Prosecution
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 max-w-2xl mx-auto">
            &ldquo;AI assists, humans decide.&rdquo; Explore the 4-phase statutory journey turning raw field photos into court-ready Section 36 legal notices.
          </p>
        </div>

        {/* 4 Step Nav Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {LIFECYCLE_STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === activeStepId;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStepId(step.id)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? `${step.borderColor} ${step.bgLight} ring-2 ring-emerald-500/20 shadow-md`
                    : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      isActive ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    0{step.id}
                  </div>
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? step.color : 'text-zinc-400'
                    }`}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-[11px] text-zinc-500 line-clamp-1 mt-1">
                    {step.legalCitation}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Interactive Active Step Dossier */}
        <div className="bg-zinc-900 text-zinc-100 rounded-2xl p-6 sm:p-8 border border-zinc-800 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Details */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  PHASE 0{currentStep.id} OF 04
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  {currentStep.legalCitation}
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-white">
                {currentStep.title}
              </h3>
              <p className="text-sm text-emerald-400 font-medium">
                {currentStep.tagline}
              </p>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed pt-1">
                {currentStep.description}
              </p>
            </div>

            {/* Technical Specifications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {currentStep.technicalDetails.map((detail, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-2.5 text-xs"
                >
                  <span className="text-zinc-500 text-[10px] uppercase tracking-wider block font-semibold">
                    {detail.label}
                  </span>
                  <span className="text-zinc-200 font-mono font-medium">
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Navigation CTA */}
            <div className="pt-2 flex items-center gap-3">
              {currentStep.id < 4 ? (
                <button
                  onClick={() => setActiveStepId(currentStep.id + 1)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <span>Next: Phase 0{currentStep.id + 1}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Link
                  href="/dashboard/district"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <span>Launch District Controller Center</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}

              <Link
                href="/admin/rules"
                className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
              >
                Inspect Codified Rules
              </Link>
            </div>
          </div>

          {/* Right Live Simulation Box */}
          <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                {currentStep.previewSnippet.heading}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                AUDIT LOG
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs text-zinc-300">
              {currentStep.previewSnippet.details.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-zinc-900/90 border border-zinc-800/80 flex items-start gap-2"
                >
                  <span className="text-emerald-500 font-bold">›</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-zinc-400 italic pt-1 border-t border-zinc-850">
              ⚡ {currentStep.previewSnippet.footerNote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Building2,
  ScanLine,
  FileCheck2,
  Scale,
  Server,
  Cpu,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { canAccess } from '@/lib/route-guard';
import InteractiveAiSandbox from '@/components/home/InteractiveAiSandbox';
import StatutoryLifecycleStepper from '@/components/home/StatutoryLifecycleStepper';
import AmbientAuroraSmoke from '@/components/home/AmbientAuroraSmoke';

export default function Home() {
  const router = useRouter();

  return (
    <div className="relative w-full flex flex-col items-center overflow-x-hidden">
      {/* Interactive Ambient Aurora Smoke Nebula */}
      <AmbientAuroraSmoke />

      {/* Hero Section */}
      <section className="relative w-full bg-gradient-to-b from-white/75 via-emerald-50/25 to-zinc-50/50 backdrop-blur-[1.5px] border-b border-zinc-200/80 py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 max-w-6xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100/90 backdrop-blur-xs border border-emerald-300/80 text-emerald-900 text-xs font-semibold tracking-wide shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>National Packaged Commodity Regulatory Infrastructure • LM-PC-2011</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-950 tracking-tight leading-tight">
            National Packaged Commodity <br className="hidden sm:inline" />
            <span className="text-emerald-700">
              Compliance & Verification Portal
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg text-zinc-600 leading-relaxed">
            Automating the verification of packaged commodities under the{' '}
            <strong className="text-zinc-800">Legal Metrology (Packaged Commodities) Rules, 2011</strong>. Instant
            multilingual OCR extraction, sub-millimeter font height measurement, sticker tamper detection, and
            enforcement-grade Section 36 legal notices.
          </p>

          {/* Quick CTAs */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/vendor/audit/new"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Launch Vendor Self-Audit</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/dashboard/district"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold shadow-md transition flex items-center justify-center gap-2"
            >
              <Scale className="w-4 h-4" />
              <span>District Controller Hub</span>
            </Link>

            <Link
              href="/inspector/scans"
              className="w-full sm:w-auto px-5 py-3 rounded-lg bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 text-sm font-semibold shadow-xs transition flex items-center justify-center gap-2"
            >
              <ScanLine className="w-4 h-4 text-emerald-600" />
              <span>Inspector Field Mode</span>
            </Link>
          </div>

          {/* Golden Rule Anchor Quote from PDF */}
          <div className="pt-4 max-w-xl mx-auto">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              Core Architectural Principle
            </p>
            <p className="text-sm italic font-serif text-zinc-700 mt-0.5">
              &ldquo;AI assists, humans decide. The system auto-drafts Section 36 notices with immutable cryptographic evidence; human Controllers approve.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Live Operational Metrics Ribbon */}
      <section className="w-full bg-white border-b border-zinc-200 py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
          <div className="p-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-zinc-900">50,000+</p>
            <p className="text-xs font-medium text-zinc-500 mt-1">Field Inspectors Supported</p>
          </div>
          <div className="p-3 sm:border-l border-zinc-200">
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">30x</p>
            <p className="text-xs font-medium text-zinc-500 mt-1">Faster than Manual Checks (3min vs 30s)</p>
          </div>
          <div className="p-3 sm:border-l border-zinc-200">
            <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600">&lt; ₹3 Cr/yr</p>
            <p className="text-xs font-medium text-zinc-500 mt-1">National MeghRaj Cloud Budget</p>
          </div>
          <div className="p-3 sm:border-l border-zinc-200">
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600">&lt; 6 Mos</p>
            <p className="text-xs font-medium text-zinc-500 mt-1">Public Investment Payback Period</p>
          </div>
        </div>
      </section>

      {/* Interactive AI Inspection Sandbox (Real-time Demo) */}
      <InteractiveAiSandbox />

      {/* From Shelf to Prosecution: 4-Step Statutory Lifecycle Stepper */}
      <StatutoryLifecycleStepper />

      {/* Personas / User Hierarchy Grid (from Main Users PDF) */}
      <section className="w-full max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            User Ecosystem
          </span>
          <h2 className="text-3xl font-bold text-zinc-950 tracking-tight">
            Role-Based Multi-Portal Architecture
          </h2>
          <p className="text-sm text-zinc-600 max-w-2xl mx-auto">
            A specialized B2G + B2B interface system tailored for regulatory inspectors, enforcement controllers, manufacturers, and administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Vendor */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                B2B Second Pillar
              </span>
              <h3 className="text-lg font-bold text-zinc-900">Manufacturers & Packers</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                &ldquo;Prevention &gt; Penalty&rdquo; self-audit portal. Validate packaging artwork before commercial printing. Avoid ₹25,000+ fines and batch recalls.
              </p>
              <ul className="text-xs text-zinc-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Pre-print AI artwork inspection
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Official Compliance Certificate generator
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Fix & Resubmit revision loops
                </li>
              </ul>
            </div>
            <Link
              href="/vendor/dashboard"
              className="mt-6 inline-flex items-center text-xs font-semibold text-emerald-700 hover:text-emerald-800 group"
            >
              Open Vendor Dashboard <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition" />
            </Link>
          </div>

          {/* Card 2: Field Inspector */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 border border-blue-300 text-blue-800 flex items-center justify-center font-bold">
                <ScanLine className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                Field Enforcement
              </span>
              <h3 className="text-lg font-bold text-zinc-900">Legal Metrology Inspectors</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Field inspection app for retail shelves and wholesale warehouses. Fast mobile capture, GPS geotagging, and dual-MRP sticker tamper identification.
              </p>
              <ul className="text-xs text-zinc-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Offline preview mode with local cache
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Camera-only capture with signed EXIF & GPS
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Batch shelf-sweep rapid scanning
                </li>
              </ul>
            </div>
            <Link
              href="/inspector/scans"
              className="mt-6 inline-flex items-center text-xs font-semibold text-blue-700 hover:text-blue-800 group"
            >
              Launch Inspector Scans <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition" />
            </Link>
          </div>

          {/* Card 3: District Controller */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center font-bold">
                <Scale className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                Statutory Authority
              </span>
              <h3 className="text-lg font-bold text-zinc-900">District Controllers</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Oversight and statutory enforcement. Review auto-drafted Section 36 compounding notices, monitor district GIS violation heatmaps, and prioritize repeat offenders.
              </p>
              <ul className="text-xs text-zinc-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  Section 36 Notice auto-drafter & approval queue
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  District GIS violation density heatmap
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  Repeat-Offender tracking (&ge; 3 violations)
                </li>
              </ul>
            </div>
            <Link
              href="/dashboard/district"
              className="mt-6 inline-flex items-center text-xs font-semibold text-amber-700 hover:text-amber-800 group"
            >
              Open Controller Dashboard <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition" />
            </Link>
          </div>

          {/* Card 4: Codified Rule Engine */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 border border-purple-300 text-purple-800 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                Dynamic Regulation
              </span>
              <h3 className="text-lg font-bold text-zinc-900">Codified Rule Engine</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Rules are versioned database entities—never hardcoded. Amendments (2017, 2021, 2022) with effective dates and state jurisdiction overrides.
              </p>
              <ul className="text-xs text-zinc-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  Rules 4, 5, 6, 7, 9(6), 10, 11 codified
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  Version history & effective-from dates
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  Immutable audit trail of regulation changes
                </li>
              </ul>
            </div>
            <Link
              href="/admin/rules"
              className="mt-6 inline-flex items-center text-xs font-semibold text-purple-700 hover:text-purple-800 group"
            >
              Manage Codified Rules <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition" />
            </Link>
          </div>

          {/* Card 5: Universal Search & Repository */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-300 text-zinc-800 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                Auditor & Public Records
              </span>
              <h3 className="text-lg font-bold text-zinc-900">Universal Repository</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Instant barcode, GTIN, brand, and company search. View longitudinal compliance trends, historical evidence galleries, and audit logs.
              </p>
              <ul className="text-xs text-zinc-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" />
                  EAN-13 Barcode & QR verification
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" />
                  Longitudinal compliance history timeline
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" />
                  Exportable MIS reports (PDF / Excel)
                </li>
              </ul>
            </div>
            <Link
              href="/search"
              className="mt-6 inline-flex items-center text-xs font-semibold text-zinc-700 hover:text-zinc-800 group"
            >
              Open Universal Search <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition" />
            </Link>
          </div>

          {/* Card 6: State & National Admin */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-100 border border-rose-300 text-rose-800 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                National Governance
              </span>
              <h3 className="text-lg font-bold text-zinc-900">State & National Admin</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Choropleth violation density maps across Indian states, e-commerce marketplace compliance ranking (Amazon, Flipkart, Blinkit), and high-level MIS.
              </p>
              <ul className="text-xs text-zinc-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                  State-wise compliance density choropleth
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                  E-commerce seller compliance leaderboard
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                  National penalty collection tracking
                </li>
              </ul>
            </div>
            <Link
              href="/dashboard/admin"
              className="mt-6 inline-flex items-center text-xs font-semibold text-rose-700 hover:text-rose-800 group"
            >
              Open National Admin <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </div>
      </section>

      {/* The "1M Users = Data Tsunami" Complete Defense (From PDF 1) */}
      <section className="w-full bg-zinc-900 text-zinc-100 py-16 px-4 sm:px-6 lg:px-8 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
              National Infrastructure Scale Economics
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Why This Scales Without Breaking the Government Budget
            </h2>
            <p className="text-sm text-zinc-400 max-w-2xl mx-auto">
              Handling nationwide packaged commodity audits with deterministic storage math, edge preprocessing, and zero incremental capital expenditure.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left: Comparison Table */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                Annual IT Spend Comparison
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 font-medium">
                      <th className="py-2.5 px-3">Government System</th>
                      <th className="py-2.5 px-3 text-right">Annual IT Cost</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-300">
                    <tr>
                      <td className="py-2.5 px-3 font-medium">Aadhaar / UIDAI</td>
                      <td className="py-2.5 px-3 text-right font-mono">₹ 800+ Crore</td>
                      <td className="py-2.5 px-3 text-zinc-400">National Production</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium">GSTN Network</td>
                      <td className="py-2.5 px-3 text-right font-mono">₹ 500+ Crore</td>
                      <td className="py-2.5 px-3 text-zinc-400">National Production</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium">eCourts Phase III</td>
                      <td className="py-2.5 px-3 text-right font-mono">₹ 7,000 Crore</td>
                      <td className="py-2.5 px-3 text-zinc-400">Phase-wise Rollout</td>
                    </tr>
                    <tr className="bg-emerald-950/40 text-emerald-300 font-semibold border-t-2 border-emerald-600">
                      <td className="py-3 px-3 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        SLCS (Our System)
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold">~₹ 2–3 Crore / yr</td>
                      <td className="py-3 px-3 text-emerald-400">MeghRaj / NIC Ready</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-zinc-400 italic">
                &ldquo;Less than the operational overhead of a single district legal metrology office, yielding complete national coverage.&rdquo;
              </p>
            </div>

            {/* Right: The 3 Architectural Pillars */}
            <div className="space-y-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-xs">
                    1
                  </span>
                  Structured Data Over Raw Bloat
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  We do not store millions of raw photos permanently. We extract structured JSON (<span className="text-emerald-400 font-mono">~3KB</span> per scan) and store it in PostgreSQL with monthly partitioning.
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                  <span className="w-5 h-5 rounded-full bg-blue-950 border border-blue-700 flex items-center justify-center text-xs">
                    2
                  </span>
                  Smart Tiered Storage & 90-Day Auto-Purge
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  <strong>92% of scans are compliant</strong>: original evidence images are automatically purged after 90 days. Only the 8% confirmed violation scans are pinned for 7 years under Limitation Act requirements.
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <span className="w-5 h-5 rounded-full bg-amber-950 border border-amber-700 flex items-center justify-center text-xs">
                    3
                  </span>
                  On-Demand Deterministic PDF Generation
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Reports are never stored as static 300KB files. They are generated deterministically in &lt;1 second from data + template (<code className="text-amber-400 font-mono">PDF = f(data, template)</code>), achieving 100x storage savings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

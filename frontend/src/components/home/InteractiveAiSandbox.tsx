'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Code2,
  Scan,
  Scale,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface SampleProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  badge: string;
  status: 'compliant' | 'warning' | 'critical';
  complianceScore: number;
  image: string;
  verdict: string;
  findings: {
    field: string;
    value: string;
    rule: string;
    status: 'pass' | 'warning' | 'fail';
    note: string;
    bbox?: { top: string; left: string; width: string; height: string };
  }[];
  jsonPreview: object;
}

const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    id: 'biscuit',
    name: 'NutriRich Digestive Biscuits 500g',
    brand: 'NutriRich Foods Pvt Ltd',
    category: 'Packaged Food',
    badge: '100% Compliant Baseline',
    status: 'compliant',
    complianceScore: 100,
    image: '/samples/biscuits.jpg',
    verdict:
      'Fully compliant under LM (Packaged Commodities) Rules 2011. Pre-print certificate eligible.',
    findings: [
      {
        field: 'MRP & Unit Sale Price',
        value: '₹ 145.00 (USP: ₹ 0.29 / g)',
        rule: 'Rule 6(1)(e) - Inclusive of all taxes + USP',
        status: 'pass',
        note: 'Unit sale price clearly stamped adjacent to MRP.',
        bbox: { top: '76%', left: '57%', width: '36%', height: '8%' },
      },
      {
        field: 'Net Quantity',
        value: '500 g',
        rule: 'Rule 5 & Schedule II - Metric Standard',
        status: 'pass',
        note: 'Standard SI metric unit with correct spacing.',
        bbox: { top: '76%', left: '33%', width: '22%', height: '8%' },
      },
      {
        field: 'Brand & Generic Name',
        value: 'NutriRich Digestive Biscuits',
        rule: 'Rule 6(1)(b) - Generic Commodity Title',
        status: 'pass',
        note: 'Prominent generic name displayed on front panel.',
        bbox: { top: '28%', left: '33%', width: '38%', height: '26%' },
      },
      {
        field: 'FSSAI & Veg Logo',
        value: 'Standard green vegetarian logo in green square',
        rule: 'FSSAI & Packaging Standards Alignment',
        status: 'pass',
        note: 'Mandatory vegetarian emblem correctly printed.',
        bbox: { top: '70%', left: '64%', width: '9%', height: '7%' },
      },
    ],
    jsonPreview: {
      sku: 'NR-DIG-500G',
      mrp_inr: 145.0,
      unit_sale_price: '0.29/g',
      net_quantity_g: 500,
      mfg_month_year: '08/2026',
      ocr_confidence_mean: 98.4,
      statutory_compliance: 'PASSED_ALL_CHECKS',
      certificate_hash: 'SHA256:4a8b71...',
    },
  },
  {
    id: 'hairoil',
    name: 'GlowHerb Ayurvedic Hair Oil 100ml',
    brand: 'GlowHerb Natural Care',
    category: 'Cosmetics',
    badge: 'Rule 9(6) Font Height Violation',
    status: 'warning',
    complianceScore: 68,
    image: '/samples/hairoil.jpg',
    verdict:
      'Defect Detected: Numeral height is 0.72mm, failing mandatory Table I minimum of 1.0mm.',
    findings: [
      {
        field: 'Numeral & Letter Height',
        value: '0.72 mm (Expected: ≥ 1.0 mm)',
        rule: 'Rule 9(6) Table I - Font Legibility Standard',
        status: 'fail',
        note: 'Physical font height below statutory minimum for 120cm² pack area.',
        bbox: { top: '63%', left: '39%', width: '24%', height: '8%' },
      },
      {
        field: 'Maximum Retail Price',
        value: '₹ 180.00 (Inclusive of taxes)',
        rule: 'Rule 6(1)(e) - Price Declaration',
        status: 'pass',
        note: 'Correct declaration syntax detected.',
        bbox: { top: '75%', left: '39%', width: '22%', height: '6%' },
      },
      {
        field: 'Net Volume',
        value: '100 ml',
        rule: 'Rule 5 - Metric Volume',
        status: 'pass',
        note: 'Standard milliliter unit notation used.',
        bbox: { top: '59%', left: '44%', width: '14%', height: '4%' },
      },
      {
        field: 'Barcode & Origin',
        value: 'EAN-13: 8901234567890 • Made in India',
        rule: 'Rule 11 - Country of Origin',
        status: 'pass',
        note: 'Standard EAN barcode and domestic manufacturer origin present.',
        bbox: { top: '77%', left: '39%', width: '18%', height: '10%' },
      },
    ],
    jsonPreview: {
      sku: 'GH-AHO-100ML',
      font_height_mm: 0.72,
      statutory_minimum_mm: 1.0,
      defect_code: 'ERR_RULE_9_6_UNDERSIZED_FONT',
      penalty_risk: 'Compounding Notice under Sec 36',
      rectification_action: 'Increase primary font size to at least 1.2mm',
    },
  },
  {
    id: 'chips',
    name: 'CrispWave Kettle Chips 75g',
    brand: 'CrispWave Snacks Ltd',
    category: 'Snacks & Savouries',
    badge: 'Critical Dual-MRP Sticker Tamper',
    status: 'critical',
    complianceScore: 42,
    image: '/samples/chips.jpg',
    verdict:
      'Critical Breach: Illegal secondary sticker (₹50) overlaid on original printed MRP (₹35). Section 36 Notice queued.',
    findings: [
      {
        field: 'Dual-MRP Sticker Tamper',
        value: 'Sticker: ₹50.00 | Underneath: ₹35.00',
        rule: 'Rule 18(2) & Section 36(1) - Alteration Prohibited',
        status: 'fail',
        note: 'Adhesive layer seam identified with OCR layer difference.',
        bbox: { top: '15%', left: '54%', width: '28%', height: '18%' },
      },
      {
        field: 'Consumer Care Contact',
        value: 'MISSING (No phone or email found)',
        rule: 'Rule 6(5) - Mandatory Grievance Cell',
        status: 'fail',
        note: 'No grievance officer contact details present on back panel.',
      },
      {
        field: 'Net Quantity',
        value: '75 g',
        rule: 'Rule 5 - Standard Weight',
        status: 'pass',
        note: 'Standard net quantity declaration detected.',
        bbox: { top: '82%', left: '56%', width: '22%', height: '6%' },
      },
      {
        field: 'Brand & Commodity',
        value: 'CrispWave Kettle Cooked Chips',
        rule: 'Rule 6(1)(b) - Commodity Name',
        status: 'pass',
        note: 'Generic commodity declaration verified.',
        bbox: { top: '30%', left: '32%', width: '38%', height: '22%' },
      },
    ],
    jsonPreview: {
      sku: 'CW-KC-75G',
      tamper_detected: true,
      printed_mrp: 35.0,
      sticker_mrp: 50.0,
      price_alteration_ratio: 1.428,
      statutory_prosecution: 'SECTION_36_1_NOTICE_DRAFTED',
      notice_ref: 'LM/DEL/CN/2026/0418',
    },
  },
];

export default function InteractiveAiSandbox() {
  const [selectedProduct, setSelectedProduct] = useState<SampleProduct>(
    SAMPLE_PRODUCTS[0]
  );
  const [activeTab, setActiveTab] = useState<'visual' | 'json'>('visual');
  const [isScanning, setIsScanning] = useState(false);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);

  const handleScanSimulation = (product: SampleProduct) => {
    setSelectedProduct(product);
    setHighlightedField(null);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 600);
  };

  return (
    <section className="w-full bg-zinc-950 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Interactive AI Compliance Sandbox • Instant Real-Time Demo</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            See the AI Inspection Engine in Action
          </h2>
          <p className="text-sm text-zinc-400 max-w-2xl mx-auto">
            Select real-world sample packages below to test our computer vision OCR, sub-millimeter font height detection, and dual-MRP sticker tamper analyzer without logging in.
          </p>
        </div>

        {/* 3 Sample Package Cards Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAMPLE_PRODUCTS.map((prod) => {
            const isSelected = selectedProduct.id === prod.id;
            return (
              <button
                key={prod.id}
                onClick={() => handleScanSimulation(prod)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? prod.status === 'compliant'
                      ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
                      : prod.status === 'warning'
                      ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30'
                      : 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30'
                    : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        prod.status === 'compliant'
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                          : prod.status === 'warning'
                          ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                          : 'bg-rose-900/60 text-rose-300 border border-rose-700/50'
                      }`}
                    >
                      {prod.badge}
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-400">
                      Score: {prod.complianceScore}%
                    </span>
                  </div>
                  <p className="text-sm font-bold text-zinc-100">{prod.name}</p>
                  <p className="text-xs text-zinc-400">{prod.brand}</p>
                </div>
                <div className="pt-3 border-t border-zinc-800/80 mt-3 flex items-center justify-between text-xs text-zinc-400">
                  <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                    <Scan className="w-3.5 h-3.5" />
                    {isSelected ? 'Active Demo' : 'Click to Inspect'}
                  </span>
                  <span className="font-mono text-[11px]">
                    {prod.findings.length} checks
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Inspection Screen (Interactive Split Panel) */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6">
          {/* Subheader with toggles */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  CV / Multilingual OCR Engine v3.4 Active
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {selectedProduct.name}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg bg-zinc-800 p-1 border border-zinc-700 text-xs">
                <button
                  onClick={() => setActiveTab('visual')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
                    activeTab === 'visual'
                      ? 'bg-zinc-900 text-emerald-400 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Bounding Box View</span>
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
                    activeTab === 'json'
                      ? 'bg-zinc-900 text-emerald-400 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Structured JSON</span>
                </button>
              </div>

              <button
                onClick={() => handleScanSimulation(selectedProduct)}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                title="Rerun AI Scan"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isScanning ? 'animate-spin text-emerald-400' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Verdict Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs sm:text-sm ${
              selectedProduct.status === 'compliant'
                ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                : selectedProduct.status === 'warning'
                ? 'bg-amber-950/40 border-amber-700/60 text-amber-300'
                : 'bg-rose-950/40 border-rose-700/60 text-rose-300'
            }`}
          >
            {selectedProduct.status === 'compliant' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            ) : selectedProduct.status === 'warning' ? (
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            )}
            <div>
              <span className="font-bold uppercase tracking-wider block text-[11px]">
                Statutory AI Verdict:
              </span>
              <p className="mt-0.5 font-medium">{selectedProduct.verdict}</p>
            </div>
          </div>

          {/* Main Inspection View */}
          {activeTab === 'visual' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Image with animated bounding boxes */}
              <div className="lg:col-span-6 relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center min-h-[340px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  onError={(e) => {
                    e.currentTarget.src = '/samples/prodcut.png';
                  }}
                  className="w-full h-80 sm:h-96 object-cover opacity-85"
                />

                {/* Simulated Scanning Laser Line */}
                {isScanning && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/25 to-transparent animate-pulse pointer-events-none" />
                )}

                {/* Overlaid Bounding Boxes */}
                {selectedProduct.findings.map((item, idx) => {
                  if (!item.bbox) return null;
                  const isHovered = highlightedField === item.field;
                  return (
                    <div
                      key={idx}
                      style={{
                        top: item.bbox.top,
                        left: item.bbox.left,
                        width: item.bbox.width,
                        height: item.bbox.height,
                      }}
                      className={`absolute border-2 rounded transition-all duration-200 pointer-events-none flex items-start justify-start p-1 ${
                        item.status === 'pass'
                          ? isHovered
                            ? 'border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-500/40 scale-105'
                            : 'border-emerald-500/70 bg-emerald-500/10'
                          : item.status === 'warning'
                          ? isHovered
                            ? 'border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/40 scale-105'
                            : 'border-amber-500/70 bg-amber-500/10'
                          : isHovered
                          ? 'border-rose-400 bg-rose-500/20 shadow-lg shadow-rose-500/40 scale-105'
                          : 'border-rose-500/70 bg-rose-500/10 animate-pulse'
                      }`}
                    >
                      <span
                        className={`text-[9px] font-mono font-bold px-1 rounded uppercase tracking-wider ${
                          item.status === 'pass'
                            ? 'bg-emerald-950 text-emerald-300'
                            : item.status === 'warning'
                            ? 'bg-amber-950 text-amber-300'
                            : 'bg-rose-950 text-rose-300'
                        }`}
                      >
                        {item.field}
                      </span>
                    </div>
                  );
                })}

                <div className="absolute bottom-2 left-2 bg-zinc-950/80 backdrop-blur-xs text-zinc-400 text-[10px] px-2.5 py-1 rounded border border-zinc-800">
                  Hover rows on right to highlight AI Bounding Boxes
                </div>
              </div>

              {/* Right Column: Statutory Declarations Table */}
              <div className="lg:col-span-6 space-y-2.5">
                <div className="flex justify-between items-center text-xs text-zinc-400 px-1">
                  <span className="font-semibold uppercase tracking-wider">
                    Extracted Declarations
                  </span>
                  <span className="font-mono">
                    Score: {selectedProduct.complianceScore} / 100
                  </span>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {selectedProduct.findings.map((finding, idx) => (
                    <div
                      key={idx}
                      onMouseEnter={() => setHighlightedField(finding.field)}
                      onMouseLeave={() => setHighlightedField(null)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        highlightedField === finding.field
                          ? 'border-emerald-500/80 bg-zinc-800/90 shadow-md'
                          : 'border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-850'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-zinc-200">
                          {finding.field}
                        </span>
                        <span
                          className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase ${
                            finding.status === 'pass'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                              : finding.status === 'warning'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                              : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                          }`}
                        >
                          {finding.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 font-mono mt-1 font-semibold">
                        {finding.value}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {finding.rule}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1 italic">
                        ↳ {finding.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* JSON Telemetry View */
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[360px]">
              <pre>{JSON.stringify(selectedProduct.jsonPreview, null, 2)}</pre>
            </div>
          )}

          {/* Quick Footer CTA inside sandbox */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-zinc-800 text-xs">
            <span className="text-zinc-400">
              Want to test this with your own packaging files or photos?
            </span>
            <div className="flex items-center gap-3">
              <Link
                href="/vendor/audit/new"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 transition"
              >
                <span>Upload Custom Packaging</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/dashboard/district"
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold flex items-center gap-1.5 transition"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>View Enforcement Queue</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

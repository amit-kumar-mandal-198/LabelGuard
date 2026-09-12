'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  ShieldCheck, 
  FileText,
  ChevronRight,
  Sparkles,
  Layers
} from 'lucide-react';

interface DeclarationRule {
  id: string;
  ruleCitation: string;
  title: string;
  complianceRate: number;
  passingSkus: number;
  totalSkus: number;
  status: 'passed' | 'warning' | 'critical';
  defectSummary: string;
  affectedSkus: string[];
}

const DECLARATION_RULES: DeclarationRule[] = [
  {
    id: 'rule-mfr',
    ruleCitation: 'Rule 4 & 6(1)(a)',
    title: 'Manufacturer Postal Address & PIN',
    complianceRate: 100,
    passingSkus: 24,
    totalSkus: 24,
    status: 'passed',
    defectSummary: 'All factory addresses contain valid 6-digit postal PIN codes and state names.',
    affectedSkus: []
  },
  {
    id: 'rule-commodity',
    ruleCitation: 'Rule 6(1)(b)',
    title: 'Common Commodity Name on PDP',
    complianceRate: 96,
    passingSkus: 23,
    totalSkus: 24,
    status: 'passed',
    defectSummary: 'Prominent generic name verified on Principal Display Panel across catalog.',
    affectedSkus: ['FM-HNY-250G']
  },
  {
    id: 'rule-qty',
    ruleCitation: 'Rule 6(1)(c) & Sched. II',
    title: 'Net Quantity SI Units & Font Spacing',
    complianceRate: 92,
    passingSkus: 22,
    totalSkus: 24,
    status: 'passed',
    defectSummary: 'Standard SI metric symbols (g, kg, ml) with mandatory letter spacing.',
    affectedSkus: ['GH-AHO-100ML', 'CW-KC-75G']
  },
  {
    id: 'rule-date',
    ruleCitation: 'Rule 6(1)(d)',
    title: 'Month & Year of Manufacture / Packing',
    complianceRate: 75,
    passingSkus: 18,
    totalSkus: 24,
    status: 'warning',
    defectSummary: 'Missing MM/YYYY date stamps or ambiguous batch abbreviations in 6 SKUs.',
    affectedSkus: ['FM-HNY-250G', 'NR-DIG-500G', 'CW-KC-75G']
  },
  {
    id: 'rule-mrp',
    ruleCitation: 'Rule 6(1)(e)',
    title: 'MRP (Incl. of All Taxes) & USP Ratio',
    complianceRate: 88,
    passingSkus: 21,
    totalSkus: 24,
    status: 'warning',
    defectSummary: 'Unit Sale Price (e.g. ₹0.29/g) missing on large bulk packs (>1kg/1L).',
    affectedSkus: ['CW-KC-75G', 'GH-AHO-100ML']
  },
  {
    id: 'rule-care',
    ruleCitation: 'Rule 6(5) Amend. 2021',
    title: 'Consumer Care Cell (Toll-Free + Email)',
    complianceRate: 65,
    passingSkus: 16,
    totalSkus: 24,
    status: 'critical',
    defectSummary: 'Top Vulnerability: 8 SKUs omit official email or designated complaint officer name.',
    affectedSkus: ['CW-KC-75G', 'FM-HNY-250G', 'GH-AHO-100ML']
  },
  {
    id: 'rule-fssai',
    ruleCitation: 'FSSAI Act Sec. 23',
    title: 'Veg / Non-Veg Emblem & FSSAI Lic.',
    complianceRate: 100,
    passingSkus: 24,
    totalSkus: 24,
    status: 'passed',
    defectSummary: '100% compliance: Green circular dot inside square frame verified by computer vision.',
    affectedSkus: []
  },
  {
    id: 'rule-origin',
    ruleCitation: 'Rule 6(10) Amend. 2017',
    title: 'Country of Origin Declaration',
    complianceRate: 100,
    passingSkus: 24,
    totalSkus: 24,
    status: 'passed',
    defectSummary: '"Product of India / Country of Origin" declared on PDP with font ratio compliant.',
    affectedSkus: []
  }
];

interface DeclarationHealthMatrixProps {
  onSelectSkuForRemediation?: (sku: string) => void;
}

export default function DeclarationHealthMatrix({ onSelectSkuForRemediation }: DeclarationHealthMatrixProps) {
  const [selectedRule, setSelectedRule] = useState<DeclarationRule | null>(null);

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> Statutory Audit Matrix
            </span>
            <span className="text-xs text-zinc-500 font-mono">8 Mandatory Legal Metrology PC Rules (2011)</span>
          </div>
          <h2 className="text-lg font-bold text-zinc-900 mt-1">
            Mandatory Declaration Health & Readiness Radar
          </h2>
          <p className="text-xs text-zinc-500">
            Real-time compliance rating across all 24 registered brand SKUs. Pinpoint legal blind spots before dispatching products to market.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg">
          <span>Overall Health:</span>
          <span className="font-mono text-emerald-700 font-bold text-sm">88% (A+)</span>
        </div>
      </div>

      {/* 8-Rule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {DECLARATION_RULES.map((rule) => (
          <div
            key={rule.id}
            onClick={() => setSelectedRule(rule)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedRule?.id === rule.id
                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
                : rule.status === 'passed'
                ? 'border-zinc-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/20'
                : rule.status === 'warning'
                ? 'border-amber-200 bg-amber-50/30 hover:border-amber-400'
                : 'border-rose-200 bg-rose-50/30 hover:border-rose-400'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-zinc-500">{rule.ruleCitation}</span>
                {rule.status === 'passed' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" /> PASS
                  </span>
                ) : rule.status === 'warning' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    <AlertTriangle className="w-3 h-3" /> WARN
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                    <AlertOctagon className="w-3 h-3" /> ALERT
                  </span>
                )}
              </div>

              <h4 className="font-semibold text-xs text-zinc-900 leading-snug line-clamp-2">
                {rule.title}
              </h4>
            </div>

            {/* Score Bar */}
            <div className="pt-3 mt-2 border-t border-zinc-100/80 space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">{rule.passingSkus}/{rule.totalSkus} SKUs OK</span>
                <span className={`font-mono font-bold ${
                  rule.complianceRate >= 90 ? 'text-emerald-700' : rule.complianceRate >= 75 ? 'text-amber-700' : 'text-rose-700'
                }`}>
                  {rule.complianceRate}%
                </span>
              </div>
              <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    rule.complianceRate >= 90 ? 'bg-emerald-500' : rule.complianceRate >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${rule.complianceRate}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Drill-down Detail Modal / Callout if a rule is clicked */}
      {selectedRule && (
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 animate-in fade-in text-xs">
          <div className="flex justify-between items-center">
            <span className="font-bold text-zinc-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              {selectedRule.title} ({selectedRule.ruleCitation})
            </span>
            <button
              onClick={() => setSelectedRule(null)}
              className="text-zinc-400 hover:text-zinc-700 text-xs font-semibold"
            >
              Close Detail
            </button>
          </div>
          <p className="text-zinc-600">{selectedRule.defectSummary}</p>
          
          {selectedRule.affectedSkus.length > 0 ? (
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-zinc-500 font-semibold">Flagged SKUs for Revision:</span>
              {selectedRule.affectedSkus.map((sku) => (
                <button
                  key={sku}
                  onClick={() => onSelectSkuForRemediation && onSelectSkuForRemediation(sku)}
                  className="px-2 py-0.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded font-mono font-bold text-[11px] transition flex items-center gap-1 shadow-2xs"
                >
                  <span>{sku}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          ) : (
            <div className="pt-1 text-emerald-700 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>All 24 SKUs pass this statutory requirement with 100% confidence.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

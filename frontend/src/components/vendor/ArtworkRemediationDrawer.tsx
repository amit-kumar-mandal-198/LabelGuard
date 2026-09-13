'use client';

import React, { useState } from 'react';
import { 
  X, 
  Wrench, 
  Copy, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Type,
  FileCode,
  Layers
} from 'lucide-react';
import { InspectionRecord } from '@/lib/types';

interface ArtworkRemediationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  record: InspectionRecord | null;
  onApplyRemediation: (recordId: string) => void;
}

export default function ArtworkRemediationDrawer({
  isOpen,
  onClose,
  record,
  onApplyRemediation
}: ArtworkRemediationDrawerProps) {
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  if (!isOpen || !record) return null;

  // Generate customized compliant text recommendation based on SKU
  const isConsumerCareIssue = record.violations.some(v => v.fieldName === 'consumer_care' || v.ruleCode === 'LG-CARE');
  const isDateIssue = record.violations.some(v => v.fieldName === 'manufacturing_date' || v.ruleCode === 'LG-DATE');
  const isFontIssue = record.violations.some(v => v.fieldName === 'net_quantity' || v.ruleCode === 'LG-QTY');

  const suggestedText = isConsumerCareIssue
    ? `For consumer feedback / grievances, contact Consumer Care Cell: Executive Officer, ${record.brand || 'NutriRich Foods Ltd'}, Plot 42, Ecotech III, Greater Noida 201306, UP. Toll-Free: 1800-200-9944, Email: care@nutririchfoods.in.`
    : isDateIssue
    ? `MFD / PKG: 09/2026 • BATCH NO: NR-B9284 • USE BEFORE 12 MONTHS FROM PACKAGING.`
    : `Net Qty: ${record.netQuantity || '100 g'} (USP: ₹ ${((record.declaredMrp || 50) / 100).toFixed(2)} / g) • Minimum Numeral Height: 2.0 mm`;

  const typographySpecs = isFontIssue
    ? 'Schedule II Table I: Minimum numeral height must be ≥ 2.0 mm on PDP area 120-360 cm².'
    : 'Rule 6(5): All grievance contact text must have equal prominent contrast against background.';

  const handleCopy = () => {
    navigator.clipboard.writeText(suggestedText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      onApplyRemediation(String(record.id));
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 bg-zinc-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">ARTWORK REMEDIATION ASSISTANT</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  PRE-PRINT FIX
                </span>
              </div>
              <p className="text-xs text-zinc-400">{record.productName} ({record.sku})</p>
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
        <div className="p-6 space-y-6 flex-1 text-xs">
          
          {/* Packaging Preview with Defect Bounding Box Highlight */}
          <div className="space-y-2">
            <span className="text-zinc-500 uppercase font-bold tracking-wider text-[10px] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> Inspected Label Proof Area
            </span>
            <div className="relative rounded-xl overflow-hidden border border-zinc-200 bg-zinc-950 flex items-center justify-center p-4">
              <img
                src={record.imageUrl || '/samples/biscuits.jpg'}
                alt={record.productName}
                className="max-h-56 object-contain rounded-lg shadow-sm"
              />
              {/* Highlight Overlay Indicator */}
              <div className="absolute top-4 right-4 bg-rose-900/90 text-rose-200 px-2.5 py-1 rounded border border-rose-600/50 flex items-center gap-1.5 text-[11px] font-bold shadow-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Non-Compliance Flagged</span>
              </div>
            </div>
          </div>

          {/* Active Violations List */}
          <div className="space-y-2">
            <span className="text-zinc-500 uppercase font-bold tracking-wider text-[10px]">
              Detected Legal Metrology Violations ({record.violations.length})
            </span>
            {record.violations.map((v, i) => (
              <div key={i} className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-900 font-mono text-[11px]">{v.legalCitation || v.ruleCode}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-200 text-rose-800 uppercase">
                    {v.severity}
                  </span>
                </div>
                <p className="text-zinc-700">{v.message}</p>
              </div>
            ))}
          </div>

          {/* AI Recommended Compliant Typography & Copy */}
          <div className="space-y-2.5 bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold uppercase text-[11px]">
                <Sparkles className="w-4 h-4 text-emerald-600" /> Statutory Compliant Copy-Paste Text
              </div>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded font-semibold text-[11px] flex items-center gap-1 transition shadow-2xs"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Text Box */}
            <div className="p-3 bg-white border border-emerald-300/80 rounded-lg font-mono text-[11px] text-zinc-800 leading-relaxed select-all">
              {suggestedText}
            </div>

            {/* Typography Specs */}
            <div className="flex items-start gap-2 text-[11px] text-zinc-600 pt-1">
              <Type className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Typography Rule:</strong> {typographySpecs}</span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 rounded-lg text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            {isApplying ? (
              <>Applying Fix & Re-Auditing...</>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Remediation Applied & Re-Audit</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

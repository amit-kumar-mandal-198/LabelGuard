'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  ShieldAlert, 
  ShieldCheck, 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  Sparkles,
  AlertOctagon,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

// Deterministic number formatter to avoid SSR/Client locale hydration mismatch
const formatNum = (val: number): string => {
  return Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export default function FinancialRiskCalculator() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [batchSize, setBatchSize] = useState<number>(50000);
  const [unitPackagingCost, setUnitPackagingCost] = useState<number>(14);
  const [potentialViolations, setPotentialViolations] = useState<number>(2);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Financial Calculations
  const prePrintTweakCost = 10 * potentialViolations; // ₹10 per digital artwork file fix
  const statutoryFineRisk = potentialViolations * 25000; // Minimum ₹25,000 compounding fine per SKU under Section 36
  const physicalRepackagingLoss = batchSize * unitPackagingCost; // Cost of scrapping printed cartons/foils
  const reverseLogisticsLoss = Math.round(batchSize * 3.5); // Shipping recall cost from distributors
  const totalMarketFailureRisk = statutoryFineRisk + physicalRepackagingLoss + reverseLogisticsLoss;
  const netCapitalSaved = totalMarketFailureRisk - prePrintTweakCost;
  const roiMultiplier = Math.round(netCapitalSaved / Math.max(prePrintTweakCost, 1));

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-emerald-600" /> ROI & Risk Model
            </span>
            <span className="text-xs text-zinc-500 font-mono">Legal Metrology Act Sec. 36 Compounding Audit</span>
          </div>
          <h2 className="text-lg font-bold text-zinc-900 mt-1">
            Pre-Print Prevention vs Market Recall Financial Risk Exposure
          </h2>
          <p className="text-xs text-zinc-500">
            Simulate the capital risk avoided by catching packaging declaration defects digitally before retail distribution.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl font-mono text-xs font-bold shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span suppressHydrationWarning>{formatNum(roiMultiplier)}x Capital ROI</span>
        </div>
      </div>

      {/* Interactive Controls & Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left: Interactive Sliders (5 cols) */}
        <div className="lg:col-span-5 space-y-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1.5 font-semibold text-zinc-800">
              <span>Production Batch Run Size:</span>
              <span suppressHydrationWarning className="font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                {formatNum(batchSize)} units
              </span>
            </div>
            <input
              type="range"
              min={5000}
              max={200000}
              step={5000}
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 font-mono mt-0.5">
              <span>5,000 units</span>
              <span>100,000</span>
              <span>200,000 units</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 font-semibold text-zinc-800">
              <span>Unit Packaging / Cartoning Cost:</span>
              <span suppressHydrationWarning className="font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                ₹ {unitPackagingCost} / unit
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={60}
              step={1}
              value={unitPackagingCost}
              onChange={(e) => setUnitPackagingCost(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 font-mono mt-0.5">
              <span>₹ 5 (Pouch)</span>
              <span>₹ 30 (Mono-carton)</span>
              <span>₹ 60 (Glass Jar)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 font-semibold text-zinc-800">
              <span>Vulnerable Pre-Print SKUs:</span>
              <span suppressHydrationWarning className="font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                {potentialViolations} SKU Flags
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={potentialViolations}
              onChange={(e) => setPotentialViolations(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Right: Comparative Financial Ledger (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          
          {/* Scenario A: Caught Post-Distribution (The Penalty Reality) */}
          <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2.5 text-xs">
            <div className="flex items-center gap-1.5 text-rose-800 font-bold uppercase tracking-wider text-[11px]">
              <AlertOctagon className="w-4 h-4 text-rose-600" /> If Detected In Market
            </div>
            <div className="space-y-1.5 text-zinc-600 text-[11px]">
              <div className="flex justify-between">
                <span>Sec 36 Statutory Compounding:</span>
                <span suppressHydrationWarning className="font-mono font-semibold text-rose-900">
                  ₹ {formatNum(statutoryFineRisk)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Carton Scrap & Repackaging:</span>
                <span suppressHydrationWarning className="font-mono font-semibold text-rose-900">
                  ₹ {formatNum(physicalRepackagingLoss)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Distributor Reverse Logistics:</span>
                <span suppressHydrationWarning className="font-mono font-semibold text-rose-900">
                  ₹ {formatNum(reverseLogisticsLoss)}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-rose-200 flex justify-between items-baseline">
              <span className="font-bold text-rose-950 text-xs">Total Market Penalty:</span>
              <span suppressHydrationWarning className="font-mono font-extrabold text-base text-rose-700">
                ₹ {formatNum(totalMarketFailureRisk)}
              </span>
            </div>
          </div>

          {/* Scenario B: Caught in LabelGuard Pre-Print Sandbox */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Caught in Pre-Print Audit
            </div>
            <div className="space-y-1.5 text-zinc-600 text-[11px]">
              <div className="flex justify-between">
                <span>Vector Typography Fix:</span>
                <span suppressHydrationWarning className="font-mono font-semibold text-emerald-900">
                  ₹ {prePrintTweakCost} (5 mins)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Engraving Cylinder Wastage:</span>
                <span className="font-mono font-semibold text-emerald-900">₹ 0 (Zero Waste)</span>
              </div>
              <div className="flex justify-between">
                <span>Market Legal Exposure:</span>
                <span className="font-mono font-semibold text-emerald-900">₹ 0 (100% Shielded)</span>
              </div>
            </div>
            <div className="pt-2 border-t border-emerald-200 flex justify-between items-baseline">
              <span className="font-bold text-emerald-950 text-xs">Net Capital Saved:</span>
              <span suppressHydrationWarning className="font-mono font-extrabold text-base text-emerald-700">
                ₹ {formatNum(netCapitalSaved)}
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

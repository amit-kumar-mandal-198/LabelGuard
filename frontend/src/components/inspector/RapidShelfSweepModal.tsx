'use client';

import React, { useState, useEffect } from 'react';
import { 
  Scan, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Zap, 
  Layers, 
  Camera, 
  Check, 
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface SweepItem {
  id: string;
  barcode: string;
  productName: string;
  brand: string;
  category: string;
  status: 'compliant' | 'tampered' | 'missing_decl';
  mrp: string;
  notes: string;
}

const SIMULATED_STREAM: SweepItem[] = [
  {
    id: 'SW-101',
    barcode: '8901030382910',
    productName: 'CrispWave Kettle Chips Classic Salted (45g)',
    brand: 'CrispWave Foods',
    category: 'Snacks',
    status: 'compliant',
    mrp: '₹20.00',
    notes: 'All 7 mandatory declarations verified via Gemini OCR'
  },
  {
    id: 'SW-102',
    barcode: '8901030382910',
    productName: 'CrispWave Kettle Chips Classic Salted (45g)',
    brand: 'CrispWave Foods',
    category: 'Snacks',
    status: 'compliant',
    mrp: '₹20.00',
    notes: 'Batch verification matches cloud database registry'
  },
  {
    id: 'SW-103',
    barcode: '8901030382915',
    productName: 'CrispWave Kettle Chips Sour Cream (45g)',
    brand: 'CrispWave Foods',
    category: 'Snacks',
    status: 'tampered',
    mrp: '₹50.00 (Sticker) vs ₹35.00 (OCR Base)',
    notes: 'Tamper Alert: Physical re-labeling detected over original MRP font'
  },
  {
    id: 'SW-104',
    barcode: '8901058852331',
    productName: 'NutriRich High-Fiber Digestive Biscuits (200g)',
    brand: 'NutriRich Bakeries Ltd',
    category: 'Biscuits',
    status: 'compliant',
    mrp: '₹45.00 (₹0.225 / g)',
    notes: 'Unit Sale Price font ratio compliant (Rule 6(11))'
  },
  {
    id: 'SW-105',
    barcode: '8901058852332',
    productName: 'NutriRich Digestive Biscuits Honey & Oats (200g)',
    brand: 'NutriRich Bakeries Ltd',
    category: 'Biscuits',
    status: 'missing_decl',
    mrp: '₹48.00',
    notes: 'Defect: Consumer Care toll-free phone number unreadable / omitted'
  }
];

interface RapidShelfSweepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBatchToRegistry: (items: any[]) => void;
}

export default function RapidShelfSweepModal({ isOpen, onClose, onAddBatchToRegistry }: RapidShelfSweepModalProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedItems, setScannedItems] = useState<SweepItem[]>([]);
  const [autoComplete, setAutoComplete] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setIsScanning(false);
      setCurrentIndex(0);
      setScannedItems([]);
      setAutoComplete(false);
      return;
    }

    // Start auto sweep on open
    setIsScanning(true);
  }, [isOpen]);

  useEffect(() => {
    if (!isScanning || currentIndex >= SIMULATED_STREAM.length) {
      if (currentIndex >= SIMULATED_STREAM.length && !autoComplete) {
        setIsScanning(false);
        setAutoComplete(true);
      }
      return;
    }

    const timer = setTimeout(() => {
      const nextItem = SIMULATED_STREAM[currentIndex];
      setScannedItems(prev => [nextItem, ...prev]);
      setCurrentIndex(prev => prev + 1);
    }, 1400);

    return () => clearTimeout(timer);
  }, [isScanning, currentIndex, autoComplete]);

  if (!isOpen) return null;

  const handleFinish = () => {
    const formatted = scannedItems.map(item => ({
      id: `SW-${Date.now().toString().slice(-4)}-${item.id}`,
      barcode: item.barcode,
      productName: item.productName,
      brand: item.brand,
      category: item.category,
      retailer: 'Reliance Smart Bazaar, Sector 18',
      location: 'Sector 18, Noida • Sub-Division 4',
      status: item.status === 'compliant' ? 'compliant' : 'irregular',
      defectType: item.status === 'tampered' ? 'Overcharging' : item.status === 'missing_decl' ? 'Missing Declarations' : 'None',
      defectReason: item.notes,
      scannedAt: 'Just now (Rapid Sweep)',
      officer: 'Insp. Rajesh Sharma (Field Active)',
      image: item.barcode.includes('8901030') ? '/samples/chips.jpg' : '/samples/biscuits.jpg',
      confidence: 97,
      isSeized: false
    }));

    onAddBatchToRegistry(formatted);
    onClose();
  };

  const restartSweep = () => {
    setScannedItems([]);
    setCurrentIndex(0);
    setAutoComplete(false);
    setIsScanning(true);
  };

  const tamperedCount = scannedItems.filter(i => i.status !== 'compliant').length;
  const compliantCount = scannedItems.filter(i => i.status === 'compliant').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">RAPID BATCH SHELF SWEEP</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Continuous HUD Sweep
                </span>
              </div>
              <p className="text-xs text-slate-400">Target Shelf: Aisle 4B (Snacks & Packaged Confectionery) • Sector 18 Store</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto flex-1 bg-slate-900/50">
          
          {/* Left Column: Simulated Camera Viewfinder with Laser Scanner */}
          <div className="space-y-4">
            <div className="relative w-full aspect-square md:aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex flex-col justify-between p-4">
              {/* Overlay grid lines */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
              
              {/* Animated Laser Beam */}
              {isScanning && (
                <div className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,0.8)] animate-pulse top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300" />
              )}

              {/* Viewfinder Reticle Corners */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400/80 rounded-tl pointer-events-none" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400/80 rounded-tr pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400/80 rounded-bl pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400/80 rounded-br pointer-events-none" />

              {/* Top Viewfinder HUD */}
              <div className="relative z-10 flex justify-between items-center text-[11px] font-mono text-emerald-400 bg-slate-950/70 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                  {isScanning ? 'SCANNER LIVE (60 FPS)' : 'SWEEP COMPLETE'}
                </span>
                <span>ISO 400 • F/1.8 • 4K</span>
              </div>

              {/* Center Target Box */}
              <div className="relative z-10 flex flex-col items-center justify-center my-auto">
                <div className={`w-48 h-28 border-2 rounded-xl flex flex-col items-center justify-center p-3 text-center transition-all ${
                  isScanning 
                    ? 'border-emerald-500/60 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                    : 'border-slate-700 bg-slate-900/60'
                }`}>
                  <Scan className={`w-8 h-8 ${isScanning ? 'text-emerald-400 animate-bounce' : 'text-slate-500'}`} />
                  <span className="text-[11px] text-slate-300 font-mono mt-1">
                    {isScanning ? `TARGET ACQUIRED: UNIT #${currentIndex + 1}` : 'SCANNER STANDBY'}
                  </span>
                </div>
              </div>

              {/* Bottom Viewfinder HUD */}
              <div className="relative z-10 flex justify-between items-center text-xs font-mono text-slate-300 bg-slate-950/70 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800">
                <span>PROGRESS: {currentIndex}/{SIMULATED_STREAM.length} FACINGS</span>
                <span className="text-emerald-400 font-bold">
                  {Math.round((currentIndex / SIMULATED_STREAM.length) * 100)}%
                </span>
              </div>
            </div>

            {/* Sweep Score Card */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
                <span className="text-[11px] text-slate-400 font-medium">TOTAL SCANNED</span>
                <p className="text-xl font-bold font-mono text-white mt-0.5">{scannedItems.length}</p>
              </div>
              <div className="bg-slate-950 border border-emerald-900/30 p-3 rounded-xl text-center">
                <span className="text-[11px] text-emerald-400 font-medium">PASSED / OK</span>
                <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{compliantCount}</p>
              </div>
              <div className="bg-slate-950 border border-rose-900/30 p-3 rounded-xl text-center">
                <span className="text-[11px] text-rose-400 font-medium">IRREGULARITIES</span>
                <p className="text-xl font-bold font-mono text-rose-400 mt-0.5">{tamperedCount}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Live Audit Feed */}
          <div className="flex flex-col space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" /> Real-time Shelf Audit Stream
              </h4>
              <span className="text-[11px] font-mono text-slate-500">Auto-matched with Central MRP DB</span>
            </div>

            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-y-auto space-y-2.5 max-h-[360px]">
              {scannedItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-12">
                  <Scan className="w-8 h-8 mb-2 opacity-40 animate-spin" />
                  <p>Initializing camera pipeline...</p>
                </div>
              ) : (
                scannedItems.map((item, idx) => (
                  <div 
                    key={item.id + idx}
                    className={`p-3 rounded-lg border transition-all animate-in slide-in-from-top-2 ${
                      item.status === 'compliant'
                        ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40'
                        : item.status === 'tampered'
                        ? 'bg-rose-950/30 border-rose-800/50'
                        : 'bg-amber-950/30 border-amber-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400">{item.barcode}</span>
                        <h5 className="font-semibold text-white text-xs leading-snug">{item.productName}</h5>
                        <p className="text-[11px] text-slate-400 mt-0.5">Declared: <span className="font-mono text-slate-200">{item.mrp}</span></p>
                      </div>

                      {item.status === 'compliant' ? (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> PASS
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> DEFECT
                        </span>
                      )}
                    </div>

                    <p className={`text-[11px] mt-1.5 pl-2 border-l-2 ${
                      item.status === 'compliant' ? 'border-emerald-500/40 text-slate-400' : 'border-rose-500 text-rose-300'
                    }`}>
                      {item.notes}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Sweep Completion Actions */}
            {autoComplete && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">Batch Sweep of 5 Facing Units Completed</span>
                </div>
                <button
                  onClick={restartSweep}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  <RefreshCw className="w-3 h-3" /> Repeat
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950">
          <p className="text-xs text-slate-400 font-mono">
            {scannedItems.length} items buffered in local device RAM
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
            >
              Discard & Close
            </button>
            <button
              onClick={handleFinish}
              disabled={scannedItems.length === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all"
            >
              <Check className="w-4 h-4" /> Import Batch into Audit Docket ({scannedItems.length})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

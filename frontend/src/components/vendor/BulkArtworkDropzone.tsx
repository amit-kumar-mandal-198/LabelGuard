'use client';

import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Sparkles, 
  Layers, 
  RefreshCw, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';

interface StagedArtwork {
  id: string;
  name: string;
  size: string;
  sku: string;
  category: string;
  status: 'processing' | 'ready' | 'flagged';
  readinessScore: number;
  barcode: string;
  tamperCheck: 'pass' | 'review';
  declarationsFound: number;
  totalDeclarations: number;
  imageUrl: string;
}

const INITIAL_STAGED: StagedArtwork[] = [
  {
    id: 'ART-01',
    name: 'NutriRich_OatKrunch_250g_Proof_v3.pdf',
    size: '4.2 MB',
    sku: 'NR-OAT-250G',
    category: 'Packaged Food & Confectionery',
    status: 'ready',
    readinessScore: 98,
    barcode: '8901030829188',
    tamperCheck: 'pass',
    declarationsFound: 8,
    totalDeclarations: 8,
    imageUrl: '/samples/biscuits.jpg'
  },
  {
    id: 'ART-02',
    name: 'FreshMeadow_OrganicHoney_500g_DieLine_Rev2.ai',
    size: '8.7 MB',
    sku: 'FM-HNY-500G',
    category: 'Natural & Organic Foods',
    status: 'flagged',
    readinessScore: 68,
    barcode: '8907819200429',
    tamperCheck: 'review',
    declarationsFound: 6,
    totalDeclarations: 8,
    imageUrl: '/samples/honey.jpg'
  }
];

interface BulkArtworkDropzoneProps {
  onImportToCatalog: (items: StagedArtwork[]) => void;
}

export default function BulkArtworkDropzone({ onImportToCatalog }: BulkArtworkDropzoneProps) {
  const [stagedFiles, setStagedFiles] = useState<StagedArtwork[]>(INITIAL_STAGED);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const handleSimulatedDrop = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const newItem: StagedArtwork = {
        id: `ART-${Date.now().toString().slice(-4)}`,
        name: 'CrispWave_MasalaCurls_90g_FinalPack.pdf',
        size: '5.6 MB',
        sku: 'CW-MC-90G',
        category: 'Snacks & Savouries',
        status: 'ready',
        readinessScore: 94,
        barcode: '8906001229155',
        tamperCheck: 'pass',
        declarationsFound: 8,
        totalDeclarations: 8,
        imageUrl: '/samples/chips.jpg'
      };
      setStagedFiles(prev => [newItem, ...prev]);
      setIsSimulating(false);
    }, 1200);
  };

  const handleRemove = (id: string) => {
    setStagedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleBatchApprove = () => {
    onImportToCatalog(stagedFiles);
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" /> Pre-Flight AI Labeller
            </span>
            <span className="text-xs text-zinc-500 font-mono">Adobe Illustrator / Vector PDF / High-Res PNG</span>
          </div>
          <h2 className="text-lg font-bold text-zinc-900 mt-1">
            Bulk Packaging Artwork Staging & OCR Pre-Check
          </h2>
          <p className="text-xs text-zinc-500">
            Upload digital label proofs before printing cylinder engraving to guarantee 100% Legal Metrology (Packaged Commodities) compliance.
          </p>
        </div>

        <button
          onClick={handleSimulatedDrop}
          disabled={isSimulating}
          className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-lg text-xs flex items-center gap-2 shadow-xs transition"
        >
          {isSimulating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>Analyzing Vector Proof...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulate Proof Upload</span>
            </>
          )}
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleSimulatedDrop(); }}
        onClick={handleSimulatedDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging 
            ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]' 
            : 'border-zinc-300 hover:border-emerald-400 hover:bg-zinc-50/60'
        }`}
      >
        <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>
        <p className="text-xs sm:text-sm font-semibold text-zinc-800">
          Drag and drop artwork die-lines or click to browse files
        </p>
        <p className="text-[11px] text-zinc-500 mt-1">
          Supported: <strong>PDF (Vector)</strong>, <strong>AI / EPS</strong>, <strong>TIFF</strong>, <strong>PNG/JPG (&gt;300 DPI)</strong> up to 50MB per SKU
        </p>
      </div>

      {/* Staged Artworks List */}
      {stagedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              Staged Artworks for Pre-Print Plate Verification ({stagedFiles.length})
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              Zero printing plates wasted
            </span>
          </div>

          <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50/40">
            {stagedFiles.map((file) => (
              <div key={file.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-zinc-50 transition">
                <div className="flex items-center gap-3">
                  <img
                    src={file.imageUrl}
                    alt={file.name}
                    className="w-10 h-10 rounded-lg object-cover border border-zinc-200 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-zinc-900">{file.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                        {file.size}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      SKU: <span className="font-mono text-zinc-700">{file.sku}</span> • Barcode: <span className="font-mono text-zinc-700">{file.barcode}</span>
                    </div>
                  </div>
                </div>

                {/* Score & Declarations Tally */}
                <div className="flex items-center gap-4 sm:justify-end">
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">Mandatory Checks</span>
                    <div className="text-xs font-semibold text-zinc-800">
                      {file.declarationsFound}/{file.totalDeclarations} Verified
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">Pre-Print Score</span>
                    <div>
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                        file.readinessScore >= 90
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {file.readinessScore}% {file.readinessScore >= 90 ? 'PASS' : 'FLAGGED'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(file.id)}
                    className="p-1 rounded text-zinc-400 hover:text-rose-600 transition"
                    title="Remove proof"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleBatchApprove}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition"
            >
              <Check className="w-4 h-4" />
              <span>Import Staged Proofs to Audit Catalog</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

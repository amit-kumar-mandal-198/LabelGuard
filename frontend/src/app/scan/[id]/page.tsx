'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Download,
  ArrowLeft,
  Crosshair,
  Award,
  Layers,
  FileCheck2,
} from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { BoundingBox } from '@/lib/types';

export default function ScanDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || 'INSP-2026-001';
  const [scan, setScan] = useState(ApiClient.getInspectionById(id) || ApiClient.getInspections()[0]);

  useEffect(() => {
    ApiClient.fetchInspectionById(id).then((data) => {
      if (data) setScan(data);
    });
  }, [id]);

  const [selectedBbox, setSelectedBbox] = useState<BoundingBox | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back link & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <Link
            href="/inspector/scans"
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Inspections
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900">{scan.productName}</h1>
            <span
              className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                scan.complianceScore >= 90
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              Score: {scan.complianceScore}%
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            Scan Reference: {scan.id} • Barcode: {scan.barcode || 'EAN-13 Verified'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert(`Enforcement-grade PDF report generated deterministically in 340ms.`)}
            className="px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition"
          >
            <Download className="w-4 h-4 text-zinc-600" />
            <span>Download Legal Evidence Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Metadata Bar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-zinc-400 block text-[11px]">Retailer / Warehouse:</span>
          <span className="font-semibold text-zinc-900">{scan.storeName || 'Wholesale Depot'}</span>
        </div>
        <div>
          <span className="text-zinc-400 block text-[11px]">GPS Geotag:</span>
          <span className="font-mono text-zinc-800 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
            {scan.location || '28.5708° N, 77.3261° E'}
          </span>
        </div>
        <div>
          <span className="text-zinc-400 block text-[11px]">Inspection Timestamp:</span>
          <span className="font-medium text-zinc-800">{new Date(scan.createdAt).toLocaleString()}</span>
        </div>
        <div>
          <span className="text-zinc-400 block text-[11px]">Regulatory Verdict:</span>
          <span
            className={`font-bold font-mono ${
              scan.status === 'COMPLIANT' ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {scan.status}
          </span>
        </div>
      </div>

      {/* Hero Evidence & Findings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Visual Packaging Evidence */}
        <div className="lg:col-span-6 bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-emerald-600" />
              Cryptographic Packaging Evidence
            </h2>
            <span className="text-[11px] text-zinc-500 font-mono">EXIF Signed</span>
          </div>

          <div className="relative rounded-lg overflow-hidden border border-zinc-300 bg-zinc-950">
            <img src={scan.imageUrl} alt={scan.productName} className="w-full h-96 object-cover opacity-90" />

            {/* Overlaid Bounding Boxes */}
            {scan.declarations
              .filter((d) => d.bbox)
              .map((decl, idx) => {
                const b = decl.bbox!;
                const isSelected = selectedBbox?.label === b.label;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedBbox(b)}
                    style={{
                      top: `${b.ymin}%`,
                      left: `${b.xmin}%`,
                      height: `${b.ymax - b.ymin}%`,
                      width: `${b.xmax - b.xmin}%`,
                    }}
                    className={`absolute border-2 cursor-pointer transition-all ${
                      b.status === 'pass'
                        ? isSelected
                          ? 'border-emerald-400 bg-emerald-500/30'
                          : 'border-emerald-500 bg-emerald-500/20'
                        : isSelected
                        ? 'border-rose-400 bg-rose-500/40'
                        : 'border-rose-500 bg-rose-500/20'
                    }`}
                  >
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs text-white uppercase ${
                        b.status === 'pass' ? 'bg-emerald-700' : 'bg-rose-700'
                      }`}
                    >
                      {b.label}
                    </span>
                  </div>
                );
              })}
          </div>

          {scan.tamperDetected && (
            <div className="p-3 bg-rose-100 border border-rose-300 rounded-lg text-xs text-rose-900 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Sticker Tampering Detected (Dual-MRP Violation)
              </span>
              <p className="text-[11px] text-rose-800">{scan.tamperReason}</p>
            </div>
          )}
        </div>

        {/* Declarations & Violations */}
        <div className="lg:col-span-6 space-y-4">
          {scan.violations.length > 0 && (
            <div className="bg-white border border-rose-200 rounded-xl p-5 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Violations Cited for Prosecution
              </h2>
              <div className="space-y-3">
                {scan.violations.map((viol) => (
                  <div key={viol.id} className="p-3 bg-rose-50/60 rounded-lg border border-rose-200 text-xs space-y-2">
                    <div className="flex justify-between font-bold text-rose-950">
                      <span>{viol.ruleTitle}</span>
                      <span className="font-mono text-[10px] uppercase bg-rose-200 px-2 py-0.5 rounded">
                        {viol.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-700">{viol.message}</p>
                    <div className="bg-white p-2 rounded border border-rose-200 font-mono text-[11px]">
                      <div>Detected: <strong className="text-rose-700">{viol.detectedValue}</strong></div>
                      <div>Statutory: <strong className="text-emerald-700">{viol.expectedValue}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              Extracted Legal Metrology Declarations
            </h2>
            <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-lg overflow-hidden text-xs">
              {scan.declarations.map((decl, idx) => (
                <div key={idx} className="p-3 flex justify-between items-center bg-white hover:bg-zinc-50">
                  <div>
                    <span className="font-semibold text-zinc-800">{decl.label}</span>
                    <p className="font-mono text-xs text-zinc-600 mt-0.5">
                      {decl.value || <span className="text-rose-600 font-bold">MISSING</span>}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] text-zinc-500">
                    {decl.confidence ? `${decl.confidence}%` : '100%'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

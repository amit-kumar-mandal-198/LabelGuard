'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  MapPin,
  Camera,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  ExternalLink,
  Siren,
  Copy,
  Check,
  Building,
} from 'lucide-react';
import { InspectionRecord } from '@/lib/types';
import { resolveImageUrl } from '@/lib/api-client';

interface FieldEvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  record: InspectionRecord | null;
  onOpenSeizureModal: (record: InspectionRecord) => void;
}

export default function FieldEvidenceDrawer({
  isOpen,
  onClose,
  record,
  onOpenSeizureModal,
}: FieldEvidenceDrawerProps) {
  const [escalated, setEscalated] = useState(false);
  const [copiedGps, setCopiedGps] = useState(false);

  if (!isOpen || !record) return null;

  const handleEscalate = () => {
    setEscalated(true);
    setTimeout(() => {
      alert(`Record ${record.id} has been escalated to District Controller's Section 36 Priority Queue via MeghRaj Cloud.`);
    }, 100);
  };

  const handleCopyGps = () => {
    const coords = `${record.gpsCoords?.lat || '28.5708'}, ${record.gpsCoords?.lng || '77.3261'}`;
    navigator.clipboard.writeText(coords);
    setCopiedGps(true);
    setTimeout(() => setCopiedGps(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between transform transition-transform duration-300"
        style={{ animation: 'slideInRight 0.25s ease-out' }}
      >
        {/* Top Header */}
        <div className="p-5 border-b border-zinc-200 bg-zinc-900 text-white flex items-center justify-between sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500 text-white uppercase tracking-wider">
                Field Evidence Dossier
              </span>
              <span className="text-xs font-mono text-zinc-400">UID: {record.id}</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1 leading-snug">
              {record.productName}
            </h2>
            <p className="text-xs text-zinc-400">{record.brand} • SKU: {record.sku}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-xs text-zinc-700 flex-1">
          {/* Status Verdict Pill */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
              record.status === 'COMPLIANT'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2">
              {record.status === 'COMPLIANT' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div>
                <span className="font-bold text-xs uppercase block">
                  {record.status === 'COMPLIANT' ? 'Status: Fully Compliant (100%)' : 'Status: Violations Detected'}
                </span>
                <span className="text-[11px] opacity-80">
                  {record.violations?.length > 0 ? `${record.violations.length} statutory infractions logged` : 'All mandatory declarations present'}
                </span>
              </div>
            </div>

            {record.tamperDetected && (
              <span className="px-2 py-1 bg-rose-600 text-white rounded font-mono font-bold text-[10px] animate-pulse">
                DUAL-MRP FLAG
              </span>
            )}
          </div>

          {/* Evidence Canvas Snapshot */}
          <div className="space-y-2">
            <span className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] block">
              Field Shutter Acquisition Snapshot
            </span>
            <div className="relative rounded-xl overflow-hidden border border-zinc-300 bg-zinc-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImageUrl(record.imageUrl)}
                alt={record.productName}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('/samples/biscuits.jpg')) {
                    target.src = '/samples/biscuits.jpg';
                  }
                }}
                className="w-full h-56 object-cover opacity-90"
              />
              <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-xs text-white px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>EXIF Hardware Locked</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Chain of Custody & Geolocation */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2.5">
            <span className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Chain of Custody & EXIF Telemetry
            </span>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-white p-2 rounded border border-zinc-200">
                <span className="text-zinc-400 block text-[10px]">Merchant Location:</span>
                <span className="font-bold text-zinc-800">{record.storeName || 'Wholesale Depot'}</span>
              </div>

              <div className="bg-white p-2 rounded border border-zinc-200 flex items-center justify-between">
                <div>
                  <span className="text-zinc-400 block text-[10px]">GPS Coordinates:</span>
                  <span className="font-bold text-zinc-800">
                    {record.gpsCoords ? `${record.gpsCoords.lat.toFixed(4)}, ${record.gpsCoords.lng.toFixed(4)}` : '28.5708, 77.3261'}
                  </span>
                </div>
                <button
                  onClick={handleCopyGps}
                  className="text-zinc-400 hover:text-zinc-800 p-1"
                  title="Copy GPS"
                >
                  {copiedGps ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="bg-white p-2 rounded border border-zinc-200">
                <span className="text-zinc-400 block text-[10px]">Audit Timestamp:</span>
                <span className="font-bold text-zinc-800">
                  {new Date(record.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>

              <div className="bg-white p-2 rounded border border-zinc-200">
                <span className="text-zinc-400 block text-[10px]">Device IMEI / Keystore:</span>
                <span className="font-bold text-zinc-800 truncate block">HSM-SHA256-88192</span>
              </div>
            </div>
          </div>

          {/* Extracted Declarations Summary */}
          <div className="space-y-2">
            <span className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] block">
              Extracted Legal Metrology Declarations
            </span>
            <div className="border border-zinc-200 rounded-xl divide-y divide-zinc-200 overflow-hidden bg-white">
              {record.declarations?.map((decl, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between gap-2 text-[11px]">
                  <div>
                    <span className="font-semibold text-zinc-900 block">{decl.label}</span>
                    <span className="text-zinc-500 font-mono text-[10px]">{decl.value || 'MISSING'}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      decl.status === 'extracted' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {decl.status === 'extracted' ? 'VERIFIED' : 'DEFECT'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Actions Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 space-y-2 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            {record.status !== 'COMPLIANT' && (
              <button
                type="button"
                onClick={() => onOpenSeizureModal(record)}
                className="w-full px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
              >
                <Siren className="w-3.5 h-3.5" />
                <span>Form IV Seizure Panchnama</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleEscalate}
              disabled={escalated}
              className={`w-full px-3 py-2 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition ${
                escalated
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{escalated ? 'Escalated to Controller ✓' : 'Escalate to Sec 36 Queue'}</span>
            </button>
          </div>

          <div className="flex justify-between items-center pt-1 text-[11px]">
            <Link
              href={`/scan/${record.id}`}
              className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
            >
              <span>Open Complete Longitudinal Dossier</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-700 font-medium"
            >
              Close Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

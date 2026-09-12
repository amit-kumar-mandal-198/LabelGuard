'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  MapPin,
  User,
  Phone,
  Clock,
  FileText,
  Download,
  Radio,
  Copy,
  Check,
  Shield,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';

interface Hotspot {
  id: string;
  name: string;
  location: string;
  coords: [number, number];
  type: 'critical' | 'warning' | 'compliant';
  details: string;
  scans: number;
  rate?: string;
}

interface HotspotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  hotspot: Hotspot | null;
}

const SCAN_LOG = [
  {
    id: 'SCN-44819',
    timestamp: '12 Sep 2026, 18:42 IST',
    product: 'Amoxicillin 500mg — Batch #LX-7891',
    status: 'fail' as const,
  },
  {
    id: 'SCN-44817',
    timestamp: '12 Sep 2026, 16:15 IST',
    product: 'Paracetamol IP 650mg — Batch #MK-3320',
    status: 'pass' as const,
  },
  {
    id: 'SCN-44802',
    timestamp: '11 Sep 2026, 21:08 IST',
    product: 'Cetirizine HCl 10mg — Batch #RP-0054',
    status: 'fail' as const,
  },
  {
    id: 'SCN-44798',
    timestamp: '11 Sep 2026, 14:33 IST',
    product: 'Azithromycin 250mg — Batch #GN-6127',
    status: 'pass' as const,
  },
];

const STATUS_CONFIG = {
  critical: {
    label: 'Critical',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    dot: 'bg-red-500',
    icon: AlertTriangle,
  },
  warning: {
    label: 'Warning',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-500',
    icon: AlertTriangle,
  },
  compliant: {
    label: 'Compliant',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
    icon: CheckCircle,
  },
};

export default function HotspotDrawer({ isOpen, onClose, hotspot }: HotspotDrawerProps) {
  const [gpsCopied, setGpsCopied] = useState(false);

  const handleCopyGps = useCallback(() => {
    if (!hotspot) return;
    const text = `${hotspot.coords[0].toFixed(6)}, ${hotspot.coords[1].toFixed(6)}`;
    navigator.clipboard.writeText(text).then(() => {
      setGpsCopied(true);
      setTimeout(() => setGpsCopied(false), 2000);
    });
  }, [hotspot]);

  // Reset copied state when drawer closes or hotspot changes
  useEffect(() => {
    setGpsCopied(false);
  }, [isOpen, hotspot?.id]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!hotspot) return null;

  const status = STATUS_CONFIG[hotspot.type];
  const StatusIcon = status.icon;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Dossier for ${hotspot.name}`}
        className={`fixed right-0 top-0 z-50 h-full w-96 bg-zinc-900 border-l border-zinc-700/60 shadow-2xl shadow-black/40 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* ── HEADER ── */}
        <div className="flex-shrink-0 border-b border-zinc-700/60 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider border ${status.bg} ${status.border} ${status.text}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot} animate-pulse`} />
                  {status.label}
                </span>
              </div>
              <h2 className="text-lg font-bold text-zinc-100 leading-tight truncate">
                {hotspot.name}
              </h2>
              <p className="flex items-center gap-1.5 text-sm text-zinc-400 mt-1">
                <MapPin className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
                <span className="truncate">{hotspot.location}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
          {/* ── COORDINATES ── */}
          <section className="px-5 py-4 border-b border-zinc-800">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2.5">
              GPS Coordinates
            </h3>
            <div className="flex items-center justify-between bg-zinc-800/70 rounded-lg px-3.5 py-2.5 border border-zinc-700/50">
              <code className="text-sm font-mono text-zinc-300">
                {hotspot.coords[0].toFixed(6)}°N,&nbsp;{hotspot.coords[1].toFixed(6)}°E
              </code>
              <button
                onClick={handleCopyGps}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  gpsCopied
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 border border-zinc-600/50'
                }`}
              >
                {gpsCopied ? (
                  <>
                    <Check className="h-3 w-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy GPS
                  </>
                )}
              </button>
            </div>
          </section>

          {/* ── VIOLATION DETAILS ── */}
          <section className="px-5 py-4 border-b border-zinc-800">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2.5">
              Violation Details
            </h3>
            <div
              className={`rounded-lg px-4 py-3 border text-sm leading-relaxed ${
                hotspot.type === 'critical'
                  ? 'bg-red-500/5 border-red-500/20 text-red-200'
                  : hotspot.type === 'warning'
                  ? 'bg-amber-500/5 border-amber-500/20 text-amber-200'
                  : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-200'
              }`}
            >
              <StatusIcon className="h-4 w-4 inline-block mr-1.5 -mt-0.5 opacity-70" />
              {hotspot.details}
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Radio className="h-3.5 w-3.5 text-zinc-500" />
                <span className="font-medium text-zinc-300">{hotspot.scans}</span>
                <span>scans</span>
              </div>
              {hotspot.rate && (
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Shield className="h-3.5 w-3.5 text-zinc-500" />
                  Compliance:&nbsp;
                  <span className="font-medium text-zinc-300">{hotspot.rate}</span>
                </div>
              )}
            </div>
          </section>

          {/* ── ASSIGNED INSPECTOR ── */}
          <section className="px-5 py-4 border-b border-zinc-800">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2.5">
              Assigned Inspector
            </h3>
            <div className="bg-zinc-800/50 rounded-lg border border-zinc-700/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                  <User className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-200">Inspector V. Sharma</p>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">LM-INS-2026-0447</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-2.5 py-0.5 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  On Field
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-700/40 space-y-2">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Phone className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="font-mono text-zinc-300">+91 98XXX-XXXXX</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                  Assigned Tehsil:&nbsp;
                  <span className="text-zinc-300">{hotspot.location.split(',')[0]}</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── RECENT SCAN LOG ── */}
          <section className="px-5 py-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2.5">
              Recent Scan Log
            </h3>
            <div className="space-y-2">
              {SCAN_LOG.map((scan) => (
                <div
                  key={scan.id}
                  className="group bg-zinc-800/40 rounded-lg border border-zinc-700/40 px-3.5 py-3 hover:border-zinc-600/60 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-zinc-500">{scan.id}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ${
                        scan.status === 'fail'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/25'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                      }`}
                    >
                      {scan.status === 'fail' ? 'Fail' : 'Pass'}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-snug">{scan.product}</p>
                  <p className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1.5">
                    <Clock className="h-3 w-3" />
                    {scan.timestamp}
                  </p>
                </div>
              ))}
            </div>
            <button className="mt-3 flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors group">
              View full scan history
              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </section>
        </div>

        {/* ── ACTION BUTTONS (sticky footer) ── */}
        <div className="flex-shrink-0 border-t border-zinc-700/60 bg-zinc-900/95 backdrop-blur px-5 py-4 space-y-2.5">
          <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2.5 px-4 transition-colors shadow-lg shadow-emerald-900/30">
            <Radio className="h-4 w-4" />
            Dispatch Immediate Inspection Team
          </button>
          {hotspot.type !== 'compliant' && (
            <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold py-2.5 px-4 transition-colors shadow-lg shadow-amber-900/30">
              <FileText className="h-4 w-4" />
              Generate Section 36 Notice
            </button>
          )}
          <button className="w-full flex items-center justify-center gap-2 rounded-lg border border-zinc-600 hover:border-zinc-500 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 text-sm font-medium py-2.5 px-4 transition-colors">
            <Download className="h-4 w-4" />
            Export Dossier PDF
          </button>
        </div>
      </aside>
    </>
  );
}

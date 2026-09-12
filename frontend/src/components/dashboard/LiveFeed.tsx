'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Radio,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Pause,
  Play,
  ChevronDown,
  ChevronUp,
  Activity,
  Shield,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface ScanEvent {
  id: string;
  product: string;
  location: string;
  state: string;
  result: 'compliant' | 'violation';
  rule?: string;
  inspectorBadge: string;
  timestamp: number; // epoch ms
}

// ── Simulated Data Pool ─────────────────────────────────────────────────────

const PRODUCTS = [
  'Tata Salt (1 kg)',
  'Amul Butter (500 g)',
  'Fortune Sunflower Oil (1 L)',
  'Maggi Noodles (280 g)',
  'Aashirvaad Atta (5 kg)',
  'Parle-G Biscuits (800 g)',
  'Dabur Honey (500 g)',
  'Britannia Bread (400 g)',
  'Surf Excel Detergent (2 kg)',
  'Haldiram Namkeen (200 g)',
  'MDH Chana Masala (100 g)',
  'Nestle Milk (1 L)',
  'Bournvita (500 g)',
  'Patanjali Ghee (1 L)',
  'Colgate Toothpaste (200 g)',
  'Vim Dishwash Gel (750 ml)',
  'Red Label Tea (500 g)',
  'Saffola Oil (1 L)',
  'Kurkure Snacks (115 g)',
  'Sunfeast Cookies (150 g)',
];

const LOCATIONS: { store: string; state: string }[] = [
  { store: 'Reliance Fresh, Andheri', state: 'Maharashtra' },
  { store: 'Big Bazaar, Connaught Place', state: 'Delhi' },
  { store: 'D-Mart, Whitefield', state: 'Karnataka' },
  { store: 'Spencer\'s, Anna Nagar', state: 'Tamil Nadu' },
  { store: 'More Megastore, Salt Lake', state: 'West Bengal' },
  { store: 'Star Bazaar, SG Highway', state: 'Gujarat' },
  { store: 'Easyday, Aliganj', state: 'Uttar Pradesh' },
  { store: 'Metro Cash & Carry, Zirakpur', state: 'Punjab' },
  { store: 'Vishal Mega Mart, Patna', state: 'Bihar' },
  { store: 'Nilgiris, Kochi', state: 'Kerala' },
  { store: 'Ratnadeep, Banjara Hills', state: 'Telangana' },
  { store: 'Heritage Fresh, Visakhapatnam', state: 'Andhra Pradesh' },
  { store: 'Nature\'s Basket, Baner', state: 'Maharashtra' },
  { store: 'Grofers Hub, Sector 62', state: 'Uttar Pradesh' },
  { store: 'Walmart Neighbourhood, Jalandhar', state: 'Punjab' },
];

const VIOLATIONS = [
  'Rule 6(1) – MRP not declared',
  'Rule 6(2)(a) – Net quantity mismatch',
  'Rule 6(1)(b) – Missing manufacturer address',
  'Rule 6(1)(d) – Expiry date not printed',
  'Rule 6(1)(c) – Month/Year of manufacture absent',
  'Rule 9 – Misleading quantity declaration',
  'Rule 6(2) – Unit of measurement incorrect',
  'Rule 18 – Non-standard package size',
  'Rule 6(1)(e) – Generic/common name missing',
  'Rule 5 – Country of origin undeclared',
];

const BADGE_PREFIXES = ['LMI', 'FSI', 'NMC', 'RCI', 'CED'];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateBadge(): string {
  const prefix = randomPick(BADGE_PREFIXES);
  const num = String(Math.floor(1000 + Math.random() * 9000));
  return `${prefix}-${num}`;
}

function generateEvent(): ScanEvent {
  const isViolation = Math.random() < 0.35; // 35% violation rate
  const location = randomPick(LOCATIONS);
  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    product: randomPick(PRODUCTS),
    location: location.store,
    state: location.state,
    result: isViolation ? 'violation' : 'compliant',
    rule: isViolation ? randomPick(VIOLATIONS) : undefined,
    inspectorBadge: generateBadge(),
    timestamp: Date.now(),
  };
}

// ── Utility ─────────────────────────────────────────────────────────────────

function timeAgo(epoch: number): string {
  const diff = Math.max(0, Math.floor((Date.now() - epoch) / 1000));
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function LiveFeed() {
  const [events, setEvents] = useState<ScanEvent[]>([]);
  const [paused, setPaused] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [scanCount, setScanCount] = useState(142);
  const [, setTick] = useState(0); // force re-render for timeAgo
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Seed initial events
  useEffect(() => {
    const seed: ScanEvent[] = [];
    for (let i = 0; i < 6; i++) {
      const evt = generateEvent();
      evt.timestamp = Date.now() - (i + 1) * 8000; // stagger
      seed.push(evt);
    }
    setEvents(seed);
  }, []);

  // Auto-generate new scan events
  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const evt = generateEvent();
      setEvents((prev) => [evt, ...prev].slice(0, 50)); // cap at 50
      setScanCount((c) => c + 1);
    }, 3000 + Math.random() * 1000); // 3-4s

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused]);

  // Tick for timeAgo refresh
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const togglePause = useCallback(() => setPaused((p) => !p), []);
  const toggleCollapse = useCallback(() => setCollapsed((c) => !c), []);

  return (
    <div className="flex flex-col w-full rounded-xl border border-slate-700/60 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 shadow-2xl overflow-hidden font-[var(--font-geist-sans)]">
      {/* ── Scanline decorative top bar ─────────────────────────── */}
      <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500/0 via-emerald-400 to-emerald-500/0" />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          {/* Pulsing LIVE dot */}
          <div className="relative flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_2px_rgba(16,185,129,0.45)]" />
            </span>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-emerald-400">
              Live
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-200 tracking-wide">
              Field Ingestion Feed
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Scan count */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/60">
            <Activity className="h-3 w-3 text-cyan-400" />
            <span className="text-[10px] font-mono font-bold text-cyan-300">
              {scanCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">scans today</span>
          </div>

          {/* Pause / Resume */}
          <button
            onClick={togglePause}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer border border-slate-600/60 hover:border-slate-500 bg-slate-800 hover:bg-slate-700"
            title={paused ? 'Resume feed' : 'Pause feed'}
          >
            {paused ? (
              <>
                <Play className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Resume</span>
              </>
            ) : (
              <>
                <Pause className="h-3 w-3 text-amber-400" />
                <span className="text-amber-400">Pause</span>
              </>
            )}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={toggleCollapse}
            className="p-1 rounded-md transition-colors cursor-pointer hover:bg-slate-700 text-slate-400 hover:text-slate-200"
            title={collapsed ? 'Expand feed' : 'Collapse feed'}
          >
            {collapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* ── Feed Body ──────────────────────────────────────────── */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          collapsed ? 'max-h-0' : 'max-h-[520px]'
        }`}
      >
        <div
          ref={feedRef}
          className="overflow-y-auto max-h-[520px] px-1 py-1 [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.700)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {/* Subtle grid pattern background */}
          <div className="relative">
            {events.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Shield className="h-8 w-8 mb-2 opacity-40" />
                <span className="text-xs">Awaiting field scan data…</span>
              </div>
            )}

            {events.map((evt, idx) => (
              <div
                key={evt.id}
                className="animate-[slideIn_0.35s_ease-out] mx-1 mb-1"
              >
                <FeedCard event={evt} isNew={idx === 0 && !paused} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer Status Bar ──────────────────────────────────── */}
      {!collapsed && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-950/80 border-t border-slate-800/60">
          <span className="text-[9px] text-slate-600 font-mono tracking-wide uppercase">
            LABELGUARD · NatGrid FieldSync v3.2
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                paused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <span className="text-[9px] text-slate-500 font-mono">
              {paused ? 'PAUSED' : 'STREAMING'}
            </span>
          </div>
        </div>
      )}

      {/* ── Inline keyframes ───────────────────────────────────── */}
      <style>{`
        @keyframes slideIn {
          0% {
            opacity: 0;
            transform: translateY(-12px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

// ── Sub-component: Feed Card ────────────────────────────────────────────────

function FeedCard({
  event,
  isNew,
}: {
  event: ScanEvent;
  isNew: boolean;
}) {
  const isViolation = event.result === 'violation';

  return (
    <div
      className={`relative rounded-lg px-3 py-2.5 transition-all duration-500 border ${
        isNew
          ? isViolation
            ? 'bg-red-950/30 border-red-800/40 shadow-[inset_0_0_20px_rgba(239,68,68,0.06)]'
            : 'bg-emerald-950/20 border-emerald-800/30 shadow-[inset_0_0_20px_rgba(16,185,129,0.06)]'
          : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50'
      }`}
    >
      {/* Top row: status + product + timestamp */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isViolation ? (
            <div className="shrink-0 flex items-center justify-center h-6 w-6 rounded-md bg-red-900/50 border border-red-700/40">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            </div>
          ) : (
            <div className="shrink-0 flex items-center justify-center h-6 w-6 rounded-md bg-emerald-900/40 border border-emerald-700/30">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
            </div>
          )}

          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-100 truncate leading-tight">
              {event.product}
            </p>
            {isViolation && event.rule && (
              <p className="text-[9px] text-red-400/90 font-mono truncate mt-0.5 leading-tight">
                {event.rule}
              </p>
            )}
            {!isViolation && (
              <p className="text-[9px] text-emerald-400/80 font-medium mt-0.5 leading-tight">
                All declarations valid
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1 text-slate-500">
          <Clock className="h-2.5 w-2.5" />
          <span className="text-[9px] font-mono whitespace-nowrap">
            {timeAgo(event.timestamp)}
          </span>
        </div>
      </div>

      {/* Bottom row: location + inspector */}
      <div className="flex items-center justify-between mt-1.5 pl-8">
        <span className="text-[9px] text-slate-400 truncate">
          {event.location}
          <span className="text-slate-600"> · </span>
          <span className="text-slate-500">{event.state}</span>
        </span>

        <div className="shrink-0 flex items-center gap-1 ml-2">
          <User className="h-2.5 w-2.5 text-slate-600" />
          <span className="text-[9px] font-mono text-slate-500">
            {event.inspectorBadge}
          </span>
        </div>
      </div>
    </div>
  );
}

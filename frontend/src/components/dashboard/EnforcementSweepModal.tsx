'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Radio,
  Target,
  Users,
  Zap,
  CheckCircle,
  MapPin,
  ShieldAlert,
  Send,
  Clock,
  AlertTriangle,
  Siren,
} from 'lucide-react';

interface EnforcementSweepModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Zone {
  id: string;
  name: string;
  district: string;
}

interface DefectType {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  selectedBg: string;
}

const ZONES: Zone[] = [
  { id: 'z1', name: 'Kanpur Railway Market Corridor', district: 'Kanpur Nagar' },
  { id: 'z2', name: 'Sector 18 Noida Hub', district: 'Gautam Buddh Nagar' },
  { id: 'z3', name: 'Chandni Chowk Old Delhi', district: 'Central Delhi' },
  { id: 'z4', name: 'Pari Chowk Greater Noida', district: 'Gautam Buddh Nagar' },
  { id: 'z5', name: 'Sahibabad Industrial Zone', district: 'Ghaziabad' },
  { id: 'z6', name: 'Connaught Place Central Delhi', district: 'New Delhi' },
  { id: 'z7', name: 'Meerut Sadar Wholesale', district: 'Meerut' },
  { id: 'z8', name: 'Aminabad Lucknow', district: 'Lucknow' },
];

const DEFECT_TYPES: DefectType[] = [
  {
    id: 'd1',
    label: 'Dual-MRP Crackdown',
    color: 'text-red-300',
    bgColor: 'bg-red-950/40',
    borderColor: 'border-red-800/50',
    selectedBg: 'bg-red-900/70',
  },
  {
    id: 'd2',
    label: 'Font Height & Legibility',
    color: 'text-amber-300',
    bgColor: 'bg-amber-950/40',
    borderColor: 'border-amber-800/50',
    selectedBg: 'bg-amber-900/70',
  },
  {
    id: 'd3',
    label: 'Missing Expiry/Date',
    color: 'text-orange-300',
    bgColor: 'bg-orange-950/40',
    borderColor: 'border-orange-800/50',
    selectedBg: 'bg-orange-900/70',
  },
  {
    id: 'd4',
    label: 'Net Quantity Shortfall',
    color: 'text-cyan-300',
    bgColor: 'bg-cyan-950/40',
    borderColor: 'border-cyan-800/50',
    selectedBg: 'bg-cyan-900/70',
  },
  {
    id: 'd5',
    label: 'Tampered Labels',
    color: 'text-rose-300',
    bgColor: 'bg-rose-950/40',
    borderColor: 'border-rose-800/50',
    selectedBg: 'bg-rose-900/70',
  },
  {
    id: 'd6',
    label: 'Country of Origin',
    color: 'text-emerald-300',
    bgColor: 'bg-emerald-950/40',
    borderColor: 'border-emerald-800/50',
    selectedBg: 'bg-emerald-900/70',
  },
];

const OFFICER_NAMES = [
  'Insp. R. K. Sharma',
  'Insp. Priya Verma',
  'SI Ankit Tiwari',
  'Insp. Meena Kumari',
  'SI Rakesh Yadav',
  'Insp. Deepak Gupta',
  'SI Kavita Singh',
  'Insp. Mohd. Irfan',
  'SI Sunita Devi',
  'Insp. Vikas Chauhan',
  'SI Neha Pandey',
  'Insp. Suresh Babu',
  'SI Amit Mishra',
  'Insp. Pooja Rawat',
  'SI Manoj Kumar',
  'Insp. Ritu Agarwal',
  'SI Sanjay Patel',
  'Insp. Divya Nair',
];

type PriorityLevel = 'standard' | 'urgent' | 'emergency';

export default function EnforcementSweepModal({
  isOpen,
  onClose,
}: EnforcementSweepModalProps) {
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [selectedDefects, setSelectedDefects] = useState<string[]>([]);
  const [officerCount, setOfficerCount] = useState(6);
  const [priority, setPriority] = useState<PriorityLevel>('standard');
  const [isDispatched, setIsDispatched] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Slide-up animation on open
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setShowContent(true), 50);
      return () => clearTimeout(t);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  const resetState = useCallback(() => {
    setSelectedZones([]);
    setSelectedDefects([]);
    setOfficerCount(6);
    setPriority('standard');
    setIsDispatched(false);
    setIsAnimating(false);
  }, []);

  const handleClose = useCallback(() => {
    setShowContent(false);
    setTimeout(() => {
      resetState();
      onClose();
    }, 300);
  }, [onClose, resetState]);

  const toggleZone = (id: string) => {
    setSelectedZones((prev) =>
      prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id]
    );
  };

  const toggleDefect = (id: string) => {
    setSelectedDefects((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleBroadcast = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      setIsDispatched(true);
    }, 1800);
  };

  const canBroadcast =
    selectedZones.length > 0 && selectedDefects.length > 0 && officerCount > 0;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Initiate Tehsil Enforcement Sweep"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          showContent ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Modal Panel */}
      <div
        className={`relative w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/60 shadow-2xl shadow-black/50 transition-all duration-300 ease-out ${
          showContent
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-12 opacity-0 scale-95'
        }`}
      >
        {/* Accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 rounded-t-2xl" />

        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-950/60 border border-red-800/40">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                🚨 Initiate Tehsil Enforcement Sweep
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                District Controller — Tactical Dispatch Console
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Dispatched Confirmation State ─── */}
        {isDispatched ? (
          <div className="px-6 py-16 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
              <div className="relative p-5 rounded-full bg-green-900/40 border-2 border-green-500/60">
                <CheckCircle className="w-14 h-14 text-green-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-green-300">
                Directives Dispatched Successfully
              </h3>
              <p className="text-slate-300 max-w-lg mx-auto leading-relaxed">
                Directives pushed to{' '}
                <span className="font-bold text-amber-300">{officerCount} inspector devices</span>{' '}
                via <span className="font-semibold text-cyan-300">MeghRaj Cloud</span>
              </p>
            </div>

            {/* Summary */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-xl">
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Zones Targeted</p>
                <p className="text-2xl font-bold text-white mt-1">{selectedZones.length}</p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Defect Checks</p>
                <p className="text-2xl font-bold text-white mt-1">{selectedDefects.length}</p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Priority</p>
                <p className="text-2xl font-bold text-white mt-1 capitalize">
                  {priority === 'standard'
                    ? 'Standard'
                    : priority === 'urgent'
                      ? 'Urgent'
                      : 'Emergency'}
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="mt-6 px-8 py-3 rounded-xl bg-slate-700/60 hover:bg-slate-600/60 text-white font-semibold transition-colors border border-slate-600/50"
            >
              Close Console
            </button>
          </div>
        ) : (
          /* ─── Main Form ─── */
          <div className="px-6 py-5 space-y-7">
            {/* ── 1. Target Zone Selection ── */}
            <section>
              <SectionHeader
                icon={<MapPin className="w-4 h-4 text-amber-400" />}
                title="TARGET ZONE SELECTION"
                subtitle={`${selectedZones.length} zone${selectedZones.length !== 1 ? 's' : ''} selected`}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                {ZONES.map((zone) => {
                  const selected = selectedZones.includes(zone.id);
                  return (
                    <button
                      key={zone.id}
                      onClick={() => toggleZone(zone.id)}
                      className={`relative text-left p-3.5 rounded-xl border transition-all duration-200 group ${
                        selected
                          ? 'bg-amber-950/40 border-amber-600/60 ring-1 ring-amber-500/30 shadow-lg shadow-amber-900/20'
                          : 'bg-slate-800/40 border-slate-700/40 hover:border-slate-600/60 hover:bg-slate-800/70'
                      }`}
                    >
                      {/* Checkmark */}
                      <div
                        className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
                          selected
                            ? 'bg-amber-500 scale-100'
                            : 'bg-slate-700/60 scale-90 group-hover:scale-100'
                        }`}
                      >
                        {selected && <CheckCircle className="w-3.5 h-3.5 text-black" />}
                      </div>
                      <p
                        className={`text-sm font-semibold leading-snug pr-6 ${
                          selected ? 'text-amber-200' : 'text-slate-200'
                        }`}
                      >
                        {zone.name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">{zone.district}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── 2. Defect Type Targeting ── */}
            <section>
              <SectionHeader
                icon={<Target className="w-4 h-4 text-red-400" />}
                title="DEFECT TYPE TARGETING"
                subtitle={`${selectedDefects.length} type${selectedDefects.length !== 1 ? 's' : ''} active`}
              />
              <div className="flex flex-wrap gap-2.5 mt-3">
                {DEFECT_TYPES.map((defect) => {
                  const selected = selectedDefects.includes(defect.id);
                  return (
                    <button
                      key={defect.id}
                      onClick={() => toggleDefect(defect.id)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${
                        selected
                          ? `${defect.selectedBg} ${defect.borderColor} ${defect.color} ring-1 ring-white/10 shadow-lg`
                          : `${defect.bgColor} ${defect.borderColor} ${defect.color} opacity-60 hover:opacity-100`
                      }`}
                    >
                      {selected && <CheckCircle className="w-3.5 h-3.5" />}
                      {defect.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── 3. Officer Allocation ── */}
            <section>
              <SectionHeader
                icon={<Users className="w-4 h-4 text-cyan-400" />}
                title="OFFICER ALLOCATION"
                subtitle="Available Officers: 18 / 20"
              />
              <div className="mt-3 bg-slate-800/40 border border-slate-700/40 rounded-xl p-5">
                {/* Slider Row */}
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500 font-mono w-6 text-right">1</span>
                  <input
                    type="range"
                    min={1}
                    max={18}
                    value={officerCount}
                    onChange={(e) => setOfficerCount(Number(e.target.value))}
                    className="flex-1 h-2 rounded-full cursor-pointer bg-slate-700 accent-cyan-500"
                  />
                  <span className="text-xs text-slate-500 font-mono w-6">18</span>
                  <div className="ml-2 px-3 py-1.5 rounded-lg bg-cyan-950/50 border border-cyan-800/40">
                    <span className="text-lg font-bold text-cyan-300 font-mono">
                      {officerCount}
                    </span>
                  </div>
                </div>

                {/* Officer List */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {OFFICER_NAMES.slice(0, officerCount).map((name, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/40 border border-slate-600/30"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                      <span className="text-[11px] text-slate-300 truncate">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── 4. Priority Level ── */}
            <section>
              <SectionHeader
                icon={<Zap className="w-4 h-4 text-yellow-400" />}
                title="PRIORITY LEVEL"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <PriorityButton
                  selected={priority === 'standard'}
                  onClick={() => setPriority('standard')}
                  icon={<Clock className="w-5 h-5" />}
                  label="Standard"
                  time="48h"
                  colorClasses={{
                    ring: 'ring-slate-500/30',
                    bg: 'bg-slate-800/60',
                    selectedBg: 'bg-slate-700/80',
                    border: 'border-slate-600/50',
                    selectedBorder: 'border-slate-400/60',
                    text: 'text-slate-200',
                    icon: 'text-slate-400',
                  }}
                />
                <PriorityButton
                  selected={priority === 'urgent'}
                  onClick={() => setPriority('urgent')}
                  icon={<AlertTriangle className="w-5 h-5" />}
                  label="Urgent"
                  time="24h"
                  colorClasses={{
                    ring: 'ring-amber-500/30',
                    bg: 'bg-amber-950/20',
                    selectedBg: 'bg-amber-950/50',
                    border: 'border-amber-800/40',
                    selectedBorder: 'border-amber-500/60',
                    text: 'text-amber-200',
                    icon: 'text-amber-400',
                  }}
                />
                <PriorityButton
                  selected={priority === 'emergency'}
                  onClick={() => setPriority('emergency')}
                  icon={<Siren className="w-5 h-5" />}
                  label="Emergency"
                  time="Immediate"
                  colorClasses={{
                    ring: 'ring-red-500/40',
                    bg: 'bg-red-950/20',
                    selectedBg: 'bg-red-950/50',
                    border: 'border-red-800/40',
                    selectedBorder: 'border-red-500/60',
                    text: 'text-red-200',
                    icon: 'text-red-400',
                  }}
                />
              </div>
            </section>

            {/* ── 5. Action Button ── */}
            <section className="pt-2 pb-2">
              <button
                onClick={handleBroadcast}
                disabled={!canBroadcast || isAnimating}
                className={`w-full relative overflow-hidden flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-bold uppercase tracking-wider transition-all duration-300 ${
                  isAnimating
                    ? 'bg-amber-700/60 border-amber-500/60 text-amber-200 cursor-wait'
                    : canBroadcast
                      ? 'bg-gradient-to-r from-red-700 via-red-600 to-amber-600 hover:from-red-600 hover:via-red-500 hover:to-amber-500 text-white border border-red-500/40 shadow-lg shadow-red-900/30 hover:shadow-red-800/40 active:scale-[0.98]'
                      : 'bg-slate-800/50 border border-slate-700/40 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isAnimating ? (
                  <>
                    <Radio className="w-5 h-5 animate-pulse" />
                    <span className="animate-pulse">Broadcasting Directives…</span>
                    {/* Sweep animation bar */}
                    <div className="absolute bottom-0 left-0 h-1 bg-amber-400/80 animate-[sweep_1.8s_ease-in-out]" />
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Broadcast Field Directives</span>
                  </>
                )}
              </button>
              {!canBroadcast && !isAnimating && (
                <p className="text-center text-xs text-slate-500 mt-2">
                  Select at least one zone and one defect type to proceed
                </p>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Keyframe for sweep bar */}
      <style>{`
        @keyframes sweep {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

/* ─── Sub-components ─── */

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="p-1.5 rounded-md bg-slate-800/60 border border-slate-700/40">{icon}</div>
      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">{title}</h3>
      {subtitle && (
        <>
          <span className="text-slate-700">•</span>
          <span className="text-xs text-slate-500">{subtitle}</span>
        </>
      )}
    </div>
  );
}

interface PriorityButtonProps {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  time: string;
  colorClasses: {
    ring: string;
    bg: string;
    selectedBg: string;
    border: string;
    selectedBorder: string;
    text: string;
    icon: string;
  };
}

function PriorityButton({
  selected,
  onClick,
  icon,
  label,
  time,
  colorClasses,
}: PriorityButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${
        selected
          ? `${colorClasses.selectedBg} ${colorClasses.selectedBorder} ring-1 ${colorClasses.ring} shadow-lg`
          : `${colorClasses.bg} ${colorClasses.border} hover:brightness-110`
      }`}
    >
      {/* Radio dot */}
      <div
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          selected ? colorClasses.selectedBorder : 'border-slate-600'
        }`}
      >
        {selected && (
          <div
            className={`w-2 h-2 rounded-full ${colorClasses.icon.replace('text-', 'bg-')}`}
          />
        )}
      </div>
      <div className={`${colorClasses.icon}`}>{icon}</div>
      <div className="text-left">
        <p className={`text-sm font-semibold ${colorClasses.text}`}>{label}</p>
        <p className="text-[11px] text-slate-500">{time}</p>
      </div>
    </button>
  );
}

'use client';

import React, { useState } from 'react';
import { 
  Radio, 
  MapPin, 
  BatteryCharging, 
  Wifi, 
  UserCheck, 
  PhoneCall, 
  ShieldCheck, 
  Compass,
  AlertCircle
} from 'lucide-react';

interface PatrolOfficer {
  id: string;
  name: string;
  badge: string;
  beatZone: string;
  coords: string;
  battery: number;
  status: 'active_sweep' | 'investigating' | 'transit';
  currentStore: string;
  scansToday: number;
  phone: string;
}

const PATROL_SQUAD: PatrolOfficer[] = [
  {
    id: 'off-1',
    name: 'Insp. Rajesh Sharma',
    badge: 'LM-NCR-8492',
    beatZone: 'Sector 18 Commercial & Atta Market',
    coords: '28.5708° N, 77.3261° E',
    battery: 92,
    status: 'investigating',
    currentStore: 'Reliance Smart Superstore (Aisle 4B)',
    scansToday: 24,
    phone: '+91 98110 44219'
  },
  {
    id: 'off-2',
    name: 'Insp. V. Sharma',
    badge: 'LM-OFF-4892',
    beatZone: 'Botanical Garden & Sector 37 Hub',
    coords: '28.5645° N, 77.3342° E',
    battery: 84,
    status: 'active_sweep',
    currentStore: 'Modern Bazaar, Sector 37',
    scansToday: 18,
    phone: '+91 98711 20045'
  },
  {
    id: 'off-3',
    name: 'Insp. P. Verma',
    badge: 'LM-KNP-1049',
    beatZone: 'Kanpur Railway & Wholesale Depot',
    coords: '26.4499° N, 80.3319° E',
    battery: 68,
    status: 'transit',
    currentStore: 'In transit to Kalyan Provision Stores',
    scansToday: 31,
    phone: '+91 94150 99812'
  }
];

export default function PatrolRadarOverlay() {
  const [activeOfficer, setActiveOfficer] = useState<PatrolOfficer | null>(null);
  const [pingedId, setPingedId] = useState<string | null>(null);

  const handlePing = (id: string, name: string) => {
    setPingedId(id);
    setTimeout(() => {
      alert(`Radio directive dispatched to ${name} via MeghRaj telemetry channel.`);
      setPingedId(null);
    }, 800);
  };

  return (
    <div className="bg-zinc-950 text-white border border-zinc-800 rounded-xl p-4 shadow-md space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
            Live Inspector Field Radar (MeghRaj Real-Time Patrol Telemetry)
          </h4>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          3 Field Patrols Live • Encrypted 256-Bit Link
        </span>
      </div>

      {/* Patrol Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {PATROL_SQUAD.map((off) => (
          <div
            key={off.id}
            className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-2 hover:border-zinc-700 transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="font-bold text-white text-xs">{off.name}</span>
                <p className="text-[10px] font-mono text-zinc-400">{off.badge}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                off.status === 'investigating' 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                  : off.status === 'active_sweep'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {off.status.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-1 text-[11px] text-zinc-400">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{off.currentStore}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-zinc-800">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-zinc-500" /> {off.coords}
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <BatteryCharging className="w-3 h-3" /> {off.battery}%
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-zinc-800/80">
              <span className="text-[10px] text-zinc-400 font-mono">
                {off.scansToday} audits logged
              </span>
              <button
                onClick={() => handlePing(off.id, off.name)}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 rounded text-[10px] font-semibold transition flex items-center gap-1"
              >
                <Radio className="w-3 h-3" />
                <span>{pingedId === off.id ? 'Pinging...' : 'Radio Direct'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  ArrowLeft, 
  Search, 
  Filter, 
  Siren, 
  FileText, 
  Scale, 
  AlertOctagon, 
  Building2, 
  Send,
  Eye,
  UserX,
  Sparkles,
  Layers
} from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { RepeatOffender } from '@/lib/types';
import OffenderDossierDrawer from '@/components/offenders/OffenderDossierDrawer';
import RaidDispatchModal from '@/components/offenders/RaidDispatchModal';

export default function RepeatOffendersPage() {
  const offenders = ApiClient.getRepeatOffenders();
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'tier1' | 'tier2' | 'tier3'>('all');
  
  // Modals & Drawer state
  const [selectedOffender, setSelectedOffender] = useState<RepeatOffender | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isRaidModalOpen, setIsRaidModalOpen] = useState(false);
  const [raidTarget, setRaidTarget] = useState<RepeatOffender | null>(null);

  const filteredOffenders = useMemo(() => {
    return offenders.filter(off => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!off.brand.toLowerCase().includes(q) && !off.companyName.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (tierFilter === 'tier3' && off.riskScore < 90) return false;
      if (tierFilter === 'tier2' && (off.riskScore < 75 || off.riskScore >= 90)) return false;
      if (tierFilter === 'tier1' && off.riskScore >= 75) return false;
      return true;
    });
  }, [offenders, searchQuery, tierFilter]);

  const handleOpenDossier = (off: RepeatOffender) => {
    setSelectedOffender(off);
    setIsDossierOpen(true);
  };

  const handleOpenRaid = (off: RepeatOffender) => {
    setRaidTarget(off);
    setIsRaidModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <Link
            href="/dashboard/district"
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 flex items-center gap-1 mb-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to District Controller Hub
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Section 36(2) Special Registry
            </span>
            <span className="text-xs text-zinc-500 font-mono">Automated Recidivist Pattern Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight mt-1">
            Repeat Offender Escalation & Prosecution Engine
          </h1>
          <p className="text-xs text-zinc-500 max-w-2xl">
            Systematic pattern tracking under Section 36(2) and corporate officer liability enforcement under Section 49 of the Legal Metrology Act, 2009.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenRaid(offenders[0])}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Siren className="w-4 h-4" />
            <span>Issue Emergency Raid Directive</span>
          </button>
        </div>
      </div>

      {/* KPI Severity Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-zinc-500 font-medium">Recidivist Entities Tracked</span>
          <p className="text-2xl font-extrabold text-zinc-900 font-mono">{offenders.length} Brands</p>
          <p className="text-[11px] text-zinc-400">Across 3 regional manufacturing hubs</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-xs space-y-1">
          <span className="text-amber-800 font-medium">Tier 1: Compounding Stage</span>
          <p className="text-2xl font-extrabold text-amber-600 font-mono">1 Brand</p>
          <p className="text-[11px] text-amber-700 font-medium">15-day statutory response clock</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-xs space-y-1">
          <span className="text-rose-800 font-medium">Tier 2: Court Prosecution</span>
          <p className="text-2xl font-extrabold text-rose-600 font-mono">1 Brand</p>
          <p className="text-[11px] text-rose-700 font-medium">Sec. 36(2) charges drafted</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-purple-200 shadow-xs space-y-1">
          <span className="text-purple-800 font-medium">Tier 3: Factory Sealing Order</span>
          <p className="text-2xl font-extrabold text-purple-700 font-mono">1 Brand</p>
          <p className="text-[11px] text-purple-700 font-medium">Under Review by State Controller</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recidivist brand or parent company..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-rose-500 focus:outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Escalation Tier:
          </span>
          <button
            onClick={() => setTierFilter('all')}
            className={`px-2.5 py-1 rounded-md transition font-medium ${
              tierFilter === 'all' ? 'bg-zinc-900 text-white font-semibold' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTierFilter('tier3')}
            className={`px-2.5 py-1 rounded-md transition font-medium ${
              tierFilter === 'tier3' ? 'bg-purple-700 text-white font-semibold' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
            }`}
          >
            Tier 3 (Sealing)
          </button>
          <button
            onClick={() => setTierFilter('tier2')}
            className={`px-2.5 py-1 rounded-md transition font-medium ${
              tierFilter === 'tier2' ? 'bg-rose-600 text-white font-semibold' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Tier 2 (Prosecution)
          </button>
          <button
            onClick={() => setTierFilter('tier1')}
            className={`px-2.5 py-1 rounded-md transition font-medium ${
              tierFilter === 'tier1' ? 'bg-amber-600 text-white font-semibold' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Tier 1 (Compounding)
          </button>
        </div>
      </div>

      {/* Main Offenders Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-6">Brand & Corporate Packer</th>
                <th className="py-3.5 px-4">Audits</th>
                <th className="py-3.5 px-4">Violations</th>
                <th className="py-3.5 px-4">Critical Fails</th>
                <th className="py-3.5 px-4">Risk Tier & Legal Status</th>
                <th className="py-3.5 px-4">Chronic Non-Compliance</th>
                <th className="py-3.5 px-6 text-right">Enforcement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-700">
              {filteredOffenders.map((off, idx) => {
                const tier = off.riskScore >= 90 ? 'Tier 3: Factory Sealing Directive' : off.riskScore >= 75 ? 'Tier 2: Magistrate Court Prosecution' : 'Tier 1: Compounding Fine Notice';
                const tierColor = off.riskScore >= 90 ? 'bg-purple-100 text-purple-800 border-purple-300' : off.riskScore >= 75 ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-amber-100 text-amber-800 border-amber-300';

                return (
                  <tr key={idx} className="hover:bg-rose-50/30 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-zinc-900 text-xs sm:text-sm">{off.brand}</div>
                      <div className="text-[11px] text-zinc-500">{off.companyName}</div>
                      <div className="text-[10px] font-mono text-purple-700 mt-0.5">Sec 49 Notice Active</div>
                    </td>

                    <td className="py-4 px-4 font-mono font-semibold">{off.totalScans}</td>

                    <td className="py-4 px-4 font-mono font-bold text-rose-600">
                      {off.violationCount}
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-rose-800">
                      {off.criticalCount}
                    </td>

                    <td className="py-4 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${tierColor}`}>
                        {tier}
                      </span>
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Score: {off.riskScore}/100</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-medium text-zinc-900">{off.topViolationRule}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">Last detected: {off.lastViolationDate}</div>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDossier(off)}
                          className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded font-semibold text-[11px] transition flex items-center gap-1"
                          title="View Corporate Dossier & KMP Liability"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Dossier</span>
                        </button>
                        <button
                          onClick={() => handleOpenRaid(off)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[11px] transition flex items-center gap-1 shadow-2xs"
                        >
                          <Siren className="w-3 h-3" />
                          <span>Raid Squad</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Offender Dossier Slide-Out Drawer */}
      <OffenderDossierDrawer
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        offender={selectedOffender}
        onDispatchRaid={(off) => handleOpenRaid(off)}
      />

      {/* Raid Dispatch Modal */}
      <RaidDispatchModal
        isOpen={isRaidModalOpen}
        onClose={() => setIsRaidModalOpen(false)}
        offender={raidTarget}
      />

    </div>
  );
}

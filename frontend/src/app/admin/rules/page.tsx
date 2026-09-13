'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  PlusCircle,
  Clock,
  ShieldCheck,
  CheckCircle,
  FileCode,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { CodifiedRule } from '@/lib/types';

export default function CodifiedRulesManager() {
  const [rules, setRules] = useState<CodifiedRule[]>(ApiClient.getRules());

  useEffect(() => {
    ApiClient.fetchRules().then(setRules);
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);

  // New Rule Form
  const [ruleCode, setRuleCode] = useState('LG-ECOMM');
  const [ruleNumber, setRuleNumber] = useState('Rule 10(1)');
  const [title, setTitle] = useState('E-Commerce Mandatory Display of Declarations');
  const [requirement, setRequirement] = useState('Digital marketplace must display MRP, Net Quantity, Expiry, and MFR prior to purchase.');
  const [severity, setSeverity] = useState<'minor' | 'major' | 'critical'>('critical');
  const [effectiveFrom, setEffectiveFrom] = useState('2026-10-01');

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    const newRule: CodifiedRule = {
      id: rules.length + 1,
      ruleCode,
      ruleNumber,
      title,
      requirement,
      severity,
      version: 1,
      effectiveFrom,
      status: 'active',
      jurisdiction: 'India (Central)',
      checksCount: 3,
    };
    setRules([...rules, newRule]);
    setShowAddModal(false);
    alert(`Rule amendment ${ruleCode} codified successfully into regulatory repository with effective date ${effectiveFrom}.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300">
              Regulatory Core Engine
            </span>
            <span className="text-xs text-zinc-500 font-mono">Central Metrology Database</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mt-1">Codified Rule Engine Manager</h1>
          <p className="text-xs text-zinc-500">
            Rules are stored as versioned database entities with effective dates—never hardcoded in application logic.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Codify New Rule / Amendment</span>
        </button>
      </div>

      {/* Rules Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-x-auto shadow-xs">
        <table className="w-full min-w-[700px] text-left text-xs">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase">
              <th className="py-3 px-6">Rule Code & Statutory Number</th>
              <th className="py-3 px-4">Title & Regulatory Requirement</th>
              <th className="py-3 px-4">Severity Tier</th>
              <th className="py-3 px-4">Version</th>
              <th className="py-3 px-4">Effective Date</th>
              <th className="py-3 px-4">Jurisdiction</th>
              <th className="py-3 px-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-zinc-700">
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-zinc-50 transition">
                <td className="py-4 px-6">
                  <div className="font-mono font-bold text-purple-900">{rule.ruleCode}</div>
                  <div className="text-[11px] text-zinc-500 font-semibold">{rule.ruleNumber}</div>
                </td>
                <td className="py-4 px-4 max-w-md">
                  <div className="font-bold text-zinc-900">{rule.title}</div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">{rule.requirement}</p>
                </td>
                <td className="py-4 px-4">
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                      rule.severity === 'critical'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : rule.severity === 'major'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-zinc-100 text-zinc-800'
                    }`}
                  >
                    {rule.severity}
                  </span>
                </td>
                <td className="py-4 px-4 font-mono font-semibold">v{rule.version}.0</td>
                <td className="py-4 px-4 font-mono text-[11px] text-zinc-600">{rule.effectiveFrom}</td>
                <td className="py-4 px-4 text-zinc-600">{rule.jurisdiction}</td>
                <td className="py-4 px-6 text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle className="w-3 h-3" /> ACTIVE
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Amendment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-xl border border-zinc-200 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <h2 className="text-base font-bold text-zinc-900">Codify Legal Metrology Amendment</h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-700 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRule} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Rule Code</label>
                  <input
                    type="text"
                    required
                    value={ruleCode}
                    onChange={(e) => setRuleCode(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-300 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Gazette Section / Rule No.</label>
                  <input
                    type="text"
                    required
                    value={ruleNumber}
                    onChange={(e) => setRuleNumber(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-300 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Rule Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 rounded-lg border border-zinc-300 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Legal Requirement Text</label>
                <textarea
                  rows={3}
                  required
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  className="w-full p-2 rounded-lg border border-zinc-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Severity Tier</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-zinc-300 font-medium"
                  >
                    <option value="critical">Critical (Section 36 Compounding)</option>
                    <option value="major">Major (Notice & SMS Alert)</option>
                    <option value="minor">Minor (Log report only)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Gazette Effective Date</label>
                  <input
                    type="date"
                    required
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-300 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Commit to Rule Engine DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { 
  ShoppingCart, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  AlertOctagon,
  ArrowRight,
  Check
} from 'lucide-react';

interface EcommListing {
  id: string;
  sku: string;
  productName: string;
  platform: 'Blinkit' | 'Zepto' | 'Amazon India' | 'Instamart';
  platformLogoText: string;
  onPackMrp: number;
  listedPrice: number;
  uspDeclared: boolean;
  uspValue: string;
  status: 'synced' | 'overpriced' | 'missing_usp';
  lastSynced: string;
}

const INITIAL_ECOMM_LISTINGS: EcommListing[] = [
  {
    id: 'ec-1',
    sku: 'NR-DIG-500G',
    productName: 'NutriRich Digestive Biscuits (500g)',
    platform: 'Blinkit',
    platformLogoText: '🟡 Blinkit Quick',
    onPackMrp: 145.0,
    listedPrice: 145.0,
    uspDeclared: true,
    uspValue: '₹0.29 / g',
    status: 'synced',
    lastSynced: '10 mins ago'
  },
  {
    id: 'ec-2',
    sku: 'CW-KC-75G',
    productName: 'CrispWave Kettle Cooked Chips (75g)',
    platform: 'Zepto',
    platformLogoText: '🟣 Zepto 10m',
    onPackMrp: 35.0,
    listedPrice: 50.0,
    uspDeclared: false,
    uspValue: 'Missing USP',
    status: 'overpriced',
    lastSynced: '18 mins ago'
  },
  {
    id: 'ec-3',
    sku: 'GH-AHO-100ML',
    productName: 'GlowHerb Ayurvedic Hair Oil (100ml)',
    platform: 'Instamart',
    platformLogoText: '🟠 Swiggy Instamart',
    onPackMrp: 180.0,
    listedPrice: 180.0,
    uspDeclared: true,
    uspValue: '₹1.80 / ml',
    status: 'synced',
    lastSynced: '25 mins ago'
  },
  {
    id: 'ec-4',
    sku: 'FM-HNY-250G',
    productName: 'FreshMeadow Farm Pure Honey (250g)',
    platform: 'Amazon India',
    platformLogoText: '📦 Amazon Pantry',
    onPackMrp: 210.0,
    listedPrice: 225.0,
    uspDeclared: false,
    uspValue: 'Missing USP',
    status: 'overpriced',
    lastSynced: '35 mins ago'
  }
];

export default function EcommSyncGuard() {
  const [listings, setListings] = useState<EcommListing[]>(INITIAL_ECOMM_LISTINGS);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSyncPrice = (id: string) => {
    setSyncingId(id);
    setTimeout(() => {
      setListings(prev => prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            listedPrice: item.onPackMrp,
            uspDeclared: true,
            uspValue: `₹${(item.onPackMrp / 100).toFixed(2)} / unit`,
            status: 'synced',
            lastSynced: 'Just now (Auto-Corrected)'
          };
        }
        return item;
      }));
      setSyncingId(null);
    }, 1000);
  };

  const flaggedCount = listings.filter(l => l.status !== 'synced').length;

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-purple-600" /> Quick-Commerce Price Guard
            </span>
            <span className="text-xs text-zinc-500 font-mono">Blinkit • Zepto • Instamart • Amazon</span>
          </div>
          <h2 className="text-lg font-bold text-zinc-900 mt-1">
            E-Commerce Dual-Pricing & Unit Sale Price (USP) Monitor
          </h2>
          <p className="text-xs text-zinc-500">
            Continuously audits live catalog pricing on quick-commerce apps against physical on-pack declared MRP to prevent Section 36(1) overcharging penalties.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {flaggedCount > 0 ? (
            <span className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <span>{flaggedCount} Pricing Discrepancies</span>
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>All App Listings 100% Synced</span>
            </span>
          )}
        </div>
      </div>

      {/* Listings Table */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden text-xs">
        <table className="w-full min-w-[650px] text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-5">Platform & Product SKU</th>
              <th className="py-3 px-4">On-Pack MRP</th>
              <th className="py-3 px-4">Live App Price</th>
              <th className="py-3 px-4">Unit Sale Price (USP)</th>
              <th className="py-3 px-4">Compliance Status</th>
              <th className="py-3 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-zinc-700">
            {listings.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50/70 transition">
                <td className="py-3.5 px-5">
                  <div className="font-semibold text-zinc-900">{item.productName}</div>
                  <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                    <span className="font-medium text-zinc-700">{item.platformLogoText}</span>
                    <span>•</span>
                    <span className="font-mono">{item.sku}</span>
                    <span>•</span>
                    <span className="text-zinc-400 font-mono">{item.lastSynced}</span>
                  </div>
                </td>

                <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                  ₹ {item.onPackMrp.toFixed(2)}
                </td>

                <td className="py-3.5 px-4 font-mono font-bold">
                  {item.listedPrice > item.onPackMrp ? (
                    <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      ₹ {item.listedPrice.toFixed(2)} (Overcharged!)
                    </span>
                  ) : (
                    <span className="text-emerald-700">₹ {item.listedPrice.toFixed(2)}</span>
                  )}
                </td>

                <td className="py-3.5 px-4 font-mono">
                  {item.uspDeclared ? (
                    <span className="text-zinc-700">{item.uspValue}</span>
                  ) : (
                    <span className="text-rose-600 font-semibold text-[11px] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      Missing on Title
                    </span>
                  )}
                </td>

                <td className="py-3.5 px-4">
                  {item.status === 'synced' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3" /> MATCHED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
                      <AlertTriangle className="w-3 h-3" /> DUAL MRP RISK
                    </span>
                  )}
                </td>

                <td className="py-3.5 px-5 text-right">
                  {item.status !== 'synced' ? (
                    <button
                      onClick={() => handleSyncPrice(item.id)}
                      disabled={syncingId === item.id}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-[11px] inline-flex items-center gap-1 shadow-2xs transition disabled:opacity-50"
                    >
                      {syncingId === item.id ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Syncing...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3" />
                          <span>Push Price Sync</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-emerald-700 font-mono text-[11px] font-semibold">
                      ✓ Compliant
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

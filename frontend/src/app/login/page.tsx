'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Scale,
  Lock,
  Mail,
  ChevronDown,
  LogIn,
  ShieldCheck,
  Scan,
  FileCheck,
  BarChart3,
  Fingerprint,
} from 'lucide-react';
import { UserRole } from '@/lib/types';
import { useAuth, getDefaultRoute } from '@/lib/auth-context';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'vendor', label: 'Manufacturer / Vendor' },
  { value: 'inspector', label: 'Field Inspector' },
  { value: 'controller', label: 'District Controller' },
  { value: 'admin', label: 'State / National Admin' },
  { value: 'auditor', label: 'Auditor / Observer' },
];

const FEATURES = [
  { icon: Scan, text: 'AI-Powered Label Scanning & OCR' },
  { icon: ShieldCheck, text: 'Automated Compliance Verification' },
  { icon: FileCheck, text: 'Section 36 Notice Generation' },
  { icon: BarChart3, text: 'Real-Time Analytics Dashboard' },
  { icon: Fingerprint, text: 'Tamper-Proof Evidence Chain' },
];

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, user, login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('vendor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push(getDefaultRoute(user.role));
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      await login(email, password, selectedRole);
      router.push(getDefaultRoute(selectedRole));
    } catch {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSent(true);
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotSent(false);
      setForgotEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Glowing orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-teal-400/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-emerald-300/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Top — Logo & tag */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <Scale className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg tracking-tight">LABELGUARD</h2>
                <p className="text-emerald-300/80 text-[11px] font-medium tracking-wide uppercase">Smart Label Compliance System</p>
              </div>
            </div>
          </div>

          {/* Center — Headline */}
          <div className="flex-1 flex flex-col justify-center -mt-8">
            <p className="text-emerald-400/90 text-xs font-semibold uppercase tracking-widest mb-4">
              Government of India • Dept. of Legal Metrology
            </p>
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-5">
              Packaged Commodity
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">
                Compliance Portal
              </span>
            </h1>
            <p className="text-emerald-100/70 text-sm leading-relaxed max-w-md">
              AI-assisted verification of packaged commodities under the
              Legal Metrology (Packaged Commodities) Rules, 2011.
            </p>

            {/* Feature pills */}
            <div className="mt-8 space-y-3">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/15 transition-colors">
                      <Icon className="w-4 h-4 text-emerald-300" />
                    </div>
                    <span className="text-emerald-100/80 text-sm font-medium">{f.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom — credential */}
          <div className="pt-6 border-t border-white/10">
            <p className="text-emerald-300/50 text-[11px]">
              Ministry of Consumer Affairs, Food & Public Distribution
            </p>
            <p className="text-emerald-300/40 text-[10px] mt-0.5">
              National Informatics Centre • MeghRaj Cloud Infrastructure
            </p>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col bg-zinc-50">
        {/* Mobile-only top strip */}
        <div className="lg:hidden bg-emerald-800 text-white px-4 py-3 flex items-center gap-2">
          <Scale className="w-5 h-5 text-emerald-300" />
          <span className="font-bold text-sm">LABELGUARD</span>
          <span className="text-emerald-300/70 text-[10px] ml-1 uppercase tracking-wide">Compliance Portal</span>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="mb-6">
              <div className="hidden lg:inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <Scale className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 mb-1">Welcome to LABELGUARD</h1>
              <p className="text-sm text-zinc-500">Select a quick demo portal or sign in below</p>
            </div>

            {/* Quick Demo Access Pills */}
            <div className="mb-6 bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-2">
              <p className="text-xs font-bold text-emerald-900 flex items-center justify-between">
                <span>⚡ Quick Demo Portals</span>
                <span className="text-[10px] font-normal text-emerald-700">Tap to test immediately</span>
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    login('vendor@labelguard.gov.in', 'demo', 'vendor');
                    router.push('/vendor/audit/new');
                  }}
                  className="px-2.5 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1 transition text-left truncate"
                >
                  🟢 Vendor Audit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    login('inspector@labelguard.gov.in', 'demo', 'inspector');
                    router.push('/inspector/scans');
                  }}
                  className="px-2.5 py-2 bg-white hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1 transition text-left truncate"
                >
                  🔵 Field Inspector
                </button>
                <button
                  type="button"
                  onClick={() => {
                    login('controller@labelguard.gov.in', 'demo', 'controller');
                    router.push('/dashboard/district');
                  }}
                  className="px-2.5 py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1 transition text-left truncate"
                >
                  🟡 Controller Hub
                </button>
                <button
                  type="button"
                  onClick={() => {
                    login('admin@labelguard.gov.in', 'demo', 'admin');
                    router.push('/dashboard/admin');
                  }}
                  className="px-2.5 py-2 bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1 transition text-left truncate"
                >
                  🟣 National Admin
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Dropdown */}
              <div>
                <label htmlFor="login-role" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Sign in as
                </label>
                <div className="relative">
                  <select
                    id="login-role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer transition-colors hover:border-zinc-400"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter your official email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="login-password" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter your password"
                  />
                </div>
                <div className="mt-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-zinc-50 px-3 text-zinc-400 font-medium">or</span>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-zinc-500">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline">
                  Register Here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom footnote — right panel */}
        <div className="px-6 py-3 text-center border-t border-zinc-200 lg:hidden">
          <p className="text-[10px] text-zinc-400">© 2026 Department of Consumer Affairs, Government of India</p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full relative">
            <button
              onClick={() => { setShowForgotModal(false); setForgotSent(false); setForgotEmail(''); }}
              className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600 text-lg font-bold"
            >
              ✕
            </button>

            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600 mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Reset Password</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Enter your registered email and we&apos;ll send you a password reset link.
              </p>
            </div>

            {forgotSent ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-emerald-800">Reset link sent!</p>
                <p className="text-xs text-emerald-600 mt-1">Check your inbox for <strong>{forgotEmail}</strong></p>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="your.email@organization.com"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

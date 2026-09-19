'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function VendorRegistrationPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [companyName, setCompanyName] = useState('NutriRich Foods Private Limited');
  const [entityType, setEntityType] = useState('Manufacturer / Packer');
  const [gstin, setGstin] = useState('09AAACN8841F1ZS');
  const [lutNo, setLutNo] = useState('LUT/2026/UP/0491');
  const [address, setAddress] = useState('Plot 42, Ecotech III, Greater Noida, UP 201306');
  const [email, setEmail] = useState('compliance@nutririch.com');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await register({
        email,
        password,
        fullName: companyName ? `${companyName} Admin` : 'Vendor Admin',
        role: 'vendor',
        companyName,
        gstNumber: gstin,
        lutNumber: lutNo,
        entityCategory: entityType,
        address,
      });
      setSubmitted(true);
      setTimeout(() => {
        router.push('/vendor/dashboard');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Vendor registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 max-w-lg w-full shadow-lg space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center mx-auto shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Packer / Manufacturer Registration</h1>
          <p className="text-xs text-zinc-500">
            Official onboarding for Legal Metrology Packaged Commodities compliance & pre-print certification.
          </p>
        </div>

        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-6 text-center space-y-2 text-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h2 className="text-base font-bold text-emerald-950">Registration Submitted Successfully!</h2>
            <p className="text-zinc-600">
              Your GSTIN and LUT records have been verified against the National Registry. Account active.
            </p>
            <p className="text-emerald-700 font-semibold pt-2">Redirecting to Vendor Self-Audit Command Center...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium text-xs">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Official Compliance Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-zinc-300 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Create Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-300 font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Confirm Password</label>
                <input
                  type="password"
                  required
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-300 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Company / Entity Legal Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-zinc-300 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Entity Category</label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-300 font-medium"
                >
                  <option>Manufacturer / Packer</option>
                  <option>Authorized Importer</option>
                  <option>E-Commerce Marketplace Seller</option>
                  <option>Wholesale Distributor</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">GSTIN Number</label>
                <input
                  type="text"
                  required
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-300 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">LUT / Registration No.</label>
                <input
                  type="text"
                  value={lutNo}
                  onChange={(e) => setLutNo(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-300 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Official Contact Phone</label>
                <input
                  type="text"
                  defaultValue="+91 98110 44892"
                  className="w-full p-2.5 rounded-lg border border-zinc-300 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Registered Plant / Office Address</label>
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-zinc-300"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <span>Submit & Create Vendor Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="pt-2 text-center text-xs text-zinc-500">
          <span>Already registered? </span>
          <Link href="/login" className="font-bold text-emerald-700 hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}

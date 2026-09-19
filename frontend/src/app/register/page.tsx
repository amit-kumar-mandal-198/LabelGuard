'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Scale, Building2, Eye, ShieldCheck, BarChart3, Search as SearchIcon, ArrowRight, ArrowLeft, CheckCircle2, Mail, Lock, User } from 'lucide-react'
import { UserRole } from '@/lib/types'
import { useAuth, getDefaultRoute, RegisterData } from '@/lib/auth-context'

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, register } = useAuth();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState<RegisterData>({
    fullName: '',
    email: '',
    password: '',
    role: 'vendor'
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push(getDefaultRoute(user.role));
    }
  }, [user, router]);

  // Check URL params for role
  useEffect(() => {
    const roleParam = searchParams.get('role') as UserRole;
    if (roleParam && ['vendor', 'inspector', 'controller', 'admin', 'auditor'].includes(roleParam)) {
      setSelectedRole(roleParam);
      setFormData(prev => ({ ...prev, role: roleParam }));
      setStep(2);
    }
  }, [searchParams]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setFormData(prev => ({ ...prev, role }));
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedRole(null);
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const createdUser = await register(formData);
      setSuccess(true);
      setTimeout(() => {
        router.push(getDefaultRoute(createdUser?.role || selectedRole || 'vendor'));
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-6">
              <Scale size={32} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Your Account</h1>
            <p className="text-slate-600">Register to access the Legal Metrology Compliance Portal</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Manufacturer / Vendor */}
            <div 
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col h-full cursor-pointer" 
              onClick={() => handleRoleSelect('vendor')}
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Building2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Manufacturer / Vendor</h3>
              <p className="text-slate-600 text-sm mb-6 flex-grow">Self-audit label compliance & get certificates</p>
              <div className="text-emerald-600 font-medium text-sm flex items-center group">
                Register as <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Field Inspector */}
            <div 
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col h-full cursor-pointer" 
              onClick={() => handleRoleSelect('inspector')}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Eye size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Field Inspector</h3>
              <p className="text-slate-600 text-sm mb-6 flex-grow">Scan packaged goods in the field</p>
              <div className="text-blue-600 font-medium text-sm flex items-center group">
                Register as <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* District Controller */}
            <div 
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col h-full cursor-pointer" 
              onClick={() => handleRoleSelect('controller')}
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">District Controller</h3>
              <p className="text-slate-600 text-sm mb-6 flex-grow">Approve Section 36 notices & enforcement</p>
              <div className="text-amber-600 font-medium text-sm flex items-center group">
                Register as <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* State / National Admin */}
            <div 
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col h-full cursor-pointer" 
              onClick={() => handleRoleSelect('admin')}
            >
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">State / National Admin</h3>
              <p className="text-slate-600 text-sm mb-6 flex-grow">National oversight & rule management</p>
              <div className="text-purple-600 font-medium text-sm flex items-center group">
                Register as <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Auditor / Observer */}
            <div 
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col h-full cursor-pointer lg:col-span-1 md:col-span-2" 
              onClick={() => handleRoleSelect('auditor')}
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-50 text-zinc-600 flex items-center justify-center mb-4">
                <SearchIcon size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Auditor / Observer</h3>
              <p className="text-slate-600 text-sm mb-6 flex-grow">Read-only access to audit logs</p>
              <div className="text-zinc-600 font-medium text-sm flex items-center group">
                Register as <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Link href="/login" className="text-slate-600 hover:text-slate-900 font-medium">
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Step 2
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-lg">
        <button 
          onClick={handleBack}
          className="text-slate-500 hover:text-slate-900 flex items-center text-sm font-medium mb-6"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to role selection
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <Scale size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 capitalize">Register as {selectedRole}</h2>
          <p className="text-slate-500 text-sm mt-1">Fill in your details to create your account</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
            {error}
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 size={64} className="text-emerald-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Registration Successful!</h3>
            <p className="text-slate-500">Redirecting to your dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common Fields */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Official Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="name@organization.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Role Specific Fields */}
            {selectedRole === 'vendor' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                  <input type="text" name="companyName" onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">GSTIN</label>
                    <input type="text" name="gstNumber" onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">LUT/Reg. No.</label>
                    <input type="text" name="lutNumber" onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Entity Category</label>
                  <select name="entityCategory" onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                    <option value="">Select Category</option>
                    <option value="Manufacturer/Packer">Manufacturer/Packer</option>
                    <option value="Authorized Importer">Authorized Importer</option>
                    <option value="E-Commerce Seller">E-Commerce Seller</option>
                    <option value="Wholesale Distributor">Wholesale Distributor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Registered Address</label>
                  <textarea name="address" onChange={handleChange} required rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"></textarea>
                </div>
              </>
            )}

            {selectedRole === 'inspector' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Badge / ID Number</label>
                  <input type="text" name="badgeNumber" onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                    <input type="text" name="district" onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <select name="state" onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            {selectedRole === 'controller' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
                  <input type="text" name="designation" onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                    <input type="text" name="district" onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <select name="state" onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            {selectedRole === 'admin' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
                  <input type="text" name="designation" onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <input type="text" name="department" onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </>
            )}

            {selectedRole === 'auditor' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
                <input type="text" name="organization" onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center mt-6"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <p className="text-slate-600 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

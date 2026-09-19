'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Scale, ChevronDown, LogOut, User, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getNavLinksForRole } from '@/lib/route-guard';

const PUBLIC_NAV_LINKS = [
  { href: '/vendor/audit/new', label: 'Vendor Audit', prefixes: ['/vendor'] },
  { href: '/inspector/scans', label: 'Field Inspections', prefixes: ['/inspector', '/scan'] },
  { href: '/dashboard/district', label: 'District Controller', prefixes: ['/dashboard/district'] },
  { href: '/admin/rules', label: 'Codified Rules', prefixes: ['/admin'] },
  { href: '/search', label: 'Universal Search', prefixes: ['/search'] },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hide navbar on login/register pages
  if (pathname === '/login' || pathname?.startsWith('/register')) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const navLinks = isAuthenticated && user ? getNavLinksForRole(user.role) : PUBLIC_NAV_LINKS;

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'vendor':
        return 'bg-emerald-100 text-emerald-800';
      case 'inspector':
        return 'bg-blue-100 text-blue-800';
      case 'controller':
        return 'bg-amber-100 text-amber-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'auditor':
        return 'bg-zinc-100 text-zinc-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white shadow-sm">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Brand logo */}
          <Link href="/" className="flex items-center space-x-3 flex-shrink-0 group">
            <div className="bg-emerald-600 p-2 rounded-lg text-white group-hover:bg-emerald-700 transition-colors shadow-sm">
              <Scale size={24} />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold tracking-tight text-zinc-900">LABELGUARD</span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm">SLCS v2.4</span>
              </div>
              <span className="text-xs font-medium text-zinc-500">Smart Label Compliance System</span>
            </div>
          </Link>

          {/* Center: Navigation links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = link.prefixes.some((p) => pathname.startsWith(p));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-100 text-emerald-700 font-semibold'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="hidden lg:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                  <span className="text-sm font-medium text-zinc-700 max-w-[150px] truncate">
                    {user.email}
                  </span>
                </div>
                <div className="h-8 w-px bg-zinc-200"></div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-sm font-medium text-zinc-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-md transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-zinc-400 hover:text-zinc-500 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = link.prefixes.some((p) => pathname.startsWith(p));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive
                      ? 'bg-zinc-100 text-emerald-700'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          
          <div className="pt-4 pb-3 border-t border-zinc-200">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center px-5 mb-4">
                  <div className="flex-shrink-0 bg-zinc-100 p-2 rounded-full">
                    <User className="h-6 w-6 text-zinc-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-zinc-800 truncate">{user.email}</div>
                    <div className="text-sm font-medium text-zinc-500 mt-1 flex items-center space-x-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-2 space-y-1">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-800"
                  >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="px-5">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

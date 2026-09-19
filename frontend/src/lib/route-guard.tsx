'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, getDefaultRoute } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';

/** Routes accessible without authentication */
const PUBLIC_ROUTES = ['/', '/login', '/register'];

/** Check if a pathname is public (no auth required) */
function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (pathname.startsWith('/register/')) return true;
  return false;
}

/** Role → allowed route prefixes mapping */
const ROLE_ROUTES: Record<UserRole, string[]> = {
  vendor: ['/vendor', '/search'],
  inspector: ['/inspector', '/scan', '/search'],
  controller: ['/dashboard/district', '/notices', '/offenders', '/search'],
  admin: [
    '/dashboard/admin',
    '/admin',
    '/search',
    // Admin has oversight access to all operational views
    '/dashboard/district',
    '/notices',
    '/offenders',
    '/inspector',
    '/scan',
    '/vendor',
  ],
  auditor: ['/search'],
};

/** Check if a role can access a given pathname */
export function canAccess(role: UserRole, pathname: string): boolean {
  if (isPublicRoute(pathname)) return true;
  const allowedPrefixes = ROLE_ROUTES[role] || [];
  return allowedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

/** Get the nav links visible to a given role */
export interface NavLink {
  href: string;
  label: string;
  prefixes: string[]; // pathnames that activate this link
}

const ALL_NAV_LINKS: (NavLink & { roles: UserRole[] })[] = [
  {
    href: '/vendor/dashboard',
    label: 'Vendor Self-Audit',
    prefixes: ['/vendor'],
    roles: ['vendor', 'admin'],
  },
  {
    href: '/inspector/scans',
    label: 'Field Inspections',
    prefixes: ['/inspector', '/scan'],
    roles: ['inspector', 'admin'],
  },
  {
    href: '/dashboard/district',
    label: 'District Controller',
    prefixes: ['/dashboard/district', '/notices', '/offenders'],
    roles: ['controller', 'admin'],
  },
  {
    href: '/admin/rules',
    label: 'Codified Rules',
    prefixes: ['/admin'],
    roles: ['admin'],
  },
  {
    href: '/search',
    label: 'Universal Search',
    prefixes: ['/search'],
    roles: ['vendor', 'inspector', 'controller', 'admin', 'auditor'],
  },
];

export function getNavLinksForRole(role: UserRole): NavLink[] {
  return ALL_NAV_LINKS.filter((link) => link.roles.includes(role)).map(({ href, label, prefixes }) => ({
    href,
    label,
    prefixes,
  }));
}

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait for localStorage session to load

    // Public routes — accessible without login
    if (isPublicRoute(pathname)) {
      return;
    }

    // Protected route — not authenticated → redirect to /login
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }

    // Authenticated but unauthorized for this role's route → redirect to own role's dashboard
    if (!canAccess(user.role, pathname)) {
      router.replace(getDefaultRoute(user.role));
    }
  }, [pathname, isAuthenticated, isLoading, user, router]);

  // While checking authentication on protected routes, prevent flashing protected UI
  if (isLoading && !isPublicRoute(pathname)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  // If unauthenticated and on a protected route, block rendering while redirect takes place
  if (!isPublicRoute(pathname) && (!isAuthenticated || !user)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-sm font-medium text-zinc-500">Redirecting to login...</div>
      </div>
    );
  }

  return <>{children}</>;
}

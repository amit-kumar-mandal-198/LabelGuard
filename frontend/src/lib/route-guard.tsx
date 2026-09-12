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
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait for localStorage to load

    // Public routes — always accessible
    if (isPublicRoute(pathname)) {
      if (isAuthenticated && user && (pathname === '/login' || pathname.startsWith('/register'))) {
        router.replace(getDefaultRoute(user.role));
      }
      return;
    }

    // Protected route — not authenticated → auto login demo user matching target portal
    if (!isAuthenticated || !user) {
      let targetRole: UserRole = 'vendor';
      if (pathname.startsWith('/inspector') || pathname.startsWith('/scan')) {
        targetRole = 'inspector';
      } else if (pathname.startsWith('/dashboard/district') || pathname.startsWith('/notices') || pathname.startsWith('/offenders')) {
        targetRole = 'controller';
      } else if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard/admin')) {
        targetRole = 'admin';
      } else if (pathname.startsWith('/search')) {
        targetRole = 'auditor';
      }
      login(`${targetRole}@labelguard.gov.in`, 'demo', targetRole);
      return;
    }

    // Authenticated but wrong role for this route → auto switch role to match target portal
    if (!canAccess(user.role, pathname)) {
      let targetRole: UserRole = user.role;
      if (pathname.startsWith('/vendor')) targetRole = 'vendor';
      else if (pathname.startsWith('/inspector') || pathname.startsWith('/scan')) targetRole = 'inspector';
      else if (pathname.startsWith('/dashboard/district') || pathname.startsWith('/notices') || pathname.startsWith('/offenders')) targetRole = 'controller';
      else if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard/admin')) targetRole = 'admin';
      else if (pathname.startsWith('/search')) targetRole = 'auditor';

      if (targetRole !== user.role) {
        login(`${targetRole}@labelguard.gov.in`, 'demo', targetRole);
      } else {
        router.replace(getDefaultRoute(user.role));
      }
    }
  }, [pathname, isAuthenticated, isLoading, user, router, login]);

  // For seamless demo access: render children directly
  return <>{children}</>;
}

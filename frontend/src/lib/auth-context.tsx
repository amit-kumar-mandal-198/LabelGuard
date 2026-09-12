'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole } from '@/lib/types';

export interface AuthUser {
  email: string;
  fullName: string;
  role: UserRole;
  designation?: string;
  department?: string;
  district?: string;
  state?: string;
  companyName?: string;
  gstNumber?: string;
  lutNumber?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  designation?: string;
  department?: string;
  district?: string;
  state?: string;
  companyName?: string;
  gstNumber?: string;
  lutNumber?: string;
  entityType?: string;
  entityCategory?: string;
  address?: string;
  badgeNumber?: string;
  organization?: string;
}

const AUTH_STORAGE_KEY = 'labelguard_auth_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        if (parsed && parsed.email && parsed.role) {
          setUser(parsed);
        }
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, _password: string, role: UserRole) => {
    const roleNames: Record<UserRole, { fullName: string; designation: string }> = {
      vendor: { fullName: 'Vendor Administrator', designation: 'Compliance Manager' },
      inspector: { fullName: 'Field Inspector', designation: 'Legal Metrology Inspector' },
      controller: { fullName: 'District Controller', designation: 'Assistant Controller (LM)' },
      admin: { fullName: 'National Administrator', designation: 'Director, Dept. of Legal Metrology' },
      auditor: { fullName: 'Audit Observer', designation: 'Compliance Auditor' },
    };

    const authUser: AuthUser = {
      email,
      fullName: roleNames[role]?.fullName || 'Demo User',
      role,
      designation: roleNames[role]?.designation || 'Staff',
    };

    setUser(authUser);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    } catch {}
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    // Simulate registration delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const authUser: AuthUser = {
      email: data.email,
      fullName: data.fullName,
      role: data.role,
      designation: data.designation,
      department: data.department,
      district: data.district,
      state: data.state,
      companyName: data.companyName,
      gstNumber: data.gstNumber,
      lutNumber: data.lutNumber,
    };

    setUser(authUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/** Returns the default landing route for each role */
export function getDefaultRoute(role: UserRole): string {
  switch (role) {
    case 'vendor':
      return '/vendor/dashboard';
    case 'inspector':
      return '/inspector/scans';
    case 'controller':
      return '/dashboard/district';
    case 'admin':
      return '/dashboard/admin';
    case 'auditor':
      return '/search';
    default:
      return '/';
  }
}

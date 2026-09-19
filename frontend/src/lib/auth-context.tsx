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
  login: (email: string, password: string, role?: UserRole) => Promise<AuthUser>;
  register: (data: RegisterData) => Promise<AuthUser>;
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

  // Restore session from localStorage on mount (requires both valid token and stored user)
  useEffect(() => {
    try {
      const token = localStorage.getItem('labelguard_access_token');
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (token && stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        if (parsed && parsed.email && parsed.role) {
          setUser(parsed);
        } else {
          setUser(null);
        }
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem('labelguard_access_token');
        setUser(null);
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('labelguard_access_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string, _role?: UserRole): Promise<AuthUser> => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    let res: Response;
    try {
      res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        signal: AbortSignal.timeout(5000),
      });
    } catch (err: any) {
      throw new Error(
        err.name === 'TimeoutError' || err.message?.includes('timeout') || err.message?.includes('aborted')
          ? 'Authentication server timed out. Please ensure the backend is running.'
          : 'Unable to connect to authentication server. Please check your network or backend server.'
      );
    }

    if (!res.ok) {
      let errorDetail = 'Invalid email or password';
      try {
        const data = await res.json();
        if (data && data.detail) {
          errorDetail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        }
      } catch {}
      throw new Error(errorDetail);
    }

    const data = await res.json();
    if (!data.access_token || !data.user) {
      throw new Error('Authentication response missing access token or user profile');
    }

    localStorage.setItem('labelguard_access_token', data.access_token);
    const authUser: AuthUser = {
      email: data.user.email,
      fullName: data.user.full_name || 'Authorized User',
      role: data.user.role as UserRole,
      designation: data.user.designation,
      department: data.user.department,
      district: data.user.district,
      state: data.user.state,
      companyName: data.user.company_name,
      gstNumber: data.user.gst_number,
      lutNumber: data.user.lut_number,
    };

    setUser(authUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    return authUser;
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<AuthUser> => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    let res: Response;
    try {
      res = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email.trim(),
          password: data.password,
          full_name: data.fullName.trim(),
          role: data.role,
          designation: data.designation,
          department: data.department,
          district: data.district,
          state: data.state,
          company_name: data.companyName,
          gst_number: data.gstNumber,
          lut_number: data.lutNumber,
          badge_number: data.badgeNumber,
          entity_category: data.entityCategory || data.entityType,
          address: data.address,
          organization: data.organization,
        }),
        signal: AbortSignal.timeout(5000),
      });
    } catch (err: any) {
      throw new Error(
        err.name === 'TimeoutError' || err.message?.includes('timeout') || err.message?.includes('aborted')
          ? 'Registration server timed out. Please ensure the backend is running.'
          : 'Unable to connect to registration server. Please ensure backend is running.'
      );
    }

    if (!res.ok) {
      let errorDetail = 'Registration failed';
      try {
        const resData = await res.json();
        if (resData && resData.detail) {
          errorDetail = typeof resData.detail === 'string' ? resData.detail : JSON.stringify(resData.detail);
        }
      } catch {}
      throw new Error(errorDetail);
    }

    const resData = await res.json();
    if (resData.access_token) {
      localStorage.setItem('labelguard_access_token', resData.access_token);
    }

    const userProfile = resData.user || {};
    const authUser: AuthUser = {
      email: userProfile.email || data.email,
      fullName: userProfile.full_name || data.fullName,
      role: (userProfile.role as UserRole) || data.role,
      designation: userProfile.designation || data.designation,
      department: userProfile.department || data.department,
      district: userProfile.district || data.district,
      state: userProfile.state || data.state,
      companyName: userProfile.company_name || data.companyName,
      gstNumber: userProfile.gst_number || data.gstNumber,
      lutNumber: userProfile.lut_number || data.lutNumber,
    };

    setUser(authUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    return authUser;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('labelguard_access_token');
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

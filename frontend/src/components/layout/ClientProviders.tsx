'use client';

import React from 'react';
import { AuthProvider } from '@/lib/auth-context';
import RouteGuard from '@/lib/route-guard';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      <RouteGuard>
        <main className="flex-1 flex flex-col">{children}</main>
      </RouteGuard>
      <Footer />
    </AuthProvider>
  );
}

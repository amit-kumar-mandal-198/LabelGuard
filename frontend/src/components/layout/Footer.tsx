import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-white text-zinc-500 text-xs border-t border-zinc-200 mt-auto py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p className="text-zinc-600 font-medium">
          © {new Date().getFullYear()} Department of Consumer Affairs, Government of India. All rights reserved.
        </p>
        <p className="text-[11px] text-zinc-400">
          Legal Metrology (Packaged Commodities) Division
        </p>
      </div>
    </footer>
  );
}

'use client';

import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';

// Dynamic import with SSR disabled to prevent server-side crashes
// from browser-only APIs (localStorage, crypto, pdfjs-dist)
const NotebookClient = dynamic(() => import('@/components/notebook/NotebookClient'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 pt-24 flex items-center justify-center">
      <div className="animate-pulse text-white/30 text-sm">Loading Launchpad…</div>
    </div>
  ),
});

export default function NotebookPage() {
  return (
    <main className="relative h-screen flex flex-col overflow-hidden">
      <Navbar />
      <NotebookClient />
    </main>
  );
}

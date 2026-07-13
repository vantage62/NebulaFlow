'use client';

import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Dynamic import with SSR disabled to prevent server-side crashes
// from browser-only APIs (localStorage, crypto, pdfjs-dist, mermaid)
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
    <main className="relative min-h-screen flex flex-col">
      <Navbar />
      <NotebookClient />
      <Footer />
    </main>
  );
}

import type { Metadata } from 'next';
import { Inter, Syne } from 'next/font/google';
import './globals.css';
import GalaxyBackground from '@/components/GalaxyBackground';

import ChatWidget from '@/components/ChatWidget';
import MusicPlayerBar from '@/components/MusicPlayerBar';
import SmoothScroll from '@/components/SmoothScroll';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const syne = Syne({ subsets: ['latin'], variable: '--font-syne' });

export const metadata: Metadata = {
  title: 'NebulaFlow — Premium Study Hub',
  description: 'A premium digital study hub with NCERT downloads, deep-dive notes and a formula vault for curious students.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${syne.variable} font-sans antialiased bg-black text-white min-h-screen overflow-x-hidden`}>
        <SmoothScroll>
          <GalaxyBackground />
          <div className="relative z-10">{children}</div>
          <ChatWidget />
          <MusicPlayerBar />
        </SmoothScroll>
      </body>
    </html>
  );
}

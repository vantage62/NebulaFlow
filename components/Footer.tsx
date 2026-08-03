'use client';

import Image from 'next/image';
import { Mail, Sparkles, BookOpen } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="contact" className="relative mt-32 px-4 pb-8">
      <div
        className="max-w-6xl mx-auto rounded-3xl overflow-hidden glass-panel"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="p-10 md:p-14">
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <div className="flex items-center group mb-4">
                <div className="relative w-72 h-20 flex items-center justify-center mix-blend-plus-lighter transition-opacity hover:opacity-80">
                  <Image src="/logo.png" alt="NebulaFlow Logo" fill className="object-contain" />
                </div>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                A premium digital study hub. Deep-dive notes, revision sheets, and NCERT resources — designed for focused students.
              </p>
            </div>

            <div>
              <h4 className="text-white font-medium mb-4 text-sm tracking-wide uppercase">Explore</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="/classes" className="hover:text-white transition">Class Selection</a></li>
                <li><a href="#ncert" className="hover:text-white transition">NCERT Downloads</a></li>
                <li><a href="#subjects" className="hover:text-white transition">Core Subjects</a></li>
                <li><a href="#" className="hover:text-white transition">Formula Vault</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-medium mb-4 text-sm tracking-wide uppercase">Contact</h4>
              <a href="mailto:pandeyomofficial2010@gmail.com" className="group inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/20 transition">
                <div className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center group-hover:bg-white/10 transition">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-widest text-white/40">Reach us at</p>
                  <p className="text-sm text-white font-medium">pandeyomofficial2010@gmail.com</p>
                </div>
              </a>
              <div className="flex items-center gap-3 mt-5 text-white/40">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs">Built for curious minds.</span>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
            <p>© {new Date().getFullYear()} NebulaFlow — All rights reserved.</p>
            <p className="tracking-wide">Designed with obsession</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

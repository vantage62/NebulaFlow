'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Menu, X, Download, Zap, Layers, GraduationCap, Mail, BookOpen, type LucideIcon } from 'lucide-react';

interface NavLink {
  label: string;
  href: string;
}

interface MobileMenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navLinks: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Classes', href: '/classes' },
  { label: 'Launchpad', href: '/notebook' },
  { label: 'NCERT Books', href: '/#ncert' },
  { label: 'Features', href: '/#subjects' },
  { label: 'Contact', href: '/#contact' },
];

const mobileMenuItems: MobileMenuItem[] = [
  { label: 'Home', href: '/', icon: Sparkles },
  { label: 'Classes', href: '/classes', icon: GraduationCap },
  { label: 'Launchpad', href: '/notebook', icon: BookOpen },
  { label: 'NCERT Books', href: '/#ncert', icon: Download },
  { label: 'Features', href: '/#subjects', icon: Layers },
  { label: 'Formula Vault', href: '/#subjects', icon: Zap },
  { label: 'Contact', href: '/#contact', icon: Mail },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-50 flex justify-center pt-4 px-4 animate-fade-in-up"
      >
        <nav
          className={`w-full max-w-6xl flex items-center justify-between px-5 py-3 rounded-full transition-all duration-300 ${scrolled
              ? 'glass-panel shadow-lg shadow-black/20'
              : 'glass-panel opacity-95'
            }`}
        >
          <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center group relative w-56 h-8">
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[263px] h-[71px] mix-blend-plus-lighter transition-opacity hover:opacity-80">
              <Image src="/logo.png" alt="NebulaFlow Logo" fill className="object-contain object-left" priority />
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              link.href.startsWith('#') ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="relative px-4 py-2 text-[13px] font-[var(--font-syne)] font-extrabold tracking-[1px] uppercase text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="relative px-4 py-2 text-[13px] font-[var(--font-syne)] font-extrabold tracking-[1px] uppercase text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]"
                >
                  {link.label}
                </Link>
              )
            ))}
          </div>

          {/* Right side: CTA + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/classes"
              className="hidden sm:inline-flex items-center gap-2 text-sm px-5 py-2 rounded-lg bg-white text-black font-medium hover:bg-white/90 transition-all hover:shadow-lg hover:shadow-white/10"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Start Learning
            </Link>

            {/* Hamburger toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] transition"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="w-4 h-4 text-white" />
              ) : (
                <Menu className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setMobileOpen(false)}
          />

          {/* Menu Panel */}
          <div className="relative mt-20 mx-4 animate-fade-in-up">
              <div className="rounded-2xl glass-panel overflow-hidden shadow-2xl">
                <div className="p-2">
                  {mobileMenuItems.map((item, i) => {
                    const Icon = item.icon;
                    const inner = (
                      <div
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06] transition-all group"
                        style={{ transitionDelay: `${i * 0.05}s` }}
                        onClick={() => setMobileOpen(false)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center group-hover:bg-white/[0.1] transition">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    );

                    return item.href.startsWith('#') ? (
                      <a key={item.label} href={item.href}>{inner}</a>
                    ) : (
                      <Link key={item.label} href={item.href}>{inner}</Link>
                    );
                  })}
                </div>

                {/* Mobile CTA */}
                <div className="p-4 pt-2 border-t border-white/[0.06]">
                  <Link
                    href="/classes"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition text-sm"
                  >
                    <GraduationCap className="w-4 h-4" />
                    Start Learning
                  </Link>
                </div>
              </div>
            </div>
        </div>
      )}
    </>
  );
}

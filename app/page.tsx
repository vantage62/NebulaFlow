'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Sparkles, Download, GraduationCap, Zap, Layers, type LucideIcon } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlassCard from '@/components/GlassCard';
import { NCERT_BOOKS, CLASSES } from '@/lib/data';

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

const features: Feature[] = [
  { icon: BookOpen, title: 'Deep-Dive Notes', desc: 'Chapter-wise notes built for real understanding — not just memorisation.' },
  { icon: Download, title: 'NCERT Downloads', desc: 'One-click access to official NCERT textbooks, straight from the source.' },
  { icon: Zap, title: 'Formula Vault', desc: 'Every math formula, theorem and identity organised in one elegant space.' },
  { icon: Layers, title: 'Revision Sheets', desc: 'Scannable, high-yield revision notes designed for the night before an exam.' },
];

function App() {
  return (
    <main className="relative min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-40 pb-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-white/70 tracking-wide">Premium Study Hub · Now live</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tighter text-gradient leading-[0.95]"
          >
            Learn beautifully.<br/>Learn deeply.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed font-light"
          >
            NebulaFlow is a distraction-free digital study hub for students. NCERT books, chapter notes, revision sheets, and a formula vault — all in one immersive space.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/classes" className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition">
              Choose your class
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </Link>
            <Link href="/notebook" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition font-medium">
              <Sparkles className="w-4 h-4" />
              Try Launchpad Studio
            </Link>
            <a href="#ncert" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] transition">
              <Download className="w-4 h-4" />
              Download NCERT books
            </a>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="subjects" className="px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Everything you need</p>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">Built for focused students.</h2>
            </div>
            <Sparkles className="w-6 h-6 text-white/40 hidden md:block" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <GlassCard key={f.title} delay={i * 0.08} className="p-6">
                <f.icon className="w-6 h-6 text-white mb-4" />
                <h3 className="text-white font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* NOTEBOOK HERO SHOWCASE */}
      <section className="px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <Link href="/notebook" className="block relative group overflow-hidden rounded-3xl border border-emerald-500/20 bg-emerald-500/5">
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition duration-700" />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/20 blur-[120px] rounded-full group-hover:bg-emerald-500/30 transition duration-700" />
            
            <div className="relative p-10 md:p-16 flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-6">
                  <Sparkles className="w-3.5 h-3.5" /> New Feature
                </div>
                <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white mb-4">Meet Launchpad Studio.</h2>
                <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-xl">
                  Upload your textbooks, class notes, or PDFs, and let our AI instantly generate beautiful mind maps, interactive 3D flashcards, and quizzes to test your knowledge.
                </p>
                <div className="inline-flex items-center gap-2 font-medium text-emerald-400 group-hover:text-emerald-300 transition">
                  Open Launchpad <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
              
              <div className="w-full md:w-1/3 aspect-square relative flex items-center justify-center">
                {/* Decorative floating cards */}
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute z-20 top-4 right-4 w-32 h-40 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl flex items-center justify-center -rotate-6">
                  <BookOpen className="w-8 h-8 text-white/30" />
                </motion.div>
                <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute z-10 bottom-4 left-4 w-40 h-24 rounded-xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md shadow-2xl flex items-center justify-center rotate-3">
                  <Layers className="w-8 h-8 text-emerald-400/50" />
                </motion.div>
                <div className="w-48 h-48 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_100px_rgba(16,185,129,0.1)]">
                  <Sparkles className="w-16 h-16 text-emerald-400" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* NCERT SECTION */}
      <section id="ncert" className="px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div className="lg:sticky lg:top-32">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] mb-6">
                <GraduationCap className="w-3.5 h-3.5 text-white" />
                <span className="text-xs text-white/70">Official NCERT</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
                Every NCERT textbook. Instantly downloadable.
              </h2>
              <p className="mt-4 text-white/60 leading-relaxed max-w-lg">
                Direct links to official, high-quality NCERT books — sourced straight from ncert.nic.in. Zero ads, zero friction, just the book you need.
              </p>
              <Link href="/classes" className="mt-6 inline-flex items-center gap-2 text-sm text-white hover:text-white/80 transition">
                Explore all classes <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {CLASSES.slice(0, 4).map((c, i) => (
                <GlassCard key={c.id} delay={i * 0.08} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/40">Grade {c.grade}</p>
                      <h3 className="text-lg font-semibold text-white">{c.label} · NCERT Textbooks</h3>
                    </div>
                    <Link href={`/classes/${c.id}/subjects`} className="text-xs text-white/60 hover:text-white transition">Open →</Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(NCERT_BOOKS[c.id] || []).map((b) => (
                      <a key={b.title} href={b.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition group">
                        <Download className="w-3.5 h-3.5 text-white/50 group-hover:text-white transition" />
                        <span className="text-xs text-white/70 group-hover:text-white transition truncate">{b.title}</span>
                      </a>
                    ))}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default App;

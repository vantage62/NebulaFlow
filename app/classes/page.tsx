'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, GraduationCap } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlassCard from '@/components/GlassCard';
import { CLASSES } from '@/lib/data';

export default function ClassesPage() {
  return (
    <main className="relative min-h-screen">
      <Navbar />

      <section className="pt-36 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] mb-6">
              <GraduationCap className="w-3.5 h-3.5 text-white" />
              <span className="text-xs text-white/70">Select your grade</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-gradient">Pick your class.</h1>
            <p className="mt-4 text-white/60 max-w-2xl">
              Choose the grade you&apos;re studying — we&apos;ll unlock notes, revision sheets, formulas and NCERT downloads tailored to that class.
            </p>
          </motion.div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {CLASSES.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
              >
                <Link href={`/classes/${c.id}/subjects`} className="block group">
                  <div className={`relative aspect-square rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl hover:border-white/[0.2] transition-all duration-500 hover:-translate-y-1`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${c.tint} opacity-40 group-hover:opacity-70 transition-opacity`} />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    <div className="relative h-full p-6 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/40">Grade</p>
                        <p className="text-4xl font-semibold text-white mt-1">{c.grade}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-white font-medium">{c.label}</p>
                        <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-1 transition" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

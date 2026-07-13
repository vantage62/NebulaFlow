'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, FileText, Sigma, BookOpen } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlassCard from '@/components/GlassCard';
import { SUBJECTS, CLASSES, CONTENT } from '@/lib/data';
import { use } from 'react';

interface SubjectDetailPageProps {
  params: Promise<{ classId: string; subject: string }>;
}

export default function SubjectDetailPage({ params }: SubjectDetailPageProps) {
  const { classId, subject } = use(params);
  const cls = CLASSES.find((c) => c.id === classId) || { label: `Class ${classId}`, grade: classId };
  const s = SUBJECTS[subject];

  if (!s) {
    return (
      <main className="relative min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto pt-40 px-4 text-center">
          <h1 className="text-3xl text-white">Subject not found.</h1>
          <Link href={`/classes/${classId}/subjects`} className="text-white/60 hover:text-white transition mt-4 inline-block">← Back</Link>
        </div>
      </main>
    );
  }

  const content = CONTENT[s.id];
  const isMath = s.id === 'mathematics';

  return (
    <main className="relative min-h-screen">
      <Navbar />
      <section className="pt-36 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href={`/classes/${classId}/subjects`} className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition mb-6">
            <ArrowLeft className="w-4 h-4" /> {cls.label} · Subjects
          </Link>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className={`inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br ${s.accent} items-center justify-center mb-5`}>
              {isMath ? <Sigma className="w-6 h-6 text-black" /> : <BookOpen className="w-6 h-6 text-black" />}
            </div>
            <p className="text-xs uppercase tracking-widest text-white/40">{cls.label}</p>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-gradient mt-1">{s.name}</h1>
            <p className="mt-3 text-white/60 max-w-2xl">{s.description}</p>
          </motion.div>

          {/* Math view */}
          {isMath ? (
            <div className="mt-14 space-y-14">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-5">Formula &amp; Theorem Vault</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {content.formulas?.map((f, i) => (
                    <GlassCard key={f.id} delay={i * 0.08} className="p-6">
                      <p className="text-xs uppercase tracking-widest text-white/40 mb-3">{f.title}</p>
                      <ul className="space-y-2">
                        {f.items.map((it) => (
                          <li key={it} className="font-mono text-sm text-white/80 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">{it}</li>
                        ))}
                      </ul>
                    </GlassCard>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-5">Practice Worksheets</h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {content.worksheets?.map((w, i) => (
                    <GlassCard key={w.id} delay={i * 0.05} className="p-5">
                      <FileText className="w-5 h-5 text-white/60 mb-3" />
                      <p className="text-sm font-medium text-white leading-snug">{w.title}</p>
                      <p className="text-[11px] text-white/40 mt-1">{w.pages} pages</p>
                      <a href="#" onClick={(e) => e.preventDefault()} className="mt-4 inline-flex items-center gap-2 text-xs text-white/80 hover:text-white transition">
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </GlassCard>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-14">
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-5">Chapter Notes</h2>
              <div className="space-y-3">
                {content.chapters?.map((ch, i) => (
                  <motion.div
                    key={ch.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    className="group relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl hover:border-white/[0.16] transition p-6"
                  >
                    <div className="flex items-start gap-5">
                      <span className="text-3xl font-light text-white/30 w-10 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                      <div className="flex-1">
                        <h3 className="text-lg text-white font-medium tracking-tight">{ch.title}</h3>
                        <p className="text-sm text-white/60 mt-2 leading-relaxed">{ch.summary}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}

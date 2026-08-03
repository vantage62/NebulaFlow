import Link from 'next/link';
import { ArrowRight, ArrowLeft, Atom, Globe2, BookOpen, Sigma, Download, type LucideIcon } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlassCard from '@/components/GlassCard';
import { SUBJECTS, CLASSES, NCERT_BOOKS } from '@/lib/data';
import { use } from 'react';

const ICONS: Record<string, LucideIcon> = { Atom, Globe2, BookOpen, Sigma };

interface SubjectsPageProps {
  params: Promise<{ classId: string }>;
}

export default function SubjectsPage({ params }: SubjectsPageProps) {
  const { classId } = use(params);
  const cls = CLASSES.find((c) => c.id === classId) || { label: `Class ${classId}`, grade: classId };
  const books = NCERT_BOOKS[classId] || [];

  return (
    <main className="relative min-h-screen">
      <Navbar />

      <section className="pt-36 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/classes" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition mb-6">
            <ArrowLeft className="w-4 h-4" /> All classes
          </Link>

          <div className="animate-fade-in-up stagger-1">
            <p className="text-xs uppercase tracking-widest text-white/40">Grade {cls.grade}</p>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-gradient mt-1">{cls.label}</h1>
            <p className="mt-3 text-white/60 max-w-2xl">Your core subject dashboard. Choose a subject to dive into notes, revision sheets, formulas or practice worksheets.</p>
          </div>

          {/* Subjects grid */}
          <div className="mt-12 grid md:grid-cols-2 gap-4">
            {Object.values(SUBJECTS).map((s, i) => {
              const Icon = ICONS[s.icon];
              return (
                <div key={s.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
                  <Link href={`/classes/${classId}/subjects/${s.id}`} className="block group">
                    <div className="relative rounded-2xl overflow-hidden glass-card transition-all duration-500 hover:-translate-y-1 p-6">
                      <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br ${s.accent} opacity-20 blur-3xl group-hover:opacity-40 transition-opacity`} />
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      <div className="relative">
                        <div className={`inline-flex w-11 h-11 rounded-xl bg-gradient-to-br ${s.accent} items-center justify-center mb-5`}>
                          {Icon && <Icon className="w-5 h-5 text-black" />}
                        </div>
                        <h3 className="text-2xl font-semibold text-white tracking-tight">{s.name}</h3>
                        <p className="text-sm text-white/40 mt-1">{s.tagline}</p>
                        <p className="text-sm text-white/60 mt-4 leading-relaxed">{s.description}</p>
                        <div className="mt-6 inline-flex items-center gap-2 text-sm text-white group-hover:text-white transition">
                          Open subject <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* NCERT downloads for this class */}
          {books.length > 0 && (
            <div className="mt-16">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/40">Official</p>
                  <h2 className="text-2xl md:text-3xl font-semibold text-white">NCERT Textbooks · {cls.label}</h2>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {books.map((b, i) => (
                  <GlassCard key={b.title} delay={i * 0.05} className="p-4">
                    <a href={b.url} target="_blank" rel="noopener noreferrer" className="block group">
                      <Download className="w-4 h-4 text-white/60 group-hover:text-white mb-3 transition" />
                      <p className="text-sm font-medium text-white leading-snug">{b.title}</p>
                      <p className="text-[11px] text-white/40 mt-2">ncert.nic.in · Official PDF</p>
                    </a>
                  </GlassCard>
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

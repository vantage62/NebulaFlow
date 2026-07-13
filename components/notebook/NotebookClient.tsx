'use client';

import { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Trash2, Loader2, Search, BookOpen, Sparkles, List, Layers, BrainCircuit, Network, ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NotebookDocument {
  id: string;
  name: string;
  text: string;
  createdAt: number;
}

type ArtifactType = 'summary' | 'notes' | 'flashcards' | 'quiz' | 'mindmap';

interface NotebookArtifact {
  id: string;
  docId: string;
  type: ArtifactType;
  content: string;
  createdAt: number;
}

interface Flashcard { front: string; back: string; }
interface QuizQuestion { question: string; options: string[]; answer: number; }

/* ------------------------------------------------------------------ */
/*  Storage helpers (browser-only)                                     */
/* ------------------------------------------------------------------ */

const DOCS_KEY = 'nb-docs';
const ARTIFACTS_KEY = 'nb-artifacts';

function loadFromStorage<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function saveToStorage<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* ------------------------------------------------------------------ */
/*  PDF text extraction (browser-only, dynamic import)                 */
/* ------------------------------------------------------------------ */

async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    const ab = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      text += tc.items.map((it: any) => it.str).join(' ') + '\n\n';
    }
    return text;
  }
  return file.text();
}

/* ------------------------------------------------------------------ */
/*  Generate a crypto-safe ID                                          */
/* ------------------------------------------------------------------ */

function makeId() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* ------------------------------------------------------------------ */
/*  Tab config                                                         */
/* ------------------------------------------------------------------ */

const TABS: { id: ArtifactType | 'source'; label: string; icon: any }[] = [
  { id: 'source', label: 'Source', icon: FileText },
  { id: 'summary', label: 'Summary', icon: Sparkles },
  { id: 'notes', label: 'Notes', icon: List },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'quiz', label: 'Quiz', icon: BrainCircuit },
  { id: 'mindmap', label: 'Mind Map', icon: Network },
];

/* ------------------------------------------------------------------ */
/*  Flashcard sub-component                                            */
/* ------------------------------------------------------------------ */

function FlashcardSection({ rawContent }: { rawContent: string }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  let cards: Flashcard[] = [];
  try { cards = JSON.parse(rawContent); } catch { /* ignore */ }
  if (!cards.length) return <p className="text-white/50 text-center py-10">Could not parse flashcard data.</p>;

  const card = cards[idx];
  const next = () => { setFlipped(false); setTimeout(() => setIdx(i => (i + 1) % cards.length), 120); };
  const prev = () => { setFlipped(false); setTimeout(() => setIdx(i => (i - 1 + cards.length) % cards.length), 120); };

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto py-8">
      <p className="text-white/40 text-xs tracking-widest uppercase mb-6">Card {idx + 1} / {cards.length}</p>
      <div className="w-full aspect-[3/2] cursor-pointer" style={{ perspective: 1000 }} onClick={() => setFlipped(!flipped)}>
        <motion.div
          className="w-full h-full relative"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {/* Front */}
          <div className="absolute inset-0 rounded-[2rem] bg-white/[0.04] border border-white/10 p-10 flex flex-col items-center justify-center text-center shadow-xl backdrop-blur-md" style={{ backfaceVisibility: 'hidden' }}>
            <h3 className="text-3xl font-medium text-white leading-tight tracking-tight">{card.front}</h3>
            <div className="absolute bottom-6 flex items-center gap-2 text-white/30 text-xs uppercase tracking-widest font-medium">
              <RotateCcw className="w-3.5 h-3.5" /> Tap to flip
            </div>
          </div>
          {/* Back */}
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 p-10 flex items-center justify-center text-center shadow-2xl backdrop-blur-md" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <p className="text-xl text-emerald-50 font-medium leading-relaxed">{card.back}</p>
          </div>
        </motion.div>
      </div>
      <div className="flex gap-6 mt-8">
        <button onClick={prev} className="w-11 h-11 rounded-full bg-white/[0.05] hover:bg-white/10 flex items-center justify-center text-white transition"><ChevronLeft className="w-5 h-5" /></button>
        <button onClick={() => setFlipped(!flipped)} className="w-11 h-11 rounded-full bg-white/[0.05] hover:bg-white/10 flex items-center justify-center text-white transition"><RotateCcw className="w-4 h-4" /></button>
        <button onClick={next} className="w-11 h-11 rounded-full bg-white/[0.05] hover:bg-white/10 flex items-center justify-center text-white transition"><ChevronRight className="w-5 h-5" /></button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quiz sub-component                                                 */
/* ------------------------------------------------------------------ */

function QuizSection({ rawContent }: { rawContent: string }) {
  const [ci, setCi] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  let qs: QuizQuestion[] = [];
  try { qs = JSON.parse(rawContent); } catch { /* ignore */ }
  if (!qs.length) return <p className="text-white/50 text-center py-10">Could not parse quiz data.</p>;

  const pick = (i: number) => { if (sel !== null) return; setSel(i); if (i === qs[ci].answer) setScore(s => s + 1); };
  const next = () => { if (ci < qs.length - 1) { setCi(c => c + 1); setSel(null); } else setDone(true); };
  const reset = () => { setCi(0); setSel(null); setScore(0); setDone(false); };

  if (done) {
    const pct = Math.round((score / qs.length) * 100);
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6">
          <span className="text-3xl font-bold text-emerald-400">{pct}%</span>
        </div>
        <h3 className="text-2xl font-semibold text-white mb-2">Quiz Complete!</h3>
        <p className="text-white/60 mb-8">{score} / {qs.length} correct</p>
        <button onClick={reset} className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.05] hover:bg-white/10 text-white transition"><RotateCcw className="w-4 h-4" /> Retry</button>
      </div>
    );
  }

  const q = qs[ci];
  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex justify-between mb-6">
        <span className="text-white/40 text-xs tracking-widest uppercase">Q {ci + 1} / {qs.length}</span>
        <span className="text-emerald-400 text-sm font-medium">Score: {score}</span>
      </div>
      <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-8 mb-6 shadow-xl backdrop-blur-sm">
        <h3 className="text-xl font-medium text-white mb-6">{q.question}</h3>
        <div className="space-y-3">
          {q.options.map((opt, i) => {
            let cls = 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] text-white/80';
            let icon: React.ReactNode = null;
            if (sel !== null) {
              if (i === q.answer) { cls = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-50'; icon = <CheckCircle2 className="w-5 h-5 text-emerald-400" />; }
              else if (i === sel) { cls = 'bg-red-500/10 border-red-500/30 text-red-100'; icon = <XCircle className="w-5 h-5 text-red-400" />; }
              else cls = 'bg-white/[0.01] border-transparent text-white/30';
            }
            return (
              <button key={i} onClick={() => pick(i)} disabled={sel !== null}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition ${cls}`}
              >
                <span className="text-sm font-medium pr-4">{opt}</span>{icon}
              </button>
            );
          })}
        </div>
      </div>
      {sel !== null && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
          <button onClick={next} className="flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-white/90 transition">
            {ci < qs.length - 1 ? 'Next' : 'Finish'} <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MindMap sub-component (dynamic mermaid import)                     */
/* ------------------------------------------------------------------ */

function MindMapSection({ content }: { content: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!containerRef.current) return;
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose', fontFamily: 'inherit' });
        const id = 'mm-' + makeId().replace(/-/g, '');
        const { svg } = await mermaid.render(id, content);
        if (alive && containerRef.current) containerRef.current.innerHTML = svg;
      } catch (e) {
        console.error('Mermaid error', e);
        if (alive) setError(true);
      }
    })();
    return () => { alive = false; };
  }, [content]);

  if (error) return <p className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm">Failed to render mind map — the AI may have generated invalid syntax. Try regenerating.</p>;

  return (
    <div className="w-full bg-white/[0.02] border border-white/[0.08] rounded-3xl p-8 overflow-x-auto">
      <div ref={containerRef} className="flex justify-center min-w-max mx-auto" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main NotebookClient component                                      */
/* ------------------------------------------------------------------ */

import React from 'react';

export default function NotebookClient() {
  const [docs, setDocs] = useState<NotebookDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ArtifactType | 'source'>('source');
  const [artifacts, setArtifacts] = useState<NotebookArtifact[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  // Load docs from localStorage on mount
  useEffect(() => {
    setDocs(loadFromStorage<NotebookDocument>(DOCS_KEY));
  }, []);

  // Reload artifacts when doc changes
  useEffect(() => {
    if (selectedDocId) {
      const all = loadFromStorage<NotebookArtifact>(ARTIFACTS_KEY);
      setArtifacts(all.filter(a => a.docId === selectedDocId));
    } else {
      setArtifacts([]);
    }
    setActiveTab('source');
  }, [selectedDocId]);

  const refreshDocs = useCallback(() => setDocs(loadFromStorage<NotebookDocument>(DOCS_KEY)), []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const text = await extractTextFromFile(file);
      const newDoc: NotebookDocument = { id: makeId(), name: file.name, text, createdAt: Date.now() };
      const all = loadFromStorage<NotebookDocument>(DOCS_KEY);
      all.unshift(newDoc);
      saveToStorage(DOCS_KEY, all);
      refreshDocs();
      setSelectedDocId(newDoc.id);
    } catch (err) {
      console.error(err);
      alert('Failed to parse file.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document and all its generated materials?')) return;
    const allDocs = loadFromStorage<NotebookDocument>(DOCS_KEY).filter(d => d.id !== id);
    saveToStorage(DOCS_KEY, allDocs);
    const allArtifacts = loadFromStorage<NotebookArtifact>(ARTIFACTS_KEY).filter(a => a.docId !== id);
    saveToStorage(ARTIFACTS_KEY, allArtifacts);
    if (selectedDocId === id) setSelectedDocId(null);
    refreshDocs();
  };

  const handleGenerate = async (type: ArtifactType) => {
    if (!selectedDocId) return;
    const doc = docs.find(d => d.id === selectedDocId);
    if (!doc) return;

    setIsGenerating(true);
    setStreamingText('');
    try {
      const res = await fetch('/api/generate-artifact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, text: doc.text }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');

      let result = '';
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value);
        setStreamingText(result);
      }

      if (!result.trim()) {
        throw new Error('API returned an empty response. This is usually due to free-tier rate limits (Groq has a 6000 TPM limit). Try again in a minute or use a shorter document.');
      }

      // Clean up markdown fences the LLM might have included
      let clean = result.trim();
      if (clean.startsWith('```')) {
        clean = clean.replace(/^```(?:json|mermaid)?\n/, '').replace(/\n```$/, '');
      }

      const newArtifact: NotebookArtifact = { id: makeId(), docId: selectedDocId, type, content: clean, createdAt: Date.now() };

      // Replace existing artifact of this type for this doc
      const allArt = loadFromStorage<NotebookArtifact>(ARTIFACTS_KEY).filter(a => !(a.docId === selectedDocId && a.type === type));
      allArt.push(newArtifact);
      saveToStorage(ARTIFACTS_KEY, allArt);
      setArtifacts(allArt.filter(a => a.docId === selectedDocId));

    } catch (err: any) {
      console.error(err);
      alert('Generation failed: ' + err.message);
    } finally {
      setIsGenerating(false);
      setStreamingText('');
    }
  };

  const selectedDoc = docs.find(d => d.id === selectedDocId);
  const filteredDocs = docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
  const activeArtifact = artifacts.find(a => a.type === activeTab);

  return (
    <div className="flex-1 pt-24 px-4 pb-8 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6">
      {/* ── Sidebar ── */}
      <div className="w-full md:w-80 flex flex-col gap-4 shrink-0">
        <div className="glass rounded-2xl p-4 flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Launchpad</h1>
            <p className="text-sm text-white/40">Upload docs · Generate study materials</p>
          </div>

          <label className="relative flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/15 rounded-xl hover:bg-white/[0.04] transition cursor-pointer group">
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-400" /> : <Upload className="w-5 h-5 text-white/40 group-hover:text-emerald-400 transition" />}
            <span className="text-sm text-white/50 group-hover:text-white/80 font-medium transition">
              {isUploading ? 'Parsing…' : 'Upload .txt, .md, .pdf'}
            </span>
            <input type="file" accept=".txt,.md,.pdf" className="hidden" onChange={handleUpload} disabled={isUploading} />
          </label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px] pr-1">
          {filteredDocs.length === 0 && <p className="text-xs text-white/30 text-center py-10">No documents yet.</p>}
          {filteredDocs.map(doc => (
            <button key={doc.id} onClick={() => setSelectedDocId(doc.id)}
              className={`w-full text-left p-3 rounded-xl border transition group flex items-start gap-3 ${
                selectedDocId === doc.id ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/[0.02] border-transparent hover:bg-white/[0.04]'
              }`}
            >
              <FileText className={`w-5 h-5 shrink-0 mt-0.5 ${selectedDocId === doc.id ? 'text-emerald-400' : 'text-white/30'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${selectedDocId === doc.id ? 'text-emerald-50' : 'text-white/70'}`}>{doc.name}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{new Date(doc.createdAt).toLocaleDateString()}</p>
              </div>
              <div onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                className="shrink-0 p-1.5 rounded-md hover:bg-red-500/20 text-transparent group-hover:text-red-400 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 glass rounded-2xl overflow-hidden flex flex-col min-h-[600px]">
        {selectedDoc ? (
          <>
            {/* Tabs */}
            <div className="flex items-center gap-2 p-2 border-b border-white/[0.06] overflow-x-auto relative no-scrollbar">
              {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap z-10 ${
                      isActive ? 'text-emerald-50' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 rounded-xl bg-emerald-500/10 border border-emerald-500/20 z-[-1]"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <tab.icon className="w-4 h-4" /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'source' ? (
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">{selectedDoc.name}</h2>
                  <pre className="text-white/60 whitespace-pre-wrap text-sm leading-relaxed font-mono">{selectedDoc.text}</pre>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  {!activeArtifact && !isGenerating ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 rounded-full bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10 shadow-[0_0_80px_rgba(16,185,129,0.05)] mb-6">
                        <Sparkles className="w-10 h-10 text-emerald-400/80" />
                      </div>
                      <h3 className="text-2xl font-semibold text-white mb-3">Generate {TABS.find(t => t.id === activeTab)?.label}</h3>
                      <p className="text-white/40 mb-8 max-w-sm leading-relaxed">
                        Let AI instantly synthesize comprehensive study materials directly from your document.
                      </p>
                      <button onClick={() => handleGenerate(activeTab as ArtifactType)}
                        className="group relative flex items-center gap-2 px-8 py-4 bg-emerald-500 text-black font-semibold rounded-2xl hover:bg-emerald-400 transition shadow-[0_0_40px_rgba(16,185,129,0.2)] overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        <Sparkles className="w-5 h-5 relative z-10" /> 
                        <span className="relative z-10">Generate Now</span>
                      </button>
                    </div>
                  ) : isGenerating ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-4" />
                      <p className="text-white/50 text-sm">Generating…</p>
                      {streamingText && (activeTab === 'summary' || activeTab === 'notes') && (
                        <div className="mt-6 max-w-4xl text-left prose prose-invert prose-emerald max-w-none prose-p:leading-relaxed prose-headings:font-semibold prose-headings:tracking-tight">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {streamingText}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  ) : activeArtifact ? (
                    <div className="max-w-4xl mx-auto w-full">
                      <div className="flex justify-end mb-4">
                        <button onClick={() => handleGenerate(activeTab as ArtifactType)} disabled={isGenerating}
                          className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition"
                        >
                          <Sparkles className="w-3 h-3" /> Regenerate
                        </button>
                      </div>

                      {(activeTab === 'summary' || activeTab === 'notes') && (
                        <div className="prose prose-invert prose-emerald max-w-none prose-p:leading-relaxed prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-emerald-400 hover:prose-a:text-emerald-300">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {activeArtifact.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      {activeTab === 'flashcards' && <FlashcardSection rawContent={activeArtifact.content} />}
                      {activeTab === 'quiz' && <QuizSection rawContent={activeArtifact.content} />}
                      {activeTab === 'mindmap' && <MindMapSection content={activeArtifact.content} />}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-24 h-24 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_100px_rgba(16,185,129,0.1)] mb-8"
            >
              <BookOpen className="w-12 h-12 text-emerald-400" />
            </motion.div>
            <motion.h3 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl font-semibold tracking-tighter text-white mb-4"
            >
              Launchpad Studio
            </motion.h3>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-white/40 max-w-md leading-relaxed"
            >
              Select a document from the sidebar or upload a new one to generate AI-powered study materials.
            </motion.p>
          </div>
        )}
      </div>
    </div>
  );
}

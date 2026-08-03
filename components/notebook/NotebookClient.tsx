'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, FileText, Trash2, Loader2, Search, BookOpen, Sparkles, List, Layers, BrainCircuit, Network, ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, XCircle, MessageSquare, Send, PanelLeftClose, PanelLeftOpen, Mic, SlidersHorizontal, X, Check, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useIsMobile } from '@/hooks/use-mobile';

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
  docId: string;          // composite key: sorted doc IDs joined with '+'
  type: ArtifactType;
  content: string;
  createdAt: number;
}

interface ChatMessage { role: string; content: string; }

interface Flashcard { front: string; back: string; }
interface QuizQuestion { question: string; options: string[]; answer: number; }

/* ------------------------------------------------------------------ */
/*  Storage helpers (browser-only)                                     */
/* ------------------------------------------------------------------ */

const DOCS_KEY = 'nb-docs';
const ARTIFACTS_KEY = 'nb-artifacts';
const CHATS_KEY = 'nb-chats';

function loadFromStorage<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function saveToStorage<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Chat storage: keyed by composite doc ID
function loadChatMessages(compositeId: string): ChatMessage[] {
  try {
    const all = JSON.parse(localStorage.getItem(CHATS_KEY) || '{}');
    return all[compositeId] || [];
  } catch { return []; }
}
function saveChatMessages(compositeId: string, messages: ChatMessage[]) {
  try {
    const all = JSON.parse(localStorage.getItem(CHATS_KEY) || '{}');
    all[compositeId] = messages;
    localStorage.setItem(CHATS_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}
function deleteChatForDocs(docId: string) {
  try {
    const all = JSON.parse(localStorage.getItem(CHATS_KEY) || '{}');
    // Remove any chat key that contains this doc ID
    for (const key of Object.keys(all)) {
      if (key.split('+').includes(docId)) {
        delete all[key];
      }
    }
    localStorage.setItem(CHATS_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

/* ------------------------------------------------------------------ */
/*  Composite key helper                                               */
/* ------------------------------------------------------------------ */

function makeCompositeId(ids: string[]): string {
  return [...ids].sort().join('+');
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
/*  Studio tool card config                                            */
/* ------------------------------------------------------------------ */

const STUDIO_TOOLS: { id: ArtifactType; label: string; description: string; icon: any; badge?: string }[] = [
  { id: 'summary', label: 'Summary', description: 'AI-powered overview', icon: Sparkles },
  { id: 'notes', label: 'Study Notes', description: 'Structured notes', icon: List },
  { id: 'flashcards', label: 'Flashcards', description: 'Study with active recall', icon: Layers },
  { id: 'quiz', label: 'Quiz', description: 'Test your knowledge', icon: BrainCircuit },
  { id: 'mindmap', label: 'Mind Map', description: 'Visual knowledge map', icon: Network },
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
          <div className="absolute inset-0 rounded-[2rem] glass-panel p-10 flex flex-col items-center justify-center text-center shadow-xl" style={{ backfaceVisibility: 'hidden' }}>
            <h3 className="text-3xl font-medium text-white leading-tight tracking-tight">{card.front}</h3>
            <div className="absolute bottom-6 flex items-center gap-2 text-white/30 text-xs uppercase tracking-widest font-medium">
              <RotateCcw className="w-3.5 h-3.5" /> Tap to flip
            </div>
          </div>
          {/* Back */}
          <div className="absolute inset-0 rounded-[2rem] glass-panel p-10 flex items-center justify-center text-center shadow-2xl" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <p className="text-xl text-violet-50 font-medium leading-relaxed">{card.back}</p>
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
        <div className="w-24 h-24 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mb-6">
          <span className="text-3xl font-bold text-violet-400">{pct}%</span>
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
        <span className="text-violet-400 text-sm font-medium">Score: {score}</span>
      </div>
      <div className="glass-panel rounded-3xl p-8 mb-6 shadow-xl">
        <h3 className="text-xl font-medium text-white mb-6">{q.question}</h3>
        <div className="space-y-3">
          {q.options.map((opt, i) => {
            let cls = 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] text-white/80';
            let icon: React.ReactNode = null;
            if (sel !== null) {
              if (i === q.answer) { cls = 'bg-violet-500/10 border-violet-500/30 text-violet-50'; icon = <CheckCircle2 className="w-5 h-5 text-violet-400" />; }
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
/*  MindMap sub-component (custom SVG renderer)                        */
/* ------------------------------------------------------------------ */

import dynamic from 'next/dynamic';
const MindMapViewerDynamic = dynamic(() => import('./MindMapViewer'), { ssr: false, loading: () => <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-violet-400" /></div> });

/* ------------------------------------------------------------------ */
/*  Main NotebookClient component                                      */
/* ------------------------------------------------------------------ */

export default function NotebookClient() {
  const [docs, setDocs] = useState<NotebookDocument[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [artifacts, setArtifacts] = useState<NotebookArtifact[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingType, setGeneratingType] = useState<ArtifactType | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [activeView, setActiveView] = useState<ArtifactType | 'chat' | 'source' | null>('chat');
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const isMobile = useIsMobile();

  // Auto-collapse panels on mobile initially
  useEffect(() => {
    if (isMobile) {
      setLeftCollapsed(true);
      setRightCollapsed(true);
    }
  }, [isMobile]);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Composite ID for the current selection (for keying artifacts + chats)
  const compositeId = makeCompositeId(selectedDocIds);
  const hasSelection = selectedDocIds.length > 0;

  // Load docs from localStorage on mount
  useEffect(() => {
    setDocs(loadFromStorage<NotebookDocument>(DOCS_KEY));
  }, []);

  // When selection changes: load artifacts + chat for this selection
  useEffect(() => {
    if (hasSelection) {
      const all = loadFromStorage<NotebookArtifact>(ARTIFACTS_KEY);
      setArtifacts(all.filter(a => a.docId === compositeId));
      // Load persisted chat
      const savedMessages = loadChatMessages(compositeId);
      setMessages(savedMessages);
    } else {
      setArtifacts([]);
      setMessages([]);
    }
    setActiveView('chat');
  }, [compositeId, hasSelection]);

  // Persist chat messages whenever they change (debounced via effect)
  useEffect(() => {
    if (hasSelection && messages.length > 0) {
      saveChatMessages(compositeId, messages);
    }
  }, [messages, compositeId, hasSelection]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const refreshDocs = useCallback(() => setDocs(loadFromStorage<NotebookDocument>(DOCS_KEY)), []);

  // Get combined text from all selected docs
  const getCombinedText = useCallback((): string => {
    return selectedDocIds
      .map(id => docs.find(d => d.id === id))
      .filter(Boolean)
      .map((doc, i) => `--- SOURCE ${i + 1}: ${doc!.name} ---\n${doc!.text}`)
      .join('\n\n');
  }, [selectedDocIds, docs]);

  // Get selected doc names for display
  const selectedDocs = docs.filter(d => selectedDocIds.includes(d.id));

  // Toggle selection of a doc
  const toggleDocSelection = (docId: string) => {
    setSelectedDocIds(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  // Select all / deselect all
  const toggleSelectAll = () => {
    if (selectedDocIds.length === docs.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(docs.map(d => d.id));
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (let fi = 0; fi < files.length; fi++) {
        const file = files[fi];
        const text = await extractTextFromFile(file);
        const newDoc: NotebookDocument = { id: makeId(), name: file.name, text, createdAt: Date.now() };
        const all = loadFromStorage<NotebookDocument>(DOCS_KEY);
        all.unshift(newDoc);
        saveToStorage(DOCS_KEY, all);
        // Auto-select newly uploaded docs
        setSelectedDocIds(prev => [...prev, newDoc.id]);
      }
      refreshDocs();
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
    // Remove artifacts that reference this doc (in any composite key)
    const allArtifacts = loadFromStorage<NotebookArtifact>(ARTIFACTS_KEY).filter(a => !a.docId.split('+').includes(id));
    saveToStorage(ARTIFACTS_KEY, allArtifacts);
    // Remove chat history for any selection that includes this doc
    deleteChatForDocs(id);
    setSelectedDocIds(prev => prev.filter(did => did !== id));
    refreshDocs();
  };

  const handleGenerate = async (type: ArtifactType) => {
    if (!hasSelection) return;
    const combinedText = getCombinedText();
    if (!combinedText.trim()) return;

    setIsGenerating(true);
    setGeneratingType(type);
    setStreamingText('');
    setActiveView(type);
    try {
      const res = await fetch('/api/generate-artifact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, text: combinedText }),
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

      const newArtifact: NotebookArtifact = { id: makeId(), docId: compositeId, type, content: clean, createdAt: Date.now() };

      // Replace existing artifact of this type for this composite selection
      const allArt = loadFromStorage<NotebookArtifact>(ARTIFACTS_KEY).filter(a => !(a.docId === compositeId && a.type === type));
      allArt.push(newArtifact);
      saveToStorage(ARTIFACTS_KEY, allArt);
      setArtifacts(allArt.filter(a => a.docId === compositeId));

    } catch (err: any) {
      console.error(err);
      alert('Generation failed: ' + err.message);
    } finally {
      setIsGenerating(false);
      setGeneratingType(null);
      setStreamingText('');
    }
  };

  const handleChatSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || !hasSelection || isChatLoading) return;
    const combinedText = getCombinedText();

    const userMessage = chatInput.trim();
    setChatInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/notebook/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages,
          documentText: combinedText 
        }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');

      let result = '';
      const decoder = new TextDecoder();
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value);
        setMessages(prev => {
          const newM = [...prev];
          newM[newM.length - 1] = { ...newM[newM.length - 1], content: result };
          return newM;
        });
      }
    } catch (err: any) {
      console.error(err);
      alert('Chat failed: ' + err.message);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    if (hasSelection) {
      saveChatMessages(compositeId, []);
    }
  };

  const filteredDocs = docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
  const activeArtifact = artifacts.find(a => a.type === activeView);

  return (
    <div className="flex-1 pt-20 pb-4 px-3 w-full max-w-[1600px] mx-auto flex gap-3 overflow-hidden" style={{ height: 'calc(100vh - 0px)' }}>
      
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* LEFT PANEL — Sources                                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {!leftCollapsed && (
          <motion.div
            initial={isMobile ? { opacity: 0, y: 50 } : { width: 0, opacity: 0 }}
            animate={isMobile ? { opacity: 1, y: 0 } : { width: 280, opacity: 1 }}
            exit={isMobile ? { opacity: 0, y: 50 } : { width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className={
              isMobile 
                ? "fixed inset-0 z-50 p-4 bg-black/60 backdrop-blur-xl flex flex-col"
                : "shrink-0 flex flex-col overflow-hidden"
            }
          >
            <div className="glass-panel rounded-2xl flex flex-col h-full overflow-hidden">
              {/* Sources Header */}
              <div className="p-4 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Sources</h2>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/30 bg-white/[0.06] px-2 py-0.5 rounded-full font-medium">
                      {selectedDocIds.length}/{docs.length}
                    </span>
                    <button
                      onClick={() => setLeftCollapsed(true)}
                      className="p-1 rounded-md hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition"
                    >
                      <PanelLeftClose className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Upload — now supports multiple files */}
                <label className="relative flex items-center justify-center gap-2 p-3 border border-dashed border-white/10 rounded-xl hover:bg-white/[0.03] hover:border-violet-500/30 transition cursor-pointer group mb-3">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-violet-400" /> : <Upload className="w-4 h-4 text-white/30 group-hover:text-violet-400 transition" />}
                  <span className="text-xs text-white/40 group-hover:text-white/70 font-medium transition">
                    {isUploading ? 'Parsing…' : 'Add sources'}
                  </span>
                  <input type="file" accept=".txt,.md,.pdf" multiple className="hidden" onChange={handleUpload} disabled={isUploading} />
                </label>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                  <input type="text" placeholder="Search sources…" value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/30 transition"
                  />
                </div>
              </div>

              {/* Select All */}
              {docs.length > 0 && (
                <div className="px-4 py-2 border-b border-white/[0.04]">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-[11px] text-white/40 hover:text-white/60 transition w-full"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                      selectedDocIds.length === docs.length && docs.length > 0
                        ? 'bg-violet-500 border-violet-500'
                        : selectedDocIds.length > 0
                          ? 'bg-violet-500/30 border-violet-500/50'
                          : 'border-white/20'
                    }`}>
                      {selectedDocIds.length === docs.length && docs.length > 0 && <Check className="w-3 h-3 text-white" />}
                      {selectedDocIds.length > 0 && selectedDocIds.length < docs.length && <div className="w-2 h-0.5 bg-white rounded" />}
                    </div>
                    <span>{selectedDocIds.length === docs.length ? 'Deselect all' : 'Select all'}</span>
                  </button>
                </div>
              )}

              {/* Document List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
                {filteredDocs.length === 0 && <p className="text-[10px] text-white/25 text-center py-8">No documents yet.</p>}
                {filteredDocs.map(doc => {
                  const isSelected = selectedDocIds.includes(doc.id);
                  return (
                    <div key={doc.id}
                      className={`w-full text-left p-2.5 rounded-xl border transition group flex items-start gap-2 ${
                        isSelected ? 'bg-violet-500/8 border-violet-500/20' : 'bg-transparent border-transparent hover:bg-white/[0.03]'
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleDocSelection(doc.id)}
                        className="shrink-0 mt-0.5"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                          isSelected ? 'bg-violet-500 border-violet-500' : 'border-white/20 hover:border-white/40'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>

                      {/* Doc info (also clickable to toggle) */}
                      <button onClick={() => toggleDocSelection(doc.id)} className="flex-1 min-w-0 text-left">
                        <p className={`text-xs font-medium truncate ${isSelected ? 'text-violet-100' : 'text-white/60'}`}>{doc.name}</p>
                        <p className="text-[10px] text-white/25 mt-0.5">{new Date(doc.createdAt).toLocaleDateString()}</p>
                      </button>

                      {/* Delete button */}
                      <div onClick={() => handleDelete(doc.id)}
                        className="shrink-0 p-1 rounded-md hover:bg-red-500/20 text-transparent group-hover:text-red-400/60 transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {leftCollapsed && (
        <button
          onClick={() => setLeftCollapsed(false)}
          className={`shrink-0 w-10 h-10 self-start mt-2 rounded-xl glass-panel flex items-center justify-center text-white/40 hover:text-white/70 transition ${isMobile ? 'absolute top-20 left-4 z-40' : ''}`}
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* CENTER PANEL — Chat / Content                               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className={`flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden min-w-0 ${isMobile ? 'h-full' : ''}`}>
        {hasSelection ? (
          <>
            {/* Center Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-3 min-w-0">
                {activeView === 'chat' && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-violet-400" />
                    <h2 className="text-sm font-semibold text-white">Chat</h2>
                    {messages.length > 0 && (
                      <span className="text-[10px] text-white/25 bg-white/[0.05] px-1.5 py-0.5 rounded-full">
                        {messages.length} msgs
                      </span>
                    )}
                  </div>
                )}
                {activeView === 'source' && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-violet-400" />
                    <h2 className="text-sm font-semibold text-white truncate">
                      {selectedDocs.length === 1 ? selectedDocs[0].name : `${selectedDocs.length} Sources`}
                    </h2>
                  </div>
                )}
                {activeView && activeView !== 'chat' && activeView !== 'source' && (
                  <div className="flex items-center gap-2">
                    {React.createElement(STUDIO_TOOLS.find(t => t.id === activeView)?.icon || Sparkles, { className: 'w-4 h-4 text-violet-400' })}
                    <h2 className="text-sm font-semibold text-white">{STUDIO_TOOLS.find(t => t.id === activeView)?.label}</h2>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {/* Quick nav tabs */}
                <button onClick={() => setActiveView('chat')}
                  className={`p-2 rounded-lg transition ${activeView === 'chat' ? 'bg-violet-500/10 text-violet-400' : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'}`}
                  title="Chat"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button onClick={() => setActiveView('source')}
                  className={`p-2 rounded-lg transition ${activeView === 'source' ? 'bg-violet-500/10 text-violet-400' : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'}`}
                  title="Source"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-white/[0.06] mx-1" />
                {activeView === 'chat' && messages.length > 0 && (
                  <button onClick={handleClearChat} className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition" title="Clear chat">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {activeView && activeView !== 'chat' && activeView !== 'source' && (
                  <button onClick={() => setActiveView('chat')} className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition" title="Close artifact">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Center Content */}
            <div className="flex-1 overflow-y-auto relative">
              <AnimatePresence mode="wait">
                {/* Chat View */}
                {activeView === 'chat' && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col h-full"
                  >
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                      {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center pt-16">
                          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/15 mb-5">
                            <MessageSquare className="w-8 h-8 text-violet-400/60" />
                          </div>
                          <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">Chat with your sources</h3>
                          <p className="text-sm text-white/35 max-w-sm leading-relaxed">
                            Ask questions across {selectedDocs.length} selected source{selectedDocs.length !== 1 ? 's' : ''}.
                          </p>
                          {selectedDocs.length > 1 && (
                            <div className="mt-4 flex flex-wrap gap-1.5 justify-center max-w-md">
                              {selectedDocs.map(d => (
                                <span key={d.id} className="text-[10px] text-white/30 bg-white/[0.04] px-2 py-1 rounded-full">{d.name}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {messages.map((m, i) => (
                        <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                          {m.role === 'assistant' && (
                            <div className="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                            </div>
                          )}
                          <div className={`px-4 py-3 rounded-2xl max-w-[85%] ${m.role === 'user' ? 'bg-violet-500/15 text-white' : 'bg-transparent text-white/90 prose prose-invert prose-violet prose-sm max-w-none'}`}>
                            {m.role === 'user' ? m.content : <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>}
                          </div>
                        </div>
                      ))}
                      {isChatLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                        <div className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0">
                            <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="px-4 py-3 border-t border-white/[0.05]">
                      <form onSubmit={handleChatSubmit} className="relative">
                        <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} disabled={isChatLoading}
                          placeholder="Ask a question about your sources..."
                          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-4 pr-24 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/30 transition"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <span className="text-[10px] text-white/20 mr-1">{selectedDocIds.length} source{selectedDocIds.length !== 1 ? 's' : ''}</span>
                          <button type="submit" disabled={isChatLoading || !chatInput.trim()}
                            className="p-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 disabled:opacity-30 disabled:hover:bg-violet-500/20 transition"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}

                {/* Source View — show all selected sources */}
                {activeView === 'source' && (
                  <motion.div
                    key="source"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    <div className="max-w-3xl mx-auto space-y-8">
                      {selectedDocs.map((doc, i) => (
                        <div key={doc.id}>
                          {selectedDocs.length > 1 && (
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center">
                                <span className="text-[10px] text-violet-300 font-bold">{i + 1}</span>
                              </div>
                              <h2 className="text-lg font-semibold text-white tracking-tight">{doc.name}</h2>
                            </div>
                          )}
                          {selectedDocs.length === 1 && (
                            <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">{doc.name}</h2>
                          )}
                          <pre className="text-white/55 whitespace-pre-wrap text-sm leading-relaxed font-mono">{doc.text}</pre>
                          {i < selectedDocs.length - 1 && <div className="border-t border-white/[0.06] mt-6" />}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Artifact Views */}
                {activeView && activeView !== 'chat' && activeView !== 'source' && (
                  <motion.div
                    key={activeView}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    {isGenerating && generatingType === activeView ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/15 mb-5 pulse-purple">
                          <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
                        </div>
                        <p className="text-white/40 text-sm mb-2">Generating {STUDIO_TOOLS.find(t => t.id === activeView)?.label}…</p>
                        <p className="text-white/20 text-xs mb-6">Analyzing {selectedDocIds.length} source{selectedDocIds.length !== 1 ? 's' : ''}</p>
                        {streamingText && (activeView === 'summary' || activeView === 'notes') && (
                          <div className="max-w-3xl text-left prose prose-invert prose-violet prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    ) : activeArtifact ? (
                      <div className="max-w-4xl mx-auto w-full">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] text-white/20">
                            Generated from {selectedDocIds.length} source{selectedDocIds.length !== 1 ? 's' : ''}
                          </span>
                          <button onClick={() => handleGenerate(activeView as ArtifactType)} disabled={isGenerating}
                            className="text-xs text-white/35 hover:text-white flex items-center gap-1.5 transition"
                          >
                            <Sparkles className="w-3 h-3" /> Regenerate
                          </button>
                        </div>
                        {(activeView === 'summary' || activeView === 'notes') && (
                          <div className="prose prose-invert prose-violet max-w-none prose-p:leading-relaxed prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-violet-400 hover:prose-a:text-violet-300">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeArtifact.content}</ReactMarkdown>
                          </div>
                        )}
                        {activeView === 'flashcards' && <FlashcardSection rawContent={activeArtifact.content} />}
                        {activeView === 'quiz' && <QuizSection rawContent={activeArtifact.content} />}
                        {activeView === 'mindmap' && <MindMapViewerDynamic content={activeArtifact.content} />}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-violet-500/8 flex items-center justify-center border border-violet-500/12 mb-5">
                          {React.createElement(STUDIO_TOOLS.find(t => t.id === activeView)?.icon || Sparkles, { className: 'w-8 h-8 text-violet-400/50' })}
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">Generate {STUDIO_TOOLS.find(t => t.id === activeView)?.label}</h3>
                        <p className="text-sm text-white/35 mb-6 max-w-sm leading-relaxed">
                          AI will analyze {selectedDocIds.length} source{selectedDocIds.length !== 1 ? 's' : ''} to create this study material.
                        </p>
                        <button onClick={() => handleGenerate(activeView as ArtifactType)}
                          className="btn-purple flex items-center gap-2 px-6 py-3 rounded-xl text-sm"
                        >
                          <Sparkles className="w-4 h-4" /> Generate Now
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          /* No documents selected — welcome screen */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-500/5 via-transparent to-transparent pointer-events-none" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-20 h-20 rounded-3xl bg-violet-500/10 flex items-center justify-center border border-violet-500/15 shadow-[0_0_60px_rgba(139,92,246,0.1)] mb-7"
            >
              <BookOpen className="w-10 h-10 text-violet-400" />
            </motion.div>
            <motion.h3 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl font-semibold tracking-tighter text-white mb-3"
            >
              Launchpad Studio
            </motion.h3>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base text-white/35 max-w-md leading-relaxed"
            >
              Upload sources and select them to get started with AI-powered study materials.
            </motion.p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* RIGHT PANEL — Studio                                        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {hasSelection && (
        <AnimatePresence mode="wait">
          {!rightCollapsed ? (
            <motion.div
              initial={isMobile ? { opacity: 0, y: 50 } : { width: 0, opacity: 0 }}
              animate={isMobile ? { opacity: 1, y: 0 } : { width: 260, opacity: 1 }}
              exit={isMobile ? { opacity: 0, y: 50 } : { width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className={
                isMobile
                  ? "fixed inset-0 z-50 p-4 bg-black/60 backdrop-blur-xl flex flex-col"
                  : "shrink-0 flex flex-col overflow-hidden"
              }
            >
              <div className="glass-panel rounded-2xl flex flex-col h-full overflow-hidden">
                {/* Studio Header */}
                <div className="p-4 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Studio</h2>
                    <button
                      onClick={() => setRightCollapsed(true)}
                      className="p-1 rounded-md hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tool Cards Grid */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
                  {STUDIO_TOOLS.map(tool => {
                    const hasArtifact = artifacts.some(a => a.type === tool.id);
                    const isActive = activeView === tool.id;
                    const isCurrentlyGenerating = isGenerating && generatingType === tool.id;
                    
                    return (
                      <button
                        key={tool.id}
                        onClick={() => {
                          if (hasArtifact || isCurrentlyGenerating) {
                            setActiveView(tool.id);
                          } else {
                            handleGenerate(tool.id);
                          }
                        }}
                        disabled={isGenerating && generatingType !== tool.id}
                        className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                          isActive
                            ? 'glass-card-active'
                            : hasArtifact
                              ? 'glass-card-active hover:border-violet-400/30'
                              : 'glass-card'
                        } ${isGenerating && generatingType !== tool.id ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        {/* Shimmer effect while generating */}
                        {isCurrentlyGenerating && (
                          <div className="absolute inset-0 liquid-shimmer rounded-xl" />
                        )}
                        
                        <div className="relative flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${
                            isActive || hasArtifact
                              ? 'bg-violet-500/15 text-violet-400'
                              : 'bg-white/[0.04] text-white/30 group-hover:text-white/50'
                          }`}>
                            {isCurrentlyGenerating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <tool.icon className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium ${isActive || hasArtifact ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>
                                {tool.label}
                              </p>
                              {hasArtifact && (
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                              )}
                            </div>
                            <p className="text-[11px] text-white/30 mt-0.5">{tool.description}</p>
                          </div>
                          <ChevronRight className={`w-4 h-4 shrink-0 mt-1 transition ${isActive ? 'text-violet-400' : 'text-white/15 group-hover:text-white/30'}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected sources list */}
                <div className="p-3 border-t border-white/[0.06]">
                  <button
                    onClick={() => setActiveView('source')}
                    className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-medium transition ${
                      activeView === 'source'
                        ? 'bg-white/[0.06] text-white/80'
                        : 'text-white/35 hover:text-white/60 hover:bg-white/[0.03]'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="truncate">
                      {selectedDocs.length === 1 ? selectedDocs[0].name : `${selectedDocs.length} sources selected`}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setRightCollapsed(false)}
              className={`shrink-0 w-10 h-10 self-start mt-2 rounded-xl glass-panel flex items-center justify-center text-white/40 hover:text-white/70 transition ${isMobile ? 'absolute top-20 right-4 z-40' : ''}`}
              title="Open Studio"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

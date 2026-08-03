'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Sparkles, GripHorizontal, Trash2, Copy, Check, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SUGGESTIONS = [
  '🚀 Explain Quantum Entanglement simply',
  '💡 Best study strategy for final exams',
  '⚡ Explain Calculus Derivatives with examples',
  '💻 Write Python code for Binary Search Tree',
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [localInput, setLocalInput] = useState('');
  const [messages, setMessages] = useState<{ id: string; role: string; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || localInput;
    if (!query.trim() || isLoading) return;

    const userMsg = { id: String(Date.now()), role: 'user', content: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setLocalInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      if (!res.body) throw new Error('No stream body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const aiMsgId = String(Date.now() + 1);

      setMessages((prev) => [...prev, { id: aiMsgId, role: 'assistant', content: '' }]);
      setIsLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiMsgId ? { ...msg, content: msg.content + chunk } : msg))
        );
      }
    } catch (err: any) {
      console.error('Aegis Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 2),
          role: 'assistant',
          content: '⚠️ I encountered an issue connecting to the AI model. Please try asking again in a moment.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.05}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`pointer-events-auto flex flex-col bg-[#111111] border border-white/5 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300 ${
              isExpanded ? 'w-[90vw] max-w-[700px] h-[75vh]' : 'w-[360px] sm:w-[430px] h-[560px]'
            }`}
          >
            {/* Header / Drag Handle */}
            <div
              className="flex items-center justify-between px-4 py-4 select-none cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#e5e5e5] flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.15)]">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base tracking-tight leading-tight">Aegis</h3>
                  <p className="text-[#888888] text-xs">Powered by Groq Llama 3.1</p>
                </div>
              </div>

              <div className="flex items-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-[#888888] hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm no-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
                  <div className="w-14 h-14 rounded-full bg-[#1e1e1e] border border-white/5 flex items-center justify-center mb-6 shadow-sm">
                    <Bot className="w-7 h-7 text-[#cccccc]" />
                  </div>
                  <h4 className="text-white font-semibold text-lg mb-2">How can I help you?</h4>
                  <p className="text-[#888888] text-sm max-w-[300px] leading-relaxed mb-8">
                    Ask me about NCERT topics, request formula summaries, or get help with your revision.
                  </p>

                  <div className="w-full space-y-2 max-w-sm">
                    {SUGGESTIONS.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(s.slice(2))}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-violet-500/30 text-white/70 hover:text-white text-xs transition duration-200"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={m.id}
                    className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center border text-xs font-semibold ${
                        m.role === 'user'
                          ? 'bg-white text-black border-transparent shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                          : 'bg-violet-600/20 text-violet-300 border-violet-500/30'
                      }`}
                    >
                      {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    <div
                      className={`group relative px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] ${
                        m.role === 'user'
                          ? 'bg-white/10 text-white border border-white/15 rounded-tr-sm'
                          : 'bg-white/[0.03] text-white/90 border border-white/[0.08] rounded-tl-sm'
                      }`}
                    >
                      {m.role === 'assistant' ? (
                        <div className="prose prose-invert prose-violet prose-xs max-w-none prose-p:leading-relaxed prose-pre:bg-black/60 prose-pre:border prose-pre:border-white/10">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <span>{m.content}</span>
                      )}

                      {m.role === 'assistant' && m.content && (
                        <button
                          onClick={() => copyToClipboard(m.content, m.id)}
                          title="Copy response"
                          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-black/60 border border-white/10 text-white/50 hover:text-white transition"
                        >
                          {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}

              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex gap-1.5 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#0a0a0a]">
              <form
                onSubmit={handleFormSubmit}
                className="flex items-end gap-2 p-1.5 pl-4 bg-[#1a1a1a] border border-white/5 rounded-2xl focus-within:border-white/20 transition-colors"
              >
                <textarea
                  value={localInput}
                  onChange={(e) => setLocalInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full max-h-32 min-h-[40px] bg-transparent text-[#cccccc] text-sm py-3 outline-none resize-none placeholder:text-[#666666]"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (localInput.trim() && !isLoading) {
                        handleSendMessage();
                      }
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading || !localInput.trim()}
                  className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-[#333333] text-[#cccccc] hover:bg-[#444444] hover:text-white disabled:opacity-50 transition-all mb-1 mr-1"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-shadow"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </motion.div>
  );
}

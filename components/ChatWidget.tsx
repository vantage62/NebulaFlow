'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import GlassCard from './GlassCard';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [localInput, setLocalInput] = useState('');
  const [messages, setMessages] = useState<{id: string, role: string, content: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localInput.trim() || isLoading) return;
    
    const userMsg = { id: String(Date.now()), role: 'user', content: localInput };
    setMessages((prev) => [...prev, userMsg]);
    setLocalInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!res.body) throw new Error('No body');
      
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
          prev.map((msg) => msg.id === aiMsgId ? { ...msg, content: msg.content + chunk } : msg)
        );
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <GlassCard
            className="absolute bottom-16 right-0 w-[350px] sm:w-[400px] h-[500px] flex flex-col mb-4 p-0 overflow-hidden"
            hover={false}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-white/60 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  <Sparkles className="w-4 h-4 text-black" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">Aegis</h3>
                  <p className="text-white/40 text-xs">Powered by Groq Llama 3.1</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.1] transition-colors text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
                    <Bot className="w-6 h-6 text-white/60" />
                  </div>
                  <p className="text-white font-medium text-sm mb-1">How can I help you?</p>
                  <p className="text-white/40 text-xs max-w-[250px]">
                    Ask me about NCERT topics, request formula summaries, or get help with your revision.
                  </p>
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
                      className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center border ${
                        m.role === 'user'
                          ? 'bg-white text-black border-transparent'
                          : 'bg-white/[0.06] text-white border-white/[0.1]'
                      }`}
                    >
                      {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed max-w-[80%] ${
                        m.role === 'user'
                          ? 'bg-white/[0.06] text-white border border-white/[0.08] rounded-tr-sm'
                          : 'bg-transparent text-white/80 rounded-tl-sm'
                      }`}
                    >
                      {m.content}
                    </div>
                  </motion.div>
                ))
              )}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.1] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex gap-1.5 px-4 py-3">
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/[0.02] border-t border-white/[0.08]">
              <form
                onSubmit={handleFormSubmit}
                className="flex items-end gap-2 p-1 pl-3 bg-white/[0.04] border border-white/[0.08] rounded-xl focus-within:border-white/20 focus-within:bg-white/[0.06] transition-all"
              >
                <textarea
                  value={localInput}
                  onChange={(e) => setLocalInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full max-h-32 min-h-[44px] bg-transparent text-white text-sm py-3 outline-none resize-none placeholder:text-white/30"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (localInput.trim() && !isLoading) {
                        const form = e.currentTarget.form;
                        if (form) form.requestSubmit();
                      }
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading || !localInput.trim()}
                  className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40 transition-colors mb-0.5 mr-0.5"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </GlassCard>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-shadow"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}

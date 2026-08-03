'use client';

import { useState, useEffect } from 'react';
import { NotebookDocument, NotebookArtifact, ArtifactType, getArtifactsForDoc, saveArtifact } from '@/lib/notebook';
import { Sparkles, FileText, List, Layers, BrainCircuit, Network, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import FlashcardViewer from './FlashcardViewer';
import QuizViewer from './QuizViewer';
import MindMapViewer from './MindMapViewer';

const TABS: { id: ArtifactType | 'source'; label: string; icon: any }[] = [
  { id: 'source', label: 'Source Text', icon: FileText },
  { id: 'summary', label: 'Summary', icon: Sparkles },
  { id: 'notes', label: 'Study Notes', icon: List },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'quiz', label: 'Quiz', icon: BrainCircuit },
  { id: 'mindmap', label: 'Mind Map', icon: Network },
];

export default function DocumentViewer({ doc }: { doc: NotebookDocument }) {
  const [activeTab, setActiveTab] = useState<ArtifactType | 'source'>('source');
  const [artifacts, setArtifacts] = useState<NotebookArtifact[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadArtifacts();
    setActiveTab('source');
  }, [doc.id]);

  const loadArtifacts = async () => {
    const loaded = await getArtifactsForDoc(doc.id);
    setArtifacts(loaded);
  };

  const handleGenerate = async (type: ArtifactType) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-artifact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, text: doc.text }),
      });

      if (!response.ok) throw new Error('Generation failed');
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No stream');

      let resultText = '';
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        resultText += decoder.decode(value);
      }

      // Cleanup codeblocks for JSON and Mermaid
      let cleanText = resultText.trim();
      if ((type === 'flashcards' || type === 'quiz' || type === 'mindmap') && cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```(?:json|mermaid)?\n/, '').replace(/\n```$/, '');
      }

      const newArtifact: NotebookArtifact = {
        id: uuidv4(),
        docId: doc.id,
        type,
        content: cleanText,
        createdAt: Date.now(),
      };

      await saveArtifact(newArtifact);
      await loadArtifacts();

    } catch (err) {
      console.error(err);
      alert('Failed to generate artifact.');
    } finally {
      setIsGenerating(false);
    }
  };

  const activeArtifact = artifacts.find(a => a.type === activeTab);

  return (
    <div className="flex flex-col h-full bg-white/[0.01]">
      {/* Header Tabs */}
      <div className="flex items-center gap-1 p-2 border-b border-white/[0.08] overflow-x-auto no-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-violet-500/10 text-violet-200 border border-violet-500/20' 
                : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 relative">
        {activeTab === 'source' ? (
          <div className="max-w-3xl mx-auto prose prose-invert prose-violet">
            <h2 className="text-2xl font-semibold text-white mb-4">{doc.name}</h2>
            <div className="text-white/70 whitespace-pre-wrap font-mono text-sm">
              {doc.text}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {!activeArtifact ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Sparkles className="w-12 h-12 text-violet-400/30 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No {TABS.find(t => t.id === activeTab)?.label} yet</h3>
                <p className="text-sm text-white/40 mb-6 max-w-md">
                  Use the power of AI to instantly generate comprehensive study materials based on the source document.
                </p>
                <button
                  onClick={() => handleGenerate(activeTab as ArtifactType)}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-6 py-3 btn-purple rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {isGenerating ? 'Generating...' : `Generate ${TABS.find(t => t.id === activeTab)?.label}`}
                </button>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto w-full">
                <div className="flex justify-end mb-4">
                  <button 
                    onClick={() => handleGenerate(activeTab as ArtifactType)}
                    disabled={isGenerating}
                    className="text-xs text-white/50 hover:text-white flex items-center gap-1 transition"
                  >
                    {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Regenerate
                  </button>
                </div>

                {(activeTab === 'summary' || activeTab === 'notes') && (
                  <div className="prose prose-invert prose-violet max-w-none">
                    <ReactMarkdown>{activeArtifact.content}</ReactMarkdown>
                  </div>
                )}

                {activeTab === 'flashcards' && (
                  <FlashcardViewer rawContent={activeArtifact.content} />
                )}

                {activeTab === 'quiz' && (
                  <QuizViewer rawContent={activeArtifact.content} />
                )}

                {activeTab === 'mindmap' && (
                  <MindMapViewer content={activeArtifact.content} />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface Flashcard {
  front: string;
  back: string;
}

export default function FlashcardViewer({ rawContent }: { rawContent: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const cards: Flashcard[] = useMemo(() => {
    try {
      return JSON.parse(rawContent) as Flashcard[];
    } catch (e) {
      console.error('Failed to parse flashcards:', e);
      return [];
    }
  }, [rawContent]);

  if (cards.length === 0) {
    return <div className="text-white/50 text-center py-10">Invalid flashcard data generated.</div>;
  }

  const currentCard = cards[currentIndex];

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % cards.length);
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((i) => (i - 1 + cards.length) % cards.length);
    }, 150);
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-2xl mx-auto w-full py-8">
      
      <div className="mb-8 text-white/50 text-sm font-medium tracking-widest uppercase">
        Card {currentIndex + 1} of {cards.length}
      </div>

      <div 
        className="relative w-full aspect-[3/2] cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          className="w-full h-full relative preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white/[0.04] border border-white/[0.1] rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl">
            <h3 className="text-3xl font-medium text-white mb-4 leading-tight">{currentCard.front}</h3>
            <p className="text-white/30 text-xs uppercase tracking-widest absolute bottom-6">Click to flip</p>
          </div>

          {/* Back */}
          <div 
            className="absolute inset-0 backface-hidden bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <p className="text-xl text-emerald-50 font-medium leading-relaxed">{currentCard.back}</p>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center gap-6 mt-10">
        <button 
          onClick={prevCard}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5 pr-0.5" />
        </button>
        
        <button 
          onClick={() => setIsFlipped(!isFlipped)}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button 
          onClick={nextCard}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5 pl-0.5" />
        </button>
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

export default function QuizViewer({ rawContent }: { rawContent: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const questions: QuizQuestion[] = useMemo(() => {
    try {
      return JSON.parse(rawContent) as QuizQuestion[];
    } catch (e) {
      console.error('Failed to parse quiz:', e);
      return [];
    }
  }, [rawContent]);

  if (questions.length === 0) {
    return <div className="text-white/50 text-center py-10">Invalid quiz data generated.</div>;
  }

  const handleSelect = (idx: number) => {
    if (selectedOption !== null) return; // already answered
    setSelectedOption(idx);
    if (idx === questions[currentIndex].answer) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
  };

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center max-w-xl mx-auto w-full py-16 text-center">
        <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6">
          <span className="text-3xl font-bold text-emerald-400">{percentage}%</span>
        </div>
        <h3 className="text-2xl font-semibold text-white mb-2">Quiz Complete!</h3>
        <p className="text-white/60 mb-8">You scored {score} out of {questions.length}.</p>
        
        <button 
          onClick={resetQuiz}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white transition-colors font-medium"
        >
          <RotateCcw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="flex flex-col max-w-2xl mx-auto w-full py-8">
      <div className="flex items-center justify-between mb-8">
        <span className="text-white/50 text-sm font-medium tracking-widest uppercase">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span className="text-emerald-400 text-sm font-medium">
          Score: {score}
        </span>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-8 mb-6">
        <h3 className="text-xl font-medium text-white mb-6 leading-relaxed">
          {currentQ.question}
        </h3>

        <div className="space-y-3">
          {currentQ.options.map((opt, idx) => {
            let stateClass = 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] text-white/80 hover:text-white';
            let icon = null;

            if (selectedOption !== null) {
              if (idx === currentQ.answer) {
                stateClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-50';
                icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
              } else if (idx === selectedOption) {
                stateClass = 'bg-red-500/10 border-red-500/30 text-red-100';
                icon = <XCircle className="w-5 h-5 text-red-400 shrink-0" />;
              } else {
                stateClass = 'bg-white/[0.01] border-transparent text-white/30 cursor-not-allowed';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={selectedOption !== null}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 ${stateClass}`}
              >
                <span className="text-sm font-medium leading-relaxed pr-4">{opt}</span>
                {icon}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedOption !== null && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end"
          >
            <button 
              onClick={nextQuestion}
              className="flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-white/90 transition shadow-lg shadow-white/10"
            >
              {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function Preloader() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Check if we've already loaded this session
    if (sessionStorage.getItem('nb-preloader')) {
      setStage(3);
      return;
    }
    sessionStorage.setItem('nb-preloader', 'true');
    
    // Stage 0 -> 1: Loading bar completes (Speed up significantly)
    const t1 = setTimeout(() => {
      setStage(1);
    }, 600);

    // Stage 1 -> 2: CRT Line expands vertically
    const t2 = setTimeout(() => {
      setStage(2);
    }, 700);

    // Stage 2 -> 3: Full website revealed, preloader destroyed
    const t3 = setTimeout(() => {
      setStage(3);
    }, 1100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (stage === 3) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center bg-black overflow-hidden">
      
      {/* Loading Phase */}
      <AnimatePresence>
        {stage === 0 && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-10"
          >
            <div className="relative w-48 h-48 md:w-64 md:h-64 animate-pulse mix-blend-screen">
              <Image src="/logo2.png" alt="NebulaFlow" fill className="object-contain scale-110" priority />
            </div>

            <div className="absolute bottom-20 w-3/4 max-w-md h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="h-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.8)]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CRT Reveal Phase */}
      {stage >= 1 && (
        <motion.div
          className="absolute bg-white shadow-[0_0_100px_rgba(255,255,255,1)]"
          initial={{
            // Start as a tiny dot
            width: '0%',
            height: '2px',
            opacity: 0,
          }}
          animate={
            stage === 1
              ? {
                  // Shoot out horizontally into a thin line
                  width: '100vw',
                  height: '2px',
                  opacity: 1,
                  transition: { duration: 0.1, ease: 'easeOut' },
                }
              : {
                  // Expand vertically to reveal the screen, then fade out
                  width: '100vw',
                  height: '100vh',
                  opacity: 0,
                  transition: { duration: 0.4, ease: 'easeInOut' },
                }
          }
        />
      )}
    </div>
  );
}

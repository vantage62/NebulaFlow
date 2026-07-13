'use client';

import { type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export default function GlassCard({ children, className = '', hover = true, delay = 0, ...props }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={cn(
        'relative rounded-2xl overflow-hidden',
        'bg-white/[0.03] border border-white/[0.08]',
        'backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]',
        hover && 'hover:border-white/[0.15] hover:bg-white/[0.05] transition-colors duration-300',
        className
      )}
      {...props}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {children}
    </motion.div>
  );
}

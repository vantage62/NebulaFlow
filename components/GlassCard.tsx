'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export default function GlassCard({ children, className = '', hover = true, delay = 0, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl overflow-hidden glass-panel animate-fade-in-up',
        hover && 'hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] hover:border-white/[0.15] transition-all duration-300',
        className
      )}
      style={{ animationDelay: `${delay}s`, ...props.style }}
      {...props}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {children}
    </div>
  );
}

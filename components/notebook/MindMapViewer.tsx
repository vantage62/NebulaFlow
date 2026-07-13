'use client';

import { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function MindMapViewer({ content }: { content: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    
    const renderMindMap = async () => {
      if (!containerRef.current) return;
      
      try {
        // Dynamically import mermaid to avoid SSR issues
        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default;
        
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          fontFamily: 'inherit',
        });
        
        // Generate a unique ID for the SVG
        const id = `mermaid-${uuidv4().replace(/-/g, '')}`;
        const { svg } = await mermaid.render(id, content);
        
        if (isMounted && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (e) {
        console.error('Mermaid render error', e);
        if (isMounted && containerRef.current) {
          containerRef.current.innerHTML = '<div class="text-red-400 p-4 border border-red-500/20 rounded-xl bg-red-500/10 text-sm">Failed to render mind map. The AI generated invalid Mermaid.js syntax.</div>';
        }
      }
    };

    renderMindMap();

    return () => {
      isMounted = false;
    };
  }, [content]);

  return (
    <div className="w-full bg-white/[0.02] border border-white/[0.08] rounded-3xl p-8 overflow-x-auto">
      <div 
        ref={containerRef} 
        className="flex justify-center min-w-max mx-auto"
      />
    </div>
  );
}

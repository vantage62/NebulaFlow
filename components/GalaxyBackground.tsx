'use client';

import dynamic from 'next/dynamic';
import { useIsMobile } from '@/hooks/use-mobile';
import CSSStarfield from './CSSStarfield';

const Galaxy = dynamic(() => import('./Galaxy'), { ssr: false });

export default function GalaxyBackground() {
  const isMobile = useIsMobile();

  return (
    <div style={{ width: '100%', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: -1, overflow: 'hidden' }}>
      {isMobile ? (
        <CSSStarfield />
      ) : (
        <Galaxy
          starSpeed={0.5}
          density={1}
          hueShift={140}
          speed={2.5}
          glowIntensity={0.4}
          saturation={0}
          mouseRepulsion
          repulsionStrength={0.5}
          twinkleIntensity={0.3}
          rotationSpeed={0.1}
          transparent
        />
      )}
    </div>
  );
}

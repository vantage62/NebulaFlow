'use client';

import dynamic from 'next/dynamic';

const Galaxy = dynamic(() => import('./Galaxy'), { ssr: false });

export default function GalaxyBackground() {
  return (
    <div style={{ width: '100%', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: -1, overflow: 'hidden' }}>
      <Galaxy
        starSpeed={0.9}
        density={3}
        hueShift={140}
        speed={1.9}
        glowIntensity={0.5}
        saturation={0}
        mouseRepulsion
        repulsionStrength={1.5}
        twinkleIntensity={0.3}
        rotationSpeed={0.1}
        transparent
      />
    </div>
  );
}

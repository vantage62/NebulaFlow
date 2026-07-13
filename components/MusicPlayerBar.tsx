'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  CloudRain,
  Radio,
  ListMusic,
  ChevronRight,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types & data                                                       */
/* ------------------------------------------------------------------ */

type AudioMode = 'lofi' | 'ambient' | 'local';

interface Track {
  name: string;
  artist: string;
  color: string; // accent gradient colour
  url?: string;
}

const LOFI_TRACKS: Track[] = [
  { name: 'Midnight Keys', artist: 'NebulaFlow', color: '#a78bfa' },
  { name: 'Rainy Café', artist: 'NebulaFlow', color: '#67e8f9' },
  { name: 'Starlit Pages', artist: 'NebulaFlow', color: '#f9a8d4' },
  { name: 'Warm Vinyl', artist: 'NebulaFlow', color: '#fbbf24' },
  { name: 'Dreamy Drift', artist: 'NebulaFlow', color: '#86efac' },
];

const AMBIENT_TRACKS: Track[] = [
  { name: 'Gentle Rain', artist: 'Ambient', color: '#67e8f9' },
  { name: 'White Noise', artist: 'Ambient', color: '#e2e8f0' },
  { name: 'Brown Noise', artist: 'Ambient', color: '#d4a574' },
  { name: 'Ocean Waves', artist: 'Ambient', color: '#38bdf8' },
  { name: 'Binaural Focus', artist: 'Ambient', color: '#c084fc' },
];

const LOCAL_TRACKS: Track[] = [
  { name: 'Again', artist: 'Masaru Yokoyama', color: '#ef4444', url: '/tracks/Again.mp3' },
  { name: 'Back In Black', artist: 'AC/DC', color: '#ef4444', url: '/tracks/Back In Black.mp3' },
  { name: 'Cool For The Summer', artist: 'Demi Lovato', color: '#ef4444', url: '/tracks/Cool For The Summer.mp3' },
  { name: 'Green Green Grass Sped Up', artist: 'George Ezra', color: '#ef4444', url: '/tracks/Green Green Grass Sped Up.mp3' },
  { name: 'Harvey', artist: 'Her\'s ', color: '#ef4444', url: '/tracks/Harvey.mp3' },
  { name: 'Hotel Room', artist: 'Ax and the Hatchetmen', color: '#ef4444', url: '/tracks/Hotel Room.mp3' },
  { name: 'Introduction and Rondo Capriccioso Saint Saëns', artist: 'Saint Saëns', color: '#ef4444', url: '/tracks/Introduction and Rondo Capriccioso Saint Saëns Shigatsu Wa Kimi No Uso Sheets.mp3' },
  { name: 'Kimi Ga Iru', artist: 'Masaru Yokoyama', color: '#ef4444', url: '/tracks/Kimi Ga Iru.mp3' },
  { name: 'Kimiwa Wasurerareruno', artist: 'Masaru Yokoyama', color: '#ef4444', url: '/tracks/Kimiwa Wasurerareruno.mp3' },
  { name: 'Let It Happen', artist: 'Tame Impala', color: '#ef4444', url: '/tracks/Let It Happen.mp3' },
  { name: 'Love You Like A Love Song Slowed Reverb', artist: 'Selena Gomez', color: '#ef4444', url: '/tracks/Love You Like A Love Song Slowed Reverb.mp3' },
  { name: 'Set Fire to the Rain', artist: 'Adele', color: '#ef4444', url: '/tracks/Set Fire to the Rain.mp3' },
  { name: 'Skyfall', artist: 'Adele', color: '#ef4444', url: '/tracks/Skyfall.mp3' },
  { name: 'Solo feat.Demi Lovato', artist: 'Clean Bandit', color: '#ef4444', url: '/tracks/Solo feat.Demi Lovato.mp3' },
  { name: 'Stress Relief', artist: 'late night drive home', color: '#ef4444', url: '/tracks/Stress Relief.mp3' },
  { name: 'Tek It Sped Up', artist: 'Cafune', color: '#ef4444', url: '/tracks/Tek It Sped Up.mp3' },
  { name: 'The Less I Know The Better', artist: 'Tame Impala', color: '#ef4444', url: '/tracks/The Less I Know The Better.mp3' },
  { name: 'Uso To Honto', artist: 'Masaru Yokoyama', color: '#ef4444', url: '/tracks/Uso To Honto.mp3' },
  { name: 'Watashino Uso', artist: 'Masaru Yokoyama', color: '#ef4444', url: '/tracks/Watashino Uso.mp3' },
  { name: 'Chopin Ballade No 1 in G Minor', artist: 'Frederic Chopin', color: '#ef4444', url: '/tracks/Your Lie In April Last Performance Full Version Ballade No 1 in G Minor.mp3' },
];

/* ------------------------------------------------------------------ */
/*  Generative audio helpers                                           */
/* ------------------------------------------------------------------ */

/** Creates a buffer filled with white noise */
function createNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(2, sr * seconds, sr);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return buf;
}

/** Creates a brown-noise buffer (integrated white noise) */
function createBrownNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(2, sr * seconds, sr);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return buf;
}

/** Builds the graph for an ambient sound and returns a cleanup function */
function buildAmbientGraph(
  ctx: AudioContext,
  analyser: AnalyserNode,
  gain: GainNode,
  trackIndex: number,
): { stop: () => void } {
  const nodes: AudioNode[] = [];

  const connectAndTrack = (node: AudioNode, dest: AudioNode) => {
    node.connect(dest);
    nodes.push(node);
  };

  switch (trackIndex) {
    case 0: {
      // Gentle Rain — band-pass filtered noise + modulation
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = createNoiseBuffer(ctx, 6);
      noiseSrc.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 800;
      bp.Q.value = 0.5;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3000;
      // Subtle LFO for rain patter
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.3;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 400;
      lfo.connect(lfoGain);
      lfoGain.connect(bp.frequency);
      lfo.start();
      noiseSrc.connect(bp);
      bp.connect(lp);
      connectAndTrack(lp, analyser);
      connectAndTrack(analyser, gain);
      noiseSrc.start();
      nodes.push(noiseSrc, bp, lfo, lfoGain);
      break;
    }
    case 1: {
      // White Noise
      const src = ctx.createBufferSource();
      src.buffer = createNoiseBuffer(ctx, 4);
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 8000;
      src.connect(lp);
      connectAndTrack(lp, analyser);
      connectAndTrack(analyser, gain);
      src.start();
      nodes.push(src);
      break;
    }
    case 2: {
      // Brown Noise
      const src = ctx.createBufferSource();
      src.buffer = createBrownNoiseBuffer(ctx, 6);
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 500;
      src.connect(lp);
      connectAndTrack(lp, analyser);
      connectAndTrack(analyser, gain);
      src.start();
      nodes.push(src);
      break;
    }
    case 3: {
      // Ocean Waves — layered noise with slow modulation
      const src = ctx.createBufferSource();
      src.buffer = createNoiseBuffer(ctx, 8);
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 400;
      bp.Q.value = 0.3;
      const modGain = ctx.createGain();
      modGain.gain.value = 0;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.08;
      const lfoAmp = ctx.createGain();
      lfoAmp.gain.value = 0.6;
      lfo.connect(lfoAmp);
      lfoAmp.connect(modGain.gain);
      lfo.start();
      src.connect(bp);
      bp.connect(modGain);
      connectAndTrack(modGain, analyser);
      connectAndTrack(analyser, gain);
      src.start();
      nodes.push(src, bp, lfo, lfoAmp);
      break;
    }
    case 4: {
      // Binaural Focus — two tones at 200 Hz and 210 Hz
      const oscL = ctx.createOscillator();
      oscL.frequency.value = 200;
      oscL.type = 'sine';
      const panL = ctx.createStereoPanner();
      panL.pan.value = -1;
      oscL.connect(panL);
      connectAndTrack(panL, analyser);

      const oscR = ctx.createOscillator();
      oscR.frequency.value = 210;
      oscR.type = 'sine';
      const panR = ctx.createStereoPanner();
      panR.pan.value = 1;
      oscR.connect(panR);
      connectAndTrack(panR, analyser);

      connectAndTrack(analyser, gain);
      oscL.start();
      oscR.start();
      nodes.push(oscL, oscR);
      break;
    }
  }

  return {
    stop: () => {
      nodes.forEach((n) => {
        try {
          n.disconnect();
        } catch { /* already disconnected */ }
        if (n instanceof AudioBufferSourceNode || n instanceof OscillatorNode) {
          try { n.stop(); } catch { /* already stopped */ }
        }
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Lofi generative music helper                                       */
/* ------------------------------------------------------------------ */

/** Builds a simple lofi beat pattern using oscillators + filters */
function buildLofiGraph(
  ctx: AudioContext,
  analyser: AnalyserNode,
  gain: GainNode,
  trackIndex: number,
): { stop: () => void } {
  // Each track gets a different chord / arpeggio pattern
  const chords: number[][] = [
    [261.63, 329.63, 392.00, 493.88],   // C E G B  (Cmaj7)
    [293.66, 349.23, 440.00, 523.25],   // D F A C  (Dm7)
    [329.63, 392.00, 493.88, 587.33],   // E G B D  (Em7)
    [349.23, 440.00, 523.25, 659.25],   // F A C E  (Fmaj7)
    [392.00, 493.88, 587.33, 698.46],   // G B D F  (G7)
  ];
  const notes = chords[trackIndex % chords.length];
  const sources: (OscillatorNode | AudioBufferSourceNode)[] = [];
  const allNodes: AudioNode[] = [];

  // Pad layer — warm, detuned oscillators
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq / 2; // octave lower for warmth
    osc.detune.value = (i % 2 === 0 ? 1 : -1) * (5 + i * 2); // subtle detune

    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.04; // Lowered to prevent clipping

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600 + trackIndex * 100;
    filter.Q.value = 1;

    // Slow filter sweep for movement
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05 + i * 0.02;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    osc.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(analyser);
    osc.start();

    sources.push(osc);
    allNodes.push(osc, filter, oscGain, lfo, lfoGain);
  });

  // Arpeggio layer — gentle plucked notes
  const arpeggioNotes = [...notes, ...notes.map((n) => n * 2)];
  let arpeggioIdx = 0;
  const arpeggioInterval = setInterval(() => {
    const freq = arpeggioNotes[arpeggioIdx % arpeggioNotes.length];
    arpeggioIdx++;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const envGain = ctx.createGain();
    envGain.gain.setValueAtTime(0.04, ctx.currentTime); // Lowered
    envGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;
    filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 1.5);

    osc.connect(filter);
    filter.connect(envGain);
    envGain.connect(analyser);
    osc.start();
    osc.stop(ctx.currentTime + 2);
  }, 600 + trackIndex * 100); // different tempo per track

  // Sub bass layer
  const subOsc = ctx.createOscillator();
  subOsc.type = 'sine';
  subOsc.frequency.value = notes[0] / 4;
  const subGain = ctx.createGain();
  subGain.gain.value = 0.1;
  const subFilter = ctx.createBiquadFilter();
  subFilter.type = 'lowpass';
  subFilter.frequency.value = 150;
  subOsc.connect(subFilter);
  subFilter.connect(subGain);
  subGain.connect(analyser);
  subOsc.start();
  sources.push(subOsc);
  allNodes.push(subOsc, subFilter, subGain);

  // Vinyl crackle noise layer
  const crackle = ctx.createBufferSource();
  crackle.buffer = createNoiseBuffer(ctx, 4);
  crackle.loop = true;
  const crackleFilter = ctx.createBiquadFilter();
  crackleFilter.type = 'highpass';
  crackleFilter.frequency.value = 5000;
  const crackleGain = ctx.createGain();
  crackleGain.gain.value = 0.008; // Lowered
  crackle.connect(crackleFilter);
  crackleFilter.connect(crackleGain);
  crackleGain.connect(analyser);
  crackle.start();
  sources.push(crackle);
  allNodes.push(crackle, crackleFilter, crackleGain);

  analyser.connect(gain);

  return {
    stop: () => {
      clearInterval(arpeggioInterval);
      allNodes.forEach((n) => {
        try { n.disconnect(); } catch { /* ok */ }
      });
      sources.forEach((s) => {
        try { s.stop(); } catch { /* ok */ }
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function formatTime(seconds: number) {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MusicPlayerBar() {
  const [isMinimized, setIsMinimized] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mode, setMode] = useState<AudioMode>('lofi');
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackIdx, setTrackIdx] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(32).fill(0));
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const rafRef = useRef<number>(0);

  const tracks = mode === 'lofi' ? LOFI_TRACKS : mode === 'ambient' ? AMBIENT_TRACKS : LOCAL_TRACKS;
  const currentTrack = tracks[trackIdx] || tracks[0];

  /* ---------- ensure AudioContext exists -------------------------------- */
  const getAudioContext = useCallback(() => {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new AudioCtx();
      analyserRef.current = ctxRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      gainRef.current = ctxRef.current.createGain();
      gainRef.current.gain.value = 0.8; // Give some headroom

      const compressor = ctxRef.current.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;

      gainRef.current.connect(compressor);
      compressor.connect(ctxRef.current.destination);
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return {
      ctx: ctxRef.current,
      analyser: analyserRef.current!,
      gain: gainRef.current!,
    };
  }, []);

  /* ---------- start / stop audio ---------------------------------------- */
  const startAudio = useCallback(() => {
    // tear down any existing graph
    stopRef.current?.();

    if (mode === 'local') {
      setIsPlaying(true);
      return;
    }

    const { ctx, analyser, gain } = getAudioContext();

    // Disconnect analyser from gain first to avoid duplicate connections
    try { analyser.disconnect(); } catch { /* ok */ }

    const result =
      mode === 'lofi'
        ? buildLofiGraph(ctx, analyser, gain, trackIdx)
        : buildAmbientGraph(ctx, analyser, gain, trackIdx);

    stopRef.current = result.stop;
    setIsPlaying(true);
  }, [mode, trackIdx, getAudioContext]);

  const stopAudio = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    setIsPlaying(false);
  }, []);

  /* ---------- volume sync ------------------------------------------------ */
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = isMuted ? 0 : volume;
    }
    if (localAudioRef.current) {
      localAudioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, mode]);

  /* ---------- local audio play/pause sync -------------------------------- */
  useEffect(() => {
    if (mode === 'local' && localAudioRef.current) {
      if (isPlaying) {
        const p = localAudioRef.current.play();
        if (p !== undefined) {
          p.catch(e => console.log('Playback error/interruption:', e));
        }
      } else {
        localAudioRef.current.pause();
      }
    }
  }, [isPlaying, mode, currentTrack.url]);

  /* ---------- visualizer loop -------------------------------------------- */
  useEffect(() => {
    if (!isPlaying) {
      setVisualizerData(new Array(32).fill(0));
      return;
    }

    if (mode === 'local') {
      let time = 0;
      const tick = () => {
        time += 0.1;
        const fakeData = new Array(32).fill(0).map((_, i) => {
          return 40 + Math.sin(time + i * 0.5) * 30 + Math.random() * 40;
        });
        setVisualizerData(fakeData);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafRef.current);
    }

    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const dataArr = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(dataArr);
      setVisualizerData(Array.from(dataArr));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, mode]);

  /* ---------- cleanup on unmount ---------------------------------------- */
  useEffect(() => {
    return () => {
      stopRef.current?.();
      cancelAnimationFrame(rafRef.current);
      ctxRef.current?.close();
    };
  }, []);

  /* ---------- track / mode change while playing -------------------------- */
  useEffect(() => {
    if (isPlaying) startAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, trackIdx]);

  /* ---------- navigation helpers ---------------------------------------- */
  const prevTrack = () => {
    setTrackIdx((i) => (i - 1 + tracks.length) % tracks.length);
  };
  const nextTrack = () => {
    setTrackIdx((i) => (i + 1) % tracks.length);
  };
  const togglePlay = () => (isPlaying ? stopAudio() : startAudio());

  /* ---------- visualizer bars ------------------------------------------- */
  const BAR_COUNT = 24;
  const bars = visualizerData.slice(0, BAR_COUNT);

  /* ====================================================================== */
  /*  RENDER                                                                 */
  /* ====================================================================== */

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40" id="music-player">
      <AnimatePresence mode="wait">
        {isMinimized ? (
          /* ─────────── MINIMIZED PILL ─────────── */
          <motion.button
            key="pill"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsMinimized(false)}
            className="group relative flex items-center gap-3 px-4 py-2.5 rounded-full
              bg-black/60 backdrop-blur-2xl border border-white/[0.1]
              hover:border-white/[0.2] hover:bg-black/70 transition-all
              shadow-[0_8px_32px_rgba(0,0,0,0.4)]
              cursor-pointer"
          >
            {/* Glow ring */}
            <div
              className="absolute inset-0 rounded-full opacity-30 group-hover:opacity-50 transition-opacity blur-xl -z-10"
              style={{ background: `radial-gradient(circle, ${currentTrack.color}40, transparent)` }}
            />

            {/* Mini visualizer */}
            <div className="flex items-center gap-[2px] h-4">
              {bars.slice(0, 5).map((v, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full"
                  style={{ background: currentTrack.color }}
                  animate={{ height: isPlaying ? Math.max(4, (v / 255) * 16) : 4 }}
                  transition={{ duration: 0.1 }}
                />
              ))}
            </div>

            <span className="text-white/70 text-xs font-medium max-w-[120px] truncate">
              {isPlaying ? currentTrack.name : 'Music'}
            </span>

            {/* Play indicator */}
            {isPlaying && (
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: currentTrack.color }}
              />
            )}

            <Maximize2 className="w-3 h-3 text-white/40 group-hover:text-white/70 transition-colors" />
          </motion.button>
        ) : (
          /* ─────────── EXPANDED BAR ─────────── */
          <motion.div
            key="bar"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex items-center gap-4 px-5 py-3 rounded-2xl
              bg-black/70 backdrop-blur-2xl border border-white/[0.1]
              shadow-[0_8px_40px_rgba(0,0,0,0.5)]
              w-[min(580px,calc(100vw-2rem))]"
          >
            {/* Accent glow */}
            <div
              className="absolute inset-0 rounded-2xl opacity-20 blur-2xl -z-10 transition-colors duration-700"
              style={{ background: `radial-gradient(ellipse at center, ${currentTrack.color}30, transparent 70%)` }}
            />
            {/* Top highlight line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-t-2xl" />

            {/* PLAYLIST MENU TOGGLE */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all border
                  ${isMenuOpen
                    ? 'bg-white/[0.15] border-white/[0.25]'
                    : 'bg-white/[0.06] border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.15]'
                  }`}
                title="Playlist Menu"
              >
                <ListMusic className="w-4 h-4 text-white/70" />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-[calc(100%+16px)] left-0 w-64 p-3 rounded-2xl
                      bg-black/80 backdrop-blur-3xl border border-white/[0.1]
                      shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-50 overflow-hidden"
                  >
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                      {/* Lofi Section */}
                      <div>
                        <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
                          <Radio className="w-3 h-3" /> Lofi Beats
                        </h4>
                        <div className="space-y-0.5">
                          {LOFI_TRACKS.map((t, i) => (
                            <button
                              key={t.name}
                              onClick={() => {
                                setMode('lofi');
                                setTrackIdx(i);
                                if (!isPlaying) togglePlay();
                                setIsMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${mode === 'lofi' && trackIdx === i
                                ? 'bg-white/[0.1] text-white'
                                : 'text-white/50 hover:bg-white/[0.05] hover:text-white'
                                }`}
                            >
                              <span className="truncate">{t.name}</span>
                              {mode === 'lofi' && trackIdx === i && isPlaying && (
                                <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: t.color }} />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Ambient Section */}
                      <div>
                        <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
                          <CloudRain className="w-3 h-3" /> Ambient Sounds
                        </h4>
                        <div className="space-y-0.5">
                          {AMBIENT_TRACKS.map((t, i) => (
                            <button
                              key={t.name}
                              onClick={() => {
                                setMode('ambient');
                                setTrackIdx(i);
                                if (!isPlaying) togglePlay();
                                setIsMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${mode === 'ambient' && trackIdx === i
                                ? 'bg-white/[0.1] text-white'
                                : 'text-white/50 hover:bg-white/[0.05] hover:text-white'
                                }`}
                            >
                              <span className="truncate">{t.name}</span>
                              {mode === 'ambient' && trackIdx === i && isPlaying && (
                                <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: t.color }} />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Local Section */}
                      <div>
                        <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
                          <Music className="w-3 h-3" /> My Playlist
                        </h4>
                        <div className="space-y-0.5">
                          {LOCAL_TRACKS.map((t, i) => (
                            <button
                              key={t.name}
                              onClick={() => {
                                setMode('local');
                                setTrackIdx(i);
                                if (!isPlaying) togglePlay();
                                setIsMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${mode === 'local' && trackIdx === i
                                ? 'bg-white/[0.1] text-white'
                                : 'text-white/50 hover:bg-white/[0.05] hover:text-white'
                                }`}
                            >
                              <span className="truncate">{t.name}</span>
                              {mode === 'local' && trackIdx === i && isPlaying && (
                                <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: t.color }} />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* CONTROLS */}
            <div className="flex items-center gap-1">
              <button
                onClick={prevTrack}
                className="w-8 h-8 flex items-center justify-center rounded-lg
                  hover:bg-white/[0.06] transition-colors text-white/60 hover:text-white"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
                style={{
                  background: isPlaying
                    ? `linear-gradient(135deg, ${currentTrack.color}, ${currentTrack.color}80)`
                    : 'rgba(255,255,255,0.1)',
                }}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-black" />
                ) : (
                  <Play className="w-4 h-4 text-white ml-0.5" />
                )}
              </button>

              <button
                onClick={nextTrack}
                className="w-8 h-8 flex items-center justify-center rounded-lg
                  hover:bg-white/[0.06] transition-colors text-white/60 hover:text-white"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* TRACK INFO + VISUALIZER */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-3 w-full">
                {/* Track info */}
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate leading-tight">
                    {currentTrack.name}
                  </p>
                  <p className="text-white/40 text-[11px] truncate leading-tight">
                    {currentTrack.artist}
                  </p>
                </div>

                {/* Visualizer bars */}
                <div className="hidden sm:flex items-end gap-[2px] h-8 justify-center shrink-0">
                {bars.map((value, i) => {
                  const normHeight = isPlaying ? Math.max(3, (value / 255) * 32) : 3;
                  const hue = (i / BAR_COUNT) * 60; // spread a gradient across bars
                  return (
                    <motion.div
                      key={i}
                      className="rounded-full"
                      style={{
                        width: '2.5px',
                        background: isPlaying
                          ? `hsl(${hue + (currentTrack.color === '#67e8f9' ? 180 : currentTrack.color === '#a78bfa' ? 260 : currentTrack.color === '#f9a8d4' ? 330 : currentTrack.color === '#fbbf24' ? 40 : currentTrack.color === '#86efac' ? 150 : 200)}, 70%, ${55 + (value / 255) * 30}%)`
                          : 'rgba(255,255,255,0.15)',
                      }}
                      animate={{ height: normHeight }}
                      transition={{ duration: 0.08, ease: 'linear' }}
                    />
                  );
                })}
                </div>
              </div>

              {/* Progress Slider (Local Mode) */}
              {mode === 'local' && duration > 0 && (
                <div className="w-full flex items-center gap-2 mt-1">
                  <span className="text-[9px] text-white/40 tabular-nums">{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={(e) => {
                      const newTime = parseFloat(e.target.value);
                      setCurrentTime(newTime);
                      if (localAudioRef.current) {
                        localAudioRef.current.currentTime = newTime;
                      }
                    }}
                    className="music-volume-slider flex-1 h-1 appearance-none rounded-full cursor-pointer bg-white/10"
                    style={{
                      '--track-color': currentTrack.color,
                      background: `linear-gradient(to right, ${currentTrack.color} ${(currentTime / duration) * 100}%, rgba(255,255,255,0.1) ${(currentTime / duration) * 100}%)`
                    } as React.CSSProperties}
                  />
                  <span className="text-[9px] text-white/40 tabular-nums">{formatTime(duration)}</span>
                </div>
              )}
            </div>

            {/* VOLUME */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-7 h-7 flex items-center justify-center rounded-lg
                  hover:bg-white/[0.06] transition-colors text-white/50 hover:text-white"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="music-volume-slider w-16 h-1 appearance-none rounded-full cursor-pointer"
                style={
                  {
                    '--track-color': currentTrack.color,
                  } as React.CSSProperties
                }
              />
            </div>

            {/* MINIMIZE */}
            <button
              onClick={() => setIsMinimized(true)}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg
                hover:bg-white/[0.06] transition-colors text-white/40 hover:text-white"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {mode === 'local' && currentTrack.url && (
        <audio
          ref={localAudioRef}
          src={currentTrack.url}
          onEnded={nextTrack}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          className="hidden"
          autoPlay={isPlaying}
        />
      )}
    </div>
  );
}

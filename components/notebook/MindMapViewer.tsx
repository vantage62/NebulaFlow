'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, Download, ThumbsUp, ThumbsDown } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MindMapChild {
  label: string;
}

interface MindMapBranch {
  label: string;
  children?: MindMapChild[];
}

interface MindMapData {
  topic: string;
  branches: MindMapBranch[];
}

/* ------------------------------------------------------------------ */
/*  Color palette for branches                                         */
/* ------------------------------------------------------------------ */

const BRANCH_COLORS = [
  { bg: '#7c3aed', border: '#6d28d9', text: '#f5f3ff' },   // violet
  { bg: '#6366f1', border: '#4f46e5', text: '#eef2ff' },   // indigo
  { bg: '#8b5cf6', border: '#7c3aed', text: '#f5f3ff' },   // purple
  { bg: '#a78bfa', border: '#8b5cf6', text: '#faf5ff' },   // light purple
  { bg: '#818cf8', border: '#6366f1', text: '#eef2ff' },   // light indigo
  { bg: '#c084fc', border: '#a855f7', text: '#faf5ff' },   // fuchsia-purple
  { bg: '#7dd3fc', border: '#38bdf8', text: '#0c4a6e' },   // sky
];

const CHILD_COLORS = [
  { bg: '#1e1b4b', border: '#312e81', text: '#c7d2fe' },   // dark indigo
  { bg: '#1e1040', border: '#2e1065', text: '#d8b4fe' },   // dark purple
  { bg: '#172554', border: '#1e3a5f', text: '#bfdbfe' },   // dark blue
  { bg: '#1a1333', border: '#2d1f5e', text: '#c4b5fd' },   // dark violet
  { bg: '#0f172a', border: '#1e293b', text: '#94a3b8' },   // slate
  { bg: '#1c1227', border: '#3b1f65', text: '#d8b4fe' },   // plum
  { bg: '#0c1929', border: '#1e3a5f', text: '#7dd3fc' },   // navy
];

/* ------------------------------------------------------------------ */
/*  Layout constants                                                   */
/* ------------------------------------------------------------------ */

const NODE_HEIGHT = 36;
const NODE_RX = 18;
const ROOT_PAD_X = 28;
const ROOT_PAD_Y = 12;
const BRANCH_PAD_X = 18;
const BRANCH_PAD_Y = 8;
const CHILD_PAD_X = 14;
const CHILD_PAD_Y = 6;
const H_GAP_ROOT_BRANCH = 100;
const H_GAP_BRANCH_CHILD = 80;
const V_GAP_BRANCH = 16;
const V_GAP_CHILD = 10;

/* ------------------------------------------------------------------ */
/*  Text measurement helper                                            */
/* ------------------------------------------------------------------ */

function measureText(text: string, fontSize: number, fontWeight: string = '500'): number {
  if (typeof document === 'undefined') return text.length * fontSize * 0.6;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return text.length * fontSize * 0.6;
  ctx.font = `${fontWeight} ${fontSize}px Inter, system-ui, sans-serif`;
  return ctx.measureText(text).width;
}

/* ------------------------------------------------------------------ */
/*  Layout computation                                                 */
/* ------------------------------------------------------------------ */

interface LayoutNode {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  type: 'root' | 'branch' | 'child';
  colorIdx: number;
  children?: LayoutNode[];
}

function computeLayout(data: MindMapData): { root: LayoutNode; width: number; height: number } {
  // Measure root
  const rootTextW = measureText(data.topic, 16, '700');
  const rootW = rootTextW + ROOT_PAD_X * 2;
  const rootH = NODE_HEIGHT + ROOT_PAD_Y * 2;

  // Split branches: top half goes right-up, bottom half goes right-down
  // Actually for NotebookLM style, all branches on the right side in a vertical list
  const branches = data.branches || [];

  // Compute branch + children layout
  const branchLayouts: LayoutNode[] = [];
  let maxRightExtent = 0;

  for (let i = 0; i < branches.length; i++) {
    const b = branches[i];
    const bTextW = measureText(b.label, 13, '600');
    const bW = bTextW + BRANCH_PAD_X * 2;
    const bH = NODE_HEIGHT;

    const childLayouts: LayoutNode[] = [];
    if (b.children && b.children.length > 0) {
      for (let j = 0; j < b.children.length; j++) {
        const c = b.children[j];
        const cTextW = measureText(c.label, 12, '500');
        const cW = cTextW + CHILD_PAD_X * 2;
        const cH = NODE_HEIGHT - 4;
        childLayouts.push({
          x: 0, y: 0, w: cW, h: cH,
          label: c.label, type: 'child', colorIdx: i,
        });
      }
    }

    const childrenTotalH = childLayouts.length > 0
      ? childLayouts.reduce((sum, c) => sum + c.h, 0) + (childLayouts.length - 1) * V_GAP_CHILD
      : 0;

    const branchBlockH = Math.max(bH, childrenTotalH);

    // Position children relative to branch
    if (childLayouts.length > 0) {
      let cy = -childrenTotalH / 2;
      for (const cl of childLayouts) {
        cl.x = bW + H_GAP_BRANCH_CHILD;
        cl.y = cy + cl.h / 2;
        cy += cl.h + V_GAP_CHILD;
        maxRightExtent = Math.max(maxRightExtent, cl.x + cl.w);
      }
    }

    branchLayouts.push({
      x: 0, y: 0, w: bW, h: bH,
      label: b.label, type: 'branch', colorIdx: i,
      children: childLayouts,
    });
  }

  // Position branches vertically
  const branchesTotalH = branchLayouts.reduce((sum, b) => {
    const childrenH = b.children && b.children.length > 0
      ? b.children.reduce((s, c) => s + c.h, 0) + (b.children.length - 1) * V_GAP_CHILD
      : b.h;
    return sum + Math.max(b.h, childrenH);
  }, 0) + (branchLayouts.length - 1) * V_GAP_BRANCH;

  const branchStartX = rootW / 2 + H_GAP_ROOT_BRANCH;
  let by = -branchesTotalH / 2;

  for (const bl of branchLayouts) {
    const childrenH = bl.children && bl.children.length > 0
      ? bl.children.reduce((s, c) => s + c.h, 0) + (bl.children.length - 1) * V_GAP_CHILD
      : bl.h;
    const blockH = Math.max(bl.h, childrenH);
    bl.x = branchStartX;
    bl.y = by + blockH / 2;
    by += blockH + V_GAP_BRANCH;
  }

  // Compute total canvas
  const totalMaxRight = branchStartX + maxRightExtent + 60;
  const totalWidth = Math.max(rootW + 200, totalMaxRight + rootW / 2 + 60);
  const totalHeight = branchesTotalH + 160;

  const root: LayoutNode = {
    x: 0, y: 0,
    w: rootW, h: rootH,
    label: data.topic,
    type: 'root',
    colorIdx: 0,
    children: branchLayouts,
  };

  return { root, width: totalWidth, height: totalHeight };
}

/* ------------------------------------------------------------------ */
/*  SVG Curved Path helper                                             */
/* ------------------------------------------------------------------ */

function curvedPath(x1: number, y1: number, x2: number, y2: number): string {
  const midX = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
}

/* ------------------------------------------------------------------ */
/*  MindMapViewer Component                                            */
/* ------------------------------------------------------------------ */

export default function MindMapViewer({ content }: { content: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const [expandedBranches, setExpandedBranches] = useState<Set<number>>(new Set());

  // Parse the mind map data
  const mapData: MindMapData | null = useMemo(() => {
    try {
      let cleanContent = content.trim();
      // Strip markdown code fences if present
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
      }
      const parsed = JSON.parse(cleanContent);
      if (parsed && parsed.topic && Array.isArray(parsed.branches)) {
        // Initialize all branches as expanded
        setExpandedBranches(new Set(parsed.branches.map((_: any, i: number) => i)));
        return parsed as MindMapData;
      }
      throw new Error('Invalid mind map structure');
    } catch (e: any) {
      console.error('MindMap parse error:', e);
      setError('Failed to parse mind map data. Try regenerating.');
      return null;
    }
  }, [content]);

  // Compute layout
  const layout = useMemo(() => {
    if (!mapData) return null;
    return computeLayout(mapData);
  }, [mapData]);

  // Toggle branch expansion
  const toggleBranch = useCallback((idx: number) => {
    setExpandedBranches(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  // Zoom controls
  const zoomIn = () => setZoom(z => Math.min(z + 0.2, 3));
  const zoomOut = () => setZoom(z => Math.max(z - 0.2, 0.3));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Download as SVG
  const handleDownload = () => {
    const svgEl = containerRef.current?.querySelector('svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindmap.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.max(0.3, Math.min(3, z + delta)));
  };

  if (error || !layout) {
    return (
      <div className="w-full bg-red-500/5 border border-red-500/20 rounded-2xl p-6 text-center">
        <p className="text-red-400 text-sm">{error || 'Failed to render mind map.'}</p>
      </div>
    );
  }

  const { root, width: svgW, height: svgH } = layout;
  const cx = svgW / 2 - root.w / 4;
  const cy = svgH / 2;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Mind Map Canvas */}
      <div
        ref={containerRef}
        className="w-full bg-[#0a0a0f] border border-white/[0.06] rounded-2xl overflow-hidden relative"
        style={{ height: Math.max(450, svgH * 0.7), cursor: isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.3) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        <svg
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.2s ease',
          }}
          className="w-full h-full"
        >
          {/* Connectors: root → branches */}
          {root.children?.map((branch, i) => (
            <path
              key={`conn-root-${i}`}
              d={curvedPath(
                cx + root.w / 2, cy,
                cx + branch.x, cy + branch.y
              )}
              fill="none"
              stroke={BRANCH_COLORS[i % BRANCH_COLORS.length].bg}
              strokeWidth={2.5}
              strokeOpacity={0.5}
              className="mindmap-connector"
            />
          ))}

          {/* Connectors: branches → children */}
          {root.children?.map((branch, i) => (
            expandedBranches.has(i) && branch.children?.map((child, j) => (
              <path
                key={`conn-branch-${i}-${j}`}
                d={curvedPath(
                  cx + branch.x + branch.w, cy + branch.y,
                  cx + branch.x + child.x, cy + branch.y + child.y
                )}
                fill="none"
                stroke={BRANCH_COLORS[i % BRANCH_COLORS.length].bg}
                strokeWidth={1.5}
                strokeOpacity={0.3}
                className="mindmap-connector"
              />
            ))
          ))}

          {/* Root node */}
          <g className="mindmap-node" transform={`translate(${cx}, ${cy - root.h / 2})`}>
            <rect
              width={root.w}
              height={root.h}
              rx={root.h / 2}
              fill="url(#rootGradient)"
              stroke="rgba(139,92,246,0.5)"
              strokeWidth={2}
            />
            <text
              x={root.w / 2}
              y={root.h / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#f5f3ff"
              fontSize={16}
              fontWeight={700}
              fontFamily="Inter, system-ui, sans-serif"
            >
              {root.label}
            </text>
          </g>

          {/* Branch nodes */}
          {root.children?.map((branch, i) => {
            const color = BRANCH_COLORS[i % BRANCH_COLORS.length];
            const isExpanded = expandedBranches.has(i);
            return (
              <g key={`branch-${i}`}>
                {/* Branch node */}
                <g
                  className="mindmap-node"
                  transform={`translate(${cx + branch.x}, ${cy + branch.y - branch.h / 2})`}
                  onClick={() => toggleBranch(i)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    width={branch.w}
                    height={branch.h}
                    rx={NODE_RX}
                    fill={color.bg}
                    stroke={color.border}
                    strokeWidth={1.5}
                    opacity={0.9}
                  />
                  <text
                    x={branch.w / 2}
                    y={branch.h / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={color.text}
                    fontSize={13}
                    fontWeight={600}
                    fontFamily="Inter, system-ui, sans-serif"
                  >
                    {branch.label}
                  </text>
                  {/* Expand indicator */}
                  {branch.children && branch.children.length > 0 && (
                    <g transform={`translate(${branch.w + 6}, ${branch.h / 2})`}>
                      <circle r={8} fill="rgba(255,255,255,0.08)" />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="rgba(255,255,255,0.5)"
                        fontSize={10}
                        fontWeight={700}
                      >
                        {isExpanded ? '−' : '+'}
                      </text>
                    </g>
                  )}
                </g>

                {/* Child nodes */}
                {isExpanded && branch.children?.map((child, j) => {
                  const childColor = CHILD_COLORS[i % CHILD_COLORS.length];
                  return (
                    <g
                      key={`child-${i}-${j}`}
                      className="mindmap-node"
                      transform={`translate(${cx + branch.x + child.x}, ${cy + branch.y + child.y - child.h / 2})`}
                    >
                      <rect
                        width={child.w}
                        height={child.h}
                        rx={NODE_RX - 2}
                        fill={childColor.bg}
                        stroke={childColor.border}
                        strokeWidth={1}
                        opacity={0.85}
                      />
                      <text
                        x={child.w / 2}
                        y={child.h / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={childColor.text}
                        fontSize={12}
                        fontWeight={500}
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        {child.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="rootGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#4c1d95" />
            </linearGradient>
          </defs>
        </svg>

        {/* Zoom controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          <button onClick={resetView} className="w-9 h-9 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/50 hover:text-white transition" title="Reset view">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button onClick={zoomIn} className="w-9 h-9 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/50 hover:text-white transition" title="Zoom in">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={zoomOut} className="w-9 h-9 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/50 hover:text-white transition" title="Zoom out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={handleDownload} className="w-9 h-9 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/50 hover:text-white transition" title="Download SVG">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feedback buttons */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white/60 hover:text-white text-sm transition">
          <ThumbsUp className="w-4 h-4" /> Good content
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white/60 hover:text-white text-sm transition">
          <ThumbsDown className="w-4 h-4" /> Bad content
        </button>
      </div>
    </div>
  );
}

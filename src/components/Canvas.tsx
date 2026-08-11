import React, { useState, useEffect, useRef } from 'react';
import { Atom, Bond, ViewMode, ToolType } from '../types';
import { ELEMENT_COLORS, ELEMENT_NAMES, FUNCTIONAL_GROUPS } from '../constants';
import { atomBondOrder, maxValence, insidePolygon } from '../chemistryUtils';
import { 
  Plus, Minus, Layers, Eye, RefreshCw, ZoomIn, ZoomOut, 
  Maximize2, Minimize2, Trash2, Scissors, Move, Copy, RotateCw, 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Wifi, WifiOff,
  ChevronDown, ChevronUp
} from 'lucide-react';

interface CanvasProps {
  atoms: Atom[];
  bonds: Bond[];
  viewMode: ViewMode;
  tool: ToolType;
  activeElement: string;
  activeBond: number;
  selectedAtomId: string | null;
  setSelectedAtomId: (id: string | null) => void;
  selectedAtomIds?: Set<string>;
  setSelectedAtomIds?: (ids: Set<string>) => void;
  activeAtomIds?: Set<string>;
  onCanvasClick: (x: number, y: number) => void;
  onAtomClick: (atom: Atom) => void;
  onBondClick: (bond: Bond) => void;
  onAtomDrag: (atomId: string, x: number, y: number) => void;
  onBondGesture: (sourceAtom: Atom, targetAtom: Atom, type: number) => void;
  onLassoErase?: (atomIds: string[]) => void;
  onClearCanvas?: () => void;
  onMoveSelected?: (dx: number, dy: number) => void;
  onScaleSelected?: (factor: number) => void;
  onRotateSelected?: (angleDeg: number) => void;
  onDuplicateSelected?: () => void;
  onDeleteSelected?: () => void;
  onSelectAll?: () => void;
  isOnline?: boolean;
  showCarbonNumbers: boolean;
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  cameraYaw: number;
  setCameraYaw: React.Dispatch<React.SetStateAction<number>>;
  cameraPitch: number;
  setCameraPitch: React.Dispatch<React.SetStateAction<number>>;
  freeView: boolean;
  depth: number;
  setDepth: (d: number) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  atoms,
  bonds,
  viewMode,
  tool,
  activeElement,
  activeBond,
  selectedAtomId,
  setSelectedAtomId,
  selectedAtomIds,
  setSelectedAtomIds,
  activeAtomIds,
  onCanvasClick,
  onAtomClick,
  onBondClick,
  onAtomDrag,
  onBondGesture,
  onLassoErase,
  onClearCanvas,
  onMoveSelected,
  onScaleSelected,
  onRotateSelected,
  onDuplicateSelected,
  onDeleteSelected,
  onSelectAll,
  isOnline = true,
  showCarbonNumbers,
  scale,
  setScale,
  cameraYaw,
  setCameraYaw,
  cameraPitch,
  setCameraPitch,
  freeView,
  depth,
  setDepth
}) => {
  const [dragAtomId, setDragAtomId] = useState<string | null>(null);
  const [groupDragStart, setGroupDragStart] = useState<{ x: number; y: number } | null>(null);
  const [groupInitialAtoms, setGroupInitialAtoms] = useState<{ id: string; x: number; y: number }[]>([]);

  const [gestureStartAtom, setGestureStartAtom] = useState<Atom | null>(null);
  const [gesturePointer, setGesturePointer] = useState<{ x: number; y: number } | null>(null);
  const [lastAtomTap, setLastAtomTap] = useState<{ id: string; time: number } | null>(null);

  // Lasso selection & eraser state
  const [lassoPoints, setLassoPoints] = useState<{ x: number; y: number }[]>([]);
  const [isLassoing, setIsLassoing] = useState(false);
  const [isControlsMinimized, setIsControlsMinimized] = useState<boolean>(false);

  // Free Cam Orbit dragging & Auto spin state
  const [isOrbitDragging, setIsOrbitDragging] = useState(false);
  const [orbitStart, setOrbitStart] = useState<{ x: number; y: number; yaw: number; pitch: number }>({
    x: 0,
    y: 0,
    yaw: 0,
    pitch: 0
  });
  const [isAutoSpin, setIsAutoSpin] = useState(false);

  // Multi-touch tracking for Android phone touchscreens & Smart Boards (Pinch-to-zoom)
  const touchPointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchDistRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);

  useEffect(() => {
    if (!isAutoSpin || viewMode !== '3d') return;
    const interval = setInterval(() => {
      setCameraYaw(prev => (prev >= 180 ? -180 : prev + 1));
    }, 45);
    return () => clearInterval(interval);
  }, [isAutoSpin, viewMode, setCameraYaw]);

  // Handle Wheel Scroll for Zooming
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale(s => Math.min(2.5, s + 0.1));
    } else {
      setScale(s => Math.max(0.4, s - 0.1));
    }
  };

  // Convert SVG coordinates
  const getSvgCoordinates = (e: React.PointerEvent<SVGSVGElement>): { x: number; y: number } => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    return {
      x: Math.round(px * 1200),
      y: Math.round(py * 660)
    };
  };

  // 3D Projection transformation helper
  const project3D = (atom: Atom) => {
    const yaw = (cameraYaw * Math.PI) / 180;
    const pitch = (cameraPitch * Math.PI) / 180;
    const dx = atom.x - 600;
    const dy = atom.y - 330;
    const dz = atom.z || 0;

    const rx = dx * Math.cos(yaw) + dz * Math.sin(yaw);
    const rz = -dx * Math.sin(yaw) + dz * Math.cos(yaw);
    const ry = dy * Math.cos(pitch) - rz * Math.sin(pitch);
    const depthVal = dy * Math.sin(pitch) + rz * Math.cos(pitch);

    const perspectiveScale = 1 / (1 + depthVal / 1500);
    return {
      x: 600 + rx * perspectiveScale,
      y: 330 + ry * perspectiveScale,
      scale: perspectiveScale,
      depth: depthVal
    };
  };

  // Carbon Indexing for numbering
  const getCarbonIndex = (atom: Atom) => {
    const carbons = atoms.filter(a => a.element === 'C' && !a.group);
    return carbons.findIndex(a => a.id === atom.id) + 1;
  };

  // Event Handlers for interactive bonding, lasso select, moving, multi-touch pinch, and free-cam orbit
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    touchPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch pinch detection for Android Phone touchscreens & Smart Boards
    if (touchPointersRef.current.size === 2) {
      const pts = Array.from(touchPointersRef.current.values()) as { x: number; y: number }[];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchDistRef.current = dist;
      initialScaleRef.current = scale;
      return;
    }

    const coords = getSvgCoordinates(e);

    if (tool === 'lasso') {
      setIsLassoing(true);
      setLassoPoints([coords]);
      return;
    }

    // Find nearest atom within touch-friendly 38px hit area for mobile & smartboard precision
    const hitAtom = atoms.find(a => {
      const pos = viewMode === '3d' ? project3D(a) : a;
      return Math.hypot(coords.x - pos.x, coords.y - pos.y) < 38;
    });

    if (hitAtom) {
      setDepth(hitAtom.z || 0);

      // Determine drag set: if hit atom is part of existing selected set, move entire selected set
      const isPartofSelected = selectedAtomIds && selectedAtomIds.has(hitAtom.id) && selectedAtomIds.size > 1;
      const targetSet = isPartofSelected ? selectedAtomIds! : new Set([hitAtom.id]);

      setDragAtomId(hitAtom.id);
      setGroupDragStart(coords);
      setGroupInitialAtoms(
        atoms.filter(a => targetSet.has(a.id)).map(a => ({ id: a.id, x: a.x, y: a.y }))
      );

      if (tool === 'move') {
        setSelectedAtomId(hitAtom.id);
      } else if (tool === 'atom') {
        setSelectedAtomId(hitAtom.id);
        // Detect double-tap for double bond gesture
        const now = Date.now();
        const isDoubleTap = lastAtomTap && lastAtomTap.id === hitAtom.id && (now - lastAtomTap.time) < 380;
        setLastAtomTap({ id: hitAtom.id, time: now });

        setGestureStartAtom(hitAtom);
        setGesturePointer({ ...coords, isDoubleTap });
      } else if (tool === 'bond') {
        setGestureStartAtom(hitAtom);
        setGesturePointer({ ...coords, isDoubleTap: false });
        onAtomClick(hitAtom);
      } else {
        setSelectedAtomId(hitAtom.id);
        onAtomClick(hitAtom);
      }
    } else {
      // Empty background clicked! DESELECT ALL ATOMS
      setSelectedAtomId(null);
      if (setSelectedAtomIds) setSelectedAtomIds(new Set());

      // Start Free Cam Orbit dragging if in 3D mode or freeView is active
      if (viewMode === '3d' || freeView) {
        setIsOrbitDragging(true);
        setOrbitStart({ x: e.clientX, y: e.clientY, yaw: cameraYaw, pitch: cameraPitch });
      }

      if (tool !== 'move') {
        onCanvasClick(coords.x, coords.y);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (touchPointersRef.current.has(e.pointerId)) {
      touchPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Execute pinch-to-zoom if 2 fingers are touching screen
    if (touchPointersRef.current.size === 2 && initialPinchDistRef.current) {
      const pts = Array.from(touchPointersRef.current.values()) as { x: number; y: number }[];
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (currentDist > 0 && initialPinchDistRef.current > 0) {
        const factor = currentDist / initialPinchDistRef.current;
        const newScale = Math.min(2.5, Math.max(0.4, initialScaleRef.current * factor));
        setScale(Number(newScale.toFixed(2)));
      }
      return;
    }

    const coords = getSvgCoordinates(e);

    if (isOrbitDragging) {
      const dx = e.clientX - orbitStart.x;
      const dy = e.clientY - orbitStart.y;
      setCameraYaw(Math.round(orbitStart.yaw + dx * 0.45));
      setCameraPitch(Math.round(Math.min(85, Math.max(-85, orbitStart.pitch - dy * 0.45))));
      return;
    }

    if (tool === 'lasso' && isLassoing) {
      setLassoPoints(prev => [...prev, coords]);
      return;
    }

    if (dragAtomId && groupDragStart && groupInitialAtoms.length > 0) {
      const dx = coords.x - groupDragStart.x;
      const dy = coords.y - groupDragStart.y;

      groupInitialAtoms.forEach(initial => {
        onAtomDrag(initial.id, Math.round(initial.x + dx), Math.round(initial.y + dy));
      });
    } else if (gestureStartAtom) {
      setGesturePointer(coords);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    touchPointersRef.current.delete(e.pointerId);
    if (touchPointersRef.current.size < 2) {
      initialPinchDistRef.current = null;
    }

    setIsOrbitDragging(false);

    if (tool === 'lasso' && isLassoing) {
      setIsLassoing(false);
      if (lassoPoints.length >= 3) {
        const enclosedAtomIds = atoms
          .filter(a => {
            const pos = viewMode === '3d' ? project3D(a) : a;
            return insidePolygon(pos, lassoPoints);
          })
          .map(a => a.id);

        if (enclosedAtomIds.length > 0) {
          if (setSelectedAtomIds) {
            setSelectedAtomIds(new Set(enclosedAtomIds));
          }
          if (enclosedAtomIds.length === 1) {
            setSelectedAtomId(enclosedAtomIds[0]);
          }
        } else {
          if (setSelectedAtomIds) setSelectedAtomIds(new Set());
        }
      }
      setLassoPoints([]);
      return;
    }

    if (gestureStartAtom && gesturePointer) {
      const coords = getSvgCoordinates(e);
      const dist = Math.hypot(coords.x - gestureStartAtom.x, coords.y - gestureStartAtom.y);

      if (dist > 20) {
        // Find if dropped on another existing atom or empty space
        let targetAtom = atoms.find(a => {
          if (a.id === gestureStartAtom.id) return false;
          return Math.hypot(coords.x - a.x, coords.y - a.y) < 32;
        });

        const bondType = (gesturePointer as any)?.isDoubleTap ? 2 : 1;

        if (targetAtom) {
          onBondGesture(gestureStartAtom, targetAtom, bondType);
        } else {
          // Virtual target atom at drop location
          const virtualTarget: Atom = {
            id: `virtual-${Date.now()}`,
            x: coords.x,
            y: coords.y,
            z: depth,
            element: 'C'
          };
          onBondGesture(gestureStartAtom, virtualTarget, bondType);
        }
      }
    }

    setDragAtomId(null);
    setGroupDragStart(null);
    setGroupInitialAtoms([]);
    setGestureStartAtom(null);
    setGesturePointer(null);
  };

  return (
    <div className="relative flex-1 w-full h-full bg-[#0a1e1a] overflow-hidden flex items-center justify-center select-none">
      {/* Visual Canvas Label & Free Cam Status */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-[#0e2a24]/80 backdrop-blur border border-[#1b433b] px-3 py-1.5 rounded-full text-xs font-bold text-teal-300 shadow-md">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
          {viewMode === '2d' ? '2D MOLECULAR WHITEBOARD' : '3D MOLECULAR VIEW'}
        </div>
        {freeView && (
          <div className="flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-500/60 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-200 shadow-md animate-pulse">
            <RotateCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span>FREE CAM ACTIVE (Drag to Orbit)</span>
          </div>
        )}
      </div>

      {/* SVG Canvas (Supports 2D and projected 3D) */}
      <svg
        viewBox="0 0 1200 660"
        className="w-full h-full cursor-crosshair touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        <defs>
          <pattern id="dotGrid" width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#1b453a" opacity="0.6" />
          </pattern>
          <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#04120f" floodOpacity="0.4" />
          </filter>
        </defs>

        <rect width="1200" height="660" fill="#0a1e1a" />
        <rect width="1200" height="660" fill="url(#dotGrid)" />
        <rect x="14" y="14" width="1172" height="632" rx="12" fill="none" stroke="#143e35" strokeWidth="1.5" strokeDasharray="4 6" />

        {/* Render Bonds */}
        <g id="bondsLayer">
          {bonds.map(b => {
            const atomA = atoms.find(a => a.id === b.a);
            const atomB = atoms.find(a => a.id === b.b);
            if (!atomA || !atomB) return null;

            const posA = viewMode === '3d' ? project3D(atomA) : atomA;
            const posB = viewMode === '3d' ? project3D(atomB) : atomB;

            const dx = posB.x - posA.x;
            const dy = posB.y - posA.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = (-dy / len) * 5;
            const ny = (dx / len) * 5;

            const bondLines = [];
            for (let i = 0; i < b.type; i++) {
              const offset = i - (b.type - 1) / 2;
              bondLines.push(
                <line
                  key={`${b.id}-${i}`}
                  x1={posA.x + nx * offset}
                  y1={posA.y + ny * offset}
                  x2={posB.x + nx * offset}
                  y2={posB.y + ny * offset}
                  className="bond"
                />
              );
            }
            return (
              <g
                key={b.id}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  onBondClick(b);
                }}
              >
                {/* Wide invisible hit area for easy bond clicking */}
                <line
                  x1={posA.x}
                  y1={posA.y}
                  x2={posB.x}
                  y2={posB.y}
                  stroke="transparent"
                  strokeWidth="16"
                  className="hover:stroke-teal-400/30 transition-colors"
                />
                {bondLines}
              </g>
            );
          })}

          {/* Render Active Drag/Gesture Bond Line */}
          {gestureStartAtom && gesturePointer && (
            <line
              x1={gestureStartAtom.x}
              y1={gestureStartAtom.y}
              x2={gesturePointer.x}
              y2={gesturePointer.y}
              stroke="#10b981"
              strokeWidth="3"
              strokeDasharray="6 4"
            />
          )}
        </g>

        {/* Render Atoms */}
        <g id="atomsLayer">
          {atoms.map(a => {
            const pos = viewMode === '3d' ? project3D(a) : a;
            const text = a.label || (showCarbonNumbers && a.element === 'C' && !a.group ? `C${getCarbonIndex(a)}` : a.element);
            const radius = (a.label ? 25 : 20) * (pos.scale || 1);
            const isSingleSelected = selectedAtomId === a.id;
            const isMultiSelected = selectedAtomIds && selectedAtomIds.has(a.id);
            const isCompoundActive = activeAtomIds && activeAtomIds.has(a.id);
            const color = ELEMENT_COLORS[a.element] || '#10b981';

            return (
              <g
                key={a.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className={`atom ${isSingleSelected || isMultiSelected ? 'selected-atom' : ''} cursor-pointer`}
                filter="url(#softShadow)"
              >
                {/* Multi-Lasso Selected Glow Ring */}
                {isMultiSelected && (
                  <circle
                    r={radius + 8}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeDasharray="5 3"
                    className="animate-spin-slow"
                  />
                )}

                {/* Active Compound Ring Highlight */}
                {isCompoundActive && !isSingleSelected && !isMultiSelected && (
                  <circle
                    r={radius + 6}
                    fill="none"
                    stroke="#2dd4bf"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    opacity="0.8"
                  />
                )}

                <circle
                  r={radius}
                  fill={color}
                  stroke={isSingleSelected ? '#14b8a6' : isMultiSelected ? '#f59e0b' : '#ffffff'}
                  strokeWidth={isSingleSelected || isMultiSelected ? '4' : '2.5'}
                />
                <text
                  className={`fill-white font-extrabold select-none ${text.length > 2 ? 'text-[11px]' : 'text-[15px]'}`}
                >
                  {text}
                </text>
              </g>
            );
          })}
        </g>

        {/* Render Lasso Polygon while dragging */}
        {tool === 'lasso' && lassoPoints.length > 1 && (
          <polygon
            points={lassoPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="rgba(245, 158, 11, 0.25)"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            strokeLinejoin="round"
          />
        )}

        {/* Empty Canvas Guidance */}
        {atoms.length === 0 && (
          <g transform="translate(600, 310)" textAnchor="middle" pointerEvents="none">
            <circle r="36" fill="#12352d" stroke="#1d4d42" strokeWidth="2" />
            <path d="M-12 0 H12 M0 -12 V12" stroke="#2dd4bf" strokeWidth="3" strokeLinecap="round" />
            <text y="65" fill="#94a3b8" fontSize="16" fontWeight="700">
              Tap anywhere, use Lasso tool to select, or auto-draw compounds
            </text>
            <text y="90" fill="#64748b" fontSize="13" fontWeight="500">
              Works 100% online & offline with local chemical state persistence!
            </text>
          </g>
        )}
      </svg>

      {/* Floating Compound Transformation & Lasso Selection Bar */}
      {atoms.length > 0 && viewMode === '2d' && (
        isControlsMinimized ? (
          <button
            onClick={() => setIsControlsMinimized(false)}
            className="absolute top-14 left-4 z-10 bg-[#0e2a24]/95 hover:bg-[#143d34] border border-[#1d4d42] px-3 py-1.5 rounded-xl text-white shadow-2xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            title="Expand Compound Controls"
          >
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-black text-teal-300">
              {selectedAtomIds && selectedAtomIds.size > 0
                ? `${selectedAtomIds.size} Selected`
                : `Compound Tools (${atoms.length})`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        ) : (
          <div className="absolute top-14 left-4 z-10 bg-[#0e2a24]/95 backdrop-blur-md border border-[#1d4d42] p-2 rounded-xl text-white shadow-2xl flex flex-col gap-1.5 max-w-xs sm:max-w-none">
            <div className="flex items-center justify-between gap-2 border-b border-[#18453a] pb-1.5 text-[11px] font-extrabold text-teal-300">
              <div className="flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {selectedAtomIds && selectedAtomIds.size > 0
                    ? `${selectedAtomIds.size} ATOMS SELECTED`
                    : `COMPOUND CONTROLS (${atoms.length} ATOMS)`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {onSelectAll && (
                  <button
                    onClick={onSelectAll}
                    className="px-2 py-0.5 bg-[#163e34] hover:bg-[#1d4d41] text-teal-200 rounded text-[10px] font-bold transition-all"
                    title="Select all atoms on canvas"
                  >
                    Select All
                  </button>
                )}
                {selectedAtomIds && selectedAtomIds.size > 0 && setSelectedAtomIds && (
                  <button
                    onClick={() => setSelectedAtomIds(new Set())}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                    title="Clear selection"
                  >
                    Deselect
                  </button>
                )}
                <button
                  onClick={() => setIsControlsMinimized(true)}
                  className="p-1 hover:bg-[#18453a] text-slate-300 hover:text-teal-200 rounded transition-colors ml-1"
                  title="Minimize Compound Controls"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {/* Enlarge & Shrink Controls */}
            <div className="flex items-center bg-[#13352f] rounded-lg border border-[#1d4b40] p-0.5">
              <button
                onClick={() => onScaleSelected && onScaleSelected(1.2)}
                className="px-2 py-1 hover:bg-[#1c4b41] text-emerald-300 font-extrabold flex items-center gap-1 rounded transition-colors text-xs"
                title="Enlarge compound / selected atoms (+20% size)"
              >
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enlarge (+20%)</span>
              </button>
              <div className="h-4 w-[1px] bg-[#1d4b40]" />
              <button
                onClick={() => onScaleSelected && onScaleSelected(0.833)}
                className="px-2 py-1 hover:bg-[#1c4b41] text-amber-300 font-extrabold flex items-center gap-1 rounded transition-colors text-xs"
                title="Shrink compound / selected atoms (-20% size)"
              >
                <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Shrink (-20%)</span>
              </button>
            </div>

            {/* Directional Move Pad */}
            <div className="flex items-center bg-[#13352f] rounded-lg border border-[#1d4b40] p-0.5 gap-0.5">
              <span className="text-[10px] text-sky-400 font-extrabold px-1 flex items-center gap-0.5">
                <Move className="w-3 h-3" />
                MOVE:
              </span>
              <button
                onClick={() => onMoveSelected && onMoveSelected(-30, 0)}
                className="p-1 hover:bg-[#1c4b41] text-sky-300 rounded"
                title="Move Left 30px"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onMoveSelected && onMoveSelected(30, 0)}
                className="p-1 hover:bg-[#1c4b41] text-sky-300 rounded"
                title="Move Right 30px"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onMoveSelected && onMoveSelected(0, -30)}
                className="p-1 hover:bg-[#1c4b41] text-sky-300 rounded"
                title="Move Up 30px"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onMoveSelected && onMoveSelected(0, 30)}
                className="p-1 hover:bg-[#1c4b41] text-sky-300 rounded"
                title="Move Down 30px"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rotate, Duplicate & Delete */}
            <button
              onClick={() => onRotateSelected && onRotateSelected(45)}
              className="px-2 py-1 bg-[#13352f] hover:bg-[#1c4b41] border border-[#1d4b40] text-purple-300 font-bold rounded flex items-center gap-1"
              title="Rotate structure 45 degrees"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotate 45°</span>
            </button>

            {onDuplicateSelected && (
              <button
                onClick={onDuplicateSelected}
                className="px-2 py-1 bg-[#13352f] hover:bg-[#1c4b41] border border-[#1d4b40] text-teal-300 font-bold rounded flex items-center gap-1"
                title="Duplicate compound"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>
            )}

            {onDeleteSelected && (
              <button
                onClick={onDeleteSelected}
                className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-700/50 text-rose-300 font-bold rounded flex items-center gap-1"
                title="Delete selected atoms"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Offline Mode Indicator Banner when disconnected */}
      {!isOnline && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-amber-950/90 border border-amber-500/60 text-amber-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 shadow-xl animate-bounce">
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          <span>Offline Mode Active — Local 2D/3D studio & IUPAC analysis fully operational!</span>
        </div>
      )}

      {/* 3D Depth & Rotation Overlay Controls */}
      {viewMode === '3d' && (
        <div className="absolute bottom-6 left-6 z-10 bg-[#0e2a24]/90 backdrop-blur-md border border-[#1d4d42] p-3.5 rounded-xl text-white w-72 shadow-2xl space-y-2.5">
          <div className="text-xs font-bold text-teal-300 flex items-center justify-between">
            <span>3D VIEW ROTATION & DEPTH</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsAutoSpin(!isAutoSpin)}
                className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${
                  isAutoSpin
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-[#18453a] text-slate-300 hover:text-white'
                }`}
                title="Toggle continuous 3D rotation"
              >
                {isAutoSpin ? 'Spinning...' : 'Auto Spin'}
              </button>
              <button
                onClick={() => {
                  setCameraYaw(-28);
                  setCameraPitch(18);
                  setIsAutoSpin(false);
                }}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 p-0.5"
                title="Reset 3D camera angles"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 italic">
            Tip: Click & drag anywhere on canvas to orbit camera freely.
          </p>

          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Atom Depth (Z):</span>
              <input
                type="range"
                min="-200"
                max="200"
                value={depth}
                onChange={e => setDepth(Number(e.target.value))}
                className="w-28 accent-teal-400"
              />
              <span className="w-8 text-right font-mono text-teal-300">{depth}</span>
            </label>

            <label className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Rotate Pitch (X):</span>
              <input
                type="range"
                min="-60"
                max="60"
                value={cameraPitch}
                onChange={e => setCameraPitch(Number(e.target.value))}
                className="w-28 accent-teal-400"
              />
              <span className="w-8 text-right font-mono text-teal-300">{cameraPitch}°</span>
            </label>

            <label className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Rotate Yaw (Y):</span>
              <input
                type="range"
                min="-180"
                max="180"
                value={cameraYaw}
                onChange={e => setCameraYaw(Number(e.target.value))}
                className="w-28 accent-teal-400"
              />
              <span className="w-8 text-right font-mono text-teal-300">{cameraYaw}°</span>
            </label>
          </div>
        </div>
      )}

      {/* Canvas Zoom & Touch Screen Controls */}
      <div className="absolute top-4 right-4 z-10 bg-[#0e2a24]/95 backdrop-blur border border-[#1d4d42] p-1.5 rounded-xl flex items-center gap-1.5 shadow-xl">
        {atoms.length > 0 && onClearCanvas && (
          <>
            <button
              onClick={onClearCanvas}
              className="px-2.5 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-700/60 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold active:scale-95"
              title="Clear Entire Canvas"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
            <div className="h-5 w-[1px] bg-[#1d4d42]" />
          </>
        )}
        <button
          onClick={() => setScale(s => Math.max(0.4, s - 0.15))}
          className="p-2 hover:bg-[#184239] text-slate-200 active:text-teal-300 rounded-lg transition-colors active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Zoom Out (Touch & Pinch supported)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono font-bold text-teal-300 px-1">{Math.round(scale * 100)}%</span>
        <button
          onClick={() => setScale(s => Math.min(2.5, s + 0.15))}
          className="p-2 hover:bg-[#184239] text-slate-200 active:text-teal-300 rounded-lg transition-colors active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Zoom In (Touch & Pinch supported)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setScale(1.0)}
          className="p-2 hover:bg-[#184239] text-slate-200 active:text-teal-300 rounded-lg transition-colors active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Reset Zoom to 100%"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

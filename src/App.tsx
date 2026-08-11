import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SlideBar } from './components/SlideBar';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { Inspector } from './components/Inspector';
import { Atom, Bond, Slide, ViewMode, ToolType, ChatMessage } from './types';
import { FUNCTIONAL_GROUPS } from './constants';
import { analyseCompound, connectedComponents, canBond, bondProblem } from './chemistryUtils';

const STORAGE_KEY_V5 = 'bondboard-molecule-state-v5';
const STORAGE_KEY_LEGACY = 'bondboard-molecule-state-v4';

export default function App() {
  const [projectName, setProjectName] = useState('Organic Chemistry Whiteboard');
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [tool, setTool] = useState<ToolType>('atom');
  const [activeElement, setActiveElement] = useState('C');
  const [activeBond, setActiveBond] = useState(1);
  const [selectedAtomId, setSelectedAtomId] = useState<string | null>(null);
  const [selectedAtomIds, setSelectedAtomIds] = useState<Set<string>>(new Set());
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Slides Management State
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: 'slide-1',
      name: 'Slide 1 - Reaction / Compound',
      atoms: [
        { id: '1', x: 500, y: 330, z: 0, element: 'C' },
        { id: '2', x: 600, y: 330, z: 0, element: 'C' },
        { id: '3', x: 700, y: 330, z: 0, element: 'C' }
      ],
      bonds: [
        { id: 'b1', a: '1', b: '2', type: 1 },
        { id: 'b2', a: '2', b: '3', type: 1 }
      ]
    }
  ]);
  const [activeSlideId, setActiveSlideId] = useState<string>('slide-1');

  // Online / Offline status listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Active selected compound index when multiple disconnected structures exist
  const [activeCompoundIndex, setActiveCompoundIndex] = useState(0);

  // Molecule state for active slide canvas
  const [atoms, setAtoms] = useState<Atom[]>(slides[0].atoms);
  const [bonds, setBonds] = useState<Bond[]>(slides[0].bonds);

  // Sync current atoms & bonds into active slide object in slides array
  useEffect(() => {
    setSlides(prev =>
      prev.map(s => (s.id === activeSlideId ? { ...s, atoms, bonds } : s))
    );
  }, [atoms, bonds, activeSlideId]);

  // Undo / Redo history stack
  const [history, setHistory] = useState<{ atoms: Atom[]; bonds: Bond[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ atoms: Atom[]; bonds: Bond[] }[]>([]);

  // View parameters
  const [scale, setScale] = useState(1.0);
  const [cameraYaw, setCameraYaw] = useState(-28);
  const [cameraPitch, setCameraPitch] = useState(18);
  const [freeView, setFreeView] = useState(false);
  const [showCarbonNumbers, setShowCarbonNumbers] = useState(false);
  const [depth, setDepth] = useState(0);

  // PubChem & AI Tutor state
  const [pubchemData, setPubchemData] = useState<any>(null);
  const [isLoadingPubchem, setIsLoadingPubchem] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState('Saved locally');

  // Slide Handler Actions
  const handleSelectSlide = (targetId: string) => {
    if (targetId === activeSlideId) return;
    const targetSlide = slides.find(s => s.id === targetId);
    if (!targetSlide) return;

    setActiveSlideId(targetId);
    setAtoms(targetSlide.atoms || []);
    setBonds(targetSlide.bonds || []);
    setSelectedAtomId(null);
    setSelectedAtomIds(new Set());
    setActiveCompoundIndex(0);
    setHistory([]);
    setRedoStack([]);
  };

  const handleAddSlide = () => {
    const newId = `slide-${Date.now()}`;
    const newSlideName = `Slide ${slides.length + 1}`;
    const newSlide: Slide = {
      id: newId,
      name: newSlideName,
      atoms: [],
      bonds: []
    };

    setSlides(prev => [...prev, newSlide]);
    setActiveSlideId(newId);
    setAtoms([]);
    setBonds([]);
    setSelectedAtomId(null);
    setSelectedAtomIds(new Set());
    setActiveCompoundIndex(0);
    setHistory([]);
    setRedoStack([]);
  };

  const handleDuplicateSlide = (targetId: string) => {
    const targetSlide = slides.find(s => s.id === targetId);
    if (!targetSlide) return;

    const newId = `slide-${Date.now()}`;
    const clonedAtoms = targetSlide.atoms.map(a => ({ ...a }));
    const clonedBonds = targetSlide.bonds.map(b => ({ ...b }));
    const newSlide: Slide = {
      id: newId,
      name: `${targetSlide.name} (Copy)`,
      atoms: clonedAtoms,
      bonds: clonedBonds
    };

    setSlides(prev => [...prev, newSlide]);
    setActiveSlideId(newId);
    setAtoms(clonedAtoms);
    setBonds(clonedBonds);
    setSelectedAtomId(null);
    setSelectedAtomIds(new Set());
    setActiveCompoundIndex(0);
    setHistory([]);
    setRedoStack([]);
  };

  const handleDeleteSlide = (targetId: string) => {
    if (slides.length <= 1) return;

    const remaining = slides.filter(s => s.id !== targetId);
    setSlides(remaining);

    if (activeSlideId === targetId) {
      const nextActive = remaining[0];
      setActiveSlideId(nextActive.id);
      setAtoms(nextActive.atoms || []);
      setBonds(nextActive.bonds || []);
      setSelectedAtomId(null);
      setSelectedAtomIds(new Set());
      setActiveCompoundIndex(0);
      setHistory([]);
      setRedoStack([]);
    }
  };

  const handleRenameSlide = (targetId: string, newName: string) => {
    setSlides(prev => prev.map(s => (s.id === targetId ? { ...s, name: newName } : s)));
  };

  // Push history snapshot before mutating
  const pushHistory = () => {
    setHistory(prev => [...prev.slice(-30), { atoms, bonds }]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack(prev => [...prev, { atoms, bonds }]);
    setAtoms(previous.atoms);
    setBonds(previous.bonds);
    setHistory(prev => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory(prev => [...prev, { atoms, bonds }]);
    setAtoms(next.atoms);
    setBonds(next.bonds);
    setRedoStack(prev => prev.slice(0, -1));
  };

  // Canvas Actions
  const handleCanvasClick = (x: number, y: number) => {
    // Clear selections when clicking on empty canvas space
    setSelectedAtomId(null);
    setSelectedAtomIds(new Set());

    if (tool === 'atom') {
      pushHistory();
      const newAtom: Atom = {
        id: `atom-${Date.now()}`,
        x,
        y,
        z: depth,
        element: activeElement || 'C'
      };
      setAtoms(prev => [...prev, newAtom]);
      setSelectedAtomId(newAtom.id);
    }
  };

  const handleAtomClick = (clickedAtom: Atom) => {
    if (tool === 'erase') {
      pushHistory();
      setAtoms(prev => prev.filter(a => a.id !== clickedAtom.id));
      setBonds(prev => prev.filter(b => b.a !== clickedAtom.id && b.b !== clickedAtom.id));
      if (selectedAtomId === clickedAtom.id) setSelectedAtomId(null);
    } else if (tool === 'bond') {
      if (!selectedAtomId) {
        setSelectedAtomId(clickedAtom.id);
      } else if (selectedAtomId === clickedAtom.id) {
        // Double-click same atom or keep selected
      } else {
        const sourceAtom = atoms.find(a => a.id === selectedAtomId);
        if (sourceAtom) {
          handleToggleOrAddBond(sourceAtom, clickedAtom, activeBond);
        }
        setSelectedAtomId(clickedAtom.id);
      }
    } else {
      setSelectedAtomId(clickedAtom.id);
    }
  };

  const handleToggleOrAddBond = (sourceAtom: Atom, targetAtom: Atom, desiredType: number) => {
    if (sourceAtom.id === targetAtom.id) return;

    pushHistory();
    const existingBond = bonds.find(
      b => (b.a === sourceAtom.id && b.b === targetAtom.id) || (b.a === targetAtom.id && b.b === sourceAtom.id)
    );

    if (existingBond) {
      // If bond exists, change/cycle type
      const nextType = existingBond.type === desiredType ? (existingBond.type % 3) + 1 : desiredType;
      if (canBond(sourceAtom, targetAtom, nextType, bonds)) {
        setBonds(prev => prev.map(b => (b.id === existingBond.id ? { ...b, type: nextType } : b)));
      } else {
        alert(bondProblem(sourceAtom, targetAtom, nextType, bonds));
      }
    } else {
      // Add new bond
      if (canBond(sourceAtom, targetAtom, desiredType, bonds)) {
        setBonds(prev => [
          ...prev,
          {
            id: `bond-${Date.now()}`,
            a: sourceAtom.id,
            b: targetAtom.id,
            type: desiredType
          }
        ]);
      } else {
        alert(bondProblem(sourceAtom, targetAtom, desiredType, bonds));
      }
    }
  };

  const handleBondClick = (clickedBond: Bond) => {
    pushHistory();
    if (tool === 'erase') {
      setBonds(prev => prev.filter(b => b.id !== clickedBond.id));
    } else {
      const atomA = atoms.find(a => a.id === clickedBond.a);
      const atomB = atoms.find(a => a.id === clickedBond.b);
      if (!atomA || !atomB) return;

      const nextType = clickedBond.type === activeBond ? (clickedBond.type % 3) + 1 : activeBond;
      if (canBond(atomA, atomB, nextType, bonds)) {
        setBonds(prev => prev.map(b => (b.id === clickedBond.id ? { ...b, type: nextType } : b)));
      } else {
        alert(bondProblem(atomA, atomB, nextType, bonds));
      }
    }
  };

  const handleLassoErase = (atomIds: string[]) => {
    pushHistory();
    setAtoms(prev => prev.filter(a => !atomIds.includes(a.id)));
    setBonds(prev => prev.filter(b => !atomIds.includes(b.a) && !atomIds.includes(b.b)));
  };

  const handleAtomDrag = (atomId: string, x: number, y: number) => {
    setAtoms(prev => prev.map(a => (a.id === atomId ? { ...a, x, y, z: depth } : a)));
  };

  const handleBondGesture = (sourceAtom: Atom, targetAtom: Atom, type: number) => {
    pushHistory();

    let actualTarget = targetAtom;
    // Create new target atom if target is virtual
    if (targetAtom.id.startsWith('virtual-')) {
      const created: Atom = {
        id: `atom-${Date.now()}`,
        x: targetAtom.x,
        y: targetAtom.y,
        z: depth,
        element: activeElement
      };
      setAtoms(prev => [...prev, created]);
      actualTarget = created;
    }

    handleToggleOrAddBond(sourceAtom, actualTarget, type);
  };

  const handleAddRing = (ringType: string) => {
    pushHistory();
    const centerX = 600;
    const centerY = 330;
    const radius = 55;
    const count = ringType === 'benzene' ? 6 : Number(ringType);

    const newAtoms: Atom[] = [];
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI * 2) / count;
      newAtoms.push({
        id: `ring-atom-${Date.now()}-${i}`,
        x: Math.round(centerX + Math.cos(angle) * radius),
        y: Math.round(centerY + Math.sin(angle) * radius),
        z: depth,
        element: 'C'
      });
    }

    const newBonds: Bond[] = [];
    for (let i = 0; i < count; i++) {
      const nextIdx = (i + 1) % count;
      newBonds.push({
        id: `ring-bond-${Date.now()}-${i}`,
        a: newAtoms[i].id,
        b: newAtoms[nextIdx].id,
        type: ringType === 'benzene' && i % 2 === 0 ? 2 : 1
      });
    }

    setAtoms(prev => [...prev, ...newAtoms]);
    setBonds(prev => [...prev, ...newBonds]);
  };

  const handleAttachGroup = (groupKey: string) => {
    pushHistory();
    const groupDef = FUNCTIONAL_GROUPS[groupKey];
    if (!groupDef) return;

    // Find target atom if selected
    const target = selectedAtomId ? atoms.find(a => a.id === selectedAtomId) : null;

    if (target) {
      // Calculate non-overlapping attachment coordinates
      const connectedBonds = bonds.filter(b => b.a === target.id || b.b === target.id);
      const angles: number[] = [];
      connectedBonds.forEach(b => {
        const neighborId = b.a === target.id ? b.b : b.a;
        const neighbor = atoms.find(a => a.id === neighborId);
        if (neighbor) {
          angles.push(Math.atan2(neighbor.y - target.y, neighbor.x - target.x));
        }
      });

      let bestAngle = -Math.PI / 4; // Default top-right angle
      if (angles.length === 1) {
        bestAngle = angles[0] + Math.PI;
      } else if (angles.length > 1) {
        angles.sort((a, b) => a - b);
        let maxGap = 0;
        for (let i = 0; i < angles.length; i++) {
          const nextIdx = (i + 1) % angles.length;
          let gap = angles[nextIdx] - angles[i];
          if (gap < 0) gap += 2 * Math.PI;
          if (gap > maxGap) {
            maxGap = gap;
            bestAngle = angles[i] + gap / 2;
          }
        }
      }

      const dist = 60;
      const posX = Math.round(target.x + Math.cos(bestAngle) * dist);
      const posY = Math.round(target.y + Math.sin(bestAngle) * dist);

      const newGroupAtom: Atom = {
        id: `group-${Date.now()}`,
        x: posX,
        y: posY,
        z: depth,
        element: groupDef.element,
        label: groupDef.label,
        group: groupKey
      };

      // Check if bonding exceeds target valence
      if (canBond(target, newGroupAtom, 1, bonds)) {
        setAtoms(prev => [...prev, newGroupAtom]);
        setBonds(prev => [
          ...prev,
          {
            id: `group-bond-${Date.now()}`,
            a: target.id,
            b: newGroupAtom.id,
            type: 1
          }
        ]);
        setSelectedAtomId(newGroupAtom.id);
      } else {
        // Place functional group on canvas near target without forcing invalid bond
        setAtoms(prev => [...prev, newGroupAtom]);
        setSelectedAtomId(newGroupAtom.id);
        alert(`Target atom ${target.element} is at max valence. Placed ${groupDef.label} group on canvas nearby.`);
      }
    } else {
      // No atom selected -> Place functional group directly on canvas
      const lastAtom = atoms[atoms.length - 1];
      const posX = lastAtom ? lastAtom.x + 85 : 550;
      const posY = lastAtom ? lastAtom.y : 300;

      const newGroupAtom: Atom = {
        id: `group-${Date.now()}`,
        x: Math.min(1100, Math.max(100, posX)),
        y: Math.min(600, Math.max(100, posY)),
        z: depth,
        element: groupDef.element,
        label: groupDef.label,
        group: groupKey
      };

      setAtoms(prev => [...prev, newGroupAtom]);
      setSelectedAtomId(newGroupAtom.id);
    }
  };

  const handleClearCanvas = () => {
    pushHistory();
    setAtoms([]);
    setBonds([]);
    setSelectedAtomId(null);
    setSelectedAtomIds(new Set());
    setActiveCompoundIndex(0);
  };

  // Compound Transformation Handlers (Move, Enlarge / Scale, Rotate, Duplicate, Delete)
  const handleMoveSelected = (dx: number, dy: number) => {
    if (atoms.length === 0) return;
    pushHistory();
    const targetSet = selectedAtomIds.size > 0 ? selectedAtomIds : new Set(atoms.map(a => a.id));
    setAtoms(prev =>
      prev.map(a => (targetSet.has(a.id) ? { ...a, x: Math.round(a.x + dx), y: Math.round(a.y + dy) } : a))
    );
  };

  const handleScaleSelected = (factor: number) => {
    if (atoms.length === 0) return;
    pushHistory();
    const targetSet = selectedAtomIds.size > 0 ? selectedAtomIds : new Set(atoms.map(a => a.id));
    const targetAtoms = atoms.filter(a => targetSet.has(a.id));
    if (targetAtoms.length === 0) return;

    const cx = targetAtoms.reduce((acc, a) => acc + a.x, 0) / targetAtoms.length;
    const cy = targetAtoms.reduce((acc, a) => acc + a.y, 0) / targetAtoms.length;

    setAtoms(prev =>
      prev.map(a => {
        if (!targetSet.has(a.id)) return a;
        const nx = cx + (a.x - cx) * factor;
        const ny = cy + (a.y - cy) * factor;
        return {
          ...a,
          x: Math.round(nx),
          y: Math.round(ny)
        };
      })
    );
  };

  const handleRotateSelected = (angleDeg: number) => {
    if (atoms.length === 0) return;
    pushHistory();
    const targetSet = selectedAtomIds.size > 0 ? selectedAtomIds : new Set(atoms.map(a => a.id));
    const targetAtoms = atoms.filter(a => targetSet.has(a.id));
    if (targetAtoms.length === 0) return;

    const rad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const cx = targetAtoms.reduce((acc, a) => acc + a.x, 0) / targetAtoms.length;
    const cy = targetAtoms.reduce((acc, a) => acc + a.y, 0) / targetAtoms.length;

    setAtoms(prev =>
      prev.map(a => {
        if (!targetSet.has(a.id)) return a;
        const dx = a.x - cx;
        const dy = a.y - cy;
        const nx = cx + (dx * cos - dy * sin);
        const ny = cy + (dx * sin + dy * cos);
        return {
          ...a,
          x: Math.round(nx),
          y: Math.round(ny)
        };
      })
    );
  };

  const handleDuplicateSelected = () => {
    const targetSet = selectedAtomIds.size > 0 ? selectedAtomIds : new Set(atoms.map(a => a.id));
    if (targetSet.size === 0) return;
    pushHistory();

    const idMap: Record<string, string> = {};
    const newAtoms: Atom[] = [];

    atoms.forEach(a => {
      if (targetSet.has(a.id)) {
        const newId = `atom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        idMap[a.id] = newId;
        newAtoms.push({
          ...a,
          id: newId,
          x: a.x + 55,
          y: a.y + 55
        });
      }
    });

    const newBonds: Bond[] = [];
    bonds.forEach(b => {
      if (targetSet.has(b.a) && targetSet.has(b.b)) {
        newBonds.push({
          id: `bond-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          a: idMap[b.a],
          b: idMap[b.b],
          type: b.type
        });
      }
    });

    setAtoms(prev => [...prev, ...newAtoms]);
    setBonds(prev => [...prev, ...newBonds]);
    setSelectedAtomIds(new Set(Object.values(idMap)));
  };

  const handleDeleteSelected = () => {
    const targetSet = selectedAtomIds.size > 0 ? selectedAtomIds : new Set(atoms.map(a => a.id));
    if (targetSet.size === 0) return;
    pushHistory();

    setAtoms(prev => prev.filter(a => !targetSet.has(a.id)));
    setBonds(prev => prev.filter(b => !targetSet.has(b.a) && !targetSet.has(b.b)));
    setSelectedAtomIds(new Set());
    setSelectedAtomId(null);
  };

  const handleSelectAll = () => {
    setSelectedAtomIds(new Set(atoms.map(a => a.id)));
  };

  // Connected components & multi-compound structure analysis
  const components = connectedComponents(atoms, bonds);
  const compoundAnalyses = components.length > 0
    ? components.map(c => analyseCompound(c.atoms, c.bonds))
    : [analyseCompound([], [])];

  const safeCompoundIndex = Math.min(activeCompoundIndex, Math.max(0, compoundAnalyses.length - 1));
  const activeCompoundAnalysis = compoundAnalyses[safeCompoundIndex] || compoundAnalyses[0];
  const activeComponentAtomIds = components[safeCompoundIndex]?.ids || new Set<string>();

  // PubChem Lookup Handler
  const handlePubChemLookup = async () => {
    const name = activeCompoundAnalysis.naming.name;
    if (!name || name === 'Inorganic / Non-carbon structure') {
      alert('Build an organic structure to look up in PubChem.');
      return;
    }
    setIsLoadingPubchem(true);
    try {
      const res = await fetch(`/api/pubchem/${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setPubchemData(data);
    } catch (e) {
      alert(`PubChem lookup failed or compound '${name}' is not indexed.`);
    } finally {
      setIsLoadingPubchem(false);
    }
  };

  // AI & PubChem Compound Auto-Drawer Handler
  const handleDrawCompound = async (target: string | { atoms: Atom[]; bonds: Bond[]; name?: string }) => {
    if (typeof target === 'object' && target.atoms) {
      pushHistory();
      setAtoms(target.atoms);
      setBonds(target.bonds || []);
      setSelectedAtomId(null);
      if (target.name) setProjectName(target.name);
      return;
    }

    if (typeof target === 'string' && target.trim()) {
      setIsAiLoading(true);
      try {
        const res = await fetch('/api/compound/draw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: target.trim() })
        });
        const data = await res.json();
        if (data.success && data.atoms && data.atoms.length > 0) {
          pushHistory();
          setAtoms(data.atoms);
          setBonds(data.bonds || []);
          setSelectedAtomId(null);
          setProjectName(data.name || target.trim());
        } else {
          alert(`Could not draw "${target}". Try typing a valid IUPAC or common chemical name.`);
        }
      } catch (err) {
        alert(`Failed to auto-draw "${target}". Please check your internet connection.`);
      } finally {
        setIsAiLoading(false);
      }
    }
  };

  // AI Tutor Integration
  const handleSendMessage = async (userQuery: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userQuery,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setIsAiLoading(true);

    const currentSlide = slides.find(s => s.id === activeSlideId) || slides[0] || { id: 'slide-1', name: 'Slide 1' };
    const currentSlideIndex = slides.findIndex(s => s.id === activeSlideId);

    try {
      const allNames = compoundAnalyses.map((c, i) => `Structure #${i + 1}: ${c.naming.name}`).join('; ');

      const res = await fetch('/api/ai/chemistry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userQuery,
          slideInfo: {
            id: currentSlide.id,
            name: currentSlide.name,
            slideIndex: currentSlideIndex + 1,
            totalSlides: slides.length
          },
          compound: {
            iupac: activeCompoundAnalysis.naming.name,
            common: activeCompoundAnalysis.naming.common,
            formula: activeCompoundAnalysis.formula,
            atoms: activeCompoundAnalysis.atomCount,
            bonds: activeCompoundAnalysis.bonds,
            issues: activeCompoundAnalysis.issues,
            allStructures: allNames
          },
          history: chatMessages.slice(-6)
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, aiMsg]);

      // If AI answer contains structure JSON, automatically draw on canvas
      const jsonMatch = data.answer?.match(/```(?:json\s*structure|json)?\s*([\s\S]*?)```/i);
      if (jsonMatch) {
        try {
          const struct = JSON.parse(jsonMatch[1]);
          if (struct.atoms && Array.isArray(struct.atoms) && struct.atoms.length > 0) {
            pushHistory();
            setAtoms(struct.atoms);
            setBonds(struct.bonds || []);
            setSelectedAtomId(null);
            if (struct.name) {
              handleRenameSlide(currentSlide.id, struct.name);
            }
          }
        } catch (e) {
          // ignore JSON parse error
        }
      }
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${err.message || 'Error communicating with Gemini AI. Ensure GEMINI_API_KEY is active.'}`,
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Local Storage Sync (V5 for Slides support)
  const handleSaveLocally = () => {
    try {
      const stateToSave = {
        projectName,
        slides,
        activeSlideId,
        viewMode
      };
      localStorage.setItem(STORAGE_KEY_V5, JSON.stringify(stateToSave));
      setSaveStatus('Saved locally!');
      setTimeout(() => setSaveStatus('Saved locally'), 2500);
    } catch {
      setSaveStatus('Local storage full');
    }
  };

  useEffect(() => {
    try {
      const savedV5 = localStorage.getItem(STORAGE_KEY_V5);
      if (savedV5) {
        const parsed = JSON.parse(savedV5);
        if (parsed.slides && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
          setSlides(parsed.slides);
          const activeId = parsed.activeSlideId && parsed.slides.some((s: Slide) => s.id === parsed.activeSlideId)
            ? parsed.activeSlideId
            : parsed.slides[0].id;
          setActiveSlideId(activeId);
          const active = parsed.slides.find((s: Slide) => s.id === activeId) || parsed.slides[0];
          setAtoms(active.atoms || []);
          setBonds(active.bonds || []);
        }
        if (parsed.projectName) setProjectName(parsed.projectName);
        return;
      }

      // Legacy V4 fallback
      const savedV4 = localStorage.getItem(STORAGE_KEY_LEGACY);
      if (savedV4) {
        const parsed = JSON.parse(savedV4);
        if (parsed.atoms) setAtoms(parsed.atoms);
        if (parsed.bonds) setBonds(parsed.bonds);
        if (parsed.projectName) setProjectName(parsed.projectName);
      }
    } catch (e) {
      console.warn('Could not load local state:', e);
    }
  }, []);

  const activeSlideObject = slides.find(s => s.id === activeSlideId) || slides[0];
  const activeSlideIdx = Math.max(0, slides.findIndex(s => s.id === activeSlideId));

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a1e1a]">
      {/* Top Bar */}
      <Header
        projectName={projectName}
        setProjectName={setProjectName}
        viewMode={viewMode}
        setViewMode={setViewMode}
        freeView={freeView}
        toggleFreeView={() => setFreeView(!freeView)}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSaveLocally}
        onOpenAiTutor={() => setIsInspectorOpen(true)}
        saveStatus={saveStatus}
        isOnline={isOnline}
      />

      {/* Multiple Slides Manager Bar */}
      <SlideBar
        slides={slides}
        activeSlideId={activeSlideId}
        onSelectSlide={handleSelectSlide}
        onAddSlide={handleAddSlide}
        onDuplicateSlide={handleDuplicateSlide}
        onDeleteSlide={handleDeleteSlide}
        onRenameSlide={handleRenameSlide}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Interactive 2D/3D Canvas */}
        <Canvas
          atoms={atoms}
          bonds={bonds}
          viewMode={viewMode}
          tool={tool}
          activeElement={activeElement}
          activeBond={activeBond}
          selectedAtomId={selectedAtomId}
          setSelectedAtomId={setSelectedAtomId}
          selectedAtomIds={selectedAtomIds}
          setSelectedAtomIds={setSelectedAtomIds}
          activeAtomIds={activeComponentAtomIds}
          onCanvasClick={handleCanvasClick}
          onAtomClick={handleAtomClick}
          onBondClick={handleBondClick}
          onAtomDrag={handleAtomDrag}
          onBondGesture={handleBondGesture}
          onLassoErase={handleLassoErase}
          onClearCanvas={handleClearCanvas}
          onMoveSelected={handleMoveSelected}
          onScaleSelected={handleScaleSelected}
          onRotateSelected={handleRotateSelected}
          onDuplicateSelected={handleDuplicateSelected}
          onDeleteSelected={handleDeleteSelected}
          onSelectAll={handleSelectAll}
          isOnline={isOnline}
          showCarbonNumbers={showCarbonNumbers}
          scale={scale}
          setScale={setScale}
          cameraYaw={cameraYaw}
          setCameraYaw={setCameraYaw}
          cameraPitch={cameraPitch}
          setCameraPitch={setCameraPitch}
          freeView={freeView}
          depth={depth}
          setDepth={setDepth}
        />

        {/* Right Inspector & AI Tutor Panel */}
        <Inspector
          compoundAnalyses={compoundAnalyses}
          activeCompoundIndex={safeCompoundIndex}
          setActiveCompoundIndex={setActiveCompoundIndex}
          onNumberCarbons={() => setShowCarbonNumbers(!showCarbonNumbers)}
          showCarbonNumbers={showCarbonNumbers}
          onPubChemLookup={handlePubChemLookup}
          pubchemData={pubchemData}
          isLoadingPubchem={isLoadingPubchem}
          chatMessages={chatMessages}
          onSendMessage={handleSendMessage}
          onDrawCompound={handleDrawCompound}
          isAiLoading={isAiLoading}
          isOpen={isInspectorOpen}
          setIsOpen={setIsInspectorOpen}
          activeSlideName={activeSlideObject?.name}
          activeSlideIndex={activeSlideIdx + 1}
          totalSlides={slides.length}
        />
      </div>

      {/* Bottom Tool Palette */}
      <Toolbar
        tool={tool}
        setTool={setTool}
        activeElement={activeElement}
        setActiveElement={setActiveElement}
        activeBond={activeBond}
        setActiveBond={setActiveBond}
        onAddRing={handleAddRing}
        onAttachGroup={handleAttachGroup}
        onClearCanvas={handleClearCanvas}
        onDrawCompound={handleDrawCompound}
        isAiLoading={isAiLoading}
      />
    </div>
  );
}

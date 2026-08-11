import React, { useState } from 'react';
import { ToolType } from '../types';
import { ELEMENT_NAMES, FUNCTIONAL_GROUPS } from '../constants';
import { MousePointer, Eraser, Move, PlusCircle, Hexagon, Scissors, Sparkles, Wand2, Search } from 'lucide-react';

interface ToolbarProps {
  tool: ToolType;
  setTool: (tool: ToolType) => void;
  activeElement: string;
  setActiveElement: (el: string) => void;
  activeBond: number;
  setActiveBond: (b: number) => void;
  onAddRing: (ringType: string) => void;
  onAttachGroup: (groupKey: string) => void;
  onClearCanvas: () => void;
  onDrawCompound?: (target: string) => void;
  isAiLoading?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  setTool,
  activeElement,
  setActiveElement,
  activeBond,
  setActiveBond,
  onAddRing,
  onAttachGroup,
  onClearCanvas,
  onDrawCompound,
  isAiLoading
}) => {
  const [activeTab, setActiveTab] = useState<'atoms' | 'bonds' | 'rings' | 'groups' | 'tools' | 'aiDraw'>('atoms');
  const [aiCompoundQuery, setAiCompoundQuery] = useState('');

  const mainElements = ['C', 'H', 'O', 'N', 'Cl', 'S', 'P', 'F', 'Br', 'I'];

  const quickPresets = [
    'Aspirin', 'Benzene', 'Caffeine', 'Paracetamol', 'Ethanol', 'Acetone', 'Glucose', 'Ibuprofen', 'Dopamine'
  ];

  const handleDrawSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiCompoundQuery.trim() || !onDrawCompound) return;
    onDrawCompound(aiCompoundQuery.trim());
    setAiCompoundQuery('');
  };

  return (
    <div className="bg-[#0e2722] border-t border-[#1a423a] text-white shrink-0 z-20 shadow-lg">
      {/* Category Tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 bg-[#0a1e1a] border-b border-[#163830] overflow-x-auto no-scrollbar">
        <button
          onClick={() => { setActiveTab('aiDraw'); }}
          className={`px-4 py-2 text-xs font-black rounded-t-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'aiDraw'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 border-t-2 border-emerald-300 shadow-md'
              : 'text-teal-300 hover:text-teal-200 bg-teal-950/40 border border-teal-800/40'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>✨ AI Auto-Draw</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('atoms');
            setTool('atom');
            if (!activeElement) setActiveElement('C');
          }}
          className={`px-4 py-2 text-xs font-extrabold rounded-t-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'atoms' ? 'bg-[#0e2722] text-teal-300 border-t-2 border-teal-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="w-4 h-4 rounded-full border border-teal-400 text-[10px] flex items-center justify-center font-bold">
            {activeElement || 'C'}
          </span>
          Atoms Library
        </button>

        <button
          onClick={() => { setActiveTab('bonds'); setTool('bond'); }}
          className={`px-4 py-2 text-xs font-extrabold rounded-t-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'bonds' ? 'bg-[#0e2722] text-teal-300 border-t-2 border-teal-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="font-mono text-sm">═</span>
          Manual Bonds
        </button>

        <button
          onClick={() => { setActiveTab('rings'); setTool('ring'); }}
          className={`px-4 py-2 text-xs font-extrabold rounded-t-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'rings' ? 'bg-[#0e2722] text-teal-300 border-t-2 border-teal-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Hexagon className="w-3.5 h-3.5 text-amber-400" />
          Ring Templates
        </button>

        <button
          onClick={() => { setActiveTab('groups'); setTool('group'); }}
          className={`px-4 py-2 text-xs font-extrabold rounded-t-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'groups' ? 'bg-[#0e2722] text-teal-300 border-t-2 border-teal-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
          Functional Groups
        </button>

        <button
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-2 text-xs font-extrabold rounded-t-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'tools' ? 'bg-[#0e2722] text-teal-300 border-t-2 border-teal-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MousePointer className="w-3.5 h-3.5 text-sky-400" />
          Move & Erase
        </button>
      </div>

      {/* Subpanel Options */}
      <div className="p-3 overflow-x-auto no-scrollbar flex items-center gap-2 min-h-[72px]">
        {activeTab === 'aiDraw' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
            <form onSubmit={handleDrawSubmit} className="flex items-center gap-1.5 shrink-0">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
                <input
                  type="text"
                  value={aiCompoundQuery}
                  onChange={e => setAiCompoundQuery(e.target.value)}
                  placeholder="Type any compound name (e.g. Aspirin, Caffeine, Ethanol)..."
                  className="bg-[#13352f] border border-[#1e4c41] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-400 w-64 sm:w-80 font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={isAiLoading || !aiCompoundQuery.trim()}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-lg transition-all shadow disabled:opacity-40 flex items-center gap-1.5 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAiLoading ? 'Drawing...' : 'Draw Compound'}</span>
              </button>
            </form>

            <div className="h-6 w-[1px] bg-[#1d4b40] hidden sm:block shrink-0" />

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] text-teal-400 font-extrabold font-mono uppercase tracking-wider shrink-0">
                Popular Presets:
              </span>
              {quickPresets.map(preset => (
                <button
                  key={preset}
                  onClick={() => onDrawCompound && onDrawCompound(preset)}
                  disabled={isAiLoading}
                  className="px-2.5 py-1.5 bg-[#13352f] hover:bg-[#1c4b41] border border-[#1d4b40] text-teal-200 font-bold text-xs rounded-lg transition-all shrink-0 hover:scale-105 active:scale-95"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'atoms' && (
          <>
            <div className="flex items-center gap-1.5">
              {mainElements.map(el => {
                const currentEl = activeElement || 'C';
                const isSelected = currentEl === el;
                return (
                  <button
                    key={el}
                    onClick={() => {
                      setActiveElement(el);
                      setTool('atom');
                    }}
                    className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg border font-bold transition-all ${
                      isSelected
                        ? 'bg-teal-500/20 border-teal-400 text-teal-200 shadow-sm scale-105 ring-2 ring-teal-400/40'
                        : 'bg-[#13352f] border-[#1d4b40] text-slate-200 hover:bg-[#1a443c]'
                    }`}
                  >
                    <span className="font-mono text-base leading-none">{el}</span>
                    <span className="text-[9px] text-slate-400 font-normal">{ELEMENT_NAMES[el]}</span>
                  </button>
                );
              })}
            </div>

            <div className="h-8 w-[1px] bg-[#1d4b40] mx-1" />

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">All Periodic Elements:</span>
              <select
                value={activeElement || 'C'}
                onChange={e => {
                  setActiveElement(e.target.value);
                  setTool('atom');
                }}
                className="bg-[#13352f] border border-[#1d4b40] text-teal-200 font-medium text-xs rounded-lg p-2 focus:outline-none focus:border-teal-400"
              >
                {Object.entries(ELEMENT_NAMES).map(([sym, name]) => (
                  <option key={sym} value={sym}>
                    {sym} — {name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {activeTab === 'bonds' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setActiveBond(1); setTool('bond'); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-bold text-xs transition-all ${
                activeBond === 1 && tool === 'bond'
                  ? 'bg-teal-500/20 border-teal-400 text-teal-200'
                  : 'bg-[#13352f] border-[#1d4b40] text-slate-300 hover:bg-[#1a443c]'
              }`}
            >
              <span className="font-mono text-lg">—</span> Single Bond (1.0)
            </button>

            <button
              onClick={() => { setActiveBond(2); setTool('bond'); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-bold text-xs transition-all ${
                activeBond === 2 && tool === 'bond'
                  ? 'bg-teal-500/20 border-teal-400 text-teal-200'
                  : 'bg-[#13352f] border-[#1d4b40] text-slate-300 hover:bg-[#1a443c]'
              }`}
            >
              <span className="font-mono text-lg">═</span> Double Bond (2.0)
            </button>

            <button
              onClick={() => { setActiveBond(3); setTool('bond'); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-bold text-xs transition-all ${
                activeBond === 3 && tool === 'bond'
                  ? 'bg-teal-500/20 border-teal-400 text-teal-200'
                  : 'bg-[#13352f] border-[#1d4b40] text-slate-300 hover:bg-[#1a443c]'
              }`}
            >
              <span className="font-mono text-lg">≡</span> Triple Bond (3.0)
            </button>

            <p className="text-xs text-slate-400 italic ml-2">
              Tip: Click source atom then target atom to connect manually.
            </p>
          </div>
        )}

        {activeTab === 'rings' && (
          <div className="flex items-center gap-2">
            {[
              { type: '3', label: '△ Cyclopropane' },
              { type: '4', label: '□ Cyclobutane' },
              { type: '5', label: '⬠ Cyclopentane' },
              { type: '6', label: '⬡ Cyclohexane' },
              { type: 'benzene', label: '⌬ Benzene Ring' }
            ].map(r => (
              <button
                key={r.type}
                onClick={() => onAddRing(r.type)}
                className="px-3 py-2 bg-[#13352f] hover:bg-[#1b463e] border border-[#1d4b40] text-amber-200 font-bold text-xs rounded-lg transition-all"
              >
                {r.label}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {Object.entries(FUNCTIONAL_GROUPS).map(([key, def]) => (
              <button
                key={key}
                onClick={() => onAttachGroup(key)}
                className="px-3 py-2 bg-[#13352f] hover:bg-[#1b463e] border border-[#1d4b40] text-teal-200 font-bold text-xs rounded-lg transition-all whitespace-nowrap flex flex-col items-center"
              >
                <span className="font-mono">{def.label}</span>
                <span className="text-[9px] text-slate-400 font-normal">{def.name}</span>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTool('move')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-bold text-xs transition-all ${
                tool === 'move'
                  ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                  : 'bg-[#13352f] border-[#1d4b40] text-slate-300 hover:bg-[#1a443c]'
              }`}
            >
              <Move className="w-4 h-4 text-sky-400" />
              Reposition Atom
            </button>

            <button
              onClick={() => setTool('erase')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-bold text-xs transition-all ${
                tool === 'erase'
                  ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                  : 'bg-[#13352f] border-[#1d4b40] text-slate-300 hover:bg-[#1a443c]'
              }`}
            >
              <Eraser className="w-4 h-4 text-rose-400" />
              Tap Eraser
            </button>

            <button
              onClick={() => setTool('lasso')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-bold text-xs transition-all ${
                tool === 'lasso'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md ring-2 ring-amber-400/30'
                  : 'bg-[#13352f] border-[#1d4b40] text-slate-300 hover:bg-[#1a443c]'
              }`}
            >
              <Scissors className="w-4 h-4 text-amber-400" />
              Lasso Select & Edit
            </button>

            <div className="h-8 w-[1px] bg-[#1d4b40]" />

            <button
              onClick={onClearCanvas}
              className="px-4 py-2.5 bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700/50 text-rose-200 font-bold text-xs rounded-lg transition-all"
            >
              Clear Entire Canvas
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

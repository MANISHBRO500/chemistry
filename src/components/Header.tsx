import React from 'react';
import { Undo2, Redo2, Bookmark, Sparkles, Box, ChevronDown } from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  projectName: string;
  setProjectName: (name: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  freeView: boolean;
  toggleFreeView: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onOpenAiTutor: () => void;
  saveStatus: string;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  projectName,
  setProjectName,
  viewMode,
  setViewMode,
  freeView,
  toggleFreeView,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onOpenAiTutor,
  saveStatus,
  isOnline
}) => {
  const handleRename = () => {
    const next = prompt('Rename molecule project:', projectName);
    if (next && next.trim()) {
      setProjectName(next.trim());
    }
  };

  return (
    <header className="h-14 md:h-16 bg-[#0e2722] border-b border-[#1b3d36] px-3 md:px-6 flex items-center justify-between text-white shrink-0 z-20 shadow-md">
      {/* Brand logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500 text-slate-950 font-extrabold flex items-center justify-center text-lg shadow-inner">
            B
          </div>
          <span className="font-extrabold text-base md:text-lg tracking-tight hidden sm:inline">
            bond<span className="text-teal-400">board</span>
          </span>
        </div>

        <div className="h-5 w-[1px] bg-[#1d423a] mx-1 hidden md:block" />

        {/* Project Name & Online Status */}
        <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-[#14332d] px-2.5 py-1 rounded-md border border-[#1e473e]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold max-w-[110px] sm:max-w-[180px] truncate">{projectName}</span>
          <button 
            onClick={handleRename}
            className="text-slate-400 hover:text-teal-300 transition-colors p-0.5"
            title="Rename Project"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Network Online/Offline Status Indicator */}
        <div 
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border transition-all ${
            isOnline 
              ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-300' 
              : 'bg-amber-950/80 border-amber-500/60 text-amber-200'
          }`}
          title={isOnline ? 'Online mode active (AI Auto-draw & PubChem connected)' : 'Offline mode active (Local 2D/3D studio & storage active)'}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
          <span className="hidden lg:inline">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Middle Controls - View Switches */}
      <div className="flex items-center gap-2">
        <div className="bg-[#14332d] p-1 rounded-lg border border-[#1e473e] flex items-center gap-1">
          <button
            onClick={() => setViewMode('2d')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
              viewMode === '2d'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#1c453d]'
            }`}
          >
            2D Canvas
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${
              viewMode === '3d'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#1c453d]'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            3D Studio
          </button>
        </div>

        <button
          onClick={toggleFreeView}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all hidden lg:flex items-center gap-1.5 ${
            freeView
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
              : 'bg-[#14332d] text-slate-300 border-[#1e473e] hover:bg-[#1c453d]'
          }`}
          title="Toggle Canvas Panning / Orbit Mode"
        >
          Free Cam: {freeView ? 'On' : 'Off'}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1 border-r border-[#1d423a] pr-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-md hover:bg-[#1b433a] text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-md hover:bg-[#1b433a] text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* AI Tutor Quick Access */}
        <button
          onClick={onOpenAiTutor}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-md transition-all active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ask Google AI Tutor</span>
          <span className="sm:hidden">AI</span>
        </button>

        {/* Save button */}
        <button
          onClick={onSave}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#1a473e] hover:bg-[#23584d] text-teal-200 border border-teal-500/30 rounded-lg text-xs font-bold transition-all"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Save</span>
        </button>
      </div>
    </header>
  );
};

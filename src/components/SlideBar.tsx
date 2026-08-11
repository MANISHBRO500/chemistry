import React, { useState } from 'react';
import { Slide } from '../types';
import { Plus, Trash2, Copy, Edit2, ChevronLeft, ChevronRight, Layers, Sparkles } from 'lucide-react';

interface SlideBarProps {
  slides: Slide[];
  activeSlideId: string;
  onSelectSlide: (id: string) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (id: string) => void;
  onDeleteSlide: (id: string) => void;
  onRenameSlide: (id: string, name: string) => void;
}

export const SlideBar: React.FC<SlideBarProps> = ({
  slides,
  activeSlideId,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onRenameSlide
}) => {
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const activeIndex = slides.findIndex(s => s.id === activeSlideId);
  const currentSlide = slides[activeIndex] || slides[0];

  const handleStartRename = (slide: Slide) => {
    setEditingSlideId(slide.id);
    setEditingName(slide.name);
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim()) {
      onRenameSlide(id, editingName.trim());
    }
    setEditingSlideId(null);
  };

  const handlePrevSlide = () => {
    if (activeIndex > 0) {
      onSelectSlide(slides[activeIndex - 1].id);
    }
  };

  const handleNextSlide = () => {
    if (activeIndex < slides.length - 1) {
      onSelectSlide(slides[activeIndex + 1].id);
    }
  };

  return (
    <div className="bg-[#0b211c] border-b border-[#1b433b] px-3 py-1.5 flex items-center justify-between text-white shrink-0 shadow-md select-none overflow-x-auto no-scrollbar gap-2">
      {/* Left: Slide Navigation & Tabs */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <div className="flex items-center gap-1 text-teal-300 font-extrabold text-xs pr-2 border-r border-[#184239] shrink-0">
          <Layers className="w-4 h-4 text-teal-400" />
          <span className="hidden sm:inline uppercase tracking-wider text-[11px]">Slides</span>
          <span className="text-[10px] bg-[#143d34] px-1.5 py-0.5 rounded text-teal-200 font-mono">
            {activeIndex + 1}/{slides.length}
          </span>
        </div>

        {/* Prev / Next Slide Arrows for Mobile & Smart Board Presentations */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={handlePrevSlide}
            disabled={activeIndex <= 0}
            className="p-1 hover:bg-[#184239] text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent rounded transition-colors"
            title="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextSlide}
            disabled={activeIndex >= slides.length - 1}
            className="p-1 hover:bg-[#184239] text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent rounded transition-colors"
            title="Next Slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Slide Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1">
          {slides.map((slide, index) => {
            const isActive = slide.id === activeSlideId;
            const isEditing = editingSlideId === slide.id;

            return (
              <div
                key={slide.id}
                onClick={() => !isEditing && onSelectSlide(slide.id)}
                className={`group px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-teal-400/80 shadow-md scale-[1.02]'
                    : 'bg-[#12332c] text-slate-300 border-[#1c473f] hover:bg-[#18423a] hover:text-white'
                }`}
              >
                <span className="text-[10px] opacity-75 font-mono">#{index + 1}</span>

                {isEditing ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onBlur={() => handleSaveRename(slide.id)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveRename(slide.id)}
                    autoFocus
                    className="bg-[#0a1e1a] text-teal-200 px-1 py-0.5 rounded border border-teal-500 text-xs focus:outline-none w-24"
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span
                    onDoubleClick={() => handleStartRename(slide)}
                    className="max-w-[110px] sm:max-w-[160px] truncate"
                  >
                    {slide.name}
                  </span>
                )}

                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    isActive ? 'bg-emerald-950/60 text-emerald-200' : 'bg-[#0e2a24] text-slate-400'
                  }`}
                >
                  {slide.atoms.length} {slide.atoms.length === 1 ? 'atom' : 'atoms'}
                </span>

                {/* Edit slide name button */}
                {!isEditing && isActive && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleStartRename(slide);
                    }}
                    className="p-0.5 hover:bg-emerald-700/60 text-teal-100 rounded opacity-80 hover:opacity-100"
                    title="Rename Slide"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Add / Duplicate / Delete Slide Controls & AI Tutor Badge */}
      <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-[#184239]">
        {/* Isolated AI Tutor Slide Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 bg-[#0e2a24] border border-teal-500/40 px-2.5 py-1 rounded-lg text-[11px] font-bold text-teal-300">
          <Sparkles className="w-3 h-3 text-teal-400 animate-pulse" />
          <span>AI Tutor Focus:</span>
          <span className="text-white font-mono max-w-[110px] truncate">{currentSlide?.name || 'Slide 1'}</span>
        </div>

        {/* Add New Slide Button */}
        <button
          onClick={onAddSlide}
          className="flex items-center gap-1 px-2.5 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-lg transition-all shadow active:scale-95 whitespace-nowrap"
          title="Add New Slide"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Slide</span>
        </button>

        {/* Duplicate Current Slide */}
        <button
          onClick={() => onDuplicateSlide(activeSlideId)}
          className="p-1.5 hover:bg-[#184239] text-slate-300 hover:text-teal-200 rounded-lg transition-colors border border-[#1d473f]"
          title="Duplicate Current Slide"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        {/* Delete Current Slide */}
        <button
          onClick={() => onDeleteSlide(activeSlideId)}
          disabled={slides.length <= 1}
          className="p-1.5 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors border border-[#1d473f] disabled:border-transparent"
          title={slides.length > 1 ? 'Delete Current Slide' : 'Cannot delete the only slide'}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

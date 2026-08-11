import React, { useState } from 'react';
import { CompoundAnalysis, ChatMessage } from '../types';
import { Sparkles, Send, Copy, AlertTriangle, Search, ChevronRight, ChevronLeft, Lightbulb, RefreshCw, Layers, Wand2 } from 'lucide-react';

interface InspectorProps {
  compoundAnalyses: CompoundAnalysis[];
  activeCompoundIndex: number;
  setActiveCompoundIndex: (index: number) => void;
  onNumberCarbons: () => void;
  showCarbonNumbers: boolean;
  onPubChemLookup: () => void;
  pubchemData: any;
  isLoadingPubchem: boolean;
  chatMessages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  onDrawCompound?: (target: string | { atoms: any[]; bonds: any[]; name?: string }) => void;
  isAiLoading: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeSlideName?: string;
  activeSlideIndex?: number;
  totalSlides?: number;
}

export const Inspector: React.FC<InspectorProps> = ({
  compoundAnalyses,
  activeCompoundIndex,
  setActiveCompoundIndex,
  onNumberCarbons,
  showCarbonNumbers,
  onPubChemLookup,
  pubchemData,
  isLoadingPubchem,
  chatMessages,
  onSendMessage,
  onDrawCompound,
  isAiLoading,
  isOpen,
  setIsOpen,
  activeSlideName = 'Slide 1',
  activeSlideIndex = 1,
  totalSlides = 1
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [drawNameInput, setDrawNameInput] = useState('');

  const analysis = compoundAnalyses[activeCompoundIndex] || compoundAnalyses[0] || {
    formula: '—',
    carbons: 0,
    bonds: 0,
    functionals: 0,
    naming: { name: 'Empty canvas', common: 'No atoms on canvas', path: [] },
    issues: [],
    atomCount: 0
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim()) return;
    onSendMessage(inputQuery.trim());
    setInputQuery('');
  };

  const handleQuickDraw = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!drawNameInput.trim() || !onDrawCompound) return;
    onDrawCompound(drawNameInput.trim());
    setDrawNameInput('');
  };

  const parseMessageContent = (content: string) => {
    // Check for ```json structure ... ``` or ```json ... ``` blocks
    const jsonBlockRegex = /```(?:json\s*structure|json)?\s*([\s\S]*?)```/i;
    const match = content.match(jsonBlockRegex);

    if (match) {
      const textBefore = content.replace(jsonBlockRegex, '').trim();
      let structData: any = null;
      try {
        structData = JSON.parse(match[1]);
      } catch (e) {
        // failed parse
      }

      if (structData && structData.atoms && Array.isArray(structData.atoms)) {
        return (
          <div className="space-y-2">
            {textBefore && <div className="whitespace-pre-wrap">{textBefore}</div>}
            <div className="p-2.5 bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-teal-500/50 rounded-lg space-y-1.5 shadow-md">
              <div className="text-[11px] font-extrabold text-teal-300 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-teal-400" />
                AI Generated Structure: <span className="text-white font-mono">{structData.name || 'Compound'}</span>
              </div>
              <p className="text-[10px] text-slate-300">
                Contains {structData.atoms.length} atoms & {structData.bonds?.length || 0} bonds.
              </p>
              {onDrawCompound && (
                <button
                  onClick={() => onDrawCompound({ atoms: structData.atoms, bonds: structData.bonds || [], name: structData.name })}
                  className="w-full py-1.5 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-md transition-all shadow flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Render Structure on Canvas</span>
                </button>
              )}
            </div>
          </div>
        );
      }
    }

    return <div className="whitespace-pre-wrap">{content}</div>;
  };

  return (
    <aside
      className={`fixed lg:static top-16 right-0 bottom-0 z-30 w-full sm:w-96 bg-[#0e2722] border-l border-[#1b433b] text-white flex flex-col transition-all duration-300 shadow-2xl ${
        isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Drawer Toggle Header for Mobile */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0a1e1a] border-b border-[#1b433b]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span className="font-extrabold text-xs tracking-wider uppercase text-teal-300">
            Structure Analysis & AI Tutor
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden p-1 text-slate-400 hover:text-white"
        >
          {isOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Active Slide Context Indicator for AI Tutor */}
      <div className="px-4 py-2 bg-[#091b17] border-b border-[#183f37] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-teal-300 font-bold">
          <Layers className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>
            Slide #{activeSlideIndex}: <strong className="text-white font-mono">{activeSlideName}</strong>
          </span>
        </div>
        <span className="text-[10px] text-emerald-300 font-extrabold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-600/50 shadow-sm shrink-0">
          AI Slide Isolated
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {/* Multiple Compounds Selector Bar */}
        {compoundAnalyses.length > 1 && (
          <div className="bg-[#0a1e1a] border border-[#1b433b] p-3 rounded-xl space-y-2 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold font-mono text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-400" />
                {compoundAnalyses.length} Separate Structures Detected
              </span>
              <span className="text-[10px] text-teal-400 font-mono font-bold">
                Showing #{activeCompoundIndex + 1}
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {compoundAnalyses.map((comp, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveCompoundIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                    activeCompoundIndex === idx
                      ? 'bg-teal-500/25 border-teal-400 text-teal-200 shadow-md ring-1 ring-teal-400/50'
                      : 'bg-[#13352f] border-[#1d4b40] text-slate-300 hover:bg-[#1a443c]'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-teal-900/80 border border-teal-400/80 text-[10px] flex items-center justify-center font-mono font-black text-teal-300">
                    #{idx + 1}
                  </span>
                  <span>{comp.naming.name || `Compound ${idx + 1}`}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* IUPAC & Identification Card */}
        <div className="bg-[#13352f] border border-[#1e4c41] rounded-xl p-3.5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold font-mono text-teal-400 tracking-wider">IUPAC NOMENCLATURE</div>
            {compoundAnalyses.length > 1 && (
              <span className="text-[9px] font-extrabold font-mono text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full">
                Structure {activeCompoundIndex + 1} of {compoundAnalyses.length}
              </span>
            )}
          </div>

          <div className="text-lg font-black text-white leading-tight break-words">
            {analysis.naming.name}
          </div>
          <div className="text-xs text-slate-300 italic">{analysis.naming.common}</div>

          {/* Validation Messages */}
          {analysis.issues.length > 0 ? (
            <div className="mt-2 p-2 bg-rose-950/60 border border-rose-700/50 rounded-lg text-rose-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Valence Violation:</span>
                {analysis.issues[0]}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Bond valences & octets fully verified
            </div>
          )}
        </div>

        {/* Formula & Quantitative Metrics Grid */}
        <div className="bg-[#13352f] border border-[#1e4c41] rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1b433b] pb-2">
            <span className="text-[10px] font-bold font-mono text-slate-400 tracking-wider">MOLECULAR FORMULA</span>
            <div
              className="font-mono text-base font-bold text-teal-200"
              dangerouslySetInnerHTML={{ __html: analysis.formula }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-[#0a1e1a] p-2 rounded-lg border border-[#183d34]">
              <span className="text-[9px] font-mono text-slate-400 block">CARBONS</span>
              <span className="text-base font-black text-white font-mono">{analysis.carbons}</span>
            </div>

            <div className="bg-[#0a1e1a] p-2 rounded-lg border border-[#183d34]">
              <span className="text-[9px] font-mono text-slate-400 block">BONDS</span>
              <span className="text-base font-black text-white font-mono">{analysis.bonds}</span>
            </div>

            <div className="bg-[#0a1e1a] p-2 rounded-lg border border-[#183d34]">
              <span className="text-[9px] font-mono text-slate-400 block">GROUPS</span>
              <span className="text-base font-black text-white font-mono">{analysis.functionals}</span>
            </div>
          </div>

          {/* Quick Analysis Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onNumberCarbons}
              className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-bold transition-all ${
                showCarbonNumbers
                  ? 'bg-teal-500/20 border-teal-400 text-teal-200'
                  : 'bg-[#0a1e1a] border-[#183d34] text-slate-300 hover:text-white'
              }`}
            >
              {showCarbonNumbers ? 'Hide Numbers' : 'Number Carbons'}
            </button>

            <button
              onClick={onPubChemLookup}
              disabled={isLoadingPubchem}
              className="flex-1 py-1.5 px-2 bg-[#0a1e1a] hover:bg-[#153830] border border-[#183d34] text-teal-300 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1"
            >
              <Search className="w-3.5 h-3.5" />
              {isLoadingPubchem ? 'Searching...' : 'PubChem Info'}
            </button>
          </div>

          {/* PubChem Result Data */}
          {pubchemData && pubchemData.PropertyTable?.Properties?.[0] && (
            <div className="p-2.5 bg-[#0a1e1a] border border-[#1d4b40] rounded-lg text-xs space-y-1 text-slate-300">
              <div className="font-bold text-teal-300">PubChem Database Result:</div>
              <div>MW: {pubchemData.PropertyTable.Properties[0].MolecularWeight} g/mol</div>
              <div>Formula: {pubchemData.PropertyTable.Properties[0].MolecularFormula}</div>
            </div>
          )}
        </div>

        {/* Gemini AI Interactive Tutor Panel */}
        <div className="bg-[#13352f] border border-[#1e4c41] rounded-xl p-3.5 flex flex-col space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-teal-500/20 text-teal-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Google AI Chemistry Tutor</div>
              <div className="text-[10px] text-teal-400">Powered by Gemini 3.6 Flash</div>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="bg-[#0a1e1a] border border-[#183d34] rounded-lg p-3 max-h-56 overflow-y-auto space-y-2.5 text-xs no-scrollbar">
            {chatMessages.length === 0 ? (
              <div className="text-slate-400 italic text-center py-4 space-y-1">
                <Lightbulb className="w-5 h-5 mx-auto text-amber-400/80 mb-1" />
                <p>Ask anything about this structure, reaction mechanisms, or synthesis routes!</p>
              </div>
            ) : (
              chatMessages.map(m => (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-lg leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#1b473d] text-teal-100 ml-4 border border-[#23584c]'
                      : 'bg-[#102d27] text-slate-200 mr-2 border border-[#1a443b]'
                  }`}
                >
                  <span className="font-bold text-[10px] block opacity-70 mb-0.5">
                    {m.role === 'user' ? 'You' : 'Gemini AI Tutor'}
                  </span>
                  <div>{parseMessageContent(m.content)}</div>
                </div>
              ))
            )}

            {isAiLoading && (
              <div className="flex items-center gap-2 text-teal-300 italic text-xs py-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Gemini is analyzing chemical structure...
              </div>
            )}
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSend} className="flex items-center gap-1.5">
            <input
              type="text"
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              placeholder="Ask AI about isomers, reactions..."
              className="flex-1 bg-[#0a1e1a] border border-[#183d34] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
            />
            <button
              type="submit"
              disabled={isAiLoading || !inputQuery.trim()}
              className="p-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg disabled:opacity-40 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
};

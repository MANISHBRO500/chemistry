export interface Atom {
  id: string;
  x: number;
  y: number;
  z: number;
  element: string;
  label?: string | null;
  group?: string | null;
}

export interface Bond {
  id: string;
  a: string;
  b: string;
  type: number; // 1 = single, 2 = double, 3 = triple
}

export interface FunctionalGroupDef {
  label: string;
  name: string;
  suffix?: string;
  element: string;
  composition: Record<string, number>;
}

export interface Slide {
  id: string;
  name: string;
  atoms: Atom[];
  bonds: Bond[];
}

export interface CompoundAnalysis {
  formula: string;
  carbons: number;
  bonds: number;
  functionals: number;
  naming: {
    name: string;
    common: string;
    path: string[];
  };
  issues: string[];
  atomCount: number;
}

export interface ConnectedComponent {
  ids: Set<string>;
  atoms: Atom[];
  bonds: Bond[];
}

export type ViewMode = '2d' | '3d';
export type ToolType = 'atom' | 'bond' | 'ring' | 'group' | 'erase' | 'lasso' | 'move';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

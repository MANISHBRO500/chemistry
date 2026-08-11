import { FunctionalGroupDef } from './types';

export const ELEMENT_COLORS: Record<string, string> = {
  C: '#27332f',
  H: '#3b82f6',
  O: '#f97316',
  N: '#2563eb',
  F: '#10b981',
  Cl: '#059669',
  Br: '#c2410c',
  I: '#7c3aed',
  S: '#eab308',
  P: '#ec4899',
  B: '#d97706',
  Si: '#64748b',
  Fe: '#b91c1c',
  Cu: '#ea580c',
  Zn: '#475569',
  Na: '#8b5cf6',
  Mg: '#14b8a6',
  Ca: '#84cc16'
};

export const MAX_VALENCES: Record<string, number> = {
  H: 1, C: 4, N: 3, O: 2, F: 1, Cl: 1, Br: 1, I: 1, B: 3, Si: 4, P: 5, S: 6
};

export const ELEMENT_NAMES: Record<string, string> = {
  H: 'Hydrogen', He: 'Helium', Li: 'Lithium', Be: 'Beryllium', B: 'Boron',
  C: 'Carbon', N: 'Nitrogen', O: 'Oxygen', F: 'Fluorine', Ne: 'Neon',
  Na: 'Sodium', Mg: 'Magnesium', Al: 'Aluminium', Si: 'Silicon', P: 'Phosphorus',
  S: 'Sulfur', Cl: 'Chlorine', Ar: 'Argon', K: 'Potassium', Ca: 'Calcium',
  Sc: 'Scandium', Ti: 'Titanium', V: 'Vanadium', Cr: 'Chromium', Mn: 'Manganese',
  Fe: 'Iron', Co: 'Cobalt', Ni: 'Nickel', Cu: 'Copper', Zn: 'Zinc',
  Ga: 'Gallium', Ge: 'Germanium', As: 'Arsenic', Se: 'Selenium', Br: 'Bromine',
  Kr: 'Krypton', Rb: 'Rubidium', Sr: 'Strontium', Y: 'Yttrium', Zr: 'Zirconium',
  Nb: 'Niobium', Mo: 'Molybdenum', Tc: 'Technetium', Ru: 'Ruthenium', Rh: 'Rhodium',
  Pd: 'Palladium', Ag: 'Silver', Cd: 'Cadmium', In: 'Indium', Sn: 'Tin',
  Sb: 'Antimony', Te: 'Tellurium', I: 'Iodine', Xe: 'Xenon', Cs: 'Caesium',
  Ba: 'Barium', La: 'Lanthanum', Ce: 'Cerium', Pr: 'Praseodymium', Nd: 'Neodymium',
  Pm: 'Promethium', Sm: 'Samarium', Eu: 'Europium', Gd: 'Gadolinium', Tb: 'Terbium',
  Dy: 'Dysprosium', Ho: 'Holmium', Er: 'Erbium', Tm: 'Thulium', Yb: 'Ytterbium',
  Lu: 'Lutetium', Hf: 'Hafnium', Ta: 'Tantalum', W: 'Tungsten', Re: 'Rhenium',
  Os: 'Osmium', Ir: 'Iridium', Pt: 'Platinum', Au: 'Gold', Hg: 'Mercury',
  Tl: 'Thallium', Pb: 'Lead', Bi: 'Bismuth', Po: 'Polonium', At: 'Astatine',
  Rn: 'Radon', Fr: 'Francium', Ra: 'Radium', Ac: 'Actinium', Th: 'Thorium',
  Pa: 'Protactinium', U: 'Uranium', Np: 'Neptunium', Pu: 'Plutonium', Am: 'Americium',
  Cm: 'Curium', Bk: 'Berkelium', Cf: 'Californium', Es: 'Einsteinium', Fm: 'Fermium',
  Md: 'Mendelevium', No: 'Nobelium', Lr: 'Lawrencium', Rf: 'Rutherfordium', Db: 'Dubnium',
  Sg: 'Seaborgium', Bh: 'Bohrium', Hs: 'Hassium', Mt: 'Meitnerium', Ds: 'Darmstadtium',
  Rg: 'Roentgenium', Cn: 'Copernicium', Nh: 'Nihonium', Fl: 'Flerovium', Mc: 'Moscovium',
  Lv: 'Livermorium', Ts: 'Tennessine', Og: 'Oganesson'
};

export const FUNCTIONAL_GROUPS: Record<string, FunctionalGroupDef> = {
  OH: { label: 'OH', name: 'hydroxy', suffix: 'ol', element: 'O', composition: { O: 1, H: 1 } },
  OR: { label: 'OR', name: 'alkoxy', element: 'O', composition: { O: 1, C: 1, H: 3 } },
  CHO: { label: 'CHO', name: 'formyl', suffix: 'al', element: 'C', composition: { C: 1, H: 1, O: 1 } },
  CO: { label: 'C=O', name: 'oxo', suffix: 'one', element: 'C', composition: { C: 1, O: 1 } },
  COOH: { label: 'COOH', name: 'carboxy', suffix: 'oic acid', element: 'C', composition: { C: 1, O: 2, H: 1 } },
  COOR: { label: 'COOR', name: 'alkoxycarbonyl', suffix: 'oate', element: 'C', composition: { C: 2, O: 2, H: 3 } },
  CONH2: { label: 'CONH₂', name: 'carbamoyl', suffix: 'amide', element: 'C', composition: { C: 1, O: 1, N: 1, H: 2 } },
  COCl: { label: 'COCl', name: 'chlorocarbonyl', suffix: 'oyl chloride', element: 'C', composition: { C: 1, O: 1, Cl: 1 } },
  NH2: { label: 'NH₂', name: 'amino', suffix: 'amine', element: 'N', composition: { N: 1, H: 2 } },
  NO2: { label: 'NO₂', name: 'nitro', element: 'N', composition: { N: 1, O: 2 } },
  CN: { label: 'CN', name: 'cyano', suffix: 'nitrile', element: 'C', composition: { C: 1, N: 1 } },
  SH: { label: 'SH', name: 'sulfanyl', suffix: 'thiol', element: 'S', composition: { S: 1, H: 1 } },
  SR: { label: 'SR', name: 'alkylsulfanyl', element: 'S', composition: { S: 1, C: 1, H: 3 } },
  SO3H: { label: 'SO₃H', name: 'sulfo', suffix: 'sulfonic acid', element: 'S', composition: { S: 1, O: 3, H: 1 } },
  F: { label: 'F', name: 'fluoro', element: 'F', composition: { F: 1 } },
  Cl: { label: 'Cl', name: 'chloro', element: 'Cl', composition: { Cl: 1 } },
  Br: { label: 'Br', name: 'bromo', element: 'Br', composition: { Br: 1 } },
  I: { label: 'I', name: 'iodo', element: 'I', composition: { I: 1 } }
};

export const GROUP_PRIORITY = ['COOH', 'SO3H', 'COOR', 'COCl', 'CONH2', 'CN', 'CHO', 'CO', 'OH', 'SH', 'NH2'];
export const ROOTS = ['', 'meth', 'eth', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'dec', 'undec', 'dodec', 'tridec', 'tetradec', 'pentadec', 'hexadec', 'heptadec', 'octadec', 'nonadec', 'eicos'];

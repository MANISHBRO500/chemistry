import { Atom, Bond, CompoundAnalysis } from './types';
import { MAX_VALENCES, FUNCTIONAL_GROUPS, GROUP_PRIORITY, ROOTS, ELEMENT_NAMES } from './constants';

export function atomBondOrder(atom: Atom, bonds: Bond[]): number {
  return bonds
    .filter(b => b.a === atom.id || b.b === atom.id)
    .reduce((sum, b) => sum + b.type, 0);
}

export function maxValence(atom: Atom): number {
  return atom.group ? 1 : (MAX_VALENCES[atom.element] || 8);
}

export function canBond(a: Atom | null, b: Atom | null, type = 1, bonds: Bond[]): boolean {
  if (!a || !b || a.id === b.id) return false;
  const existingBond = bonds.find(x => (x.a === a.id && x.b === b.id) || (x.a === b.id && x.b === a.id));
  const oldType = existingBond ? existingBond.type : 0;

  const valenceA = atomBondOrder(a, bonds) - oldType + type;
  const valenceB = atomBondOrder(b, bonds) - oldType + type;

  return valenceA <= maxValence(a) && valenceB <= maxValence(b);
}

export function bondProblem(a: Atom | null, b: Atom | null, type: number, bonds: Bond[]): string {
  if (!a || !b) return 'Select two atoms.';
  if (a.id === b.id) return 'An atom cannot bond to itself.';
  const existingBond = bonds.find(x => (x.a === a.id && x.b === b.id) || (x.a === b.id && x.b === a.id));
  const oldType = existingBond ? existingBond.type : 0;

  const valenceA = atomBondOrder(a, bonds) - oldType + type;
  const valenceB = atomBondOrder(b, bonds) - oldType + type;

  if (valenceA > maxValence(a)) {
    return `${a.label || a.element} would exceed its maximum valence of ${maxValence(a)}.`;
  }
  if (valenceB > maxValence(b)) {
    return `${b.label || b.element} would exceed its maximum valence of ${maxValence(b)}.`;
  }
  return 'Cannot set bond.';
}

export function formulaHTML(atoms: Atom[], bonds: Bond[]): string {
  const count: Record<string, number> = {};
  atoms.forEach(a => {
    if (a.group && FUNCTIONAL_GROUPS[a.group]) {
      Object.entries(FUNCTIONAL_GROUPS[a.group].composition).forEach(([e, n]) => {
        count[e] = (count[e] || 0) + n;
      });
    } else {
      count[a.element] = (count[a.element] || 0) + 1;
    }
  });

  const bondWeight: Record<string, number> = {};
  atoms.forEach(a => { bondWeight[a.id] = 0; });
  bonds.forEach(b => {
    if (bondWeight[b.a] !== undefined) bondWeight[b.a] += b.type;
    if (bondWeight[b.b] !== undefined) bondWeight[b.b] += b.type;
  });

  atoms.filter(a => a.element === 'C' && !a.group).forEach(a => {
    count.H = (count.H || 0) + Math.max(0, 4 - (bondWeight[a.id] || 0));
  });

  const order = ['C', 'H', 'N', 'O', 'S', 'P', 'F', 'Cl', 'Br', 'I'];
  const extra = Object.keys(count).filter(k => !order.includes(k)).sort();
  return [...order, ...extra]
    .filter(e => count[e])
    .map(e => `${e}${count[e] > 1 ? `<sub>${count[e]}</sub>` : ''}`)
    .join('') || '—';
}

function carbonGroupInParentChain(group: string | null | undefined): boolean {
  return !!group && ['CHO', 'CO', 'COOH', 'COOR', 'CONH2', 'COCl', 'CN'].includes(group);
}

function carbonGraph(atoms: Atom[], bonds: Bond[]) {
  const nodes = atoms.filter(a => a.element === 'C' && (!a.group || carbonGroupInParentChain(a.group)));
  const graph = new Map<string, { id: string; bond: Bond }[]>(nodes.map(n => [n.id, []]));
  bonds.forEach(b => {
    if (graph.has(b.a) && graph.has(b.b)) {
      graph.get(b.a)!.push({ id: b.b, bond: b });
      graph.get(b.b)!.push({ id: b.a, bond: b });
    }
  });
  return { nodes, graph };
}

function longestCarbonPath(atoms: Atom[], bonds: Bond[]): string[] {
  const { nodes, graph } = carbonGraph(atoms, bonds);
  let best: string[] = [];

  const walk = (id: string, seen: Set<string>, path: string[]) => {
    if (path.length > best.length) best = [...path];
    if (path.length > 30) return;
    for (const next of graph.get(id) || []) {
      if (!seen.has(next.id)) {
        seen.add(next.id);
        walk(next.id, seen, [...path, next.id]);
        seen.delete(next.id);
      }
    }
  };

  nodes.forEach(n => walk(n.id, new Set([n.id]), [n.id]));
  return best;
}

function groupAttachments(atoms: Atom[], bonds: Bond[]) {
  return atoms
    .filter(a => a.group)
    .map(group => {
      const link = bonds.find(b => b.a === group.id || b.b === group.id);
      const parent = link ? atoms.find(a => a.id === (link.a === group.id ? link.b : link.a)) : null;
      return { group, parent, key: group.group! };
    })
    .filter(x => x.parent) as { group: Atom; parent: Atom; key: string }[];
}

function chainName(length: number): string {
  return ROOTS[length] || `${length}-carbon`;
}

function benzeneLike(atoms: Atom[], bonds: Bond[]): boolean {
  const nodes = atoms.filter(a => a.element === 'C' && !a.group);
  const ids = new Set(nodes.map(a => a.id));
  const graph = new Map<string, string[]>(nodes.map(n => [n.id, []]));
  bonds.forEach(b => {
    if (ids.has(b.a) && ids.has(b.b)) {
      graph.get(b.a)!.push(b.b);
      graph.get(b.b)!.push(b.a);
    }
  });
  return nodes.length === 6 &&
         bonds.filter(b => ids.has(b.a) && ids.has(b.b)).length >= 6 &&
         nodes.every(n => (graph.get(n.id) || []).length >= 2);
}

function commonSyllabusName(name: string, primary?: { key: string }): [string, string] {
  if (!name) return ['Unknown', 'No common name'];
  const commonMap: Record<string, [string, string]> = {
    'methane': ['Methane', 'marsh gas'],
    'ethane': ['Ethane', 'dimethyl'],
    'ethene': ['Ethene', 'ethylene'],
    'ethyne': ['Ethyne', 'acetylene'],
    'methanol': ['Methanol', 'wood alcohol'],
    'ethan-1-ol': ['Ethan-1-ol', 'ethyl alcohol / grain alcohol'],
    'propan-1-ol': ['Propan-1-ol', 'n-propyl alcohol'],
    'propan-2-ol': ['Propan-2-ol', 'isopropyl alcohol / rubbing alcohol'],
    'methanal': ['Methanal', 'formaldehyde'],
    'ethanal': ['Ethanal', 'acetaldehyde'],
    'propan-2-one': ['Propan-2-one', 'acetone'],
    'methanoic acid': ['Methanoic acid', 'formic acid'],
    'ethanoic acid': ['Ethanoic acid', 'acetic acid / vinegar'],
    'methanamine': ['Methanamine', 'methylamine'],
    'ethanamine': ['Ethanamine', 'ethylamine'],
    'methanoyl chloride': ['Methanoyl chloride', 'formyl chloride']
  };

  const lc = name.toLowerCase();
  if (commonMap[lc]) return commonMap[lc];

  return [name, 'Standard IUPAC nomenclature'];
}

function compareLocants(left: number[], right: number[]): number {
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const a = left[i] ?? Infinity;
    const b = right[i] ?? Infinity;
    if (a !== b) return a - b;
  }
  return 0;
}

export function naming(atoms: Atom[], bonds: Bond[]): { name: string; common: string; path: string[] } {
  const path = longestCarbonPath(atoms, bonds);
  const groupsOnStructure = groupAttachments(atoms, bonds);

  if (!path.length) {
    const lone = atoms[0];
    if (atoms.length === 1 && lone) {
      return {
        name: `${ELEMENT_NAMES[lone.element] || lone.element} atom`,
        common: 'Isolated element',
        path: []
      };
    }
    return {
      name: 'Inorganic / Non-carbon structure',
      common: 'Does not contain a carbon parent chain.',
      path: []
    };
  }

  const principalGroups = groupsOnStructure.filter(g => GROUP_PRIORITY.includes(g.key));
  const primary = principalGroups.slice().sort((a, b) => GROUP_PRIORITY.indexOf(a.key) - GROUP_PRIORITY.indexOf(b.key))[0];
  const anchorFor = (item: { group: Atom; parent: Atom }) => carbonGroupInParentChain(item.group.group) ? item.group : item.parent;

  let ordered = [...path];
  const locantsFor = (chain: string[]) => {
    const pos = (item: { group: Atom; parent: Atom }) => Math.max(1, chain.indexOf(anchorFor(item).id) + 1);
    const principal = primary ? [pos(primary)] : [];
    const unsaturation: number[] = [];
    for (let i = 0; i < chain.length - 1; i++) {
      const b = bonds.find(x => (x.a === chain[i] && x.b === chain[i+1]) || (x.a === chain[i+1] && x.b === chain[i]));
      if (b && b.type > 1) unsaturation.push(i + 1);
    }
    const prefixes = groupsOnStructure.filter(g => g !== primary).map(pos).sort((a, b) => a - b);
    return [...principal, ...unsaturation.sort((a, b) => a - b), ...prefixes];
  };

  const reversed = [...ordered].reverse();
  if (compareLocants(locantsFor(reversed), locantsFor(ordered)) < 0) {
    ordered = reversed;
  }

  const length = ordered.length;
  const root = chainName(length);
  const posFor = (item: { group: Atom; parent: Atom }) => Math.max(1, ordered.indexOf(anchorFor(item).id) + 1);

  const unsat: { pos: number; type: number }[] = [];
  for (let i = 0; i < ordered.length - 1; i++) {
    const b = bonds.find(x => (x.a === ordered[i] && x.b === ordered[i+1]) || (x.a === ordered[i+1] && x.b === ordered[i]));
    if (b && b.type > 1) unsat.push({ pos: i + 1, type: b.type });
  }

  const unsatName = () => {
    if (!unsat.length) return `${root}ane`;
    const first = unsat[0];
    const kind = first.type === 2 ? 'ene' : 'yne';
    return length === 2 ? `${root}${kind}` : `${root}-${first.pos}-${kind}`;
  };

  let name = unsatName();
  if (primary) {
    const pos = posFor(primary);
    const key = primary.key;
    if (key === 'COOH') name = `${root}anoic acid`;
    else if (key === 'SO3H') name = `${root}ane sulfonic acid`;
    else if (key === 'COOR') name = `methyl ${root}anoate`;
    else if (key === 'COCl') name = `${root}anoyl chloride`;
    else if (key === 'CONH2') name = `${root}anamide`;
    else if (key === 'CN') name = `${root}anenitrile`;
    else if (key === 'CHO') name = `${root}anal`;
    else if (key === 'CO') name = length === 1 ? 'methanal' : `${root}an-${pos}-one`;
    else if (key === 'OH') name = length === 1 ? 'methanol' : `${root}an-${pos}-ol`;
    else if (key === 'SH') name = length === 1 ? 'methanethiol' : `${root}an-${pos}-thiol`;
    else if (key === 'NH2') name = length === 1 ? 'methanamine' : `${root}an-${pos}-amine`;
  }

  const prefixes = groupsOnStructure
    .filter(g => g !== primary && FUNCTIONAL_GROUPS[g.key]?.name)
    .map(g => ({ loc: posFor(g), name: FUNCTIONAL_GROUPS[g.key].name }))
    .sort((a, b) => a.loc - b.loc || a.name.localeCompare(b.name))
    .map(g => `${g.loc}-${g.name}`);

  if (prefixes.length) {
    name = `${prefixes.join('-')}${primary ? '-' : ''}${name}`;
  }

  const [iupac, common] = commonSyllabusName(name, primary || groupsOnStructure[0]);
  return { name: iupac, common: `Common name: ${common}`, path: ordered };
}

export function connectedComponents(atoms: Atom[], bonds: Bond[]) {
  const byId = new Map(atoms.map(a => [a.id, a]));
  const links = new Map(atoms.map(a => [a.id, [] as string[]]));
  bonds.forEach(b => {
    if (byId.has(b.a) && byId.has(b.b)) {
      links.get(b.a)!.push(b.b);
      links.get(b.b)!.push(b.a);
    }
  });

  const seen = new Set<string>();
  const components: { ids: Set<string>; atoms: Atom[]; bonds: Bond[] }[] = [];

  atoms.forEach(first => {
    if (seen.has(first.id)) return;
    const ids = new Set([first.id]);
    const queue = [first.id];
    seen.add(first.id);

    while (queue.length) {
      const id = queue.shift()!;
      (links.get(id) || []).forEach(next => {
        if (!seen.has(next)) {
          seen.add(next);
          ids.add(next);
          queue.push(next);
        }
      });
    }

    components.push({
      ids,
      atoms: [...ids].map(id => byId.get(id)!),
      bonds: bonds.filter(b => ids.has(b.a) && ids.has(b.b))
    });
  });

  return components;
}

export function valenceIssues(atoms: Atom[], bonds: Bond[]): string[] {
  return atoms.flatMap(atom => {
    const used = atomBondOrder(atom, bonds);
    const limit = maxValence(atom);
    return used > limit ? [`${atom.label || atom.element} has bond order ${used}, above allowed valence ${limit}.`] : [];
  });
}

export function analyseCompound(atoms: Atom[], bonds: Bond[]): CompoundAnalysis {
  const c = atoms.filter(a => a.element === 'C' && !a.group).length +
            atoms.filter(a => a.group).reduce((n, a) => n + (FUNCTIONAL_GROUPS[a.group!]?.composition.C || 0), 0);

  return {
    formula: formulaHTML(atoms, bonds),
    carbons: c,
    bonds: bonds.length,
    functionals: atoms.filter(a => a.group).length,
    naming: naming(atoms, bonds),
    issues: valenceIssues(atoms, bonds),
    atomCount: atoms.length
  };
}

export function insidePolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

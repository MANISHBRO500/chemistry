// Client-side direct PubChem PUG REST API client with 2D coordinate transformation
// Works 100% client-side in Web Browsers, Android APKs, and Offline/PWA environments

export interface PubChemDrawResult {
  success: boolean;
  source: 'pubchem';
  name: string;
  atoms: Array<{ id: string; x: number; y: number; element: string }>;
  bonds: Array<{ id: string; a: string; b: string; type: number }>;
}

export interface PubChemDetailsResult {
  cid?: number;
  iupacName?: string;
  formula?: string;
  molecularWeight?: string;
  canonicalSmiles?: string;
  description?: string;
}

const ELEMENT_MAP: Record<number, string> = {
  1: 'H', 6: 'C', 7: 'N', 8: 'O', 9: 'F', 15: 'P', 16: 'S', 17: 'Cl', 35: 'Br', 53: 'I'
};

export async function fetchPubChemDirect(name: string): Promise<PubChemDrawResult | null> {
  const cleanName = name.trim();
  if (!cleanName) return null;

  try {
    const pcUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(cleanName)}/JSON`;
    const res = await fetch(pcUrl);
    if (!res.ok) return null;

    const pcData = await res.json();
    const compoundData = pcData.PC_Compounds?.[0];

    if (!compoundData || !compoundData.atoms || !compoundData.coords?.[0]?.conformers?.[0]) {
      return null;
    }

    const aids: number[] = compoundData.atoms.aid || [];
    const elementsNum: number[] = compoundData.atoms.element || [];
    const rawX: number[] = compoundData.coords[0].conformers[0].x || [];
    const rawY: number[] = compoundData.coords[0].conformers[0].y || [];

    if (aids.length === 0 || rawX.length !== aids.length || rawY.length !== aids.length) {
      return null;
    }

    // Find bounding box
    const minX = Math.min(...rawX), maxX = Math.max(...rawX);
    const minY = Math.min(...rawY), maxY = Math.max(...rawY);

    const width = maxX - minX || 1;
    const height = maxY - minY || 1;

    // Center around (600, 320)
    const targetSize = Math.max(width, height);
    let scale = targetSize > 0 ? Math.min(480 / targetSize, 65) : 55;
    scale = Math.max(25, Math.min(scale, 85));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const atoms = aids.map((aid, idx) => {
      const elNum = elementsNum[idx];
      const symbol = ELEMENT_MAP[elNum] || 'C';
      const px = Math.round(600 + (rawX[idx] - centerX) * scale);
      const py = Math.round(320 - (rawY[idx] - centerY) * scale); // Invert Y for SVG canvas

      return {
        id: String(aid),
        x: px,
        y: py,
        element: symbol
      };
    });

    const rawBondsAid1: number[] = compoundData.bonds?.aid1 || [];
    const rawBondsAid2: number[] = compoundData.bonds?.aid2 || [];
    const rawBondsOrder: number[] = compoundData.bonds?.order || [];

    const bonds = rawBondsAid1.map((a1, idx) => {
      const a2 = rawBondsAid2[idx];
      let order = rawBondsOrder[idx] || 1;
      if (order > 3) order = 1;

      return {
        id: `b-${idx + 1}`,
        a: String(a1),
        b: String(a2),
        type: order
      };
    });

    return {
      success: true,
      source: 'pubchem',
      name: cleanName,
      atoms,
      bonds
    };
  } catch (err) {
    console.warn('Direct client PubChem fetch error:', err);
    return null;
  }
}

export async function fetchPubChemDetailsDirect(name: string): Promise<PubChemDetailsResult | null> {
  const cleanName = name.trim();
  if (!cleanName) return null;

  try {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(cleanName)}/property/IUPACName,MolecularFormula,MolecularWeight,CanonicalSMILES/JSON`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const props = data.PropertyTable?.Properties?.[0];
    if (!props) return null;

    return {
      cid: props.CID,
      iupacName: props.IUPACName,
      formula: props.MolecularFormula,
      molecularWeight: props.MolecularWeight ? String(props.MolecularWeight) : undefined,
      canonicalSmiles: props.CanonicalSMILES
    };
  } catch (err) {
    console.warn('Direct client PubChem details error:', err);
    return null;
  }
}

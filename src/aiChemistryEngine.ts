// Dynamic Client-Side Chemistry Tutor Engine
// Provides immediate, rich, topic-specific chemistry answers and auto-drawing for Mobile APKs & Offline environments

import { fetchPubChemDirect, fetchPubChemDetailsDirect } from './pubchemClient';

export interface ChemistryAnalysis {
  naming: { name: string; common?: string; isPolymer?: boolean };
  formula: string;
  atomCount: number;
  bonds: number;
  issues: string[];
}

export async function generateSmartChemistryResponse(
  question: string,
  analysis: ChemistryAnalysis,
  slideName: string
): Promise<{ text: string; drawData?: any }> {
  const q = question.toLowerCase().trim();

  // 1. Check for Draw / Structure creation requests
  const drawKeywords = ['draw', 'show', 'create', 'build', 'make', 'structure of', 'molecule of'];
  const isDrawReq = drawKeywords.some(kw => q.includes(kw));

  if (isDrawReq) {
    // Extract compound name from query
    let target = question;
    for (const kw of drawKeywords) {
      const idx = q.indexOf(kw);
      if (idx !== -1) {
        target = question.substring(idx + kw.length).trim();
        break;
      }
    }
    target = target.replace(/^(a|an|the|molecule|compound|structure|of)\s+/i, '').replace(/[?.!]/g, '').trim();

    if (target.length > 1) {
      const pubchem = await fetchPubChemDirect(target);
      if (pubchem && pubchem.atoms && pubchem.atoms.length > 0) {
        const details = await fetchPubChemDetailsDirect(target);
        const formulaStr = details?.formula ? ` (**Formula: ${details.formula}**)` : '';
        const iupacStr = details?.iupacName ? `\n- **IUPAC Name**: \`${details.iupacName}\`` : '';

        const text = `I've auto-drawn **${pubchem.name}**${formulaStr} directly onto your canvas!

### **Compound Summary**:
- **Common Name**: ${pubchem.name}${iupacStr}
- **Atom Count**: ${pubchem.atoms.length}
- **Bond Count**: ${pubchem.bonds.length}

*You can now switch between 2D Canvas and 3D Studio in the top bar to inspect its 3D geometry!*`;

        return { text, drawData: pubchem };
      }
    }
  }

  // 2. Questions about the current structure on canvas
  const currentCompName = analysis.naming?.name || 'Unregistered Structure';
  const currentFormula = analysis.formula || 'N/A';
  const valenceStatus = analysis.issues.length === 0
    ? '✅ All atom valencies are satisfied!'
    : `⚠️ Valency Warnings: ${analysis.issues.join('; ')}`;

  if (q.includes('this') || q.includes('current') || q.includes('canvas') || q.includes('slide') || q.includes('name of') || q.includes('iupac')) {
    const text = `### **Analysis of Active Structure ("${slideName}")**:

- **Identified Name**: **${currentCompName}**
- **Molecular Formula**: \`${currentFormula}\`
- **Total Atoms**: ${analysis.atomCount}
- **Total Bonds**: ${analysis.bonds}
- **Valency Check**: ${valenceStatus}

### **IUPAC Naming Rules Applied**:
1. **Longest Carbon Chain**: Identified main chain and substituent positions.
2. **Principal Functional Group**: Assigned highest priority suffix based on IUPAC guidelines.
3. **Numbering**: Numbered from the end giving substituents/functional groups lowest locants.`;

    return { text };
  }

  // 3. Valency & Octet Rule Questions
  if (q.includes('valence') || q.includes('valency') || q.includes('octet') || q.includes('bond') || q.includes('valid')) {
    const text = `### **Organic Chemistry Valency Rules**:

- **Carbon (C)**: Tetravalent (Forms **4 bonds**, 0 lone pairs).
- **Nitrogen (N)**: Trivalent (Forms **3 bonds**, 1 lone pair).
- **Oxygen (O)**: Divalent (Forms **2 bonds**, 2 lone pairs).
- **Hydrogen (H) & Halogens (F, Cl, Br, I)**: Monovalent (Forms **1 bond**).

### **Current Canvas Check**:
- **Molecule**: \`${currentCompName}\` (\`${currentFormula}\`)
- **Status**: ${valenceStatus}

*Tip: Click on any atom in 2D mode to inspect its degree, formal charge, and bonding state in the Inspector panel on the right.*`;

    return { text };
  }

  // 4. Functional Group Questions
  if (q.includes('functional group') || q.includes('alcohol') || q.includes('carboxylic') || q.includes('amine') || q.includes('ketone') || q.includes('aldehyde') || q.includes('ester') || q.includes('ether')) {
    const text = `### **Key Organic Functional Groups Overview**:

- **Alcohol (\`-OH\`)**: Priority suffix *-ol*. Gives characteristic polar hydrogen bonding.
- **Carboxylic Acid (\`-COOH\`)**: Priority suffix *-oic acid*. Acidic proton due to resonance stabilization of carboxylate ion.
- **Aldehyde (\`-CHO\`)**: Priority suffix *-al*. Terminal carbonyl group.
- **Ketone (\`-C(=O)-\`)**: Priority suffix *-one*. Internal carbonyl group.
- **Amine (\`-NH2\`)**: Suffix *-amine*. Basic character due to lone pair on nitrogen.
- **Ester (\`-COO-\`)**: Suffix *-oate*. Formed via Fischer Esterification (Carboxylic acid + Alcohol).

### **Your Active Canvas Molecule**:
- **Name**: \`${currentCompName}\`
- **Formula**: \`${currentFormula}\``;

    return { text };
  }

  // 5. Isomerism & Hybridization Questions
  if (q.includes('hybrid') || q.includes('sp') || q.includes('geometry') || q.includes('angle')) {
    const text = `### **Carbon Hybridization & Molecular Geometry**:

1. **$sp^3$ Hybridization**:
   - **Bonds**: 4 single $\\sigma$ bonds.
   - **Geometry**: Tetrahedral ($109.5^\\circ$ bond angle).
   - **Example**: Alkanes (Methane, Ethane).

2. **$sp^2$ Hybridization**:
   - **Bonds**: 3 $\\sigma$ bonds + 1 $\\pi$ bond (1 double bond).
   - **Geometry**: Trigonal Planar ($120^\\circ$ bond angle).
   - **Example**: Alkenes (Ethene), Benzene.

3. **$sp$ Hybridization**:
   - **Bonds**: 2 $\\sigma$ bonds + 2 $\\pi$ bonds (1 triple bond or 2 cumulated double bonds).
   - **Geometry**: Linear ($180^\\circ$ bond angle).
   - **Example**: Alkynes (Ethyne).`;

    return { text };
  }

  // 6. SN1 / SN2 / Reaction Mechanisms
  if (q.includes('sn1') || q.includes('sn2') || q.includes('reaction') || q.includes('nucleophile') || q.includes('electrophile')) {
    const text = `### **Nucleophilic Substitution Reactions ($S_N1$ vs $S_N2$)**:

| Feature | $S_N1$ Reaction | $S_N2$ Reaction |
| :--- | :--- | :--- |
| **Steps** | 2 Steps (Carbocation intermediate) | 1 Concerted Step (Transition state) |
| **Substrate Preference** | $3^\\circ > 2^\\circ$ (Tertiary carbocation stability) | Methyl $> 1^\\circ > 2^\\circ$ (Unhindered access) |
| **Stereochemistry** | Racemization (Inversion + Retention) | Complete Inversion of Configuration (*Walden*) |
| **Nucleophile** | Weak nucleophile works | Strong nucleophile required |
| **Solvent** | Polar Protic ($H_2O, ROH$) | Polar Aprotic ($DMSO, Acetone$) |`;

    return { text };
  }

  // 7. Aromaticity / Benzene / Hückel Rule
  if (q.includes('aromatic') || q.includes('benzene') || q.includes('huckel') || q.includes('resonance')) {
    const text = `### **Hückel's Rule for Aromaticity**:

A compound is **aromatic** if it satisfies four strict criteria:
1. **Cyclic**: Must contain at least one ring of conjugated atoms.
2. **Planar**: All atoms in the ring must lie in the same flat plane.
3. **Fully Conjugated**: Every ring atom must possess an unhybridized $p$-orbital ($sp^2$ or $sp$).
4. **Hückel's $(4n + 2)\\pi$ Electrons Rule**: Total conjugated $\\pi$-electrons = $4n + 2$ (where $n = 0, 1, 2, 3...$).
   - $n = 0 \\rightarrow 2\\pi$ e⁻ (e.g. Cyclopropenyl cation)
   - $n = 1 \\rightarrow 6\\pi$ e⁻ (e.g. **Benzene**, Pyridine, Furan)
   - $n = 2 \\rightarrow 10\\pi$ e⁻ (e.g. Naphthalene)`;

    return { text };
  }

  // 8. General Chemistry / Conversational Response
  const formattedQuestion = question.charAt(0).toUpperCase() + question.slice(1);
  const text = `### **BondBoard Chemistry Tutor**:

> **Query**: *"${formattedQuestion}"*

Here is an organic chemistry breakdown:

- **Active Canvas Structure**: **${currentCompName}** (\`${currentFormula}\`)
- **Structure Health**: ${valenceStatus}

#### **Core Concepts & Guidance**:
- **Structure Building**: You can place Carbon, Nitrogen, Oxygen, Halogens, or pre-built Functional Groups (Benzene, Cyclohexane, Carboxyl, Phosphate) directly using the left Toolbar.
- **3D Visualization**: Switch to **3D Studio** mode in the header at any time to inspect spatial bond orientations, space-filling CPK spheres, and wireframe conformations.
- **Auto-Drawing**: Type any chemical name (e.g., *"Draw Aspirin"*, *"Show Ibuprofen"*, *"Draw Ethanol"*) in this chat or the top search bar to auto-generate 2D coordinates!

*Ask me anything specific about IUPAC nomenclature, reaction mechanisms, functional group properties, or structural valencies!*`;

  return { text };
}

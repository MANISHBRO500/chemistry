import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable CORS for mobile APK / Capacitor / web apps
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json());

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing from environment variables.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// Health check route
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', hasApiKey: !!process.env.GEMINI_API_KEY });
});

// AI Chemistry Assistant Route
app.post('/api/ai/chemistry', async (req, res) => {
  try {
    const { question, compound, slideInfo, history } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Question is required.' });
      return;
    }

    const slideName = slideInfo?.name || 'Slide 1';
    const slideIdx = slideInfo?.slideIndex || 1;
    const totalSlides = slideInfo?.totalSlides || 1;

    // Custom system prompt for BondBoard AI Tutor
    const systemInstruction = `You are BondBoard AI, a world-class organic chemistry tutor and expert whiteboarding assistant built for high school & university chemistry students (Classes 11-12, AP Chemistry, Organic Chemistry I & II).
Your responses should be encouraging, clear, precise, and educational. Format with clean Markdown (bolding key terms, sub/superscripts where applicable).

App Context:
- BondBoard was designed and created by Manish Kumar Behera. If explicitly asked about the designer, creator, or inventor of BondBoard, always attribute it to Manish Kumar Behera.
- When explaining IUPAC naming rules, refer to priority rules (like Principal Functional Group > Unsaturation > Substituents).

STRICT SLIDE ISOLATION PRINCIPLE:
- You are strictly focused on **Slide #${slideIdx} of ${totalSlides}: "${slideName}"**.
- Every slide in BondBoard is an isolated chemical whiteboard workspace. You can ONLY see and analyze the structure drawn on THIS SPECIFIC SLIDE ("${slideName}").
- Do NOT confuse or blend this compound with structures on other slides unless the user explicitly asks you to compare slides.

CRITICAL FEATURE - DRAWING MOLECULES ON CANVAS:
If the user asks you to draw a compound, create a molecule, or if drawing a structure directly answers their prompt (e.g., "draw aspirin", "show me benzene", "draw 2-methylpropane", "draw ethanol", "draw caffeine"), you MUST generate the 2D atomic layout and bonds as a JSON block at the VERY END of your response.
Format the JSON block strictly inside a markdown code block tagged \`\`\`json structure like this:
\`\`\`json structure
{
  "action": "draw",
  "name": "Aspirin",
  "atoms": [
    { "id": "1", "x": 600, "y": 320, "element": "C" },
    { "id": "2", "x": 660, "y": 320, "element": "C" }
  ],
  "bonds": [
    { "id": "b1", "a": "1", "b": "2", "type": 1 }
  ]
}
\`\`\`
Rules for generating coordinates:
- Center the main structure around (x: 600, y: 320).
- Standard bond lengths should be approximately 50 to 60 units.
- Keep x between 350 and 850, and y between 160 and 480.
- Bond types: 1 = single bond, 2 = double bond, 3 = triple bond.

Current Compound Details on Active Slide ("${slideName}"):
- IUPAC Name: ${compound?.iupac || 'Not built yet / single fragment'}
- Common Name: ${compound?.common || 'N/A'}
- Formula: ${compound?.formula || 'N/A'}
- Atom Count: ${compound?.atoms ?? 0}
- Bond Count: ${compound?.bonds ?? 0}
- Validation Issues: ${compound?.issues?.length ? compound.issues.join('; ') : 'None (Valences are valid)'}`;

    const ai = getGeminiClient();

    let contentsPrompt = question;
    if (history && Array.isArray(history) && history.length > 0) {
      // Build conversation context
      const previousTurns = history
        .map((h: { role: string; content: string }) => `${h.role === 'user' ? 'Student' : 'Tutor'}: ${h.content}`)
        .join('\n');
      contentsPrompt = `${previousTurns}\nStudent: ${question}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: contentsPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        topP: 0.95
      }
    });

    const replyText = response.text || 'I analyzed your query, but could not generate a response. Please try rephrasing.';
    res.json({ answer: replyText });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate chemistry insights.',
      hint: 'Ensure GEMINI_API_KEY is configured in Settings > Secrets.'
    });
  }
});

// AI & PubChem Compound Auto-Drawer Route
app.post('/api/compound/draw', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Compound name is required.' });
      return;
    }

    const cleanName = name.trim();

    // 1. Try PubChem PUG REST API for 2D Conformer Coordinates first
    try {
      const pcUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(cleanName)}/JSON`;
      const pcRes = await fetch(pcUrl);

      if (pcRes.ok) {
        const pcData = await pcRes.json();
        const compoundData = pcData.PC_Compounds?.[0];

        if (compoundData && compoundData.atoms && compoundData.coords?.[0]?.conformers?.[0]) {
          const aids: number[] = compoundData.atoms.aid || [];
          const elementsNum: number[] = compoundData.atoms.element || [];
          const rawX: number[] = compoundData.coords[0].conformers[0].x || [];
          const rawY: number[] = compoundData.coords[0].conformers[0].y || [];

          const elementMap: Record<number, string> = {
            1: 'H', 6: 'C', 7: 'N', 8: 'O', 9: 'F', 15: 'P', 16: 'S', 17: 'Cl', 35: 'Br', 53: 'I'
          };

          if (aids.length > 0 && rawX.length === aids.length && rawY.length === aids.length) {
            // Find bounds
            let minX = Math.min(...rawX), maxX = Math.max(...rawX);
            let minY = Math.min(...rawY), maxY = Math.max(...rawY);

            let width = maxX - minX || 1;
            let height = maxY - minY || 1;

            // Target canvas area ~500x350 centered at (600, 320)
            let targetSize = Math.max(width, height);
            let scale = targetSize > 0 ? Math.min(480 / targetSize, 65) : 55;
            scale = Math.max(25, Math.min(scale, 85));

            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            const atoms = aids.map((aid, idx) => {
              const elNum = elementsNum[idx];
              const symbol = elementMap[elNum] || 'C';
              const px = Math.round(600 + (rawX[idx] - centerX) * scale);
              const py = Math.round(320 - (rawY[idx] - centerY) * scale); // invert Y for SVG

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
              if (order > 3) order = 1; // map aromatic or multi-order to single/double

              return {
                id: `b-${idx + 1}`,
                a: String(a1),
                b: String(a2),
                type: order
              };
            });

            res.json({
              success: true,
              source: 'pubchem',
              name: cleanName,
              atoms,
              bonds
            });
            return;
          }
        }
      }
    } catch (pcErr) {
      console.warn('PubChem 2D lookup failed, falling back to Gemini:', pcErr);
    }

    // 2. Gemini AI Structure Generation Fallback
    const ai = getGeminiClient();
    const prompt = `Generate a 2D atomic layout and bonds for drawing the chemical structure of: "${cleanName}".
Center the structure around x=600, y=320 with bond distances approximately 55 units apart. Keep x values between 350 and 850, and y values between 160 and 480.
Return JSON with "name", "atoms" array (with "id", "x", "y", "element"), and "bonds" array (with "id", "a", "b", "type" where type is 1 for single, 2 for double, 3 for triple).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING' },
            atoms: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  id: { type: 'STRING' },
                  x: { type: 'NUMBER' },
                  y: { type: 'NUMBER' },
                  element: { type: 'STRING' }
                },
                required: ['id', 'x', 'y', 'element']
              }
            },
            bonds: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  id: { type: 'STRING' },
                  a: { type: 'STRING' },
                  b: { type: 'STRING' },
                  type: { type: 'INTEGER' }
                },
                required: ['id', 'a', 'b', 'type']
              }
            }
          },
          required: ['name', 'atoms', 'bonds']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      source: 'gemini',
      name: parsed.name || cleanName,
      atoms: parsed.atoms || [],
      bonds: parsed.bonds || []
    });
  } catch (err: any) {
    console.error('AI Compound Draw Error:', err);
    res.status(500).json({ error: err.message || 'Could not draw requested compound.' });
  }
});

// PubChem Proxy Route to avoid CORS issues
app.get('/api/pubchem/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES/JSON`;
    const pubchemRes = await fetch(url);
    if (!pubchemRes.ok) {
      res.status(404).json({ error: 'Compound not found in PubChem.' });
      return;
    }
    const data = await pubchemRes.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'PubChem lookup failed.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BondBoard server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

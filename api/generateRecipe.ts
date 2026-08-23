import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items, peopleCount } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Nessun ingrediente fornito.' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("API Key mancante su Vercel!");
      return res.status(500).json({ error: "Configurazione server mancante." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
AGISCI COME: Uno Chef Stellato ed esperto di cucina anti-spreco.
COMPITO: Ho i seguenti ingredienti nel frigo, nel freezer o in dispensa (pasta, legumi, conserve, sale, ecc.). Crea una ricetta deliziosa per ESATTAMENTE ${peopleCount || 2} persone per utilizzarne il più possibile, specialmente quelli vicini alla scadenza.

INGREDIENTI DISPONIBILI:
${items.map((i: any) => `- ${i.name} (Quantità: ${i.quantity}, Scadenza: ${i.expiration_date})`).join('\n')}

REGOLE OUTPUT:
1. Restituisci SOLO un oggetto JSON. NESSUN markdown, NESSUNA spiegazione fuori dal JSON.
2. Formato richiesto:
{
  "title": "Nome creativo della ricetta",
  "prep_time_minutes": 30,
  "difficulty": "Facile | Media | Difficile",
  "ingredients_used": [
    { "name": "Nome", "quantity_deducted": 2, "unit": "pezzi", "original_id": "ID_SE_PRESENTE" }
  ],
  "extra_ingredients_needed": ["sale", "olio", "pepe"],
  "steps": ["Passo 1...", "Passo 2..."]
}

NOTA BENE: In "ingredients_used", metti esattamente quanto di quel prodotto specifico viene consumato per ${peopleCount || 2} persone. Usa "original_id" se fornito nell'input.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const parsedData = JSON.parse(text);
    return res.status(200).json(parsedData);

  } catch (error: any) {
    console.error('Gemini Recipe Error:', error);
    return res.status(500).json({ error: 'Errore durante la generazione della ricetta', details: error.message });
  }
}

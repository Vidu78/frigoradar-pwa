import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { guard } from '../lib/guard.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await guard(req, res))) return;

  const { query, barcode } = req.body;
  
  if (!query && !barcode) {
    return res.status(400).json({ error: 'Devi fornire una query di testo o un barcode.' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("API Key mancante su Vercel!");
      return res.status(500).json({ error: "Configurazione server mancante (API Key non trovata)." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const prompt = `
AGISCI COME: Database Architect e Data Normalization Master specializzato in nutrizione, GDO e Retail Alimentare.
COMPITO: Analizza una stringa grezza (da scanner o OCR) e restituisci i metadati canonici di un prodotto alimentare.

REGOLE ANTI-ALLUCINAZIONE E SALUTE:
1. NON INVENTARE NOMI: Se la stringa è vuota o incomprensibile, name = "Prodotto Sconosciuto".
2. NORMALIZZAZIONE: Nome pulito senza codici o pesi.
3. CONSERVAZIONE: Solo "FRIDGE", "FREEZER", "PANTRY".
4. HEALTH SCORE: Valuta l'impatto sulla salute in base alla tipologia di prodotto. Valori ammessi: "Sano", "Moderato", "Poco Sano", "Sconosciuto".
5. NO MARKDOWN: Solo JSON puro.

INPUT REALE: "${query || barcode}"

SCHEMA DI OUTPUT JSON OBBLIGATORIO:
{
  "name": "Nome canonico pulito",
  "brand": "Marca se certa, altrimenti null",
  "category": "Macro categoria semantica",
  "storage_type": "FRIDGE | FREEZER | PANTRY",
  "default_shelf_life_days": 5,
  "health_score": "Sano | Moderato | Poco Sano | Sconosciuto",
  "ingredients": "Lista degli ingredienti separati da virgola (se deducibile o noti), altrimenti null",
  "nutritional_info": { "calories_per_100g": "valore numerico o null" },
  "nutriscore": "A | B | C | D | E | null"
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const parsedData = JSON.parse(text);
    return res.status(200).json(parsedData);

  } catch (error: any) {
    console.error('Gemini Error:', error);
    return res.status(500).json({ error: 'Errore AI', details: error.message });
  }
}

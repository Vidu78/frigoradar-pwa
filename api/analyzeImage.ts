import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { image } = req.body; // base64 string
  
  if (!image) {
    return res.status(400).json({ error: 'Devi fornire l\'immagine in formato base64.' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("API Key mancante su Vercel!");
      return res.status(500).json({ error: "Configurazione server mancante (API Key non trovata)." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Rimuove l'eventuale intestazione data:image/jpeg;base64,
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      }
    };

    const today = new Date().toISOString().split('T')[0];

    const prompt = `
AGISCI COME: Database Architect ed esperto di Visione Artificiale applicata al retail alimentare.
COMPITO: Analizza la foto fornita (può essere la foto del prodotto o la data di scadenza stampata sulla confezione). Riconosci i dati del prodotto e, soprattutto, leggi visivamente la DATA DI SCADENZA.

REGOLE IMPORTANTI DI LETTURA:
1. NOME PRODOTTO: Identifica il nome dell'alimento visibile nella foto. Se l'immagine mostra solo la data di scadenza e non si capisce il prodotto, usa "Prodotto da Foto".
2. DATA DI SCADENZA (FONDAMENTALE): Cerca stringhe come "Scad.", "EXP", "Da consumarsi entro", o date stampate (es. "12/10/26", "24 LUG 25", ecc.).
   - Se trovi una data stampata, convertila nel formato YYYY-MM-DD (es. "2026-10-12").
   - Se la data ha solo l'anno a due cifre (es. '26'), convertila in anno a 4 cifre ('2026').
   - Se NON c'è alcuna data visibile nella foto, stima una data di scadenza ragionevole basandoti sul tipo di prodotto, calcolandola a partire da OGGI (${today}) usando il campo default_shelf_life_days.
3. CONSERVAZIONE: Determina dove va conservato tra: "FRIDGE" (Frigo), "FREEZER" (Freezer), "PANTRY" (Dispensa).
4. HEALTH SCORE: Valuta la salubrità del cibo tra: "Sano", "Moderato", "Poco Sano", "Sconosciuto".
5. OUTPUT: Restituisci esclusivamente l'oggetto JSON richiesto. NESSUN blocco markdown o testo esplicativo.

SCHEMA DI OUTPUT JSON OBBLIGATORIO:
{
  "name": "Nome pulito del prodotto",
  "category": "Categoria alimentare",
  "storage_type": "FRIDGE | FREEZER | PANTRY",
  "expiration_date": "YYYY-MM-DD (quella letta o quella stimata)",
  "default_shelf_life_days": 7,
  "health_score": "Sano | Moderato | Poco Sano | Sconosciuto"
}
`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    let text = response.text().trim();
    
    // Pulisce eventuale markdown inviato per errore
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const parsedData = JSON.parse(text);
    return res.status(200).json(parsedData);

  } catch (error: any) {
    console.error('Gemini Image Error:', error);
    return res.status(500).json({ error: 'Errore durante l\'analisi dell\'immagine', details: error.message });
  }
}

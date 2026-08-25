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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
AGISCI COME: Esperto di Visione Artificiale e OCR applicato al retail alimentare.
COMPITO: Analizza la foto fornita. Può essere la foto dell'intero prodotto o un dettaglio ravvicinato della data di scadenza. 

REGOLE IMPORTANTI DI TOLLERANZA E LETTURA:
1. DATA DI SCADENZA (TOLLERANZA MASSIMA):
   - Cerca qualsiasi stringa riconducibile a una scadenza (es. "Scad", "EXP", "Consumare entro", "B.B.", "Da consumarsi", "Lotto", ecc.) o cifre stampate a getto d'inchiostro.
   - Sii estremamente tollerante: se l'immagine è sfocata, riflessa, parzialmente tagliata, o di sbieco, fai del tuo meglio per intuire e ricostruire la data corretta.
   - Se l'anno è espresso a due cifre (es. "25", "26"), convertilo a 4 cifre ("2025", "2026").
   - Se la data è totalmente invisibile, illeggibile o assente, NON dare errore e NON scrivere null o "sconosciuto". Calcola invece una data stimata ragionevole basandoti sul tipo di prodotto identificato (es. Latticini: +7gg, Carne/Pesce freschi: +3gg, Pane: +5gg, Conserve/Scatolame: +365gg, Succhi: +30gg) a partire da OGGI (${today}).
   - IL CAMPO "expiration_date" DEVE SEMPRE ED ESCLUSIVAMENTE CONTENERE UNA DATA VALIDA NEL FORMATO "YYYY-MM-DD". Non usare mai parole o formati alternativi.

2. NOME PRODOTTO: Identifica il nome dell'alimento. Se la foto mostra solo la data su sfondo bianco/neutro e non è possibile capire il prodotto, usa il nome generico "Prodotto da Foto".

3. CONSERVAZIONE: Determina la modalità di conservazione corretta tra: "FRIDGE" (Frigo), "FREEZER" (Freezer), "PANTRY" (Dispensa).

4. HEALTH SCORE: Valuta la salubrità del cibo tra: "Sano", "Moderato", "Poco Sano", "Sconosciuto".

SCHEMA DI OUTPUT JSON RICHIESTO:
{
  "name": "Nome del prodotto",
  "category": "Categoria dell'alimento",
  "storage_type": "FRIDGE | FREEZER | PANTRY",
  "expiration_date": "YYYY-MM-DD (letta o stimata con tolleranza)",
  "default_shelf_life_days": 7,
  "health_score": "Sano | Moderato | Poco Sano | Sconosciuto"
}
`;

    // Esegui la chiamata con configurazione per forzare output JSON nativo
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }, imagePart] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });
    
    const response = await result.response;
    let text = response.text().trim();
    
    // Pulisce eventuale markdown residuo
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const parsedData = JSON.parse(text);
    return res.status(200).json(parsedData);

  } catch (error: any) {
    console.error('Gemini Image Error:', error);
    return res.status(500).json({ error: 'Errore durante l\'analisi dell\'immagine', details: error.message });
  }
}

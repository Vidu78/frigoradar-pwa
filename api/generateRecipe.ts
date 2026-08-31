import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { guard, consumaCredito } from '../lib/guard.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await guard(req, res))) return;

  const { items, peopleCount, difficulty, priority } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Nessun ingrediente fornito.' });
  }

  if (!(await consumaCredito(req, res, 'recipe'))) return;

  // Limite di sicurezza: max 50 ingredienti per prevenire abuso di token
  const safeItems = items.slice(0, 50);

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("API Key mancante su Vercel!");
      return res.status(500).json({ error: "Configurazione server mancante." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const diffLabel = difficulty === 'STELLATO' ? 'Stellato (Alta cucina gourmet da chef Michelin)' : (difficulty === 'MEDIO' ? 'Medio (Cucina tradizionale elaborata)' : 'Facile (Cucina semplice e veloce)');
    const priorityLabel = priority === 'IN_SCADENZA' ? 'Dai assoluta priorità e usa per primi gli ingredienti con scadenza più imminente.' : 'Usa qualsiasi combinazione ideale degli ingredienti forniti.';

    const prompt = `
AGISCI COME: Un rinomato Chef Stellato Michelin italiano, appassionato di cucina regionale e sostenibilità anti-spreco. La tua cucina predilige e celebra le tradizioni gastronomiche di: Puglia, Toscana, Umbria, Campania, Sicilia e Sardegna.
COMPITO: Crea una ricetta descritta in modo paziente, meticoloso e dettagliato per ESATTAMENTE ${peopleCount || 2} persone, valorizzando gli ingredienti che ho a disposizione. Non tralasciare alcun passaggio e spiega ogni tecnica come se stessi guidando un giovane commis di cucina.

LIVELLO RICETTA RICHIESTO: ${diffLabel}
PRIORITÀ ALIMENTI: ${priorityLabel}

INGREDIENTI DISPONIBILI (Usa prevalentemente questi. Puoi assumere che l'utente abbia in dispensa ingredienti base come sale, pepe, olio d'oliva, acqua, aceto):
${safeItems.map((i: any) => `- ${i.name} (Quantità: ${i.quantity}, Scadenza: ${i.expiration_date}, ID: ${i.original_id})`).join('\n')}

REGOLE DEL PROMPT DA CHEF STELLATO:
1. ISPIRAZIONE REGIONALE: Dai un tocco regionale marcato (es. pugliese, toscano, campano, ecc.) alla ricetta, menzionando l'ispirazione.
2. DETTAGLIO ASSOLUTO: Descrivi i passaggi in modo chiaro e meticoloso. Se la ricetta è 'STELLATO', includi dettagli sulla consistenza, l'impiattamento visivo, l'emulsione dei sughi o la gestione delle temperature. Non lasciare buchi o passaggi omessi.
3. OUTPUT FORMAT: Restituisci esclusivamente un oggetto JSON conforme allo schema sotto. NESSUN blocco di testo o markdown esplicativo esterno.

SCHEMA DI OUTPUT JSON OBBLIGATORIO:
{
  "title": "Nome creativo ed elegante del piatto (es. Spaghetto spezzato alla pugliese con...)",
  "prep_time_minutes": 35,
  "difficulty": "Facile | Media | Difficile",
  "ingredients_used": [
    { "name": "Nome esatto ingrediente usato", "quantity_deducted": 150, "unit": "g | pezzi | cucchiai", "original_id": "ID_SE_PRESENTE" }
  ],
  "extra_ingredients_needed": ["sale", "olio extravergine d'oliva", "pepe"],
  "steps": [
    "Fase 1: Spiegazione dettagliata della preparazione degli ingredienti...",
    "Fase 2: Spiegazione dettagliata della cottura con tempi e dettagli tecnici...",
    "Fase 3: Spiegazione dettagliata della finitura e impiattamento da Chef..."
  ]
}
`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
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
    console.error('Gemini Recipe Error:', error);
    // Il messaggio dell'SDK resta nei log: puo contenere dettagli interni.
    return res.status(500).json({ error: 'Errore durante la generazione della ricetta' });
  }
}

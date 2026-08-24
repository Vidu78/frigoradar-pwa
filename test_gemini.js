import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("API Key mancante!");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const items = [{ name: 'Pomodoro', quantity: 2, expiration_date: '2026-08-30', original_id: '1' }];
  const peopleCount = 2;
  const diffLabel = 'Facile';
  const priorityLabel = 'Tutti';

  const prompt = `
AGISCI COME: Un rinomato Chef Stellato Michelin italiano, appassionato di cucina regionale e sostenibilità anti-spreco. La tua cucina predilige e celebra le tradizioni gastronomiche di: Puglia, Toscana, Umbria, Campania, Sicilia e Sardegna.
COMPITO: Crea una ricetta descritta in modo paziente, meticoloso e dettagliato per ESATTAMENTE ${peopleCount || 2} persone, valorizzando gli ingredienti che ho a disposizione. Non tralasciare alcun passaggio e spiega ogni tecnica come se stessi guidando un giovane commis di cucina.

LIVELLO RICETTA RICHIESTO: ${diffLabel}
PRIORITÀ ALIMENTI: ${priorityLabel}

INGREDIENTI DISPONIBILI (Usa prevalentemente questi. Puoi assumere che l'utente abbia in dispensa ingredienti base come sale, pepe, olio d'oliva, acqua, aceto):
${items.map((i: any) => `- ${i.name} (Quantità: ${i.quantity}, Scadenza: ${i.expiration_date}, ID: ${i.original_id})`).join('\n')}

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

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });
    console.log("Response:", await result.response.text());
  } catch (error) {
    console.error("Error with correct structure:", error);
  }
}

run();

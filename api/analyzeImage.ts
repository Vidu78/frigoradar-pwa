import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { guard, consumaCredito } from '../lib/guard.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await guard(req, res))) return;

  const { image, mode } = req.body; // base64 string
  
  if (!image) {
    return res.status(400).json({ error: 'Devi fornire l\'immagine in formato base64.' });
  }

  if (!(await consumaCredito(req, res, 'scan'))) return;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("API Key mancante su Vercel!");
      return res.status(500).json({ error: "Configurazione server mancante (API Key non trovata)." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    // Rimuove l'eventuale intestazione data:image/jpeg;base64,
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      }
    };

    const today = new Date().toISOString().split('T')[0];

    // AddItemModal invia mode: 'produce_weight' per le etichette del banco
    // ortofrutta e si aspetta weight_kg / produce_name. Finche questo campo
    // veniva ignorato, la lettura del peso mostrava sempre "non leggibile".
    const producePrompt = `
AGISCI COME: Esperto di OCR applicato alle etichette con codice a barre del banco ortofrutta della GDO italiana.
COMPITO: Nella foto c'e l'etichetta adesiva stampata dalla bilancia del supermercato. Estrai il peso e il prodotto.

REGOLE:
1. PESO: cerca il valore accanto a "kg", "Kg", "PESO", "P.NETTO" o simili. Restituiscilo in CHILOGRAMMI come numero decimale (es. 0.412). Se leggi grammi, converti (412 g -> 0.412). Se il peso non e leggibile, usa null: non inventarlo.
2. PRODOTTO: il nome dell'ortofrutta stampato sull'etichetta (es. "Banane", "Pomodori Ciliegino"). Se non leggibile, null.
3. NO MARKDOWN: solo JSON puro.

SCHEMA DI OUTPUT JSON OBBLIGATORIO:
{
  "weight_kg": 0.412,
  "produce_name": "Banane"
}
`;

    const defaultPrompt = `
AGISCI COME: Esperto di Visione Artificiale e OCR applicato al retail alimentare.
COMPITO: Analizza la foto fornita. Può essere la foto dell'intero prodotto o un dettaglio ravvicinato della data di scadenza. 

REGOLE IMPORTANTI DI TOLLERANZA E LETTURA:
1. DATA DI SCADENZA (TOLLERANZA MASSIMA):
   - Cerca qualsiasi stringa riconducibile a una scadenza (es. "Scad", "EXP", "Consumare entro", "B.B.", "Da consumarsi", "Lotto", ecc.) o cifre stampate a getto d'inchiostro.
   - Sii estremamente tollerante: se l'immagine è sfocata, riflessa, parzialmente tagliata, o di sbieco, fai del tuo meglio per intuire e ricostruire la data corretta.
   - Se l'anno è espresso a due cifre (es. "25", "26"), convertilo a 4 cifre ("2025", "2026").
   - Se la data è totalmente invisibile, illeggibile o assente, NON dare errore e NON scrivere null o "sconosciuto". Calcola invece una data stimata ragionevole basandoti sul tipo di prodotto identificato (es. Latticini: +7gg, Carne/Pesce freschi: +3gg, Pane: +5gg, Conserve/Scatolame: +365gg, Succhi: +30gg) a partire da OGGI (${today}).
   - IL CAMPO "date_source" DEVE VALERE "letta" SOLO SE HAI EFFETTIVAMENTE VISTO LA DATA SULLA CONFEZIONE. In ogni altro caso (data ricostruita, dedotta o calcolata dal tipo di prodotto) DEVE VALERE "stimata". Non barare: l'utente vede questa distinzione e ci decide se fidarsi.
   - IL CAMPO "expiration_date" DEVE SEMPRE ED ESCLUSIVAMENTE CONTENERE UNA DATA VALIDA NEL FORMATO "YYYY-MM-DD". Non usare mai parole o formati alternativi.

2. NOME PRODOTTO: Identifica il nome dell'alimento. Se la foto mostra solo la data su sfondo bianco/neutro e non è possibile capire il prodotto, usa il nome generico "Prodotto da Foto".

3. CONSERVAZIONE: Determina la modalità di conservazione corretta tra: "FRIDGE" (Frigo), "FREEZER" (Freezer), "PANTRY" (Dispensa).

4. HEALTH SCORE: Valuta la salubrità del cibo tra: "Sano", "Moderato", "Poco Sano", "Sconosciuto".

SCHEMA DI OUTPUT JSON RICHIESTO:
{
  "name": "Nome del prodotto",
  "brand": "Marca dell'azienda produttrice (se visibile), altrimenti null",
  "category": "Categoria dell'alimento",
  "storage_type": "FRIDGE | FREEZER | PANTRY",
  "expiration_date": "YYYY-MM-DD (letta o stimata con tolleranza)",
  "date_source": "letta | stimata",
  "default_shelf_life_days": 7,
  "health_score": "Sano | Moderato | Poco Sano | Sconosciuto",
  "ingredients": "Lista degli ingredienti (se visibili o deducibili dal prodotto), altrimenti null",
  "nutritional_info": { "calories_per_100g": "valore numerico estratto o deducibile, altrimenti null" },
  "nutriscore": "A | B | C | D | E | null"
}
`;

    // Esegui la chiamata con configurazione per forzare output JSON nativo
    const prompt = mode === 'produce_weight' ? producePrompt : defaultPrompt;

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
    // Il messaggio dell'SDK resta nei log: puo contenere dettagli interni.
    return res.status(500).json({ error: 'Errore durante l\'analisi dell\'immagine' });
  }
}

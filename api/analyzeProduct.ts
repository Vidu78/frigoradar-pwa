import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  // CORS setup per permettere all'app locale di chiamare questa API (utile per i tuoi test sul computer)
  res.setHeader('Access-Control-Allow-Credentials', true);
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
AGISCI COME: Database Architect e Data Normalization Master specializzato in ambito GDO e Retail Alimentare (FMCG).
COMPITO: Devi analizzare una stringa di input grezza (derivata da API scanner o OCR) e restituire i metadati canonici di un prodotto alimentare.

REGOLE ANTI-ALLUCINAZIONE (CRITICAL STRICT MODE):
1. NON INVENTARE NOMI: Se la stringa in input è palesemente falsa, vuota o è un codice a barre numerico puro senza contesto testuale, restituisci name = "Prodotto Sconosciuto" e brand = null. Non allucinare prodotti inesistenti.
2. NORMALIZZAZIONE: Estrai il nome pulito del prodotto eliminando codici sporchi, grammature (es. 500g, 1L) e refusi dal campo "name".
3. CONSERVAZIONE: Usa ESCLUSIVAMENTE i valori esatti dell'enum: "FRIDGE", "FREEZER", "PANTRY", "OTHER". (I surgelati sono FREEZER, i prodotti secchi PANTRY, il fresco FRIDGE).
4. DATI INCERTI: Se non sei certo al 99% della marca (brand), imposta il valore a null. Non provare a indovinare.
5. NO MARKDOWN: La tua risposta DEVE essere solo l'oggetto JSON puro. Nessun backtick, nessuna spiegazione.

INPUT REALE DA ANALIZZARE: "${query || barcode}"

SCHEMA DI OUTPUT JSON OBBLIGATORIO:
{
  "name": "Nome canonico pulito (es. Latte Parzialmente Scremato) o 'Prodotto Sconosciuto'",
  "brand": "Marca estratta se presente e certa, altrimenti null",
  "category": "Macro categoria semantica (es. Latticini, Surgelati, Dispensa)",
  "storage_type": "FRIDGE | FREEZER | PANTRY | OTHER",
  "default_shelf_life_days": numero intero stimato di giorni di durata tipica (es. 180 per surgelati, 5 per fresco)
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Pulisco eventuali backticks markdown residui per evitare crash di parse
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const parsedData = JSON.parse(text);
    return res.status(200).json(parsedData);

  } catch (error: any) {
    console.error('Gemini Error:', error);
    return res.status(500).json({ error: 'Errore durante l\'analisi AI', details: error.message });
  }
}

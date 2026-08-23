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
Sei il motore semantico di "FrigoRadar", un'app avanzata per l'inventario domestico (frigo e freezer).
L'utente o lo scanner barcode ha appena rilevato questo input: "${query || barcode}"

Il tuo compito è dedurre i dettagli tecnici di questo prodotto alimentare (normalizzando nomi, correggendo ortografia e deducendo marca/scadenze).
Restituisci ESCLUSIVAMENTE un oggetto JSON valido, senza alcuna spiegazione, markdown, o blocchi di codice (nessun backtick).

Il JSON deve avere questi esatti campi:
{
  "name": "Nome pulito e standardizzato (es. Latte Parzialmente Scremato)",
  "brand": "Marca (solo se deducibile dall'input, altrimenti null)",
  "category": "Una tra: Latticini, Carne, Pesce, Verdura, Frutta, Bevande, Condimenti, Surgelati, Dispensa",
  "storage_type": "SOLO uno tra: FRIDGE, FREEZER, PANTRY, OTHER (Usa FREEZER per i surgelati)",
  "default_shelf_life_days": Stima numerica dei giorni di durata media (es. 5 per latte aperto, 180 per surgelati)
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

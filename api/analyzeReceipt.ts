import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  const { image } = req.body; 
  
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
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      }
    };

    const prompt = `
AGISCI COME: Database Architect e Cassiere Virtuale specializzato in scontrini della GDO italiana.
COMPITO: Analizza lo scontrino della spesa fornito. Estrai l'elenco dei prodotti alimentari acquistati. 
ATTENZIONE (REGOLE TASSATIVE):
1. Devi IGNORARE E SCARTARE in modo categorico qualsiasi prodotto NON ALIMENTARE (es. detersivi, saponi, shampoo, dentifricio, cura della casa, carta igienica, profumi, pile, cancelleria, abbigliamento, farmaci). Se non si mangia e non si beve, SCARTALO. L'app gestisce SOLO ED ESCLUSIVAMENTE cibo e bevande da mettere in frigo o in dispensa.
2. Ignora buste, sconti, ticket, buoni pasto, resi e i subtotali.

Per ogni prodotto trovato:
1. "raw_name": Il nome esatto letto dallo scontrino (es. "POM PEL MUTTI").
2. "name": Il nome canonico normalizzato e pulito che presumi sia corretto (es. "Pomodori Pelati Mutti").
3. "price": Il prezzo unitario o totale per quel rigo, come NUMERO (es. 2.45).
4. "quantity": Quanti pezzi o chili sono stati acquistati (es. 1, 2, 0.5). Default 1.
5. "unit": "pz" (pezzi), "kg", "l" (litri).
6. "category": "Carni e Salumi" | "Verdure e Frutta" | "Latticini e Uova" | "Pesce e Frutti di Mare" | "Pane e Pasta" | "Conserve e Sughi" | "Dolci e Snack" | "Bevande" | "Altro".
7. "storage_type": "FRIDGE" | "FREEZER" | "PANTRY" in base a dove va conservato logicamente.
8. "estimated_shelf_life_days": Quanti giorni dura solitamente quel prodotto (es. Latte fresco = 5, Pasta = 730, Carne = 3, Verdura = 7).

SCHEMA DI OUTPUT JSON RICHIESTO: Devi restituire UN ARRAY di oggetti, anche se c'è un solo prodotto.

[
  {
    "raw_name": "POM PEL MUTTI 400G",
    "name": "Pomodori Pelati Mutti",
    "price": 1.25,
    "quantity": 2,
    "unit": "pz",
    "category": "Conserve e Sughi",
    "storage_type": "PANTRY",
    "estimated_shelf_life_days": 730
  }
]
`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }, imagePart] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });
    
    const response = await result.response;
    let text = response.text().trim();
    
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const parsedData = JSON.parse(text);
    return res.status(200).json({ items: parsedData });

  } catch (error: any) {
    console.error('Gemini Receipt Error:', error);
    return res.status(500).json({ error: 'Errore durante l\'analisi dello scontrino', details: error.message });
  }
}

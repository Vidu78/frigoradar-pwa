import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { guard, consumaCredito } from '../lib/guard.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await guard(req, res))) return;

  const { image } = req.body; 
  
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

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      }
    };

    const prompt = `
AGISCI COME: Database Architect e Cassiere Virtuale specializzato in scontrini della GDO italiana.
COMPITO: Analizza lo scontrino della spesa fornito. Estrai l'insegna del supermercato, i punti fedeltà, gli sconti stampati e l'elenco dei prodotti alimentari acquistati.

ATTENZIONE (REGOLE TASSATIVE SUI PRODOTTI):
1. Devi IGNORARE E SCARTARE in modo categorico qualsiasi prodotto NON ALIMENTARE (es. detersivi, saponi, shampoo, dentifricio, cura della casa, carta igienica, profumi, pile, cancelleria, abbigliamento, farmaci). Se non si mangia e non si beve, SCARTALO. L'app gestisce SOLO ED ESCLUSIVAMENTE cibo e bevande.
2. Ignora buste, sconti sui singoli righi (che non sono coupon futuri), resi e i subtotali.

ATTENZIONE (REGOLE SUI PUNTI E SCONTI):
1. "store_name": Cerca di capire di che supermercato si tratta dall'intestazione (es. "ESSELUNGA", "COOP", "CONAD", "CARREFOUR", "LIDL"). Se non è chiaro, restituisci null.
2. "loyalty_points": Cerca voci come "Punti accumulati", "Saldo Punti", "Punti totali". Restituisci il numero totale dei punti attuali. Se non c'è, null.
3. "discounts": Cerca in fondo allo scontrino se ci sono messaggi promozionali come "Buono Sconto 5€ su spesa minima", "Coupon 20%", ecc. Estrai la descrizione, il valore se chiaro, e la data di scadenza. Se non ce ne sono, array vuoto.

Per ogni prodotto trovato:
1. "raw_name": Il nome esatto letto (es. "POM PEL MUTTI").
2. "name": Il nome canonico (es. "Pomodori Pelati Mutti").
3. "price": Il prezzo unitario o totale, come NUMERO (es. 2.45).
4. "quantity": Quanti pezzi o chili (es. 1, 2, 0.5). Default 1.
5. "unit": "pz", "kg", "l".
6. "category": "Carni e Salumi" | "Verdure e Frutta" | "Latticini e Uova" | "Pesce e Frutti di Mare" | "Pane e Pasta" | "Conserve e Sughi" | "Dolci e Snack" | "Bevande" | "Altro".
7. "storage_type": "FRIDGE" | "FREEZER" | "PANTRY".
8. "estimated_shelf_life_days": Giorni di scadenza stimata (es. Latte=5, Pasta=730).

SCHEMA DI OUTPUT JSON RICHIESTO:
{
  "store_name": "CONAD",
  "loyalty_points": 450,
  "discounts": [
    {
      "description": "Buono sconto su spesa minima 30€",
      "discount_amount": "5€",
      "expiration_date": "2026-09-15"
    }
  ],
  "items": [
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
}
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
    return res.status(200).json(parsedData); // Now returns { store_name, loyalty_points, discounts, items }

  } catch (error: any) {
    console.error('Gemini Receipt Error:', error);
    return res.status(500).json({ error: 'Errore durante l\'analisi dello scontrino', details: error.message });
  }
}

import { GoogleGenerativeAI, type GenerateContentRequest } from '@google/generative-ai';

// Ordine di preferenza: vince il primo che risponde. Google manda 503
// "high demand" sul flash piu' nuovo quando satura la capacita': con un solo
// modello fisso le ricette restano morte per ore. Un nome inesistente (404)
// costa una chiamata a vuoto e si passa al successivo.
// Verificato il 22/09/2026: 3.6-flash e 3.5-flash rispondevano 503 in serie,
// 3.5-flash-lite rispondeva; gemini-3.6-flash-lite non esiste (404).
const MODELLI = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3-flash',
  'gemini-3.6-pro',
];

// Errori che passano da soli: il primo modello riprova una volta, poi si cambia.
const TRANSITORI = new Set([429, 500, 502, 503, 504]);
const ATTESA_MS = 1500;

export async function generaTesto(
  apiKey: string,
  request: GenerateContentRequest | string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const esiti: string[] = [];

  for (const nome of MODELLI) {
    const model = genAI.getGenerativeModel({ model: nome });
    const tentativi = nome === MODELLI[0] ? 2 : 1;
    for (let tentativo = 1; tentativo <= tentativi; tentativo++) {
      try {
        const result = await model.generateContent(request);
        if (esiti.length) console.error(`Gemini: risposto ${nome} dopo ${esiti.join(', ')}`);
        return result.response.text().trim();
      } catch (e: any) {
        const status: number | undefined = e?.status;
        esiti.push(`${nome}=${status ?? 'rete'}`);
        // Chiave errata, prompt rifiutato, ecc.: insistere non serve.
        if (status !== undefined && status !== 404 && !TRANSITORI.has(status)) throw e;
        if (status === 404) break;
        if (tentativo < tentativi) await new Promise(r => setTimeout(r, ATTESA_MS));
      }
    }
  }
  // Il riassunto finisce nel log e nel campo details: dice quale modello ha
  // fatto cosa, senza dover indovinare dal solo ultimo errore.
  throw new Error(`Gemini non disponibile (${esiti.join(', ')})`);
}

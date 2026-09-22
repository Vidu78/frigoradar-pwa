import { GoogleGenerativeAI, type GenerateContentRequest } from '@google/generative-ai';

// Ordine di preferenza: vince il primo che risponde. Google manda 503
// "high demand" sul flash piu' nuovo quando satura la capacita': con un solo
// modello fisso le ricette restano morte per ore. Un nome inesistente (404)
// costa una chiamata a vuoto e si passa al successivo.
const MODELLI = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'];

// Errori che passano da soli: si riprova, poi si cambia modello.
const TRANSITORI = new Set([429, 500, 502, 503, 504]);
const ATTESA_MS = 1500;

export async function generaTesto(
  apiKey: string,
  request: GenerateContentRequest | string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  let ultimo: unknown;

  for (const nome of MODELLI) {
    const model = genAI.getGenerativeModel({ model: nome });
    for (let tentativo = 1; tentativo <= 2; tentativo++) {
      try {
        const result = await model.generateContent(request);
        if (nome !== MODELLI[0]) console.warn(`Gemini: risposto ${nome} (fallback)`);
        return result.response.text().trim();
      } catch (e: any) {
        ultimo = e;
        const status: number | undefined = e?.status;
        // Chiave errata, prompt rifiutato, ecc.: insistere non serve.
        if (status !== undefined && status !== 404 && !TRANSITORI.has(status)) throw e;
        console.warn(`Gemini ${nome} tentativo ${tentativo}: ${status ?? e?.message}`);
        if (status === 404) break;
        if (tentativo === 1) await new Promise(r => setTimeout(r, ATTESA_MS));
      }
    }
  }
  throw ultimo;
}

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key");
    return;
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const dir = "C:\\Users\\Vincenzo Durante\\Downloads";
  const files = fs.readdirSync(dir).filter(f => f.startsWith("WhatsApp Image 2026-08-25") && f.endsWith(".jpeg"));
  
  console.log(`Trovate ${files.length} immagini.`);
  
  const imageParts = files.map(file => {
    const filePath = path.join(dir, file);
    return {
      inlineData: {
        data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
        mimeType: "image/jpeg"
      },
    };
  });

  const prompt = `Analizza attentamente tutti questi screenshot di un'app competitor per la gestione del frigorifero/scadenze. 
Voglio che tu estragga con precisione:
1. Le ESATTE domande del processo di onboarding iniziale (quali preferenze o dati chiedono all'utente al primo accesso?).
2. Le opzioni di accesso/registrazione mostrate (es. Google, Email, ecc.).
3. L'elenco ESATTO e completo delle voci presenti nel "Menu Personale" o "Profilo" (es. impostazioni, supporto, categorie personalizzate, ecc.).

Formatta la risposta in Markdown chiaro.`;

  console.log("Chiamata a Gemini in corso...");
  const result = await model.generateContent([prompt, ...imageParts]);
  const response = await result.response;
  const text = response.text();
  
  const outPath = "C:\\Users\\Vincenzo Durante\\.gemini\\antigravity\\brain\\e8f932ce-9564-45b9-a878-b775b6573e08\\scratch\\analysis.md";
  fs.writeFileSync(outPath, text);
  console.log("Fatto! Salvato in", outPath);
}

run().catch(console.error);

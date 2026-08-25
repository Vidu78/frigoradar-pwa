import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Endpoint di test - protetto da accesso non autenticato in ambiente di produzione
  if (process.env.NODE_ENV === 'production' && req.query.secret !== process.env.TEST_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'No key' });
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    
    const result = await model.generateContent("Say 'hello' in Italian");
    return res.status(200).json({ text: result.response.text() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

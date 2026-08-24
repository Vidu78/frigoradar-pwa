import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'No key' });
    
    const modelName = (req.query.model as string) || 'gemini-2.5-flash';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const result = await model.generateContent("Say 'hello' in Italian");
    return res.status(200).json({ text: result.response.text() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}

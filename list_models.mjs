import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const apiKey = process.env.GEMINI_API_KEY || (fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf-8').split('\n').find(l => l.startsWith('GEMINI_API_KEY=')).split('=')[1].trim() : null);

if (!apiKey) {
    console.log("No API key found.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        const geminiModels = data.models.filter(m => m.name.includes('gemini'));
        console.log("Available Gemini Models:");
        geminiModels.forEach(m => console.log(m.name));
    } catch (e) {
        console.error(e);
    }
}

listModels();

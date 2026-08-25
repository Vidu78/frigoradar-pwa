import fs from 'fs';

let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    if (fs.existsSync('.env.local')) {
        const env = fs.readFileSync('.env.local', 'utf-8');
        const match = env.match(/GEMINI_API_KEY=([^\s]+)/);
        if (match) apiKey = match[1];
    }
}

if (!apiKey) {
    console.log("No API key found.");
    process.exit(1);
}

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        const geminiModels = data.models?.filter(m => m.name.includes('gemini'));
        if (geminiModels) {
            console.log("Available Gemini Models:");
            geminiModels.forEach(m => console.log(m.name, m.supportedGenerationMethods));
        } else {
            console.log(data);
        }
    } catch (e) {
        console.error(e);
    }
}

listModels();

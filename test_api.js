async function test() {
  const models = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3.7-flash'];
  for (const model of models) {
    console.log(`Testing ${model}...`);
    try {
      const res = await fetch(`https://frigoradar-pwa.vercel.app/api/testBackend?model=${model}`);
      const data = await res.json();
      console.log(`${model} response:`, res.status, data);
    } catch (err) {
      console.error(`${model} error:`, err);
    }
  }
}
test();

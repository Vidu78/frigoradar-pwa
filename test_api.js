async function test() {
  try {
    const res = await fetch('https://frigoradar-pwa.vercel.app/api/testModels');
    const data = await res.json();
    const flashModels = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent') && m.name.includes('flash'));
    console.log('Available flash models for generateContent:');
    flashModels.forEach(m => console.log(m.name));
  } catch (err) {
    console.error(err);
  }
}
test();

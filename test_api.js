async function test() {
  try {
    const res = await fetch('https://frigoradar-pwa.vercel.app/api/generateRecipe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{name: 'Pomodoro', quantity: 2, expiration_date: '2026-10-10'}],
        peopleCount: 2,
        difficulty: 'FACILE',
        priority: 'TUTTI'
      })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error(err);
  }
}
test();

fetch('http://localhost:3000/api/prelista', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Test', email: 'test@example.com' })
}).then(res => res.json()).then(console.log).catch(console.error);

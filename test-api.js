async function run() {
  const res = await fetch('http://localhost:3000/api/tools/diagnosis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handle: 'lucasfraga', tipo_perfil: 'criador' })
  });
  const text = await res.text();
  console.log("STATUS:", res.status);
  console.log("BODY:", text);
}
run();

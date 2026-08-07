const fetch = require('node-fetch'); // or use built-in fetch if Node 18+

async function test() {
  const actorId = "apify/instagram-scraper";
  const url = `https://api.apify.com/v2/acts/${actorId}/runs`;
  console.log("URL:", url);
  // We don't even need a token to see if it's 404
  const res = await fetch(url, { method: 'POST' });
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
}
test();

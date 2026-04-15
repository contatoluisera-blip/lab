const { ApifyClient } = require('apify-client');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment manually since we are in scratch dir
const envConfig = dotenv.parse(fs.readFileSync('.env.local'))
for (const k in envConfig) {
  process.env[k] = envConfig[k]
}

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

async function main() {
  console.log('Calling Apify actor shu8hvrXbJbY3Eb9W with input { usernames: ["luiserayt"] } ...');
  try {
    const run = await apifyClient.actor("shu8hvrXbJbY3Eb9W").call({
      usernames: ["luiserayt"]
    });
    console.log('Run finished', run.id);
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    console.log('Items fetched:', items.length);
    console.log('Sample item keys:', items.length > 0 ? Object.keys(items[0]).join(', ') : 'no items');
  } catch(e) {
    console.error('Apify Error:', e.message);
  }
}
main();

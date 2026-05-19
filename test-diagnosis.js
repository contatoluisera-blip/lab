const { ApifyClient } = require('apify-client');

async function testDiagnosis() {
  try {
    // If APIFY_API_TOKEN is not in .env.local, we can't do much unless it's in process.env
    // But let's see if we get an Apify error
    if (!process.env.APIFY_API_TOKEN) {
      console.error("APIFY_API_TOKEN is missing!");
      // We will try to fetch it from global if possible
    }

    const apifyClient = new ApifyClient({
      token: process.env.APIFY_API_TOKEN || "apify_api_E1sTqQ5YI2kS6H8P...", // fake just to see if it's the token issue
    });

    console.log("Calling actor shu8hvrXbJbY3Eb9W...");
    const handle = 'yurikaiolipolitica';
    const run = await apifyClient.actor("shu8hvrXbJbY3Eb9W").call({
      addParentData: true,
      directUrls: [`https://www.instagram.com/${handle}`],
      resultsLimit: 30,
      resultsType: "posts"
    });

    console.log("Run finished:", run.id);
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    console.log(`Fetched ${items.length} items`);
    require('fs').writeFileSync('apify_dump.json', JSON.stringify(items, null, 2));
    console.log("Saved to apify_dump.json");
    
  } catch (err) {
    console.error("ERROR CAUGHT:");
    console.error(err.message);
  }
}

testDiagnosis();

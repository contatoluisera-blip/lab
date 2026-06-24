require('dotenv').config({path: '.env.local'});
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
async function test() {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 10,
      messages: [{ role: "user", content: "oi" }]
    });
    console.log("SUCCESS:", msg);
  } catch (e) {
    console.log("ERROR:", e.message);
  }
}
test();

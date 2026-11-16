/**
 * Teste pequeno da OpenRouter (gasto estimado: ~US$ 1):
 *  1. lista os modelos Claude disponíveis e faz uma chamada curta de texto (a mesma tarefa do Gerador de Ideias);
 *  2. gera 1 vídeo de 5 s no Seedance 2.0 Fast (480p) e 1 no Wan 2.7 (720p), texto → vídeo, sem áudio;
 *  3. mostra tempo, custo real cobrado e salva os mp4 na pasta indicada.
 *
 *   npx tsx --tsconfig tsconfig.json scripts/openrouter-test.ts <pasta-de-saída> [--sem-video]
 *
 * Lê OPENROUTER_API_KEY do .env.local. O prompt é neutro (não usa conteúdo de clientes).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^OPENROUTER_API_KEY=(.*)$/);
  if (m) process.env.OPENROUTER_API_KEY = m[1].trim().replace(/^["']|["']$/g, '');
}

const out = process.argv[2];
const skipVideo = process.argv.includes('--sem-video');
if (!out) { console.error('Informe a pasta de saída.'); process.exit(1); }
mkdirSync(out, { recursive: true });

const PROMPT = 'Vertical 9:16 cinematic shot: a barista pours latte art into a ceramic cup on a wooden counter, '
  + 'soft morning window light, shallow depth of field, slow push-in camera, steam rising, warm tones, realistic.';
const USD_TO_BRL = 5.72;
const brl = (usd: number) => `R$ ${(usd * USD_TO_BRL).toFixed(2)}`;

(async () => {
  const or = await import('../src/lib/server/openrouter');

  // ── Texto ──
  const models = await or.openrouterModels();
  const claude = models.filter(id => id.startsWith('anthropic/'));
  console.log(`Modelos Claude na OpenRouter (${claude.length}):`, claude.slice(0, 12).join(', '));
  const pick = ['anthropic/claude-sonnet-5.5', 'anthropic/claude-sonnet-4.6', 'anthropic/claude-sonnet-4.5'].find(id => claude.includes(id))
    || claude.find(id => id.includes('sonnet')) || '~anthropic/claude-sonnet-latest';
  const chat = await or.openrouterChat(pick, [
    { role: 'system', content: 'Você é estrategista de conteúdo para criadores brasileiros. Responda em português do Brasil.' },
    { role: 'user', content: 'Dê 3 ideias curtas de Reels para uma cafeteria de bairro, uma linha cada.' },
  ], 400);
  console.log(`\nTEXTO · ${chat.model} via ${chat.provider || '?'} · ${chat.ms} ms · ${chat.usage.prompt_tokens}+${chat.usage.completion_tokens} tokens · custo US$ ${chat.usage.cost ?? '?'}`);
  console.log(chat.text.trim());
  const report: Record<string, unknown> = { chat: { model: chat.model, provider: chat.provider, ms: chat.ms, usage: chat.usage, text: chat.text } };

  if (!skipVideo) {
    // ── Vídeo ──
    const tests = [
      { name: 'seedance-2-fast-480p', model: 'bytedance/seedance-2.0-fast', resolution: '480p' },
      { name: 'wan-2.7-720p', model: 'alibaba/wan-2.7', resolution: '720p' },
    ];
    const jobs = await Promise.all(tests.map(async t => {
      const t0 = Date.now();
      const job = await or.createOpenRouterVideo({ model: t.model, prompt: PROMPT, duration: 5, resolution: t.resolution, aspect_ratio: '9:16', generate_audio: false });
      console.log(`\nVÍDEO ${t.name}: pedido ${job.id} (${job.status})`);
      return { ...t, id: job.id, t0 };
    }));
    const results = await Promise.all(jobs.map(async j => {
      for (let i = 0; i < 90; i++) {
        await new Promise(r => setTimeout(r, 10_000));
        const s = await or.getOpenRouterVideo(j.id);
        if (s.status === 'completed') {
          const file = join(out, `${j.name}.mp4`);
          writeFileSync(file, await or.downloadOpenRouterVideo(j.id));
          const stats = s.generation_id ? await or.openrouterGenerationCost(s.generation_id) : null;
          const cost = s.usage?.cost ?? stats?.total_cost ?? null;
          const secs = Math.round((Date.now() - j.t0) / 1000);
          console.log(`VÍDEO ${j.name}: pronto em ${secs} s · custo ${cost == null ? '?' : `US$ ${cost} (${brl(cost)})`} · provedor ${stats?.provider_name || '?'} · ${file}`);
          return { name: j.name, model: j.model, status: s.status, seconds: secs, costUsd: cost, provider: stats?.provider_name, file };
        }
        if (['failed', 'cancelled', 'expired'].includes(s.status)) {
          console.log(`VÍDEO ${j.name}: ${s.status}`, JSON.stringify(s.error));
          return { name: j.name, model: j.model, status: s.status, error: s.error };
        }
      }
      return { name: j.name, model: j.model, status: 'timeout' };
    }));
    report.videos = results;
  }
  writeFileSync(join(out, 'relatorio.json'), JSON.stringify(report, null, 2));
  console.log('\nRelatório salvo em', join(out, 'relatorio.json'));
})().catch(e => { console.error('ERRO', e.message); process.exit(1); });

'use client';

// Agente de roteiro, etapa 2: pede os prompts das cenas em lotes curtos, 3 lotes por vez.
// Cada pedido cabe no limite de tempo da Netlify; um lote que falhar não derruba os outros.

import { streamTool } from '@/lib/client/api';
import { SCRIPT_DONE_MARK, SCRIPT_PROMPT_BATCH } from '@/lib/montagem';

const PARALLEL = 3;

export async function writeScenePrompts(projectId: string, sceneIds: string[], onProgress: (done: number, total: number) => void) {
  const batches: string[][] = [];
  for (let i = 0; i < sceneIds.length; i += SCRIPT_PROMPT_BATCH) batches.push(sceneIds.slice(i, i + SCRIPT_PROMPT_BATCH));
  let done = 0;
  let lastError = '';
  const failed: string[] = [];
  onProgress(0, sceneIds.length);
  let next = 0;
  const worker = async () => {
    while (next < batches.length) {
      const batch = batches[next++];
      try {
        const full = await streamTool('/api/montagem/script/prompts', { projectId, sceneIds: batch });
        const mark = full.indexOf(SCRIPT_DONE_MARK);
        const written: string[] = mark >= 0 ? JSON.parse(full.slice(mark + SCRIPT_DONE_MARK.length)).written || [] : [];
        done += written.length;
        failed.push(...batch.filter(id => !written.includes(id)));
      } catch (e: any) {
        lastError = e.message || '';
        failed.push(...batch);
      }
      onProgress(done, sceneIds.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(PARALLEL, batches.length) }, worker));
  return { done, failed, lastError };
}

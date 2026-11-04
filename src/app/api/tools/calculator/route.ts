import { withTool } from '@/lib/server/tool';
import { calculateBudget } from '@/lib/budget/engine';

/** Calculadora de Orçamento: cálculo determinístico (modos tradicional e com IA) em src/lib/budget/engine.ts. */
export const POST = withTool('calculator', async ({ body }) => calculateBudget(body), {
  logDescription: (b) => `Orçamento ${b?.mode === 'ia' ? 'com IA ' : ''}gerado (${b?.service_details?.video_quantity || '?'} vídeos)`,
});

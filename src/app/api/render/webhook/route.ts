import { NextResponse } from 'next/server';
import { appRouterWebhook } from '@remotion/lambda/client';
import { failRender, refreshRender } from '@/lib/server/render/queue';

export const dynamic = 'force-dynamic';

const jobIdOf = (data: Record<string, unknown> | null) => (typeof data?.jobId === 'string' ? data.jobId : null);

/** Aviso da Remotion Lambda ao terminar (assinatura HMAC conferida por appRouterWebhook). */
export async function POST(req: Request) {
  const secret = process.env.REMOTION_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ ok: false }, { status: 503 });
  const handler = appRouterWebhook({
    secret,
    onSuccess: async (p) => {
      const jobId = jobIdOf(p.customData);
      // O andamento traz a chave do arquivo no S3 e o custo; a conclusão segue o mesmo caminho da consulta.
      if (jobId) await refreshRender(jobId);
    },
    onError: async (p) => {
      const jobId = jobIdOf(p.customData);
      if (jobId) await failRender(jobId, 'A renderização falhou. Seu crédito foi devolvido; tente de novo.', { providerMessage: String(p.errors?.[0]?.message || '').slice(0, 300) });
    },
    onTimeout: async (p) => {
      const jobId = jobIdOf(p.customData);
      if (jobId) await failRender(jobId, 'A renderização demorou demais. Seu crédito foi devolvido; tente de novo.');
    },
  });
  return handler(req);
}

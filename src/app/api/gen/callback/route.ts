import { NextRequest, NextResponse } from 'next/server';
import { dispatchQueue, refreshJob, verifyJobSignature } from '@/lib/server/generation/queue';

export const dynamic = 'force-dynamic';

/**
 * Aviso da KIE quando uma geração termina. Não confiamos no corpo do aviso:
 * a assinatura identifica o pedido e o resultado é conferido direto na KIE.
 */
export async function POST(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('job') || '';
  if (!verifyJobSignature(jobId, req.nextUrl.searchParams.get('sig'))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    await refreshJob(jobId);
    await dispatchQueue();
  } catch (e: any) {
    console.error('[gen] callback', jobId, e?.message);
  }
  // Sempre 2xx: a conferência periódica cobre qualquer falha daqui.
  return NextResponse.json({ ok: true });
}

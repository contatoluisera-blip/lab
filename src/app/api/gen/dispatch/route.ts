import { NextResponse } from 'next/server';
import { dispatchKey, dispatchQueue, sweep } from '@/lib/server/generation/queue';

export const dynamic = 'force-dynamic';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Rotina de 1 minuto (netlify/functions/gen-dispatch.mts): destrava pedidos parados,
 * confere os que estão gerando e esvazia a fila em até 3 janelas de 10 s.
 */
export async function POST(req: Request) {
  if (req.headers.get('x-gen-key') !== dispatchKey()) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const report: Record<string, unknown> = {};
  try {
    report.sweep = await sweep();
    const sent: number[] = [];
    for (let round = 0; round < 3; round++) {
      const n = await dispatchQueue();
      sent.push(n);
      if (n === 0) break;
      await sleep(10_500);
    }
    report.sent = sent;
  } catch (e: any) {
    report.error = e?.message;
  }
  return NextResponse.json({ ok: true, ...report });
}

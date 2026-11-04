import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireUser } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';
import { StoredJob, dispatchQueue, queuePositions, refreshJob, shouldRecheck } from '@/lib/server/generation/queue';

export const dynamic = 'force-dynamic';

/**
 * Chamada pela tela a cada ~15 s enquanto houver geração em andamento.
 * Empurra a fila, confere na KIE o que estiver gerando (caso o aviso dela não chegue)
 * e devolve a posição na fila. O resultado em si chega pelo Firestore em tempo real.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const snap = await adminDb.collection('gen_jobs').where('uid', '==', user.uid).where('active', '==', true).get();
    const active: StoredJob[] = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }) as StoredJob);

    if (active.some(j => j.status === 'queued')) await dispatchQueue(8).catch(e => console.error('[gen] status dispatch', e?.message));
    await Promise.all(active.filter(shouldRecheck).map(j => refreshJob(j.id).catch(e => console.error('[gen] status refresh', j.id, e?.message))));

    const positions = await queuePositions(active.map(j => j.id));
    return NextResponse.json({ success: true, data: { positions } });
  } catch (err) {
    return errorResponse(err);
  }
}

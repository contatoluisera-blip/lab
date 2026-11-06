import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireUser } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';
import { StoredRender, dispatchRenders, refreshRender } from '@/lib/server/render/queue';

export const dynamic = 'force-dynamic';

/**
 * Chamada pela tela a cada ~10 s enquanto houver exportação em andamento: empurra a fila
 * e confere na AWS o que estiver renderizando (caso o webhook não chegue).
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const snap = await adminDb.collection('render_jobs').where('uid', '==', user.uid).where('active', '==', true).get();
    const active: StoredRender[] = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }) as StoredRender);
    if (active.some(j => j.status === 'queued')) await dispatchRenders(2).catch(e => console.error('[render] status dispatch', e?.message));
    await Promise.all(active.filter(j => j.status === 'rendering').map(j => refreshRender(j.id).catch(e => console.error('[render] status refresh', j.id, e?.message))));
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

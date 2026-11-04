import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { HttpError, requireAdmin } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';
import { KIE_USD_PER_CREDIT, USD_TO_BRL } from '@/lib/generation';

export const dynamic = 'force-dynamic';

/**
 * Moderação e custo da geração de imagens e vídeos:
 * lista as últimas gerações (com custo previsto x real), os pedidos barrados pelo filtro
 * e bloqueia ou libera a geração de uma conta.
 */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json().catch(() => ({}));

    switch (body.action) {
      case 'list': {
        const [jobsSnap, blockedSnap] = await Promise.all([
          adminDb.collection('gen_jobs').orderBy('createdAt', 'desc').limit(120).get(),
          adminDb.collection('gen_blocked_prompts').orderBy('createdAt', 'desc').limit(40).get(),
        ]);
        const uids = new Set<string>();
        jobsSnap.docs.forEach((d: any) => uids.add(d.data().uid));
        blockedSnap.docs.forEach((d: any) => uids.add(d.data().uid));
        const users: Record<string, { email: string; blocked: boolean }> = {};
        await Promise.all([...uids].map(async uid => {
          const u = (await adminDb.collection('users').doc(uid).get()).data() || {};
          users[uid] = { email: u.email || '', blocked: !!u.genBlocked };
        }));

        const jobs = jobsSnap.docs.map((d: any) => {
          const j = d.data();
          const realUsd = typeof j.kieCreditsConsumed === 'number' ? j.kieCreditsConsumed * KIE_USD_PER_CREDIT : null;
          return {
            id: d.id, uid: j.uid, email: users[j.uid]?.email || '', userBlocked: users[j.uid]?.blocked || false,
            kind: j.kind, mode: j.mode, modelName: j.modelName, status: j.status, prompt: j.prompt,
            credits: j.credits, refunded: !!j.refunded, outputs: j.outputs || [], error: j.error || null,
            expectedBrl: Number((j.expectedKieCredits * KIE_USD_PER_CREDIT * USD_TO_BRL).toFixed(2)),
            realBrl: realUsd == null ? null : Number((realUsd * USD_TO_BRL).toFixed(2)),
            costMismatch: !!j.costMismatch, createdAt: j.createdAt,
          };
        });
        const blocked = blockedSnap.docs.map((d: any) => ({ id: d.id, ...d.data(), email: users[d.data().uid]?.email || '' }));

        const done = jobs.filter((j: any) => j.status === 'completed');
        const summary = {
          total: jobs.length,
          queued: jobs.filter((j: any) => ['queued', 'submitting'].includes(j.status)).length,
          processing: jobs.filter((j: any) => ['processing', 'finalizing'].includes(j.status)).length,
          failed: jobs.filter((j: any) => j.status === 'failed').length,
          creditsCharged: done.reduce((s: number, j: any) => s + j.credits, 0),
          costBrl: Number(done.reduce((s: number, j: any) => s + (j.realBrl ?? j.expectedBrl), 0).toFixed(2)),
          mismatches: jobs.filter((j: any) => j.costMismatch).length,
        };
        return NextResponse.json({ success: true, data: { jobs, blocked, summary } });
      }

      case 'block':
      case 'unblock': {
        const uid = typeof body.uid === 'string' ? body.uid : '';
        if (!uid) throw new HttpError(400, 'missing_uid', 'Usuário não informado.');
        const genBlocked = body.action === 'block'
          ? { by: admin.email, at: new Date().toISOString(), reason: String(body.reason || 'Violação dos termos de uso da geração').slice(0, 300) }
          : null;
        await adminDb.collection('users').doc(uid).set({ genBlocked }, { merge: true });
        return NextResponse.json({ success: true });
      }

      default:
        throw new HttpError(400, 'bad_action', 'Ação desconhecida.');
    }
  } catch (err) {
    return errorResponse(err);
  }
}

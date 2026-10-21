import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import { requireUser, HttpError } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';

const KIE_AI_API_KEY = process.env.KIE_AI_API_KEY || '';

/** Devolve o crédito de uma tarefa que falhou, uma única vez. */
async function refundTask(taskRef: admin.firestore.DocumentReference, task: any, reason: string) {
  if (task.refunded || !task.chargedCredits) return;
  const batch = adminDb.batch();
  const userRef = adminDb.collection('users').doc(task.userId);
  batch.update(userRef, { credits: admin.firestore.FieldValue.increment(task.chargedCredits), updatedAt: new Date().toISOString() });
  batch.set(userRef.collection('credit_ledger').doc(), { tool: 'estudia', delta: task.chargedCredits, reason, taskId: task.taskId, createdAt: new Date().toISOString() });
  batch.update(taskRef, { refunded: true });
  await batch.commit();
}

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const taskId = new URL(request.url).searchParams.get('taskId');
    if (!taskId) throw new HttpError(400, 'missing_task', 'Falta o identificador da geração.');

    const taskRef = adminDb.collection('estudia').doc(taskId) as admin.firestore.DocumentReference;
    const snap = await taskRef.get();
    if (!snap.exists || snap.data()?.userId !== user.uid) throw new HttpError(404, 'not_found', 'Geração não encontrada.');
    const task = snap.data()!;

    if (task.status === 'completed') return NextResponse.json({ success: true, status: 'completed', imageUrl: task.resultUrl });
    if (task.status === 'failed') return NextResponse.json({ success: false, status: 'failed', error: task.error || 'A geração falhou. Seu crédito foi devolvido.' });

    // Tarefa abandonada (navegador fechado ou KIE sem resposta) há mais de 6 min: devolve o crédito.
    if (Date.now() - new Date(task.createdAt).getTime() > 6 * 60 * 1000) {
      await refundTask(taskRef, task, 'provider_timeout');
      await taskRef.update({ status: 'failed', error: 'Tempo esgotado' });
      return NextResponse.json({ success: false, status: 'failed', error: 'A geração demorou demais e foi cancelada. Seu crédito foi devolvido; tente de novo.' });
    }

    const pollResponse = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${KIE_AI_API_KEY}` },
    });
    const pollData = await pollResponse.json().catch(() => ({}));
    if (pollData.code !== 200 || !pollData.data) {
      return NextResponse.json({ success: true, status: 'processing' });
    }

    const state = pollData.data.state;
    if (state === 'success') {
      let resultUrl: string | null = null;
      try {
        const resultObj = JSON.parse(pollData.data.resultJson);
        resultUrl = resultObj.resultUrls?.[0] || null;
      } catch { /* abaixo */ }
      if (!resultUrl) {
        await refundTask(taskRef, task, 'provider_bad_result');
        await taskRef.update({ status: 'failed', error: 'A KIE AI concluiu sem devolver a imagem.' });
        return NextResponse.json({ success: false, status: 'failed', error: 'A geração terminou sem imagem. Seu crédito foi devolvido; tente de novo.' });
      }
      await taskRef.update({ status: 'completed', resultUrl, completedAt: new Date().toISOString() });
      return NextResponse.json({ success: true, status: 'completed', imageUrl: resultUrl });
    }

    if (state === 'failed' || state === 'fail') {
      const detail = pollData.data.failMsg || 'Erro no provedor';
      await refundTask(taskRef, task, 'provider_failure');
      await taskRef.update({ status: 'failed', error: detail });
      return NextResponse.json({ success: false, status: 'failed', error: 'A geração falhou na KIE AI. Seu crédito foi devolvido; tente com outra foto.' });
    }

    return NextResponse.json({ success: true, status: 'processing' });
  } catch (err) {
    return errorResponse(err);
  }
}

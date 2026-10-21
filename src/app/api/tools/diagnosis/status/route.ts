import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import { requireUser, HttpError } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';
import { jsonKeepAliveResponse } from '@/lib/server/stream';
import { analyzeProfile, getApifyDataset, getApifyRunStatus } from '@/lib/server/diagnosis/analyze';

const FINISHED = ['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'];
const JOB_TIMEOUT_MS = 6 * 60 * 1000;
/** Se uma análise ficou presa (função cortada), outra consulta pode retomá-la depois disso. */
const ANALYSIS_STALE_MS = 2 * 60 * 1000;

async function refundJob(jobRef: admin.firestore.DocumentReference, job: any, reason: string) {
  if (job.refunded || !job.chargedCredits) return;
  const batch = adminDb.batch();
  const userRef = adminDb.collection('users').doc(job.userId);
  batch.update(userRef, { credits: admin.firestore.FieldValue.increment(job.chargedCredits), updatedAt: new Date().toISOString() });
  batch.set(userRef.collection('credit_ledger').doc(), { tool: 'diagnosis', delta: job.chargedCredits, reason, jobId: jobRef.id, createdAt: new Date().toISOString() });
  batch.update(jobRef, { refunded: true });
  await batch.commit();
}

/**
 * Etapa 2 do Diagnóstico: consulta as execuções no Apify. Quando as duas terminam,
 * baixa os dados, roda a análise (cálculos + resumo por IA), salva em `diagnoses`
 * e devolve o resultado. Em falha ou tempo esgotado, devolve o crédito.
 */
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const token = process.env.APIFY_API_TOKEN || '';
    const jobId = new URL(request.url).searchParams.get('jobId');
    if (!jobId) throw new HttpError(400, 'missing_job', 'Falta o identificador do diagnóstico.');

    const jobRef = adminDb.collection('diagnosis_jobs').doc(jobId) as admin.firestore.DocumentReference;
    const snap = await jobRef.get();
    if (!snap.exists || snap.data()?.userId !== user.uid) throw new HttpError(404, 'not_found', 'Diagnóstico não encontrado.');
    const job = snap.data()!;

    if (job.status === 'completed') return NextResponse.json({ success: true, status: 'completed', data: job.result, diagnosisId: job.diagnosisId });
    if (job.status === 'failed') return NextResponse.json({ success: false, status: 'failed', error: job.error });
    if (job.status === 'analyzing' && Date.now() - new Date(job.analyzingAt || 0).getTime() < ANALYSIS_STALE_MS) {
      return NextResponse.json({ success: true, status: 'analyzing' });
    }

    const [profileStatus, postsStatus] = await Promise.all([
      getApifyRunStatus(token, job.profileRun.runId),
      getApifyRunStatus(token, job.postsRun.runId),
    ]);

    const failed = [profileStatus, postsStatus].find((s) => FINISHED.includes(s) && s !== 'SUCCEEDED');
    const expired = Date.now() - new Date(job.createdAt).getTime() > JOB_TIMEOUT_MS + ANALYSIS_STALE_MS;

    if (failed || expired) {
      const error = failed
        ? 'A coleta no Instagram falhou. Seu crédito foi devolvido; tente de novo em alguns minutos.'
        : 'A coleta demorou demais e foi cancelada. Seu crédito foi devolvido; tente de novo.';
      await refundJob(jobRef, job, failed ? 'apify_failed' : 'apify_timeout');
      await jobRef.update({ status: 'failed', error, profileStatus, postsStatus });
      return NextResponse.json({ success: false, status: 'failed', error });
    }

    if (profileStatus !== 'SUCCEEDED' || postsStatus !== 'SUCCEEDED') {
      return NextResponse.json({ success: true, status: 'running', profileStatus, postsStatus });
    }

    // Reserva a análise numa transação: só uma consulta por vez faz o trabalho pesado.
    const claimed = await adminDb.runTransaction(async (tx: admin.firestore.Transaction) => {
      const fresh = (await tx.get(jobRef)).data()!;
      const busy = fresh.status === 'analyzing' && Date.now() - new Date(fresh.analyzingAt || 0).getTime() < ANALYSIS_STALE_MS;
      if (fresh.status === 'completed' || fresh.status === 'failed' || busy) return false;
      tx.update(jobRef, { status: 'analyzing', analyzingAt: new Date().toISOString() });
      return true;
    });
    if (!claimed) return NextResponse.json({ success: true, status: 'analyzing' });

    // Baixar 120 posts + resumo por IA pode passar do limite de uma resposta comum da Netlify:
    // a resposta vai em streaming, mantendo a conexão viva até o resultado ficar pronto.
    return jsonKeepAliveResponse(async () => {
      try {
        const [profileItems, postsItems] = await Promise.all([
          getApifyDataset(token, job.profileRun.datasetId),
          getApifyDataset(token, job.postsRun.datasetId),
        ]);
        const result = await analyzeProfile(job.handle, job.tipoPerfil, profileItems, postsItems);

        const diagRef = await adminDb.collection('diagnoses').add({
          userId: user.uid,
          handle: job.handle,
          tipoPerfil: job.tipoPerfil,
          resultado_json: result,
          nota_final: result.notaGeral || 0,
          createdAt: new Date().toISOString(),
        });
        await jobRef.update({ status: 'completed', result, diagnosisId: diagRef.id, completedAt: new Date().toISOString() });
        return { success: true, status: 'completed', data: result, diagnosisId: diagRef.id };
      } catch (err) {
        const message = err instanceof HttpError ? err.message : 'Não foi possível concluir a análise. Seu crédito foi devolvido.';
        await refundJob(jobRef, job, 'analysis_failed');
        await jobRef.update({ status: 'failed', error: message });
        return { success: false, status: 'failed', error: message };
      }
    });
  } catch (err) {
    return errorResponse(err);
  }
}

// Remotion Lambda (AWS): dispara o render e consulta o andamento.
// As credenciais ficam em REMOTION_AWS_ACCESS_KEY_ID / REMOTION_AWS_SECRET_ACCESS_KEY
// (lidas pelo próprio @remotion/lambda) e nunca vão para o navegador.

import { getRenderProgress, presignUrl, renderMediaOnLambda, type AwsRegion } from '@remotion/lambda/client';
import type { MontagemProps } from '@/remotion/Montagem';
import { edlDurationFrames } from '@/lib/montagem';

export const COMPOSITION_ID = 'Montagem';

export function lambdaConfig() {
  const region = process.env.REMOTION_REGION as AwsRegion | undefined;
  const functionName = process.env.REMOTION_FUNCTION_NAME;
  const serveUrl = process.env.REMOTION_SERVE_URL;
  const ready = !!(region && functionName && serveUrl && process.env.REMOTION_AWS_ACCESS_KEY_ID && process.env.REMOTION_AWS_SECRET_ACCESS_KEY);
  return { ready, region: region as AwsRegion, functionName: functionName || '', serveUrl: serveUrl || '' };
}

function webhookUrl() {
  const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.URL || '').replace(/\/$/, '');
  const secret = process.env.REMOTION_WEBHOOK_SECRET;
  if (!base || !secret || /localhost|127\.0\.0\.1/.test(base)) return null; // sem endereço público: a consulta de status cobre
  return { url: `${base}/api/render/webhook`, secret };
}

/** Netlify define CONTEXT=production só no deploy da main. */
function isProductionDeploy() {
  return process.env.CONTEXT === 'production';
}

/**
 * ~60 frames por função (60 s de vídeo = 30 funções em paralelo), sem passar de
 * REMOTION_MAX_LAMBDAS por render: conta nova da AWS só roda 10 funções ao mesmo tempo.
 */
const FRAMES_PER_LAMBDA = 60;
function framesPerLambda(totalFrames: number) {
  const max = Math.max(1, Number(process.env.REMOTION_MAX_LAMBDAS) || 30);
  return Math.max(FRAMES_PER_LAMBDA, Math.ceil(totalFrames / max));
}

export async function startLambdaRender(jobId: string, props: MontagemProps) {
  const cfg = lambdaConfig();
  const hook = webhookUrl();
  const res = await renderMediaOnLambda({
    region: cfg.region,
    functionName: cfg.functionName,
    serveUrl: cfg.serveUrl,
    composition: COMPOSITION_ID,
    inputProps: props,
    codec: 'h264',
    privacy: 'private',
    framesPerLambda: framesPerLambda(edlDurationFrames(props.edl)),
    maxRetries: 2,
    downloadBehavior: { type: 'download', fileName: 'creator-lab.mp4' },
    webhook: hook ? { ...hook, customData: { jobId } } : null,
    // Licença Remotion (plano por render): só o site em produção conta render;
    // local e deploy preview vão como desenvolvimento, sem cobrança.
    licenseKey: process.env.REMOTION_LICENSE_KEY || null,
    isProduction: isProductionDeploy(),
  });
  return { renderId: res.renderId, bucketName: res.bucketName };
}

export async function lambdaProgress(renderId: string, bucketName: string) {
  const cfg = lambdaConfig();
  const p = await getRenderProgress({ renderId, bucketName, functionName: cfg.functionName, region: cfg.region });
  return {
    done: p.done,
    failed: p.fatalErrorEncountered,
    error: p.errors?.[0]?.message || null,
    progress: p.overallProgress,
    outKey: p.outKey,
    outBucket: p.outBucket,
    costUsd: p.costs?.accruedSoFar ?? null,
  };
}

export async function signedLambdaOutput(bucketName: string, objectKey: string) {
  return presignUrl({ region: lambdaConfig().region, bucketName, objectKey, expiresInSeconds: 3600 });
}

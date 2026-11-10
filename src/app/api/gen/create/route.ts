import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase/admin';
import { HttpError, requireUser } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';
import { chargeCredit, refundCredit, ChargeResult } from '@/lib/server/credits';
import { logPlatformAction } from '@/lib/firebase/logAction';
import { GEN_LIMITS, GEN_TERMS_VERSION, GenMode, getModel, normalizeConfig, quote } from '@/lib/generation';
import { ToolId } from '@/lib/planConfig';
import { moderatePrompt } from '@/lib/server/generation/moderation';
import { StoredJob, dispatchQueue, newJobId, queuePositions } from '@/lib/server/generation/queue';
import { loadOwnedProject } from '@/lib/server/montagem/projects';

export const dynamic = 'force-dynamic';

/** Confere que o arquivo existe, é do próprio usuário e respeita tipo e tamanho. */
async function checkInput(uid: string, path: unknown, kind: 'image' | 'video') {
  // Entrada: arquivo enviado agora (gen-inputs) ou um resultado anterior da própria pessoa (gen-outputs).
  const own = typeof path === 'string' && (path.startsWith(`gen-inputs/${uid}/`) || path.startsWith(`gen-outputs/${uid}/`));
  if (typeof path !== 'string' || !own || path.includes('..')) {
    throw new HttpError(400, 'bad_input', 'Arquivo de entrada inválido. Envie de novo.');
  }
  const [meta] = await adminStorage.bucket().file(path).getMetadata().catch(() => [null]);
  if (!meta) throw new HttpError(400, 'input_missing', 'Não encontramos o arquivo enviado. Envie de novo.');
  const size = Number(meta.size || 0);
  const type = String(meta.contentType || '');
  if (kind === 'image' && (!/^image\/(jpeg|png)$/.test(type) || size > GEN_LIMITS.imageMaxBytes)) {
    throw new HttpError(400, 'bad_image', 'A imagem precisa ser JPG ou PNG de até 10 MB.');
  }
  if (kind === 'video' && (!/^video\/(mp4|quicktime)$/.test(type) || size > GEN_LIMITS.videoMaxBytes)) {
    throw new HttpError(400, 'bad_video', 'O vídeo precisa ser MP4 ou MOV de até 10 MB.');
  }
  return path;
}

/**
 * Cria um pedido de geração: valida, cobra os créditos do modelo escolhido,
 * coloca na fila e tenta enviar na hora. A tela acompanha pelo Firestore.
 */
export async function POST(req: Request) {
  let charge: ChargeResult | null = null;
  let uid = '';
  let tool: ToolId = 'gen-image';
  try {
    const user = await requireUser(req);
    uid = user.uid;
    const body = await req.json().catch(() => ({}));

    const model = getModel(String(body.modelId || ''));
    const mode = body.mode as GenMode;
    if (!model || !model.modes.includes(mode)) throw new HttpError(400, 'bad_model', 'Escolha um modelo compatível com o tipo de geração.');
    // Trilha só existe dentro da Montagem: cobra na ferramenta dela.
    tool = model.kind === 'video' ? 'gen-video' : model.kind === 'audio' ? 'montagem' : 'gen-image';

    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    if (prompt.length < 3) throw new HttpError(400, 'missing_prompt', 'Escreva ou importe um prompt antes de gerar.');
    if (prompt.length > GEN_LIMITS.promptMax) throw new HttpError(400, 'prompt_too_long', `O prompt passa de ${GEN_LIMITS.promptMax} caracteres. Encurte e tente de novo.`);
    const negativePrompt = typeof body.negativePrompt === 'string' ? body.negativePrompt.trim().slice(0, 500) : '';

    // Conta: termos aceitos e sem bloqueio.
    const profile = (await adminDb.collection('users').doc(uid).get()).data() || {};
    if (profile.genBlocked) {
      throw new HttpError(403, 'gen_blocked', 'Sua conta está impedida de gerar imagens e vídeos por violar os termos de uso. Fale com o suporte.');
    }
    if (profile.genTerms?.version !== GEN_TERMS_VERSION) {
      throw new HttpError(428, 'terms_required', 'Aceite os termos de uso da geração para continuar.');
    }

    const moderation = moderatePrompt(`${prompt}\n${negativePrompt}`);
    if (!moderation.ok) {
      await adminDb.collection('gen_blocked_prompts').add({ uid, email: user.email, prompt: prompt.slice(0, 1000), modelId: model.id, createdAt: new Date().toISOString() });
      throw new HttpError(422, 'prompt_blocked', moderation.reason);
    }

    // Entradas exigidas por cada modo.
    const images: string[] = Array.isArray(body.inputs?.images) ? body.inputs.images.slice(0, 8) : [];
    const maxImages = model.maxImages?.[mode] ?? 0;
    if (images.length > maxImages) throw new HttpError(400, 'too_many_images', `Este modelo aceita até ${maxImages} imagem(ns) neste modo.`);
    if ((mode === 'i2v' || mode === 'i2i') && !images.length) throw new HttpError(400, 'missing_image', 'Envie a imagem de entrada.');
    const imagePaths = await Promise.all(images.map(p => checkInput(uid, p, 'image')));
    const videoPath = mode === 'v2v' ? await checkInput(uid, body.inputs?.video, 'video') : null;

    // Limite por pessoa: evita que uma conta ocupe a fila inteira.
    const active = await adminDb.collection('gen_jobs').where('uid', '==', uid).where('active', '==', true).get();
    if (active.size >= GEN_LIMITS.activePerUser) {
      throw new HttpError(429, 'too_many_active', `Você já tem ${active.size} gerações em andamento. Espere uma terminar para pedir outra.`);
    }

    // Dentro de um Projeto de vídeo: o resultado volta para a cena na Montagem.
    let projectId: string | null = null;
    let sceneId: string | null = null;
    if (body.projectId) {
      const project = await loadOwnedProject(uid, body.projectId);
      projectId = project.id;
      sceneId = project.scenes.some(s => s.id === body.sceneId) ? String(body.sceneId) : null;
    }

    const config = normalizeConfig(model, body.config || {});
    const price = quote(model, config);
    charge = await chargeCredit(uid, tool, price.credits);

    const id = newJobId();
    const job: Omit<StoredJob, 'id'> = {
      uid,
      kind: model.kind,
      mode,
      modelId: model.id,
      modelName: model.name,
      config,
      prompt,
      negativePrompt: negativePrompt || null,
      credits: price.credits,
      chargedCredits: charge.charged,
      tool,
      status: 'queued',
      active: true,
      outputs: [],
      inputPaths: { images: imagePaths, video: videoPath },
      promptId: typeof body.promptId === 'string' ? body.promptId.slice(0, 64) : null,
      projectId,
      sceneId,
      title: model.kind === 'audio' && typeof body.title === 'string' ? body.title.trim().slice(0, 80) || null : null,
      expectedKieCredits: price.kieCredits,
      refunded: false,
      attempts: 0,
      error: null,
      createdAt: new Date().toISOString(),
    };
    await adminDb.collection('gen_jobs').doc(id).set(job);
    charge = null; // a partir daqui, o estorno é da fila (failJob)

    await logPlatformAction(uid, user.email ?? undefined, tool, `Pediu ${model.kind === 'video' ? 'vídeo' : model.kind === 'audio' ? 'trilha' : 'imagem'} (${model.name}, ${price.credits} créditos)`);
    await dispatchQueue(4).catch(e => console.error('[gen] dispatch após criar', e?.message));
    const positions = await queuePositions([id]);

    return NextResponse.json({ success: true, data: { id, credits: price.credits, position: positions[id] ?? null } });
  } catch (err) {
    if (charge && uid) {
      await refundCredit(uid, tool, charge, 'generation_not_created');
      // O pedido nem entrou na fila: o teste grátis não conta como usado.
      if (charge.trial) await adminDb.collection('users').doc(uid).update({ [`trialUsed.${tool}`]: false }).catch(() => {});
    }
    return errorResponse(err);
  }
}

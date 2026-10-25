import { adminDb } from '@/lib/firebase/admin';
import { withTool } from '@/lib/server/tool';
import { HttpError } from '@/lib/server/auth';
import { startApifyRun } from '@/lib/server/diagnosis/analyze';

/** Janela de reaproveitamento da coleta do mesmo @ (o Apify guarda os dados por 31 dias). */
const COLLECTION_REUSE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Etapa 1 do Diagnóstico: cobra o crédito, dispara as duas coletas no Apify
 * (perfil e últimos 120 posts) e devolve um jobId. O navegador acompanha em /status.
 * Nada aqui espera o Apify terminar, então a rota responde em poucos segundos.
 */
export const POST = withTool('diagnosis', async ({ body, user, charge }) => {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new HttpError(503, 'provider_unconfigured', 'O token do Apify não está configurado no servidor.');

  const handle = String(body.handle || '').replace('@', '').trim().toLowerCase();
  const tipo_perfil = body.tipo_perfil === 'negocio' ? 'negocio' : 'criador';
  if (!handle || !/^[a-z0-9._]{1,30}$/.test(handle)) {
    throw new HttpError(400, 'bad_handle', 'Digite um @ válido do Instagram (letras, números, ponto e sublinhado).');
  }

  // Reaproveita a coleta do mesmo @ feita nos últimos dias (por qualquer usuário):
  // a coleta é ~99% do custo do Diagnóstico e os dados públicos mudam pouco em poucos dias.
  const cacheRef = adminDb.collection('diagnosis_cache').doc(handle);
  const cached = (await cacheRef.get()).data();
  const fresh = cached && Date.now() - new Date(cached.createdAt).getTime() < COLLECTION_REUSE_MS;

  let profileRun, postsRun;
  if (fresh) {
    ({ profileRun, postsRun } = cached);
  } else {
    const url = `https://www.instagram.com/${handle}/`;
    [profileRun, postsRun] = await Promise.all([
      startApifyRun(token, { addParentData: false, directUrls: [url], resultsType: 'details', searchType: 'user' }),
      startApifyRun(token, { addParentData: false, directUrls: [url], resultsLimit: 120, resultsType: 'posts', searchType: 'user' }),
    ]);
    await cacheRef.set({ profileRun, postsRun, createdAt: new Date().toISOString() });
  }

  const jobRef = adminDb.collection('diagnosis_jobs').doc();
  await jobRef.set({
    userId: user.uid,
    handle,
    tipoPerfil: tipo_perfil,
    status: 'running',
    profileRun,
    postsRun,
    chargedCredits: charge.charged,
    reusedCollection: !!fresh,
    refunded: false,
    createdAt: new Date().toISOString(),
  });

  return { jobId: jobRef.id };
}, { logDescription: (b) => `Iniciou diagnóstico de @${String(b?.handle || '').replace('@', '')}` });

import * as admin from 'firebase-admin';
import { adminDb, adminStorage } from '@/lib/firebase/admin';
import { HttpError } from '@/lib/server/auth';
import {
  BRAND_FONTS, BRAND_LIMITS, BrandColorRef, BrandKit, BrandLettering, DEFAULT_TEXT_STYLE, LETTERING_ROLES, isHex,
} from '@/lib/brand';

export const brandKits = () => adminDb.collection('brand_kits') as admin.firestore.CollectionReference;

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const newId = () => crypto.randomUUID().slice(0, 8);

export async function listBrandKits(uid: string): Promise<BrandKit[]> {
  const snap = await brandKits().where('uid', '==', uid).get();
  return snap.docs
    .map((d: any) => ({ id: d.id, ...d.data() }) as BrandKit)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** A ID Visual do projeto. Sumiu ou é de outra pessoa? O projeto segue sem ela. */
export async function loadProjectBrand(uid: string, kitId: unknown): Promise<BrandKit | null> {
  if (typeof kitId !== 'string' || !kitId || kitId.length > 64) return null;
  const snap = await brandKits().doc(kitId).get();
  const data = snap.data();
  return snap.exists && data?.uid === uid ? ({ id: snap.id, ...data } as BrandKit) : null;
}

/** Confere o arquivo no Storage e monta o link no servidor: o endereço enviado pelo navegador não é usado. */
async function resolveAsset(uid: string, path: unknown, types: RegExp, maxBytes: number, tooBig: string) {
  const prefix = `gen-inputs/${uid}/brand-`;
  if (typeof path !== 'string' || !path.startsWith(prefix) || !/^[a-z0-9-]+\.(png|jpg)$/i.test(path.slice(prefix.length))) {
    throw new HttpError(400, 'bad_asset', 'Arquivo inválido. Envie de novo.');
  }
  const bucket = adminStorage.bucket();
  const [meta] = await bucket.file(path).getMetadata().catch(() => [null]);
  if (!meta) throw new HttpError(400, 'asset_missing', 'Não encontramos o arquivo enviado. Envie de novo.');
  if (!types.test(String(meta.contentType || ''))) throw new HttpError(400, 'bad_asset_type', 'Formato de imagem não aceito. Envie de novo.');
  if (Number(meta.size || 0) > maxBytes) throw new HttpError(400, 'asset_too_large', tooBig);
  const token = String(meta.metadata?.firebaseStorageDownloadTokens || '').split(',')[0];
  if (!token) throw new HttpError(400, 'asset_no_link', 'Não foi possível ler o arquivo enviado. Envie de novo.');
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

/** Valida a ID Visual vinda do navegador. Só os arquivos novos são consultados no Storage. */
async function cleanKit(uid: string, raw: any, previous: BrandKit | null) {
  const name = clean(raw?.name, BRAND_LIMITS.name);
  if (!name) throw new HttpError(400, 'missing_name', 'Dê um nome para a ID Visual.');

  const colors = [...new Set((Array.isArray(raw?.colors) ? raw.colors : []).filter(isHex).map((c: string) => c.toLowerCase()))].slice(0, BRAND_LIMITS.colors) as string[];

  const knownUrl = new Map<string, string>([...(previous?.letterings || []), ...(previous?.colorRefs || [])].map(a => [a.path, a.url]));

  const rawRefs: any[] = Array.isArray(raw?.colorRefs) ? raw.colorRefs : [];
  if (rawRefs.length > BRAND_LIMITS.refs) throw new HttpError(400, 'too_many_refs', `Use até ${BRAND_LIMITS.refs} referências de cor.`);
  const colorRefs: BrandColorRef[] = await Promise.all(rawRefs.map(async r => ({
    id: clean(r?.id, 16) || newId(),
    path: r?.path,
    url: knownUrl.get(r?.path) || await resolveAsset(uid, r?.path, /^image\/(jpeg|png)$/, BRAND_LIMITS.refMaxBytes, 'Essa referência é pesada demais. Envie uma imagem menor.'),
    palette: (Array.isArray(r?.palette) ? r.palette : []).filter(isHex).slice(0, 8),
  })));

  const rawLetterings: any[] = Array.isArray(raw?.letterings) ? raw.letterings : [];
  if (rawLetterings.length > BRAND_LIMITS.letterings) throw new HttpError(400, 'too_many_letterings', `Use até ${BRAND_LIMITS.letterings} letterings por ID Visual.`);
  const letterings: BrandLettering[] = await Promise.all(rawLetterings.map(async l => ({
    id: clean(l?.id, 16) || newId(),
    name: clean(l?.name, BRAND_LIMITS.letteringName) || 'Lettering',
    role: LETTERING_ROLES.some(r => r.id === l?.role) ? l.role : 'outro',
    path: l?.path,
    url: knownUrl.get(l?.path) || await resolveAsset(uid, l?.path, /^image\/png$/, BRAND_LIMITS.letteringMaxBytes, 'Esse lettering é pesado demais. Envie uma imagem menor.'),
    width: Math.max(1, Math.min(4096, Math.round(Number(l?.width) || 1))),
    height: Math.max(1, Math.min(4096, Math.round(Number(l?.height) || 1))),
    text: clean(l?.text, BRAND_LIMITS.letteringText),
  })));

  const style = raw?.textStyle;
  const textStyle = {
    fontId: BRAND_FONTS.some(f => f.id === style?.fontId) ? style.fontId : DEFAULT_TEXT_STYLE.fontId,
    textColor: isHex(style?.textColor) ? style.textColor.toLowerCase() : DEFAULT_TEXT_STYLE.textColor,
    boxColor: style?.boxColor === null ? null : isHex(style?.boxColor) ? style.boxColor.toLowerCase() : DEFAULT_TEXT_STYLE.boxColor,
  };
  return { name, colors, colorRefs, letterings, textStyle };
}

/** Apaga os arquivos que saíram da ID Visual (sem travar a resposta se algum falhar). */
async function removeFiles(paths: string[]) {
  const bucket = adminStorage.bucket();
  await Promise.all(paths.map(p => bucket.file(p).delete().catch(() => {})));
}

const assetPaths = (kit: Pick<BrandKit, 'letterings' | 'colorRefs'>) => [...kit.letterings, ...kit.colorRefs].map(a => a.path);

export async function saveBrandKit(uid: string, raw: any): Promise<BrandKit> {
  const at = new Date().toISOString();
  if (raw?.id) {
    const previous = await loadProjectBrand(uid, raw.id);
    if (!previous) throw new HttpError(404, 'kit_missing', 'ID Visual não encontrada.');
    const data = await cleanKit(uid, raw, previous);
    await brandKits().doc(previous.id).update({ ...data, updatedAt: at });
    const kept = new Set(assetPaths(data));
    await removeFiles(assetPaths(previous).filter(p => !kept.has(p)));
    return { ...previous, ...data, updatedAt: at };
  }
  const existing = await brandKits().where('uid', '==', uid).count().get();
  if (existing.data().count >= BRAND_LIMITS.kitsPerUser) throw new HttpError(429, 'too_many_kits', `Sua biblioteca aceita até ${BRAND_LIMITS.kitsPerUser} IDs Visuais. Apague uma para criar outra.`);
  const data = await cleanKit(uid, raw, null);
  const doc = { uid, ...data, createdAt: at, updatedAt: at };
  const ref = await brandKits().add(doc);
  return { id: ref.id, ...doc };
}

export async function deleteBrandKit(uid: string, kitId: unknown) {
  const kit = await loadProjectBrand(uid, kitId);
  if (!kit) throw new HttpError(404, 'kit_missing', 'ID Visual não encontrada.');
  await brandKits().doc(kit.id).delete();
  await removeFiles(assetPaths(kit));
}

/** Lê o resultado de uma geração da própria pessoa, para o navegador recortar o fundo do lettering. */
export async function generatedImageDataUrl(uid: string, jobId: unknown) {
  if (typeof jobId !== 'string' || !jobId || jobId.length > 64) throw new HttpError(400, 'bad_job', 'Geração inválida.');
  const snap = await adminDb.collection('gen_jobs').doc(jobId).get();
  const job = snap.data();
  const path = job?.outputs?.[0]?.path as string | undefined;
  if (!snap.exists || job?.uid !== uid || job?.kind !== 'image' || job?.status !== 'completed' || !path) {
    throw new HttpError(404, 'job_missing', 'Não encontramos essa geração.');
  }
  const [buffer] = await adminStorage.bucket().file(path).download();
  // A resposta da função tem limite de ~6 MB, e o base64 cresce um terço.
  if (buffer.length > 4 * 1024 * 1024) throw new HttpError(413, 'image_too_large', 'A imagem gerada é grande demais para recortar. Tente de novo.');
  const type = path.endsWith('.jpg') || path.endsWith('.jpeg') ? 'image/jpeg' : path.endsWith('.webp') ? 'image/webp' : 'image/png';
  return `data:${type};base64,${buffer.toString('base64')}`;
}

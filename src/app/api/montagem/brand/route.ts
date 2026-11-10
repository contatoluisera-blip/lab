import { withTool } from '@/lib/server/tool';
import { HttpError } from '@/lib/server/auth';
import { deleteBrandKit, generatedImageDataUrl, listBrandKits, saveBrandKit } from '@/lib/server/montagem/brand';

export const dynamic = 'force-dynamic';

/**
 * Biblioteca de ID Visual da conta. Tudo passa pelo servidor (a coleção fica fechada nas regras):
 * `list`, `save`, `delete` e `output` (imagem gerada, para recortar o fundo no navegador).
 */
export const POST = withTool('montagem', async ({ user, body }) => {
  switch (body?.action) {
    case 'list':
      return { kits: await listBrandKits(user.uid) };
    case 'save':
      return { kit: await saveBrandKit(user.uid, body.kit) };
    case 'delete':
      await deleteBrandKit(user.uid, body.id);
      return { deleted: true };
    case 'output':
      return { dataUrl: await generatedImageDataUrl(user.uid, body.jobId) };
    default:
      throw new HttpError(400, 'bad_action', 'Pedido inválido.');
  }
}, { charge: false });

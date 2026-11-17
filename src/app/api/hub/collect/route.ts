import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';
import { hubSecret } from '@/lib/server/hub/collect';
import { startCollection } from '@/lib/server/hub/start';
import { requestOrigin } from '@/lib/server/hub/origin';

export const dynamic = 'force-dynamic';

/**
 * Inicia a coleta automática de todas as fontes ativas.
 * Chamada pelo botão "Coletar agora" do /admin ou pela rotina semanal da Netlify
 * (que se identifica com a chave derivada em hubSecret()).
 */
export async function POST(req: Request) {
  try {
    let requestedBy = 'rotina-semanal';
    if (req.headers.get('x-hub-key') !== hubSecret()) {
      requestedBy = (await requireAdmin(req)).email || 'admin';
    }

    const result = await startCollection({ origin: requestOrigin(req), requestedBy });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}

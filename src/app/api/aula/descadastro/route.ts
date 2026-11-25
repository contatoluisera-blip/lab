import { adminDb } from '@/lib/firebase/admin';
import { validUnsubscribe } from '@/lib/server/aulaEmails';

export const dynamic = 'force-dynamic';

const page = (title: string, text: string) => new Response(
  `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#050505;color:#d1d5db;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:24px">
<div style="max-width:420px;text-align:center"><h1 style="color:#fff;font-size:22px">${title}</h1><p style="line-height:1.6">${text}</p>
<p><a href="/" style="color:#10b981">Voltar para a Creator Lab</a></p></div></body></html>`,
  { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
);

/** Link de descadastro dos e-mails da aula: para os envios de marketing para este lead. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id') || '';
  if (!/^[a-f0-9]{32}$/.test(id) || !validUnsubscribe(id, url.searchParams.get('t') || '')) {
    return page('Link inválido', 'Não conseguimos confirmar este link. Se quiser parar de receber nossos e-mails, responda qualquer um deles pedindo o descadastro.');
  }
  await adminDb.collection('leads').doc(id).set({ marketingOptOutAt: new Date().toISOString(), aulaOfferDueAt: null }, { merge: true });
  return page('Pronto, você foi descadastrado', 'Você não vai mais receber nossos e-mails de materiais e ofertas. Os e-mails da sua conta, se tiver uma, continuam chegando normalmente.');
}

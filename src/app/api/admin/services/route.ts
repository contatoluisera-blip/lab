import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';

export const dynamic = 'force-dynamic';

/** Custos de referência por uso (out/2026), para estimar quanto o saldo ainda cobre. */
const KIE_CREDITS_PER_PHOTO = 8;        // Nano Banana 2 em 1K
const APIFY_USD_PER_DIAGNOSIS = 0.28;   // perfil + 120 posts
const APIFY_USD_PER_HUB_RUN = 1.1;      // ~480 reels em alta por coleta semanal

/**
 * Saúde dos serviços pré-pagos ou com teto: saldo da KIE (Foto de Estúdio)
 * e consumo do ciclo no Apify (Diagnóstico e Hub). Mostrado no /admin com alertas.
 */
export async function POST(req: Request) {
  try {
    await requireAdmin(req);

    const [kie, apify] = await Promise.all([
      (async () => {
        if (!process.env.KIE_AI_API_KEY) return { ok: false, error: 'Chave da KIE ausente no servidor.' };
        const res = await fetch('https://api.kie.ai/api/v1/chat/credit', { headers: { Authorization: `Bearer ${process.env.KIE_AI_API_KEY}` } });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || typeof json.data !== 'number') return { ok: false, error: json.msg || `KIE respondeu ${res.status}` };
        const photosLeft = Math.floor(json.data / KIE_CREDITS_PER_PHOTO);
        return { ok: true, credits: json.data, photosLeft, level: photosLeft < 10 ? 'critical' : photosLeft < 40 ? 'warning' : 'ok' };
      })(),
      (async () => {
        if (!process.env.APIFY_API_TOKEN) return { ok: false, error: 'Token do Apify ausente no servidor.' };
        const res = await fetch('https://api.apify.com/v2/users/me/limits', { headers: { Authorization: `Bearer ${process.env.APIFY_API_TOKEN}` } });
        const json = await res.json().catch(() => ({}));
        const d = json?.data;
        if (!res.ok || !d) return { ok: false, error: `Apify respondeu ${res.status}` };
        const limit = Number(d.limits?.maxMonthlyUsageUsd) || 0;
        const used = Number(d.current?.monthlyUsageUsd) || 0;
        const cycleEnd = d.monthlyUsageCycle?.endAt as string;
        // Reserva as coletas semanais do hub que ainda cabem no ciclo.
        const weeksLeft = cycleEnd ? Math.max(0, Math.ceil((new Date(cycleEnd).getTime() - Date.now()) / (7 * 86_400_000))) : 0;
        const available = Math.max(0, limit - used - weeksLeft * APIFY_USD_PER_HUB_RUN);
        const diagnosesLeft = Math.floor(available / APIFY_USD_PER_DIAGNOSIS);
        return {
          ok: true, limit, used: Math.round(used * 100) / 100, cycleEnd, diagnosesLeft,
          level: diagnosesLeft < 5 ? 'critical' : diagnosesLeft < 20 ? 'warning' : 'ok',
        };
      })(),
    ]);

    return NextResponse.json({ success: true, kie, apify });
  } catch (error) {
    return errorResponse(error);
  }
}

import { NextResponse } from 'next/server';
import { requireAdmin, HttpError } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';
import { deleteLead, listLeads, normalizeEmail, upsertLead } from '@/lib/server/leads';

/** Todos os leads (registro central + pré-lista antiga), sem repetir e-mail. */
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const leads = (await listLeads()).map(({ preListIds: _ignored, ...lead }) => lead);
    return NextResponse.json({ success: true, leads });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Cadastra um lead manualmente. Exige token de um administrador. */
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const { name, email, whatsapp, instagram } = await request.json();
    if (!name || !normalizeEmail(email)) throw new HttpError(400, 'missing_fields', 'Nome e um e-mail válido são obrigatórios.');
    const saved = await upsertLead({ email, name: String(name), whatsapp: whatsapp ? String(whatsapp) : '', instagram: instagram ? String(instagram) : '', source: 'manual', skipSegment: true });
    return NextResponse.json({ success: true, id: saved.ok ? saved.id : null });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Remove um lead. Exige token de um administrador. */
export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);
    const id = new URL(request.url).searchParams.get('id');
    if (!id) throw new HttpError(400, 'missing_id', 'Falta o identificador do lead.');
    await deleteLead(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

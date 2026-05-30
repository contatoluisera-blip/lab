import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

const KIE_AI_API_KEY = process.env.KIE_AI_API_KEY || '';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Falta taskId' }, { status: 400 });
    }

    const pollResponse = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KIE_AI_API_KEY}`,
      }
    });

    const pollData = await pollResponse.json();

    if (pollData.code === 200 && pollData.data) {
      const state = pollData.data.state;

      if (state === 'success') {
        try {
          const resultObj = JSON.parse(pollData.data.resultJson);
          const resultUrl = resultObj.resultUrls && resultObj.resultUrls.length > 0 
            ? resultObj.resultUrls[0] 
            : null;

          if (resultUrl && adminDb) {
            await adminDb.collection('estudia').doc(taskId).update({
              status: 'completed',
              resultUrl: resultUrl
            });
          }

          return NextResponse.json({ success: true, status: 'completed', imageUrl: resultUrl || resultObj });
        } catch (e) {
          console.error('Erro ao parsear resultJson:', pollData.data.resultJson);
          return NextResponse.json({ error: 'Formato de resposta inválido' }, { status: 500 });
        }
      } else if (state === 'failed' || state === 'fail') {
        if (adminDb) {
          await adminDb.collection('estudia').doc(taskId).update({
            status: 'failed',
            error: pollData.data.failMsg || 'Erro na API'
          });
        }
        return NextResponse.json({ success: false, status: 'failed', error: 'Geração falhou no provedor', details: pollData.data.failMsg }, { status: 500 });
      } else {
        // waiting ou processing
        return NextResponse.json({ success: true, status: 'processing' });
      }
    }

    return NextResponse.json({ error: 'Erro ao consultar status' }, { status: 500 });

  } catch (error: any) {
    console.error('Estudia Status Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

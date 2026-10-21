/**
 * Resposta em streaming de texto para gerações longas de IA.
 * Mantém a conexão viva enquanto o modelo escreve, o que evita o corte
 * de 26 s da Netlify em respostas síncronas.
 * Se algo falhar no meio, o erro é sinalizado dentro do próprio stream
 * com o marcador abaixo (o cliente em `lib/client/api.ts` o reconhece).
 */
export const STREAM_ERROR_MARK = '\u0000ERROR:';

export function textStreamResponse(
  produce: (write: (chunk: string) => void) => Promise<void>,
  onError: (err: unknown) => Promise<{ error: string; code: string }>
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (chunk: string) => controller.enqueue(encoder.encode(chunk));
      try {
        await produce(write);
      } catch (err) {
        const payload = await onError(err);
        write(STREAM_ERROR_MARK + JSON.stringify(payload));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}

/**
 * Resposta JSON para trabalhos longos (ex.: análise do Diagnóstico).
 * Envia espaços em branco a cada poucos segundos para manter a conexão viva
 * e, no fim, o JSON do resultado. Espaços antes do JSON não afetam o JSON.parse.
 */
export function jsonKeepAliveResponse(work: () => Promise<unknown>, intervalMs = 4000): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(' '));
      const timer = setInterval(() => controller.enqueue(encoder.encode(' ')), intervalMs);
      try {
        const result = await work();
        controller.enqueue(encoder.encode(JSON.stringify(result)));
      } catch (err) {
        console.error('[stream] trabalho longo falhou:', err);
        controller.enqueue(encoder.encode(JSON.stringify({ success: false, status: 'failed', error: 'Não foi possível concluir a análise. Seu crédito foi devolvido.' })));
      } finally {
        clearInterval(timer);
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}

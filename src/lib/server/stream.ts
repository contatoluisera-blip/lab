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

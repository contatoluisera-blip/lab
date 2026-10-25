/** Endereço público de onde veio a requisição (site oficial ou Deploy Preview). */
export function requestOrigin(req: Request) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  if (host && !host.startsWith('localhost')) return `${proto}://${host}`;
  return new URL(req.url).origin;
}

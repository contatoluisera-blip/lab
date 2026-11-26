/**
 * Distribui vários arquivos escolhidos de uma vez pelos espaços de imagem.
 * O primeiro vai no espaço clicado; os outros ocupam os espaços vazios seguintes
 * (depois os vazios anteriores). O que passar do limite do modelo fica de fora.
 *
 * Em frames de vídeo (i2v) a ordem dos espaços é inicial, final, intermediários. Quando a
 * pessoa escolhe 3 ou mais a partir do frame inicial, a última imagem vira o frame final e as
 * do meio viram os intermediários, para seguir a ordem em que ela selecionou.
 */
export function planMultiPick<T>(opts: {
  files: T[];
  start: number;
  max: number;
  isFilled: (i: number) => boolean;
  frames?: boolean;
}): { assignments: { index: number; file: T }[]; skipped: number } {
  const { start, max, isFilled, frames } = opts;
  let files = opts.files;

  const order = [start];
  for (let i = start + 1; i < max; i++) if (!isFilled(i)) order.push(i);
  for (let i = 0; i < start; i++) if (!isFilled(i)) order.push(i);

  if (frames && start === 0 && files.length >= 3 && order.includes(1)) {
    // inicial, final, intermediários ← primeira, última, as do meio
    files = [files[0], files[files.length - 1], ...files.slice(1, -1)];
    const rest = order.filter(i => i !== 0 && i !== 1);
    order.splice(0, order.length, 0, 1, ...rest);
  }

  const assignments = files.slice(0, order.length).map((file, k) => ({ index: order[k], file }));
  return { assignments, skipped: Math.max(0, files.length - order.length) };
}

export const skippedNotice = (skipped: number, max: number) =>
  skipped > 0 ? `Este modelo aceita até ${max} ${max === 1 ? 'imagem' : 'imagens'}. ${skipped === 1 ? 'Uma ficou' : `${skipped} ficaram`} de fora.` : '';

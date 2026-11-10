// Contas sobre os pixels da ID Visual (RGBA em sequência). Sem canvas, para poder testar fora do navegador.

type Pixels = Uint8ClampedArray;

/** Cor do fundo: mediana da borda da imagem (resiste a letras encostando em algum lado). */
export function sampleBackground(data: Pixels, width: number, height: number): [number, number, number] {
  const r: number[] = [];
  const g: number[] = [];
  const b: number[] = [];
  const push = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    r.push(data[i]); g.push(data[i + 1]); b.push(data[i + 2]);
  };
  const stepX = Math.max(1, Math.floor(width / 64));
  const stepY = Math.max(1, Math.floor(height / 64));
  for (let x = 0; x < width; x += stepX) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y += stepY) { push(0, y); push(width - 1, y); }
  const median = (a: number[]) => a.sort((m, n) => m - n)[Math.floor(a.length / 2)];
  return [median(r), median(g), median(b)];
}

const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Recorta o fundo chapado: a distância até a cor do fundo vira transparência, em todo lugar,
 * inclusive no miolo de letras como "A" e "O". Na borda, tira a cor do fundo que vazou para a letra.
 */
export function keyOutBackground(data: Pixels, width: number, height: number) {
  const [br, bg, bb] = sampleBackground(data, width, height);
  const NEAR = 60;
  const FAR = 130;
  for (let i = 0; i < data.length; i += 4) {
    const dist = Math.sqrt((data[i] - br) ** 2 + (data[i + 1] - bg) ** 2 + (data[i + 2] - bb) ** 2);
    const alpha = smoothstep(NEAR, FAR, dist);
    if (alpha <= 0) { data[i + 3] = 0; continue; }
    if (alpha < 1) {
      data[i] = (data[i] - (1 - alpha) * br) / alpha;
      data[i + 1] = (data[i + 1] - (1 - alpha) * bg) / alpha;
      data[i + 2] = (data[i + 2] - (1 - alpha) * bb) / alpha;
    }
    data[i + 3] = Math.round(data[i + 3] * alpha);
  }
}

/** Tem transparência de verdade (pelo menos 1% dos pixels)? */
export function hasTransparency(data: Pixels) {
  let clear = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 200) clear++;
  return clear >= data.length / 4 / 100;
}

/** Área ocupada pelos pixels visíveis, com uma folga pequena. Null se a imagem estiver vazia. */
export function trimBounds(data: Pixels, width: number, height: number) {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.02);
  const x = Math.max(0, minX - pad);
  const y = Math.max(0, minY - pad);
  return { x, y, width: Math.min(width, maxX + pad + 1) - x, height: Math.min(height, maxY + pad + 1) - y };
}

/** Cores dominantes, das mais presentes para as menos, sem repetir tons muito parecidos. */
export function dominantColors(data: Pixels, count: number) {
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    const b = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    b.n++; b.r += data[i]; b.g += data[i + 1]; b.b += data[i + 2];
    buckets.set(key, b);
  }
  const picked: [number, number, number][] = [];
  for (const b of [...buckets.values()].sort((x, y) => y.n - x.n)) {
    const c: [number, number, number] = [Math.round(b.r / b.n), Math.round(b.g / b.n), Math.round(b.b / b.n)];
    if (picked.every(p => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2 > 2500)) picked.push(c);
    if (picked.length >= count) break;
  }
  return picked.map(c => `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`);
}

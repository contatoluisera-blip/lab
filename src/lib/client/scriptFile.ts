'use client';

// Leitura do roteiro enviado na Montagem.
// PDF vai inteiro para o Claude (ele lê texto e imagens das páginas); DOCX, TXT e MD viram texto aqui no navegador.

import { SCRIPT_PDF_MAX_BYTES, SCRIPT_TEXT_MAX } from '@/lib/montagem';

export type ScriptFile =
  | { kind: 'pdf'; name: string; data: string }
  | { kind: 'text'; name: string; text: string };

export const SCRIPT_ACCEPT = '.pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown';

export async function readScriptFile(file: File): Promise<ScriptFile> {
  // Arquivos baixados às vezes chegam com o nome codificado (ex.: "p%C3%BAblica").
  let name = file.name;
  try { name = decodeURIComponent(name); } catch { /* mantém o nome original */ }
  name = name.slice(0, 120);
  const ext = name.toLowerCase().split('.').pop();
  if (ext === 'pdf' || file.type === 'application/pdf') {
    if (file.size > SCRIPT_PDF_MAX_BYTES) throw new Error('O PDF passa de 3 MB. Exporte sem imagens ou envie em DOCX.');
    return { kind: 'pdf', name, data: await toBase64(file) };
  }
  let text: string;
  if (ext === 'docx') text = await docxText(await file.arrayBuffer());
  else if (ext === 'txt' || ext === 'md' || file.type.startsWith('text/')) text = await file.text();
  else if (ext === 'doc') throw new Error('Arquivos .doc antigos não são lidos. Salve como .docx ou PDF.');
  else throw new Error('Envie o roteiro em PDF, DOCX, TXT ou MD.');
  text = text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
  if (text.length < 20) throw new Error('Não encontramos texto nesse arquivo.');
  if (text.length > SCRIPT_TEXT_MAX) throw new Error('O roteiro é longo demais (mais de 60 mil caracteres). Divida em partes.');
  return { kind: 'text', name, text };
}

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

/** Texto de um .docx: abre o zip (só o diretório central) e lê word/document.xml. */
async function docxText(buf: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buf);
  const view = new DataView(buf);
  const invalid = () => new Error('Não foi possível ler esse DOCX. Salve de novo ou envie em PDF.');
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw invalid();
  const entries = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  for (let n = 0; n < entries && p + 46 <= bytes.length; n++) {
    if (view.getUint32(p, true) !== 0x02014b50) break;
    const method = view.getUint16(p + 10, true);
    const size = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const local = view.getUint32(p + 42, true);
    const entryName = new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + nameLen));
    if (entryName === 'word/document.xml') {
      const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
      const raw = bytes.slice(start, start + size);
      const xml = method === 0 ? new TextDecoder().decode(raw)
        : method === 8 ? await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text()
        : null;
      if (xml === null) throw invalid();
      return xmlToText(xml);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw invalid();
}

function xmlToText(xml: string) {
  return xml
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<w:(br|cr)\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

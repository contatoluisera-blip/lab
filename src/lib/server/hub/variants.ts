// Variações de busca do Hub: quando o termo de um nicho satura (a busca "popular" só devolve
// reels que já temos), o Claude sugere outros termos do mesmo nicho, que trazem rankings diferentes.

import { AI_MODELS, anthropicClient } from '@/lib/server/ai';
import { cleanSourceValue } from './collect';

/** Teto de variações guardadas por fonte (as antigas voltam a valer quando a pausa acaba). */
export const MAX_VARIANTS = 8;
const PER_CALL = 3;

/** Pede novos termos de busca do Instagram para o nicho, diferentes de todos os já usados. Nunca lança. */
export async function newSearchVariants(nicho: string, base: string, used: string[], empty: string[] = []): Promise<string[]> {
  try {
    const res = await anthropicClient().messages.create({
      model: AI_MODELS.anthropicFast,
      max_tokens: 300,
      system: 'Você sugere termos de busca do Instagram em português do Brasil para encontrar reels virais de um nicho. '
        + 'A busca de reels populares só devolve resultados para termos curtos e amplos, muito buscados: '
        + 'use 1 a 3 palavras (prefira 1 ou 2), como aparecem nas sugestões de busca do Instagram (ex.: "jantar", "marmita fit", "look", "treino glúteo"). '
        + 'Nada de frases longas ou muito específicas, sem hashtag, sem emoji, sem aspas. '
        + 'Os termos devem cobrir subtemas diferentes do nicho, para trazer reels diferentes dos já encontrados. '
        + 'Responda só com um array JSON de strings.',
      messages: [{
        role: 'user',
        content: `Nicho: ${nicho}\nTermo original: ${base}\nTermos já usados (não repita nem varie só a ordem das palavras): ${used.join('; ')}\n`
          + (empty.length ? `Termos que não trouxeram nenhum reel (evite parecidos, eram longos ou específicos demais): ${empty.join('; ')}\n` : '')
          + `Sugira ${PER_CALL} termos novos.`,
      }],
    });
    const text = res.content.map(b => (b.type === 'text' ? b.text : '')).join('');
    const list = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1));
    const seen = new Set(used.map(cleanSourceValue));
    return (Array.isArray(list) ? list : [])
      .map((t: unknown) => cleanSourceValue(String(t)).replace(/[#"“”]/g, '').slice(0, 40))
      .filter((t: string) => t.split(' ').length <= 3)
      .filter((t: string) => t.length >= 3 && !seen.has(t))
      .slice(0, PER_CALL);
  } catch (e: any) {
    console.error('[hub] variações falharam', nicho, e?.message);
    return [];
  }
}

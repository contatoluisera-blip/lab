// ─────────────────────────────────────────────────────────────
// Filtro de entrada da geração: barra pedidos que os termos de uso proíbem.
// É a primeira barreira (os modelos têm filtros próprios). Pedidos barrados
// ficam registrados para a moderação no /admin/geracoes.
// ─────────────────────────────────────────────────────────────

const normalize = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ');

/** Termos que, sozinhos, já caracterizam conteúdo proibido (sexual explícito ou envolvendo menores). */
const BLOCKED: RegExp[] = [
  /\b(nude|nudes|naked|nsfw|porn\w*|hentai|xxx|explicit sex|sex scene|sexual act)\b/,
  /\b(nua|nuas|pelad[oa]s?|porno\w*|pornografi\w*|sexo explicito|cena de sexo|ato sexual|transando)\b/,
  /\b(child|minor|underage|kid|teen|loli|shota)\b.*\b(sexy|sexual|nude|naked|lingerie|erotic)\b/,
  /\b(sexy|sexual|nude|naked|lingerie|erotic)\b.*\b(child|minor|underage|kid|teen|loli|shota)\b/,
  /\b(crianca|menor de idade|menina|menino|adolescente)\b.*\b(sensual|sexual|nua|pelad[oa]|lingerie|erotic\w*)\b/,
  /\b(sensual|sexual|nua|pelad[oa]|lingerie|erotic\w*)\b.*\b(crianca|menor de idade|menina|menino|adolescente)\b/,
  /\b(gore|decapitat\w*|desmembra\w*|beheading)\b/,
];

export function moderatePrompt(prompt: string): { ok: true } | { ok: false; reason: string } {
  const text = normalize(prompt);
  for (const rule of BLOCKED) {
    if (rule.test(text)) {
      return { ok: false, reason: 'Este pedido descreve conteúdo proibido pelos termos de uso da geração (conteúdo sexual, envolvendo menores ou violência explícita).' };
    }
  }
  return { ok: true };
}

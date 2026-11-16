// ─────────────────────────────────────────────────────────────
// Escala dos créditos (estudo: docs/creditos-multiplos.md)
//
// A plataforma mostra e cobra créditos "novos", 10 vezes menores que os antigos.
// O Firestore continua gravando na unidade antiga (saldo do usuário, cobrança das
// gerações, extrato), com até 1 casa decimal. Assim o banco é o mesmo para o código
// antigo e o novo: nada precisa ser migrado e o estorno de um pedido criado em
// qualquer versão sai certo.
//
// Regra: tudo que é lido do banco passa por fromStored; tudo que é gravado, por toStored.
// ─────────────────────────────────────────────────────────────

/** Quantos créditos novos cabem em 1 crédito gravado. */
export const CREDITS_PER_STORED = 10;

/** Créditos novos → valor gravado (ex.: 45 → 4,5). */
export const toStored = (credits: number) => Math.round((Number(credits) || 0) / CREDITS_PER_STORED * 1000) / 1000;

/** Valor gravado → créditos novos, sempre inteiro (ex.: 4,5 → 45). */
export const fromStored = (stored: unknown) => Math.round((Number(stored) || 0) * CREDITS_PER_STORED);

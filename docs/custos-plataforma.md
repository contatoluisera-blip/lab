# Custos da plataforma e margem por plano

Revisado em 10/11/2026. Valores em dólar convertidos a **R$ 5,72**, câmbio já com IOF e taxas do cartão internacional (`USD_TO_BRL` em `src/lib/generation.ts`). Os valores do código ficam em `src/lib/platformCosts.ts`: atualize aquele arquivo e este documento juntos.

## Regra de preço

Cada crédito cobrado pode custar no máximo **R$ 0,67** em provedores (`MAX_COST_PER_CREDIT_BRL`). É cerca de 34% do que um crédito rende no Elite, o plano em que o crédito vale menos.

| Plano | Preço | Créditos | Valor de 1 crédito |
|---|---|---|---|
| Start | R$ 67 | 20 | R$ 3,35 |
| Pro | R$ 117 | 50 | R$ 2,34 |
| Elite | R$ 197 | 100 | R$ 1,97 |

## Custos fixos novos (Montagem)

| Assinatura | US$/mês | R$/mês | Franquia |
|---|---|---|---|
| Remotion (licença de render) | 100 | 572 | 10.000 renders |
| ElevenLabs Pro | 99 | 566 | ~600 mil caracteres (~600 min de fala) |
| **Total** | **199** | **1.138** | |

Peso desses fixos por assinante: R$ 45,53 com 25 assinantes · R$ 22,77 com 50 · R$ 11,38 com 100 · R$ 5,69 com 200 · R$ 2,28 com 500.

Ainda não estão nesta conta: taxas do Stripe, Netlify, Firebase, saldo da KIE e uso de IA das outras ferramentas.

## Custo por uso (medido em 10/11/2026)

| Uso | Custo | Créditos cobrados hoje | Custo por crédito | Situação |
|---|---|---|---|---|
| Trilha Suno (2 versões) | US$ 0,06 · R$ 0,34 | 1 | R$ 0,34 | ✅ dentro da regra |
| Locução OpenAI, 60 s | US$ 0,021 · R$ 0,12 | 1 | R$ 0,12 | ✅ |
| Locução ElevenLabs, 43 s (742 caracteres) | US$ 0,122 · R$ 0,70 | 1 | R$ 0,70 | ⚠️ no limite |
| Locução ElevenLabs, 60 s (~1.000 caracteres) | US$ 0,165 · R$ 0,94 | 1 | R$ 0,94 | ❌ acima |
| Texto da locução (Claude) | US$ 0,023 · R$ 0,13 | 0 | — | absorvido |
| Montar com IA, 5 clipes (medido) | US$ 0,087 · R$ 0,50 | 0 | — | absorvido |
| Montar com IA, 9 clipes (estimado) | US$ 0,15 · R$ 0,86 | 0 | — | absorvido |
| Exportação 60 s (AWS, medido) | US$ 0,028 · R$ 0,16 | 2 | — | ✅ |
| Licença Remotion por render | US$ 0,01 (franquia cheia) | dentro da exportação | — | fixo, ver abaixo |
| Exportação 60 s + 2 montagens com IA | R$ 1,93 | 2 | R$ 0,97 | ❌ acima |

A ElevenLabs foi calculada com a franquia toda usada (US$ 99 ÷ 600 mil caracteres = US$ 0,165 por mil). Com menos uso, o custo por caractere sobe, porque a assinatura é fixa.

**Licença do Remotion por volume.** O preço é fixo, então quanto mais renders, menor o custo de cada um:

| Renders no mês | Custo da licença por render |
|---|---|
| 200 | R$ 2,86 |
| 500 | R$ 1,14 |
| 1.000 | R$ 0,57 |
| 3.000 | R$ 0,19 |
| 10.000 | R$ 0,06 |

## Margem por plano no pior caso (todos os créditos gastos ao teto de R$ 0,67)

| Plano | Assinantes | Custo variável | Fixo por assinante | Margem | % |
|---|---|---|---|---|---|
| Start | 50 | R$ 13,40 | R$ 22,77 | R$ 30,83 | 46% |
| Start | 100 | R$ 13,40 | R$ 11,38 | R$ 42,22 | 63% |
| Start | 200 | R$ 13,40 | R$ 5,69 | R$ 47,91 | 72% |
| Pro | 50 | R$ 33,50 | R$ 22,77 | R$ 60,73 | 52% |
| Pro | 100 | R$ 33,50 | R$ 11,38 | R$ 72,12 | 62% |
| Pro | 200 | R$ 33,50 | R$ 5,69 | R$ 77,81 | 67% |
| Elite | 50 | R$ 67,00 | R$ 22,77 | R$ 107,23 | 54% |
| Elite | 100 | R$ 67,00 | R$ 11,38 | R$ 118,62 | 60% |
| Elite | 200 | R$ 67,00 | R$ 5,69 | R$ 124,31 | 63% |

Na prática a margem é maior: a maioria dos usos custa bem menos que o teto (exportação R$ 0,11 por crédito; trilha R$ 0,34).

## Ajustes recomendados (aguardando decisão)

1. **Locução com ElevenLabs: 2 créditos.** Um vídeo de 60 s narrado custa R$ 0,94, acima do teto de 1 crédito. A locução com OpenAI continua em 1 crédito.
2. **Montar com IA: 1 crédito por rodada**, ou deixar 3 rodadas grátis por dia e projeto. Hoje é grátis até 30 por dia, e cada rodada custa de R$ 0,50 a 0,86. Quem remonta muito transforma a exportação em prejuízo.
3. **Exportação: manter 2 créditos até 60 s.** O custo variável é baixo (R$ 0,22), e sobra para a licença do Remotion enquanto o volume é pequeno.
4. **Ponto de equilíbrio:** mesmo no pior caso (todos os créditos gastos ao teto), os R$ 1.138 fixos da Montagem se pagam com **~9 assinantes Elite** (R$ 130 de contribuição cada), **~14 Pro** (R$ 83,50) ou **~22 Start** (R$ 53,60).

## Como manter atualizado

- Cada uso da Montagem grava o custo real em `montagem_costs` (etapa, provedor, modelo, US$, tokens ou caracteres).
- Os renders gravam o custo da AWS em `render_jobs.costUsd`, e as gerações da KIE gravam os créditos consumidos em `gen_jobs.kieCreditsConsumed`.
- Revise este estudo quando mudar um plano de provedor, o câmbio ou a tabela de créditos.

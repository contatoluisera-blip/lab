# Crédito em múltiplos (1 crédito atual = 10 créditos novos)

Estudo de 16/11/2026. Custos de `src/lib/generation.ts` (câmbio R$ 5,72), perfil de cliente de agência e preços da seção 8 de `docs/plano-agencia.md`. Ainda não implementado.

## 1. O problema do crédito unitário

Hoje cada uso custa **no mínimo 1 crédito** e sobe de 1 em 1, arredondando sempre para cima (`creditsForUsd`). Cada passo vale até R$ 0,67 de custo.

- Em vídeo caro o arredondamento quase não pesa: um Kling 3 de R$ 2,57 vira 4 créditos, porque o custo exato daria 3,84.
- Em uso barato ele domina. Uma trilha de R$ 0,34 cobra o mesmo crédito que uma imagem 4K de R$ 0,51, e um Flux de R$ 0,05 também. Um Veo Lite de R$ 1,00 cobra 3 créditos, o dobro do custo, por causa do piso por modelo.
- Ajustes ficam grosseiros: subir 1 crédito numa imagem é +100%, e não há como cobrar "meio crédito" pela Montagem com IA ou pela ElevenLabs proporcional ao tamanho do texto.

Higgsfield (1 crédito ≈ R$ 0,25 a 0,49) e Magnific (1 crédito ≈ R$ 0,0035) usam unidades menores justamente para isso.

## 2. Escala escolhida: ×10

| Escala | 1 crédito vale (custo máximo) | Agência | Kling 3 Pro 5 s | Imagem 2K | Leitura |
|---|---|---|---|---|---|
| ×1 (hoje) | R$ 0,67 | 1.000 | 4 | 1 | passos grosseiros |
| **×10** | **R$ 0,067** | **10.000** | **40** | **6 a 8** | erro de arredondamento abaixo de 20% em tudo que custa mais de R$ 0,34 |
| ×100 | R$ 0,0067 | 100.000 | 385 | 51 | não ganha precisão útil e os números ficam difíceis de ler |

Com ×10, o crédito novo fica na mesma ordem de grandeza da Higgsfield: R$ 0,10 a R$ 0,34 por crédito, conforme o plano.

| Plano | Créditos hoje | Créditos novos | Preço | R$ por crédito novo |
|---|---|---|---|---|
| Start | 20 | 200 | R$ 67 | R$ 0,335 |
| Pro | 50 | 500 | R$ 117 | R$ 0,234 |
| Elite | 100 | 1.000 | R$ 197 | R$ 0,197 |
| Agência | 1.000 | 10.000 | R$ 1.247 | R$ 0,125 |
| Agência Plus | 2.500 | 25.000 | R$ 2.747 | R$ 0,110 |
| Agência Max | 5.000 | 50.000 | R$ 4.997 | R$ 0,100 |
| Recarga avulsa | 10 a 1.000 | 100 a 10.000 | R$ 0,335 por crédito | — |

## 3. Três formas de converter

**Neutra:** multiplica tudo por 10. Nada muda no bolso de ninguém, só a percepção (10.000 créditos em vez de 1.000).

**A: custo exato.** Cada uso passa a custar `arredondar para cima(custo ÷ R$ 0,067)`, com números redondos (múltiplos de 5) acima de 20 e mínimo de 5. Resultado no catálogo:

| Uso | Custo real | Hoje (×10) | Custo exato | Diferença |
|---|---|---|---|---|
| Kling 3 Pro, 5 s | R$ 2,57 | 40 | 40 | 0% |
| Kling 3 Std, 5 s | R$ 2,00 | 30 | 30 | 0% |
| Kling 4, 1080p, 5 s | R$ 6,08 | 100 | 95 | −5% |
| Veo 3.1 Fast, 1080p | R$ 1,86 | 40 | 30 | −25% |
| Veo 3.1 Lite, 1080p | R$ 1,00 | 30 | 15 | −50% |
| Seedance 2 Fast, 720p, 5 s | R$ 3,55 | 60 | 55 | −8% |
| Wan 2.7, 1080p, 5 s | R$ 3,43 | 60 | 55 | −8% |
| Hailuo 2.3 Std, 6 s | R$ 0,86 | 20 | 13 | −35% |
| Grok Imagine, 720p, 6 s | R$ 0,77 | 20 | 12 | −40% |
| Nano Banana 2, 2K | R$ 0,34 | 10 | 6 | −40% |
| Nano Banana Pro, 4K | R$ 0,69 | 20 | 11 | −45% |
| Flux / Ideogram / Imagen | R$ 0,05 a 0,29 | 10 | 5 | −50% |
| Trilha Suno | R$ 0,34 | 10 | 6 | −40% |

O vídeo caro, que é a maior parte do custo, quase não muda. O desconto cai todo nos usos baratos. Com isso, o cliente de agência passa de 1.880 para **1.366 créditos por mês (−27%)**, e a margem cai demais (seção 4).

**B: recomendada.** Custo exato no vídeo, mas com pisos por categoria que preservam a margem e ainda baixam o preço dos usos baratos:

| Uso | Hoje (×10) | Recomendado | Por quê |
|---|---|---|---|
| Vídeo (todos os modelos) | conforme modelo | custo exato, múltiplos de 5 | Kling e Seedance quase iguais; Veo Fast, Hailuo e Grok ficam mais baratos |
| Veo 3.1 Lite, 1080p | 30 | **20** | piso de modelo premium, ainda 33% mais barato |
| Imagem | 10 | **8** (2K e abaixo) · **12** (4K Pro) | imagem barata fica mais barata sem cair abaixo de 2× o custo |
| Flux, Ideogram Turbo, Imagen Fast | 10 | **5** | modelos de rascunho; incentiva testar antes de gastar no modelo caro |
| Trilha Suno | 10 | **8** | — |
| Locução OpenAI | 10 | **5** | custa R$ 0,12 por minuto |
| Locução ElevenLabs | 10 | **8 por 30 s · 15 por 60 s** | resolve o prejuízo da locução longa (pendência do estudo de custos) |
| Montar com IA | 0 | **3 rodadas grátis, depois 5** | resolve a remontagem sem limite (pendência do estudo de custos) |
| Roteiro | 20 | **15** | — |
| Prompt avulso (Gerador) | 10 | **8** | na Montagem segue grátis até 3 por cena |
| Ideia, legenda, proposta | 10 | **5** | custo real ~R$ 0,17 |
| Diagnóstico | 20 | **25** | custo real R$ 1,53, hoje acima do teto |
| Exportação até 60 s | 20 | **20**, +10 a cada 30 s | paga a licença do Remotion |

Cliente de agência com a forma B: **1.550 créditos por mês (−18%)**.

## 4. Efeito no cliente e na margem

| Entrega | Hoje (×10) | A: custo exato | B: recomendada |
|---|---|---|---|
| Post de imagem | 20 | 13 | 16 |
| Carrossel de 5 imagens | 70 | 44 | 56 |
| Reel 30 s, Kling 3 | 360 | 322 | 339 |
| Reel 30 s, Veo Lite | 300 | 172 | 219 |
| Reel de edição | 40 | 34 | 36 |
| **Cliente/mês** | **1.880** | **1.366** | **1.550** |
| Clientes por Agência (10.000) | 5,3 | 7,3 | 6,5 |
| Reel Kling pronto no Agência | R$ 44,89 | R$ 40,15 | R$ 42,27 |
| Reel Kling pronto no Max | R$ 35,98 | R$ 32,18 | R$ 33,88 |

Margem (realista com 80% dos créditos gastos · pior caso só com Reels em Kling, prompts absorvidos), já descontando cartão e custo fixo, pela mesma conta da seção 8 do estudo de agência:

| Plano | Hoje | A: custo exato | B: recomendada |
|---|---|---|---|
| Agência mensal | 60% · 38% | 47% · 32% | 52% · 35% |
| Agência anual | 54% · 28% | 38% · 20% | 45% · 24% |
| Plus mensal | 55% · 31% | 40% · 23% | 47% · 27% |
| Plus anual | 48% · 19% | 30% · 10% | 38% · 15% |
| Max mensal | 51% · 24% | 35% · 16% | 42% · 20% |
| Max anual | 43% · 12% | 24% · 2% | 32% · 7% |

- A forma A deixa o Max anual praticamente sem margem no pior caso. Descartada.
- A forma B entrega ~21% mais por cliente com uma queda de margem de 6 a 11 pontos. O Max anual fica justo no pior caso (7%): se ele for o plano mais vendido, vale subir o piso do anual de −15% para −12% ou manter o Veo Lite em 25.
- Nos planos Start, Pro e Elite o efeito é o mesmo em proporção, mas a margem de partida é maior.

## 5. O que muda no código (quando aprovado)

1. Uma constante de escala (`CREDIT_SCALE = 10`) e a regra nova em `creditsForUsd`, `TOOL_COSTS`, `ideasCost` e `montagemCost`. Os pisos ficam por modelo em `generation.ts`, como já é hoje com `tierCredits`.
2. `planConfig.ts`: créditos dos planos, `TOPUP_PACKS` (100 a 10.000) e preço por crédito da recarga.
3. Script de migração com simulação antes (`--apply` só com aprovação): multiplica `credits` e `extraCredits` de todos os usuários e o `charged` / `chargedExtra` das gerações e exportações ainda em andamento, para os estornos saírem na escala certa. Roda no mesmo deploy, fora do horário de pico.
4. Stripe: só os metadados de créditos dos produtos. Preços não mudam.
5. Textos: landing, página de planos, e-mails e avisos de saldo. Um aviso no painel explica a troca ("seus 87 créditos agora são 870").
6. Histórico antigo (`gen_jobs`, `montagem_costs`) fica como está, com um campo `creditScale` nos registros novos.

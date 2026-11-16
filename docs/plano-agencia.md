# Planos para agências

Revisado em 16/11/2026. Custos medidos e tabela de créditos de `src/lib/generation.ts`, câmbio de R$ 5,72. Estudo geral em `docs/custos-plataforma.md` e `docs/projecao-planos.md`.

## 1. Quanto custa cada entrega

| Entrega | Créditos | Custo real | Custo por crédito |
|---|---|---|---|
| Post de imagem (1 prompt + 1 imagem 2K) | 3 | R$ 0,80 | R$ 0,27 |
| Carrossel de 5 imagens (2 prompts + 5 imagens 2K) | 12 | R$ 2,63 | R$ 0,22 |
| Reel IA 30 s, 6 cenas, Kling 3 | 54 | R$ 25,44 | R$ 0,47 |
| Reel IA 30 s, 6 cenas, Veo Lite 1080p | 48 | R$ 16,00 | R$ 0,33 |
| Reel de edição (material próprio + locução + trilha) | 4 | R$ 1,94 | R$ 0,49 |
| Ideia, legenda ou proposta | 1 | R$ 0,17 | R$ 0,17 |

Um Reel com IA inclui roteiro (2), 12 prompts (12), 6 frames (12), 6 vídeos (18 a 24), locução (1), trilha (1) e exportação (2). A montagem com IA e o texto da locução estão no custo, mas hoje não cobram crédito.

## 2. Perfil de consumo de um cliente da agência

Por cliente, por mês: 8 posts de imagem, 2 carrosséis, 4 Reels com IA (metade em Kling, metade em Veo Lite), 4 Reels de edição e 10 ideias ou legendas.

**Total: 278 créditos e R$ 104 de custo real, ou R$ 0,37 por crédito.**

## 3. Planos propostos

| Plano | Créditos/mês | Preço mensal | R$ por crédito | Clientes atendidos | Custo por cliente para a agência |
|---|---|---|---|---|---|
| Agência | 1.000 | R$ 1.497 | R$ 1,50 | ~3,6 | R$ 416 |
| Agência Plus | 2.500 | R$ 3.297 | R$ 1,32 | ~9 | R$ 367 |
| Agência Max | 5.000 | R$ 5.797 | R$ 1,16 | ~18 | R$ 322 |

Escada do preço por crédito: Start R$ 3,35 · Pro R$ 2,34 · Elite R$ 1,97 · Agência R$ 1,50 · Plus R$ 1,32 · Max R$ 1,16. Comparação: 1.000 créditos em 10 contas Elite custariam R$ 1.970.

## 4. Margem por ciclo

Taxa de cartão de 3,99% + R$ 0,39 e R$ 11,38 de custo fixo por conta. **Pior caso:** todos os créditos gastos a R$ 0,67. **Realista:** 80% dos créditos gastos a R$ 0,37.

| Plano | Mensal | Trimestral (−10%) | Anual (−15%) | Anual (−20%) |
|---|---|---|---|---|
| Agência | 50% · 75% | 45% · 73% | 42% · 72% | 39% · 70% |
| Agência Plus | 45% · 73% | 39% · 71% | 36% · 69% | 32% · 68% |
| Agência Max | 38% · 70% | 32% · 67% | **28% · 66%** | 24% · 64% |

Cada célula traz a margem no pior caso e no realista.

**Recomendação:** nos planos de agência, o trimestral fica em −10% e o anual em **−15%**, não −20%. Com 20%, o Max fica com só 24% de margem no pior caso.

| Plano | Mensal | Trimestral | Anual (−15%) |
|---|---|---|---|
| Agência | R$ 1.497 | R$ 1.347/mês | R$ 1.272/mês (R$ 15.264 por ano) |
| Agência Plus | R$ 3.297 | R$ 2.967/mês | R$ 2.802/mês (R$ 33.624 por ano) |
| Agência Max | R$ 5.797 | R$ 5.217/mês | R$ 4.927/mês (R$ 59.124 por ano) |

## 5. O que uma agência precisa além de créditos

1. **Mais gerações ao mesmo tempo:** hoje o limite é 3 gerações ativas por conta e 3 exportações. Sugestão: 8, 12 e 20 gerações e 5 exportações nos planos de agência.
2. **Equipe:** várias pessoas na mesma conta e no mesmo saldo. Ainda não existe na plataforma: hoje é um login por conta.
3. **Recarga com preço de agência:** a recarga avulsa custa R$ 3,35 por crédito, mais que o dobro do crédito da agência. Sugestão: recarga das agências a R$ 1,75 por crédito.
4. **Montar com IA cobrado (1 crédito por rodada):** agências remontam muito, e hoje isso é grátis (R$ 0,50 a 0,86 por rodada).

## 6. Riscos de operação

- **Saldo da KIE:** um Agência Max no pior caso consome até R$ 3.350 por mês em gerações, e a KIE é pré-paga. Com agências ativas, o saldo precisa de recarga automática ou de alerta mais cedo.
- **ElevenLabs Pro:** 600 mil caracteres por mês (~1.200 locuções de 30 s). Uma agência Max usa ~72 mil por mês. Com 6 ou mais agências grandes, vale o plano Scale.
- **AWS:** o pedido de aumento de execuções simultâneas precisa estar aprovado antes de vender os planos de agência.
- **Remotion:** 10 mil renders por mês sobram para esse volume.

## 7. Comparação com Higgsfield e Magnific

Preços lidos nas páginas oficiais em 16/11/2026: [higgsfield.ai/pricing](https://higgsfield.ai/pricing), aba Individual e Business, e [magnific.com/pricing](https://www.magnific.com/pricing). Dólar a R$ 5,72, com IOF, como nos nossos custos. A Magnific cobra em reais, sem impostos locais. A Higgsfield estava em promoção de Black Friday (até 65% de desconto no anual), então a comparação usa o preço mensal cheio e mostra a promoção à parte.

### Planos

| Plataforma e plano | Preço | Créditos/mês | Equipe |
|---|---|---|---|
| Higgsfield Plus | US$ 49/mês | 1.000 | 1 pessoa |
| Higgsfield Ultra | US$ 129/mês | 3.000 (até 9 mil) | 1 pessoa |
| Higgsfield **Team** ("para agências") | US$ 79 por assento/mês (US$ 45 no anual promocional), mínimo 2 | 1.000 por assento, saldo compartilhado | 2 a 9 pessoas, controle de gasto, SSO |
| Higgsfield **Scale** | US$ 215 por assento/mês (US$ 80 no anual promocional) | 2.500 por assento | 5 a 15 pessoas |
| Magnific Plus | R$ 180/mês (R$ 135 no anual) | 50 mil (600 mil por ano) | Business à parte (preço não publicado) |
| Magnific Pro | R$ 440/mês (R$ 330 no anual) | 125 mil (1,5 milhão por ano) | Business à parte |
| Creator Lab Agência / Plus / Max | R$ 1.497 / 3.297 / 5.797 | 1.000 / 2.500 / 5.000 | 1 login (equipe ainda não existe) |

O que ainda não conseguimos ver: o preço por assento da Magnific Business (a página retorna 403) e o preço cheio do anual da Higgsfield fora da promoção.

### Preço por entrega

| Plataforma | Kling 3 1080p, 5 s | 1 imagem (Nano Banana) | 6 imagens + 6 vídeos Kling | Reel de 30 s pronto |
|---|---|---|---|---|
| Creator Lab Agência | R$ 6,00 | R$ 3,00 | R$ 54,00 | **R$ 81,00** |
| Creator Lab Agência Plus | R$ 5,28 | R$ 2,64 | R$ 47,52 | **R$ 71,28** |
| Creator Lab Agência Max | R$ 4,64 | R$ 2,32 | R$ 41,76 | **R$ 62,64** |
| Higgsfield Team (mensal) | R$ 3,62 | R$ 0,90 | R$ 27,11 | não faz |
| Higgsfield Scale (mensal) | R$ 3,94 | R$ 0,98 | R$ 29,52 | não faz |
| Higgsfield Ultra (mensal, 1 pessoa) | R$ 1,97 | R$ 0,49 | R$ 14,76 | não faz |
| Higgsfield Team (anual promocional) | R$ 2,06 | R$ 0,51 | R$ 15,44 | não faz |
| Magnific Pro (mensal) | R$ 1,58 | R$ 0,26 (ilimitada no Plus/Pro) | R$ 11,09 | não faz |
| Magnific Pro (anual) | R$ 1,19 | R$ 0,20 | R$ 8,32 | não faz |

"Reel pronto" é roteiro, prompts das cenas, frames, animação, montagem com o Claude, locução em PT-BR, trilha e exportação, tudo na mesma conta. Nas outras, a geração termina nos clipes. Roteiro, edição, voz e trilha ficam em outras ferramentas (CapCut ou Premiere, ElevenLabs) e no tempo de um editor. A Magnific tem editor de vídeo e geração de voz e música, mas a montagem é manual.

Nosso custo real para comparar: Kling 3 5 s R$ 2,57 · Nano Banana 2 2K R$ 0,34 · Reel completo R$ 25,44.

### Leitura

1. **Na geração pura, somos de 2 a 4 vezes mais caros.** No Kling, a Magnific cobra menos que o nosso custo na KIE: não dá para disputar esse preço, e a Higgsfield também fica abaixo do que conseguimos cobrar com margem.
2. **Na imagem, a diferença não se justifica:** cobramos R$ 2,32 a R$ 3,00 por uma imagem que nos custa R$ 0,34. Os concorrentes vendem imagem a R$ 0,20 a R$ 0,90 e oferecem modelos ilimitados como isca.
3. **O que só nós temos é o Reel pronto em português**, com o Claude dirigindo do roteiro à montagem, ID Visual da marca, vozes brasileiras e as ferramentas de negócio (diagnóstico, proposta, calculadora). Se uma agência gasta 1 a 2 horas de editor por Reel (R$ 50 a 100 a R$ 50/hora), o Reel pronto a R$ 63 a 81 sai mais barato que gerar fora (R$ 15 a 30) e editar.
4. **Equipe é o básico do mercado:** a Higgsfield vende os planos de agência por assento, com saldo compartilhado, controle de gasto e SSO. Sem isso, a agência não compara a gente com eles.

### Ajustes recomendados para competir

1. **Imagem a 1 crédito nos planos de agência** (hoje 2 no Nano Banana 2K). O custo continua coberto: R$ 0,34 contra R$ 1,16 a R$ 1,50 por crédito.
2. **Prompts das cenas incluídos na Montagem dos planos de agência.** Hoje são 12 dos 54 créditos de um Reel. Sem cobrar, o Reel cai para ~42 créditos: R$ 49 no Max e R$ 63 no Agência.
3. **Modelos baratos "ilimitados" com uso justo** nos planos de agência, como Flux Klein e Imagen Fast (R$ 0,05 a R$ 0,11 por imagem), para responder ao ilimitado dos concorrentes.
4. **Contas de equipe** (assentos, saldo compartilhado, limite de gasto por pessoa) como próximo projeto, antes de vender para agências maiores.
5. **Vender por entrega, não por crédito:** a vitrine das agências deve mostrar "X Reels prontos por mês", não só "N créditos".
6. **Vídeo com modelos de melhor custo:** sugerir Veo Lite e Hailuo como padrão para agências (R$ 0,33 a R$ 0,50 por crédito de custo), deixando o Kling como opção premium.

Com os ajustes 1 e 2, o consumo por cliente cai de 278 para cerca de 220 créditos, e cada plano atende ~25% mais clientes. A margem realista continua acima de 60%, porque o custo real por cliente não muda.

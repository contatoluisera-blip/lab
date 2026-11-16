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

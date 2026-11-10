# Projeção de planos: mensal, trimestral e anual

Revisado em 10/11/2026. Usa os custos de `docs/custos-plataforma.md`. Objetivo: aumentar o LTV e tornar o caixa mais previsível sem perder a margem.

## Premissas (ajustáveis)

| Item | Valor |
|---|---|
| Preços mensais atuais | Start R$ 67 · Pro R$ 117 · Elite R$ 197 |
| Desconto trimestral / anual | 10% / 20% |
| Taxa de cartão (Stripe BR) | 3,99% + R$ 0,39 por cobrança |
| Cancelamento | Mensal: 10% ao mês (vida de ~10 meses) · Trimestral: 25% por renovação (~12 meses) · Anual: 40% por renovação (~30 meses) |
| Custo de uso, pior caso | Todos os créditos gastos a R$ 0,67 cada (teto da regra) |
| Custo de uso, realista | 60% dos créditos gastos a R$ 0,40 cada em média |
| Custos fixos da Montagem | R$ 1.138/mês ÷ 100 assinantes = R$ 11,38 por assinante |

Os créditos continuam mensais em todos os ciclos: o assinante trimestral ou anual recebe a cota do plano todo mês.

## Resultado por plano e ciclo

| Plano | Ciclo | Cobrança | Equivale a/mês | Margem/mês (pior · realista) | LTV (pior · realista) |
|---|---|---|---|---|---|
| Start | Mensal | R$ 67,00 | R$ 67,00 | R$ 39 (58%) · R$ 48 (71%) | R$ 392 · R$ 478 |
| Start | Trimestral | R$ 180,90 | R$ 60,30 | R$ 33 (55%) · R$ 42 (69%) | R$ 396 · R$ 499 |
| Start | Anual | R$ 643,20 | R$ 53,60 | R$ 27 (50%) · R$ 35 (66%) | R$ 799 · R$ 1.057 |
| Pro | Mensal | R$ 117,00 | R$ 117,00 | R$ 67 (57%) · R$ 89 (76%) | R$ 671 · R$ 886 |
| Pro | Trimestral | R$ 315,90 | R$ 105,30 | R$ 56 (53%) · R$ 78 (74%) | R$ 673 · R$ 931 |
| Pro | Anual | R$ 1.123,20 | R$ 93,60 | R$ 45 (48%) · R$ 66 (71%) | R$ 1.349 · R$ 1.994 |
| Elite | Mensal | R$ 197,00 | R$ 197,00 | R$ 110 (56%) · R$ 153 (78%) | R$ 1.104 · R$ 1.534 |
| Elite | Trimestral | R$ 531,90 | R$ 177,30 | R$ 92 (52%) · R$ 135 (76%) | R$ 1.101 · R$ 1.617 |
| Elite | Anual | R$ 1.891,20 | R$ 157,60 | R$ 73 (46%) · R$ 116 (74%) | R$ 2.187 · R$ 3.477 |

## Leitura

- **O anual é o motor de LTV:** cerca de 2x o LTV do mensal, mesmo com 20% de desconto, e o caixa do ano entra na hora.
- **O trimestral com 10% de desconto empata com o mensal em LTV:** o desconto come o ganho de retenção. Ele vale como passo intermediário e pela previsibilidade de caixa. Só passa a ganhar do mensal se a vida média do trimestral passar de ~12 meses.
- **A margem segue saudável** em todos os cenários: no pior caso, de 46% a 58% por mês; no realista, de 66% a 78%.
- **Quanto maior o cancelamento do mensal, mais vale o anual.** Com 15% ao mês (vida de ~6,7 meses), o anual chega a ~3x o LTV do mensal.

## Preços sugeridos para a vitrine (arredondados)

| Plano | Mensal | Trimestral | Anual |
|---|---|---|---|
| Start | R$ 67/mês | R$ 59,90/mês (R$ 179,70 a cada 3 meses, −11%) | R$ 53/mês (R$ 636 por ano, −21%) |
| Pro | R$ 117/mês | R$ 104,90/mês (R$ 314,70, −10%) | R$ 93/mês (R$ 1.116, −21%) |
| Elite | R$ 197/mês | R$ 177/mês (R$ 531, −10%) | R$ 157/mês (R$ 1.884, −20%) |

Na vitrine: o anual aparece como "2 meses grátis" e vem marcado por padrão; o trimestral fica como opção do meio.

## O que precisa existir antes de vender

1. **Recarga mensal de créditos para trimestral e anual.** Hoje os créditos são liberados a cada fatura paga e zeram na liberação seguinte. No anual, isso daria a cota de um mês para o ano inteiro. É preciso uma rotina agendada que recarregue a cota todo mês, enquanto a assinatura estiver ativa.
2. **Produtos no Stripe:** criar os 3 trimestrais (cobrança a cada 3 meses) e conferir os preços dos 3 anuais que já existem (`STRIPE_PRODUCT_*_ANNUAL`).
3. **Checkout e webhook:** aceitar o ciclo trimestral e mapear os produtos novos em `planFromStripeProduct`.
4. **Vitrine e faturamento:** seletor Mensal / Trimestral / Anual na página de vendas e na tela de planos, com o preço equivalente por mês e o total do ciclo.
5. **Cancelamento e reembolso:** definir a regra para trimestral e anual (sem reembolso proporcional, ou reembolso em até 7 dias pelo CDC) e deixar isso claro nos termos.

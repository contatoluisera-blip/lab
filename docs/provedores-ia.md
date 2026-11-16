# Provedores de geração: KIE, fal.ai e CometAPI

Levantado em 16/11/2026 nas páginas e documentações oficiais: [fal.ai/pricing](https://fal.ai/pricing), [fal.ai/docs](https://fal.ai/docs) (fila, webhooks, concorrência, confiabilidade, mídia), [cometapi.com/pricing](https://www.cometapi.com/pricing), [apidoc.cometapi.com](https://apidoc.cometapi.com), [cometapi.com/sla](https://www.cometapi.com/sla/) e [termos da CometAPI](https://www.cometapi.com/terms-of-service/). Os preços da KIE vêm do nosso catálogo (`src/lib/generation.ts`), conferido na kie.ai. Dólar a R$ 5,72.

**Objetivo:** ver se outro provedor deixa a operação mais lucrativa e se dá para montar fila e troca de provedor quando houver sobrecarga, sem perder qualidade.

## 1. Custo por entrega

| Entrega | Créditos | KIE | fal.ai | CometAPI | Teto de custo (R$ 0,67 × créditos) |
|---|---|---|---|---|---|
| Kling 3, 1080p, 5 s (sem áudio) | 4 | **R$ 2,57** | R$ 3,20 | sem preço publicado | R$ 2,68 |
| Veo 3.1 Fast, 1080p, 8 s | 4 | **R$ 1,86** | não oferece | sem preço publicado | R$ 2,68 |
| Veo 3.1 (qualidade), 1080p, 8 s, com áudio | 12 | **R$ 7,29** | R$ 18,30 | sem preço publicado | R$ 8,04 |
| Seedance 2 Fast, 720p, 5 s | 6 | **R$ 3,55** | R$ 6,92 | sem preço publicado | R$ 4,02 |
| Grok Imagine, 720p, 6 s | 2 | **R$ 0,77** | R$ 1,72 | — | R$ 1,34 |
| Wan 2.7, 1080p, 5 s | 6 | R$ 3,43 | — | **R$ 2,29** | R$ 4,02 |
| Nano Banana 2, 2K | 1 | **R$ 0,34** | R$ 0,46 | — | R$ 0,67 |
| Nano Banana Pro, 2K | 1 | **R$ 0,51** | R$ 0,86 | — | R$ 0,67 |
| Nano Banana Pro, 4K | 2 | **R$ 0,69** | R$ 1,72 | — | R$ 1,34 |
| GPT Image 2, 2K | 1 | R$ 0,29 | por token | **R$ 0,24** | R$ 0,67 |
| Seedream 5 Pro / 5.5, 2K | 1 | R$ 0,45 | R$ 0,39 | **R$ 0,09** (5.5) | R$ 0,67 |
| Trilha | 1 | R$ 0,34 (Suno, 2 versões) | **R$ 0,17** (MiniMax Music v2) | sem Suno | R$ 0,67 |
| Voz, por mil caracteres | — | ElevenLabs Pro R$ 0,94 | **R$ 0,29 a 0,57** (Gemini Flash TTS / MiniMax Speech 2.8 HD) | ElevenLabs v4 (unidade ambígua) | — |

Observações:
- O preço da fal.ai para o Kling 3 Pro aparece de duas formas: US$ 0,112/s na página do modelo e US$ 0,14/s na tabela geral. Usei o menor.
- O Seedance da fal.ai é cobrado por token (resolução × duração). Usei o valor que a própria página dá para 720p.
- A CometAPI anuncia "20% abaixo do preço oficial", mas não publica o preço por segundo de Kling, Veo, Seedance 2, Hailuo, Runway, Grok, PixVerse e Sora.

## 2. Leitura

1. **A KIE continua o provedor principal.** É de 25% a 150% mais barata que a fal.ai nos vídeos que mais pesam (Kling, Veo, Seedance) e nas imagens Nano Banana.
2. **A fal.ai não serve para tudo, mas serve de reserva.** Se fosse o provedor principal, Kling, Veo, Seedance, Grok e Nano Banana Pro passariam do teto de custo por crédito. Na Agência Max, o Seedance pela fal.ai daria prejuízo (R$ 1,15 de custo por crédito vendido a R$ 1,00). Como reserva para picos e quedas, o custo extra é pontual.
3. **Onde a fal.ai já é mais barata:** trilha (MiniMax Music v2 a R$ 0,17 contra R$ 0,34 do Suno) e voz (R$ 0,29 a R$ 0,57 por mil caracteres, contra R$ 0,94 da ElevenLabs). Vale testar a qualidade em PT-BR antes de trocar.
4. **A CometAPI não serve como base de produção:**
   - não publica os preços dos vídeos que mais usamos;
   - não tem aviso de conclusão (webhook) para vídeo;
   - não documenta limites de requisição;
   - os termos proíbem revender o serviço sem autorização escrita, que é o nosso uso;
   - responde à lei de Hong Kong.

   Ela pode valer para casos pontuais e baratos (Seedream 5.5 a R$ 0,09, Wan 2.7 a R$ 2,29), mas só com autorização por escrito.

## 3. Operação: comparação técnica

| | KIE | fal.ai | CometAPI |
|---|---|---|---|
| Pagamento | pré-pago | pré-pago; créditos valem 365 dias; fatura e desconto por volume com vendas | pré-pago, mínimo US$ 10, recarga automática, créditos não expiram |
| Fila | nossa (`gen_jobs`) | fila oficial (IN_QUEUE → IN_PROGRESS → COMPLETED), sem limite de tamanho | tarefa assíncrona com consulta de status |
| Aviso de conclusão | callback simples | **webhook assinado** (Ed25519), até 31 novas tentativas | **não documentado** para vídeo |
| Gerações simultâneas | 20 a cada 10 s por conta (usamos 16) | 2 numa conta nova, sobe sozinho até 40 conforme o gasto; acima disso, com vendas | não documentado ("ilimitado" só no Enterprise) |
| Novas tentativas | nossas | automáticas (até 10 em erro 503/504) e reserva de modelo ligada por padrão | não documentado |
| Cobrança de falha | não cobra falha | não cobra erro do servidor (5xx) nem a espera na fila | não documentado |
| Arquivos gerados | 14 dias | 7 dias ou mais (configurável) | não documentado |
| Garantia | — | "99,99%" (texto de marketing, sem contrato) | contrato de 99,9% no gateway (exclui os provedores de origem) |
| Sede e termos | — | EUA; licença por modelo (selo "Commercial use") | Hong Kong; proíbe revenda sem autorização escrita |

## 4. Proposta: fila com troca de provedor

A ideia é uma camada de roteamento por cima da fila que já existe em `gen_jobs`:

1. **Adaptador por provedor:** `submit`, `status`, `resultado` e `custo`. A KIE é o primeiro adaptador; a fal.ai entra como segundo.
2. **Mapa de modelos:** cada modelo do catálogo lista seus provedores, em ordem, com o endpoint e o custo de cada um, por exemplo: Kling 3 → KIE, depois fal `kling-video/v3/pro`. O crédito cobrado do usuário continua o mesmo; a diferença de custo fica com a gente.
3. **Saúde de cada provedor:** taxa de erro, recusas por limite (429) e tempo de resposta numa janela de minutos.
   - Passando do limite, o **circuito abre**: novos pedidos daquele modelo vão para o próximo provedor.
   - Depois de um tempo, um pedido de teste decide se o principal voltou.
4. **Regra de custo na troca:**
   - Só redireciona automaticamente se o custo na reserva ficar até **1,3 vez o teto do crédito**.
   - Acima disso, o pedido **espera na fila** (com aviso na tela) em vez de sair com prejuízo.
   - Exceção configurável para planos de agência com prazo apertado.
5. **Fila justa:** limite por provedor (KIE: 16 a cada 10 s; fal.ai: a concorrência da conta) e por pessoa, para uma agência grande não travar a fila de todos.
6. **Avisos de conclusão:** `/api/gen/callback` passa a aceitar o webhook da fal.ai, com verificação da assinatura. A consulta periódica que já existe cobre os dois.
7. **Saldo pré-pago:** acompanhamento do saldo da KIE e da fal.ai no admin, com alerta e recarga automática onde existir. Quando o saldo cai abaixo do limite, a fal.ai trava os pedidos, e a KIE recusa.
8. **Registro:** cada geração grava o provedor e o custo real, para o admin ver quanto a reserva custou no mês.

**Custo extra esperado:** se 10% das gerações de vídeo forem para a fal.ai num mês de pico, o custo de vídeo sobe cerca de 5% a 15%, conforme o modelo. Pelas regras acima, nenhuma geração passa de 1,3 vez o teto.

## 5. Próximos passos sugeridos

1. Criar a conta na fal.ai e testar a qualidade dos mesmos modelos (Kling 3, Seedance 2 Fast, Nano Banana) com prompts reais.
2. Testar voz (MiniMax Speech 2.8 HD, Gemini Flash TTS) e trilha (MiniMax Music v2) em PT-BR contra ElevenLabs e Suno.
3. Implementar os adaptadores e o roteamento (itens 1 a 6 da seção 4), com a fal.ai começando só como reserva.
4. Reavaliar a CometAPI só se ela publicar os preços de vídeo e autorizar o uso por revenda.

## 6. OpenRouter

Lido em 16/11/2026: [quickstart](https://openrouter.ai/docs/quickstart), [preços](https://openrouter.ai/pricing), [FAQ](https://openrouter.ai/docs/faq), [limites](https://openrouter.ai/docs/api_reference/limits), [BYOK](https://openrouter.ai/docs/use-cases/byok), [cache](https://openrouter.ai/docs/features/prompt-caching), [ZDR](https://openrouter.ai/docs/guides/features/zdr.md), [geração de imagem](https://openrouter.ai/docs/features/multimodal/image-generation), [vídeo](https://openrouter.ai/docs/cookbook/video-generation/choose-video-model.md) e a lista pública `GET https://openrouter.ai/api/v1/videos/models`, com o preço de cada vídeo.

### Como funciona

- **Uma API para centenas de modelos:** texto, imagem, vídeo e voz, compatível com o formato da OpenAI. Endereço `https://openrouter.ai/api/v1`, chave no cabeçalho `Authorization: Bearer`.
- **Endpoints:** `/chat/completions`, `/responses`, `/messages` (formato Anthropic), `/images`, `/videos` (assíncrono, com consulta de status ou webhook) e `/models`.
- **SDKs:** `@openrouter/sdk`; o SDK da OpenAI também funciona apontando o `baseURL`.
- **Roteamento:** para o mesmo modelo, escolhe o provedor por preço, velocidade ou latência. Se um provedor falha, tenta o próximo sozinho. Dá para fixar a ordem (`order`), restringir (`only`, `ignore`), limitar o preço (`max_price`) e exigir retenção zero de dados (`zdr`).

### Custos

- **Preço dos modelos:** igual ao de lista do provedor, sem margem.
- **Taxa:** 5,5% sobre cada compra de créditos (mínimo US$ 0,80); 8% no plano Business; 5% em cripto. Não há taxa por requisição.
- **BYOK (chave própria):** grátis até US$ 25 mil por mês de uso; acima disso, 5% do valor.
- **Pagamento:** pré-pago, com cartão (inclusive recarga automática), AliPay ou USDC. Os créditos podem expirar 1 ano após a compra, e o reembolso só vale até 24 horas depois.
- **Falhas:** tentativas que falham não são cobradas, nem imagens com erro.
- **Limites:** sem limite de requisições nos modelos pagos, além do limite do próprio provedor de origem.
- **Garantia de disponibilidade:** só no plano Enterprise.

### Vídeo: OpenRouter × KIE (com a taxa de 5,5%)

| Entrega | KIE | OpenRouter | Diferença |
|---|---|---|---|
| Seedance 2 Fast, 720p, 5 s | R$ 3,55 | **R$ 2,74** | 23% mais barato |
| Wan 2.7, 1080p, 5 s | R$ 3,43 | **R$ 3,02** | 12% mais barato |
| Kling 3 Standard, 5 s | R$ 2,57 | R$ 2,53 | empate |
| Kling 3 Pro, 5 s | **R$ 2,57** | R$ 3,38 | 31% mais caro |
| Hailuo 2.3, 6 s | **R$ 1,49** | R$ 2,96 | 99% mais caro |
| Veo 3.1 Fast, 1080p, 8 s | **R$ 1,86** | R$ 5,79 | 212% mais caro |
| Veo 3.1 Lite, 1080p, 8 s | **R$ 1,00** | R$ 3,86 | 286% mais caro |
| Veo 3.1, 8 s, com áudio | **R$ 7,29** | R$ 19,31 | 165% mais caro |
| Grok Imagine, 720p, 6 s | **R$ 0,77** | R$ 2,53 | 228% mais caro |

**Também na OpenRouter:**
- **Vídeo:** Kling O1, Seedance 2.0, 2.0 Mini e 2.5, Wan 2.6 e 3.0, Hailuo 3, Runway Gen-4.5 e Aleph, Veo 3.1 em 4K e HeyGen.
- **Imagem:** Seedream 5.5 a partir de US$ 0,02, Recraft, GPT Image 2, Gemini Image e FLUX.
- **Voz:** TTS (Speechify, Eleven v4 Turbo) e transcrição.
- **Fora:** música (não tem Suno) e Sora.

### Claude pela OpenRouter

- **Preço:** igual ao da Anthropic (Opus 5.5 US$ 4 / 20; Sonnet 5.5 US$ 2 / 10; Sonnet 4.6 US$ 3 / 15 por milhão de tokens), mais 5,5% na compra de créditos. Com BYOK, sem taxa até US$ 25 mil por mês.
- **O que funciona:** cache (inclusive de 1 hora), saída em JSON com esquema, esforço (`effort`), PDF e imagem por URL.
- **Restrições:** as mesmas da API direta nos modelos 5.5 (sem desligar o raciocínio, sem forçar ferramenta).
- **Reserva automática:** se a Anthropic cair, o mesmo modelo é servido pela AWS (Bedrock), pelo Google (Vertex) ou pela Azure.
- **Atenção:** exigir retenção zero de dados tira a Anthropic direta da rota e deixa só Bedrock e Vertex.

### Onde a OpenRouter entra

1. **Reserva de vídeo, melhor que a fal.ai:** é mais barata que a KIE no Seedance 2 Fast e no Wan 2.7, e empata no Kling 3 Standard. Nesses modelos dá até para usar a OpenRouter como principal. No Veo, no Hailuo e no Grok fica de 2 a 4 vezes mais cara, então só entra como reserva com a regra de 1,3 vez o teto do crédito (seção 4).
2. **Reserva do Claude e da OpenAI sem custo extra:** com BYOK, as chaves que já usamos passam pela OpenRouter e ganham troca automática de provedor quando a Anthropic ou a OpenAI estiverem fora, sem taxa.
3. **Uma conta só para muitos modelos:** simplifica testar novos modelos de vídeo e imagem sem um cadastro por fornecedor.
4. **Limites:**
   - não tem música (o Suno segue na KIE);
   - não há garantia de disponibilidade fora do Enterprise;
   - os vídeos sempre ficam guardados no provedor, mesmo exigindo retenção zero;
   - os créditos podem expirar em 1 ano.

**Ordem recomendada de provedores:**

| Uso | Ordem |
|---|---|
| Kling | KIE → OpenRouter |
| Seedance 2 Fast e Wan 2.7 | OpenRouter → KIE (após teste de qualidade) |
| Veo, Hailuo, Grok | KIE → (fila) → OpenRouter só dentro do teto |
| Imagens | KIE → OpenRouter |
| Trilha | KIE (Suno) |
| Claude | Anthropic direta → OpenRouter (BYOK) |

A fal.ai fica como terceira opção, para os modelos que a OpenRouter não tiver.

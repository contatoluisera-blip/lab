# O que a KIE e a OpenRouter oferecem e a Creator Lab ainda não tem

Levantado em 16/11/2026.

- **Fontes:**
  - KIE: kie.ai/market, kie.ai/pricing e docs.kie.ai.
  - OpenRouter: catálogos públicos `/api/v1/videos/models`, `/api/v1/images/models` e `/api/v1/models`, mais a documentação.
- **Preços:** em US$. Na KIE são o "a partir de" da tabela de preços (a opção mais barata da linha). Antes de colocar qualquer um na plataforma, conferir o preço exato da configuração usada, como fizemos em `src/lib/generation.ts`.
- **Hoje temos:**
  - imagem: Nano Banana 2 e Pro, GPT Image 2, Seedream 5.0 Pro, FLUX 3 Klein, Ideogram V3, Imagen 4 Fast;
  - vídeo: Kling 3.0 / Turbo / 4.0, Veo 3.1 Fast / Quality / Lite, Wan 2.6 (V2V) e 2.7, Seedance 2 Fast, Grok Imagine, PixVerse V6, Hailuo 2.3 / 02, Runway;
  - trilha instrumental: Suno.

## 1. Prioridade alta: encaixam direto no fluxo atual

| Ferramenta | Onde | Preço | Para que serve na Creator Lab |
|---|---|---|---|
| **Upscale de vídeo** (Kie Video Upscale, 1080p/2K/4K) | KIE | $0,0075/s | Gerar em 720p, que é barato, e entregar em 1080p ou 4K. Um Reel de 30 s sai por ~US$ 0,23 |
| Upscale de vídeo Topaz | KIE | $0,04/s | Versão premium do anterior |
| FLUX Video Upscale | OpenRouter | $0,035 a 0,05 por megapixel·s | Alternativa |
| **Upscale de imagem** (Kie 2K/4K/8K, Topaz, Recraft Crisp) | KIE | $0,0025 a 0,06 | Frames e posts em alta resolução sem pagar o modelo em 4K |
| **Remover fundo** (Recraft Remove Background) | KIE | $0,005 | Produto, logo e lettering na ID Visual; recortes para carrossel |
| **Avatar falante / lip sync**: OmniHuman 2.0 (até 5 min) | KIE | $0,07/s | Vídeo UGC com apresentador a partir de uma foto + a locução que já geramos. Forte para agências |
| Kling AI Avatar Std/Pro | KIE | $0,05/s | Idem, mais barato |
| InfiniTalk | KIE | $0,015/s | Idem, o mais barato (testar qualidade) |
| Lip sync vídeo → vídeo (Volcengine) | KIE | $0,04/s | Dublar um take real com a nossa locução |
| HeyGen Avatar IV | OpenRouter | $0,05/s | Avatar a partir de uma foto |
| **Transcrição** (NVIDIA Nemotron 3.5 Transcribe, com tempo por palavra e falantes) | KIE | $0,0015/min | Segunda etapa do "Só edição" (cortar pela fala) e legendas de vídeos gravados. 10 min custam US$ 0,015 |
| **Música com voz, jingles e efeitos sonoros** (Suno: música com vocal, estender, capa, separar vocal e instrumentos, efeitos) | KIE | linha Suno a partir de $0,002 por pedido | Jingle de marca, trilha com letra, efeitos (whoosh, clique) na Montagem |
| **Controle de movimento**: Kling 3.0 Motion Control | KIE | $0,11/s | Transferir o movimento de um vídeo de referência (dancinhas, gestos de trend) para o personagem da marca |
| Wan 2.2 Animate Move/Replace | KIE | $0,03/s | Idem, mais barato |
| **Estender vídeo**: Grok Imagine Extend | KIE | $0,072 por vídeo | Alongar um take bom sem gerar de novo |
| Gemini Omni 1.2 Flash Extend | KIE | $0,02 a 0,045/s | Idem |

## 2. Modelos de vídeo novos ou mais baratos

| Modelo | KIE | OpenRouter | Destaque |
|---|---|---|---|
| Seedance 2.0 Mini | $0,012/s | por token | O mais barato com qualidade Seedance |
| Gemini Omni 1.2 Flash (t2v, i2v, v2v, até 15 s, áudio) | $0,02/s | $0,07/s (720p com áudio) | Barato, com áudio nativo e edição de vídeo |
| Wan 3.0 / 3.0 Prime (até 30 s) | $0,04 / 0,061/s | $0,10 / 0,14/s (720p) | Takes longos; na KIE sai mais barato que o Wan 2.7 |
| Vidu Q4 (até 4K, 16 s) | $0,036/s | — | 4K barato |
| Kling 4.0 Flash (referência e keyframes) | $0,057/s | — | Kling 4 mais barato |
| Kling 3.0 Omni (referência e transformação) | $0,076/s | — | Personagem consistente por referência |
| Seedance 2.0 e 2.5 | $0,057 / 0,085/s | por token | Qualidade acima do Fast; o 2.5 vai até 30 s |
| HappyHorse 1.0 / 1.1 (inclui edição de vídeo) | $0,14 / 0,11/s | $0,10/s (720p) | Edição de vídeo por texto |
| Hailuo 3 / 3 Max | — | $0,13/s (2K) / $0,08/s | Só na OpenRouter |
| FLUX 3 Video (até 4K, 20 s) | — | $0,17/s (720p) | Só na OpenRouter, caro |
| FLUX Video Edit | — | $0,03/s | Edição de vídeo por texto, só na OpenRouter |
| Kling O1 | — | $0,11/s | Só na OpenRouter |
| Seedance 1.0 Lite / Pro, Wan 2.2 Turbo, Kling 2.x | $0,01 a 0,04/s | — | Gerações antigas; só valem como opção econômica |

## 3. Imagem

| Modelo | Onde | Preço | Destaque |
|---|---|---|---|
| **Seedream 5.5** (decomposição em camadas, fundo transparente nativo) | KIE / OpenRouter | $0,0072 | PNG transparente para letterings e produtos; barato |
| Seedream 5.0 Flash / Lite | KIE / OpenRouter | $0,016 / 0,028 | Mais baratos que o Pro |
| **Ideogram Character** (personagem consistente) | KIE | $0,06 | Mesmo personagem em várias cenas, que é a dor do storyboard |
| MiniMax H3 Image (até 16 referências) | KIE / OpenRouter | $0,009 (1K/2K) | Muitas referências ao mesmo tempo |
| Z-Image, Qwen Image 3 / 3 Pro | KIE / OpenRouter | $0,0025 a 0,004 | Os mais baratos; bons para rascunho |
| Nano Banana 2.1 e 2 Lite | KIE / OpenRouter | $0,02 | Nova versão do nosso modelo principal |
| GPT Image 2.5 / 2.6 (Flare, Sunburst, Economy) | KIE / OpenRouter | $0,025 a 0,03 | Versões mais novas do GPT Image |
| Flux-2 Pro / Flex, Flux Kontext | KIE | $0,025 a 0,07 | Edição por instrução |
| **Recraft V4 / V4.1 (vetor, estilos, utilitário)** | só OpenRouter | sem preço público por imagem | **Logos e ícones em vetor (SVG)** para a ID Visual |
| Krea 2, Microsoft MAI Image, Riverflow, Meta Muse, Tencent HY (inclui panorama 360°) | só OpenRouter | sem preço público por imagem | Estéticas diferentes; testar antes |

## 4. Voz e áudio

| Ferramenta | Onde | Preço | Observação |
|---|---|---|---|
| ElevenLabs TTS (multilingual v2 / turbo 2.5) | KIE | $0,03 por mil caracteres | 5 vezes mais barato que o nosso plano Pro com a franquia cheia ($0,165), mas na KIE ele trava (decisão de 10/11). Vale retestar como reserva |
| ElevenLabs V3 diálogo (várias vozes) | KIE | $0,07 por mil caracteres | Roteiro com dois apresentadores |
| Gemini TTS (3.8 Flash / Flash-Lite / 2.5 Pro) | KIE | $0,35 a 0,70 por milhão de tokens | Muito barato; testar o sotaque PT-BR |
| GPT Audio / Audio Mini | OpenRouter | por token | Voz com entonação por instrução |
| Lyria 3 Pro / Clip (Google, música) | OpenRouter | sem preço público | Alternativa ao Suno |
| ElevenLabs Audio Isolation | KIE | sem preço | Limpar o áudio de takes gravados (Só edição) |

## 5. Texto (LLM)

A KIE também revende Claude, GPT, Gemini, Grok, DeepSeek e Kimi. Os preços listados para o Claude ficam bem abaixo da Anthropic (Sonnet 5.5 "a partir de" $0,80 por milhão de tokens, contra $2 de entrada e $10 de saída na Anthropic), mas a tabela não deixa claro se o valor é de entrada ou saída, nem se há limites. **Não recomendo trocar** o Claude da Anthropic sem um teste de custo real e de estabilidade. Fica como possível reserva, junto da OpenRouter.

## 6. Recomendação de ordem

1. **Upscale de vídeo e imagem + remover fundo**: baratos, sem risco, melhoram a entrega na hora (Montagem e ID Visual).
2. **Transcrição**: destrava a segunda etapa do "Só edição" e as legendas de vídeo gravado.
3. **Avatar falante / lip sync**: produto novo para agências (UGC com apresentador). Testar OmniHuman 2.0, Kling Avatar e InfiniTalk lado a lado.
4. **Suno com voz, efeitos e separação de faixas**: completa a Montagem (jingle, efeitos de transição).
5. **Modelos mais baratos**: Seedance 2.0 Mini, Gemini Omni 1.2 Flash, Wan 3.0, Seedream 5.5, Ideogram Character. Mesmo processo de sempre: preço confirmado, crédito calculado e teste de qualidade.
6. **Recraft vetorial** (OpenRouter) para logos em SVG na ID Visual, depois que a conta da OpenRouter estiver funcionando.
7. **Controle de movimento e extensão de vídeo**: recursos de trend; entram depois que os itens acima estiverem estáveis.

## 7. Teste da OpenRouter (16/11/2026)

A primeira chave era de gerenciamento (management key): ela consulta a conta, mas não pode chamar modelos, e por isso dava 401 "User not found". Com uma chave de API comum, tudo funcionou.

Mesmo prompt nos dois vídeos (barista fazendo latte art), 5 s, 9:16, sem áudio, gerados ao mesmo tempo.

| Teste | Tempo | Custo cobrado | Mesmo pedido na KIE | Diferença (com a taxa de 5,5% na compra de créditos) |
|---|---|---|---|---|
| Claude Sonnet 5.5 (3 ideias de Reels, 79 + 192 tokens) | 3,4 s | US$ 0,0021 | — (direto na Anthropic: mesmo preço) | +5,5% sem BYOK |
| Seedance 2.0 Fast, 480p, 5 s | 112 s | US$ 0,213 (R$ 1,22) | US$ 0,295 (R$ 1,69) | **−24%** |
| Wan 2.7, 720p, 5 s | 100 s | US$ 0,50 (R$ 2,86) | US$ 0,40 (R$ 2,29) | **+32%** |

- **Qualidade:** os dois vídeos saíram limpos, verticais e fiéis ao prompt. O Wan, em 720p, tem mais detalhe; o Seedance, em 480p, enquadrou a cena mais aberta. Falta a comparação lado a lado com o mesmo prompt na KIE.
- **Claude:** o pedido foi atendido pela Anthropic via AWS ("Claude Platform on AWS"), com o português e o formato certos. Isso confirma que a reserva automática funciona.
- **Wan 2.7 na OpenRouter:** cobra US$ 0,10/s em qualquer resolução. Em 720p sai mais caro que na KIE; em 1080p (US$ 0,50 contra US$ 0,60 na KIE) sai ~12% mais barato com a taxa. Corrige a seção 6 de `docs/provedores-ia.md`, que tratava o Wan como mais barato em geral.
- **Conclusão:** a OpenRouter serve como reserva de vídeo e do Claude. Pode ser a principal só no Seedance 2 Fast e no Wan 2.7 em 1080p.

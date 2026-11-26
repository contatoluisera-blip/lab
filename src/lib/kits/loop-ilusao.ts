import type { Kit } from './types';

// Kit "Loop Ilusão": todos os prompts do vídeo, na ordem em que foram gerados.
// {P} = descrição do personagem e {R} = bloco de realismo, preenchidos pela pessoa na página.

const ROOM_V = 'One minimal colorful room that never changes: mint-green walls, a coral-orange color block on the right, a coral-red desk, a mustard-yellow chair, a beige 1990s CRT with a beige keyboard, a neon logo, a window with soft daylight on the left. On the CRT screen a realistic video game shows the same room in miniature with a tiny version of the man typing at his own tiny CRT, which is always on the tiny desk.';
const VIDEO_STYLE = 'Hyper-realistic live-action footage on a cinema camera, natural light, real skin texture, natural understated acting with subtle micro-expressions, natural motion blur, real-time speed, no subtitles, no music.';

export const LOOP_ILUSAO: Kit = {
  slug: 'loop-ilusao',
  eyebrow: 'Kit de prompts · loop “Ilusão”',
  title: 'Como fizemos o loop',
  accent: 'infinito',
  lead: 'Todos os prompts usados no vídeo, na ordem em que foram gerados. Coloque a descrição do seu personagem abaixo: os prompts se atualizam sozinhos e é só copiar e colar.',
  video: '/kits/loop-ilusao/loop.mp4',
  poster: '/kits/loop-ilusao/poster.jpg',
  tools: [
    { label: 'Imagens', value: 'GPT Image 2.6 · 9:16 · 2K' },
    { label: 'Vídeo', value: 'Seedance 2.5 · 720p · áudio ligado' },
    { label: 'Trilha', value: 'Suno V6 · instrumental' },
  ],
  gate: {
    headline: 'Libere o kit completo do loop infinito',
    sub: 'Deixe seu nome e e-mail para ver todos os prompts, as imagens de cada etapa e a ordem da montagem.',
    perks: ['Todos os prompts prontos para copiar', 'As imagens de cada etapa', 'A montagem que fecha o loop'],
  },
  setup: {
    intro: 'Tenha de 3 a 10 fotos reais do seu personagem: frente, três-quartos, perfil e algumas expressões. Um vídeo curto fazendo caretas também serve, é só tirar quadros dele. Depois escreva os dois blocos abaixo uma vez.',
    fields: [
      {
        key: 'P', label: '[PERSONAGEM]', hint: 'Rosto, cabelo, barba, acessórios e roupa. Em inglês funciona melhor.',
        example: 'The man is exactly the man in the real photos provided: a round, full face with full cheeks and a soft wide jaw, heavy dark eyebrows, warm brown eyes, a thick medium-brown chevron mustache with slightly long ends, light stubble, a small dark mole on the right side of the jaw, small silver hoop earrings in both ears, dark-brown slightly wavy hair cut in a short mullet with a choppy micro-fringe over the forehead and a low taper fade on the sides. He wears his signature outfit: a mint-green knitted short-sleeve polo with vertical cream, rust-orange and deep-teal stripes, over a plain white t-shirt, a thin silver chain, a black digital watch.',
      },
      {
        key: 'R', label: '[REALISMO]', hint: 'Igual para todos os frames. Pode deixar como está.',
        example: 'Hyper-realistic photograph, indistinguishable from a real photo taken with a full-frame cinema camera: true-to-life skin with pores, fine facial hair, small blemishes and natural color variation, natural eye moisture and catchlights, individual hair strands and flyaways, real fabric weave, physically correct light and shadows, subtle lens softness and fine grain; absolutely no glossy, waxy, airbrushed, plastic or CGI look; natural relaxed facial muscles.',
      },
    ],
  },
  steps: [
    {
      title: 'Fichas do personagem',
      why: 'Duas fichas que viram a referência de rosto de tudo. A de ângulos precisa ter o personagem visto de cima e de baixo, porque o loop usa esses pontos de vista.',
      items: [
        { title: 'Ficha de expressões', img: 'ficha_expr', refs: ['suas fotos reais'], tool: 'GPT Image 2.6', modelId: 'gpt-image-26',
          prompt: 'Character expression sheet of ONE man, on a plain neutral light-grey seamless background, a clean 3 by 3 grid of tight head-and-shoulders portraits, same lighting and same scale in every panel. {P} The nine expressions, each subtle and natural like a real actor: 1 neutral relaxed; 2 focused concentration, slightly narrowed eyes; 3 a faint curious smile; 4 a flicker of unease, eyes glancing to the side; 5 suspicious, brows slightly knit, looking up; 6 startled, eyes wide, lips parted; 7 awe, looking up with mouth slightly open; 8 a big genuine laugh with teeth; 9 a sly side-eye with a half smile. Use the photos to match his real teeth, smile lines and eye shape. {R} 9:16.' },
        { title: 'Ficha de ângulos', img: 'ficha_ang', refs: ['suas fotos reais'], tool: 'GPT Image 2.6', modelId: 'gpt-image-26',
          prompt: 'Character head-turnaround sheet of ONE man, on a plain neutral light-grey seamless background, a clean 3 by 3 grid of head-and-shoulders views at the same scale and lighting, neutral expression. {P} Views: 1 front; 2 three-quarter left; 3 three-quarter right; 4 full profile left; 5 full profile right; 6 seen from directly above looking down at the top of his head and his face tilted up toward the camera; 7 seen from below looking up at his face, as if from inside a box on the table; 8 back of the head; 9 head tilted down looking at something on a table in front of him. {R} 9:16.' },
      ],
    },
    {
      title: 'O cenário',
      why: 'Quanto mais vazio, mais consistente. Gere a sala sem ninguém uma vez e use como referência em todos os frames.',
      items: [
        { title: 'Sala mínima', img: 'sala', refs: ['ficha de ângulos'], tool: 'GPT Image 2.6', modelId: 'gpt-image-26',
          prompt: 'Wide photograph of an empty interior, no people: a minimal, almost empty, colorful room, the same in every shot: smooth matte walls painted soft mint green, one wall with a large warm coral-orange color block, a pale terracotta polished concrete floor; the only objects are a simple rounded coral-red desk, a mustard-yellow swivel chair, a beige 1990s CRT monitor with a curved glass screen and a beige keyboard on the desk, and a glowing neon logo on the wall above the desk. Nothing else: no shelves, no plants, no posters, no clutter. Soft, even daylight from a window out of frame on the left, gentle shadows, clean color. Straight-on three-quarter view from a standing height, the desk and the CRT in the center. {R} 9:16 vertical.' },
      ],
    },
    {
      title: 'Os 5 frames-chave',
      why: 'São os momentos que o vídeo atravessa. Gere na ordem e confira: o que aparece dentro da tela no frame 1 precisa ser igual ao frame 2.',
      items: [
        { title: 'Frame 1 · Na mesa', img: 'f1', refs: ['sala', 'fichas', '2 fotos reais'], tool: 'GPT Image 2.6', modelId: 'gpt-image-26',
          prompt: 'Exactly the room of the first image. Medium three-quarter shot from behind his right shoulder and slightly to the side: he sits in the mustard-yellow chair at the coral desk, relaxed and focused, one hand on the keyboard, looking at the CRT. The CRT screen is clearly visible and shows, like a video game, the very same room seen slightly from above, with a tiny version of him in the mustard chair typing at the coral desk, and on that tiny desk a tiny beige CRT monitor and a tiny keyboard clearly visible in front of him, and a small pixel heart x3 in the top-left corner of the screen. {P} {R} 9:16 vertical.' },
        { title: 'Frame 2 · A tela do jogo', img: 'f2', refs: ['frame 1', 'sala', 'ficha de ângulos'], tool: 'GPT Image 2.6', modelId: 'gpt-image-26',
          prompt: 'Tight insert of the beige CRT screen from the first image filling most of the frame (curved glass, scanlines, slight phosphor glow and reflections, the beige bezel edges visible). On the screen, like a realistic video game seen from a high three-quarter game camera behind and to the right of the chair, exactly the room of the second image with the same layout: the coral desk stands against the mint back wall; the CRT sits on the left half of the desk; the neon logo is on the mint wall directly above the CRT; the coral-orange color block covers the wall to the right of the desk; the large window with soft daylight is on the left side wall. A small version of the same man sits in the mustard chair typing at the tiny CRT. A small pixel heart icon with x3 in the top-left corner of the screen. {R} 9:16 vertical.' },
        { title: 'Frame 3 · Ele percebe', img: 'f3', refs: ['sala', 'fichas', '3 a 5 fotos reais'], tool: 'GPT Image 2.6', modelId: 'gpt-image-26',
          prompt: 'Reverse angle inside the game world, photographed as if real and life-size: the camera is where the CRT screen is, facing the man as he sits in the mustard chair at the coral desk, medium close-up from the chest up. Behind him we see the opposite side of the same minimal room: a plain soft mint-green wall and, in the background on one side, the large window with bright soft daylight and its reflection on the floor; no neon logo and no coral block in this view. He has stopped typing and slowly raises his eyes straight into the lens with a subtle, natural flicker of unease, brows slightly knit, lips closed. The CRT glow lights his face softly from the front, faint scanlines over the image. {P} {R} 9:16 vertical.' },
        { title: 'Frame 4 · Por trás do ombro', img: 'f4', refs: ['frames 3 e 5', 'sala', 'ficha de ângulos'], tool: 'GPT Image 2.6', modelId: 'gpt-image-26',
          prompt: "Inside the game world, life-size and real: an over-the-shoulder shot from behind the small man's right shoulder as he sits frozen in the mustard chair at the coral desk, in the same room as the first image. In front of him, where the screen of the game is, the whole wall in front of him is the curved glass of a CRT seen from inside, with faint scanlines, and through it, huge and close, the face of the big man from the second image looks in at him with quiet curiosity. The small man's head and outfit are in the foreground, slightly soft; the giant face is sharp. Scale is unmistakable: the giant eye alone is as big as the small man's torso. {P} {R} 9:16 vertical." },
        { title: 'Frame 5 · O rosto gigante', img: 'f5', refs: ['frame 1', 'fichas', '3 fotos reais'], tool: 'GPT Image 2.6', modelId: 'gpt-image-26',
          prompt: 'View from inside the CRT looking out through the curved glass: the big man leans toward the screen, his face filling the upper two thirds of the frame, looking into the screen with quiet, genuine curiosity, eyes slightly narrowed and focused, head tilted a few degrees, lips relaxed and closed, a natural, understated expression like a real person studying something tiny. Clear glass: no fog, no breath, no condensation. The glass curvature gives a very gentle distortion, with faint scanlines and a soft reflection; behind him the mint wall, the coral block and the neon logo, softly out of focus, daylight from the left. {P} {R} 9:16 vertical.' },
      ],
    },
    {
      title: 'A animação em 3 blocos',
      why: 'Cada bloco recebe vários frames no mesmo prompt, com a linha do tempo em segundos. A ordem das imagens enviadas é a ordem Image1, Image2… do prompt. Na Creator Lab, use o modo Referências → vídeo.',
      items: [
        { title: 'Bloco A · 8 s · a câmera entra na tela', refs: ['frame 1', 'frame 2', 'frame 3', 'ficha de expressões', 'ficha de ângulos'], tool: 'Seedance 2.5 · 720p', modelId: 'seedance-25',
          prompt: `Use Image1, Image2 and Image3 as the key moments of one continuous camera move, in this order. ${ROOM_V} Image4 (expression sheet) and Image5 (head-angle sheet) define the man: keep his face, hair and outfit identical at every moment. 0-2.5s: start exactly on Image1: behind the man's right shoulder, he types calmly; on the screen the tiny version of him types too. 2.5-4.5s: the camera glides forward past his shoulder in one smooth dolly push-in until the curved glass fills the frame, matching Image2. 4.5-5.5s: without cutting, the camera passes through the glass into the game world; the scanlines fade and the miniature room becomes life-size and real. 5.5-8s: the camera glides around the small man and settles facing him from the front, from where the screen is, ending exactly on Image3: medium close-up from the chest up, plain mint wall and the window in the background; he stops typing and slowly raises his eyes straight into the lens. Single continuous shot, no cuts, no text other than the small heart icon on the game screen. ${VIDEO_STYLE} Audio: soft keyboard clicks, CRT hum, a soft whoosh through the glass, then the room tone drops to near silence.` },
        { title: 'Bloco B · 5 s · o desconforto', refs: ['último quadro do bloco A', 'ficha de expressões'], tool: 'Seedance 2.5 · 720p', modelId: 'seedance-25',
          note: 'Exporte o último quadro do bloco A e use como primeira imagem. Isso evita que o fundo mude na emenda.',
          prompt: `Animate Image1 exactly as it is: Image1 is the first frame and the camera never moves. Keep the exact same framing, the same man facing the lens at the desk, the same background and daylight. Image2 (expression sheet) keeps his face identical. Action, realistic and subtle: he feels watched and his discomfort grows: he holds the stare into the lens, then his eyes dart to the left and to the right, he glances over his shoulder toward the window behind him, swallows, shifts uneasily in the chair, and slowly looks back straight into the lens, tense, lips pressed together, breathing a little faster. Faint horizontal scanlines over the image. Locked-off camera, single continuous shot, no cuts, no text. ${VIDEO_STYLE} Audio: quiet room tone, tense breathing, a soft swallow, the chair creaking slightly.` },
        { title: 'Bloco C · 8 s · o gigante e a volta ao início', refs: ['frame 4', 'frame 5', 'frame 1', 'ficha de expressões', 'ficha de ângulos'], tool: 'Seedance 2.5 · 720p', modelId: 'seedance-25',
          note: 'Terminar exatamente no frame 1 é o que fecha o loop.',
          prompt: `Use Image1, Image2 and Image3 as the three moments of this scene, in this order. ${ROOM_V} Image4 (expression sheet) and Image5 (head-angle sheet) keep both versions of the man identical. 0-2.5s: start exactly on Image1: inside the game, over the small man's shoulder, he sits frozen while through the curved CRT glass in front of him the giant face of the big man looks in at him with quiet curiosity. 2.5-4.5s: the camera slowly pushes toward the glass until the giant face fills the frame as in Image2: clear glass, no fog, the big man's eyes slowly scanning, a slight head tilt, a faint knowing smile. 4.5-8s: without cutting, the camera passes out through the glass into the real room, glides past the big man's face and around his right side, and settles behind his right shoulder as he sits back and calmly starts typing again, ending exactly on Image3, with the tiny version of him at his tiny CRT on the screen. Single continuous shot, one fluid camera move, no cuts, no text other than the small heart icon on the game screen. ${VIDEO_STYLE} Audio: low hum, a slow calm breath, a soft whoosh through the glass, then calm keyboard clicks.` },
      ],
    },
  ],
  assembly: {
    title: 'Montagem, trilha e CTA',
    why: 'A montagem reorganiza os 3 blocos para a história ficar clara. O total dá cerca de 21 s, e o último quadro é igual ao primeiro.',
    order: [
      { title: 'Bloco A inteiro · 0 a 8 s', line: 'A câmera entra na tela e para de frente para o mini-personagem.' },
      { title: 'Início do bloco C · 1,7 s, desacelerado para 2,2 s', line: 'Só o plano por trás do ombro: mostra quem está olhando quem.' },
      { title: 'Bloco B inteiro · 5 s', line: 'A reação de frente, o desconforto de ser observado.' },
      { title: 'Resto do bloco C · cerca de 6 s', line: 'O rosto gigante e a câmera voltando para trás do ombro, no mesmo quadro do começo.' },
    ],
    extras: [
      { title: 'Trilha', refs: ['30 s', 'instrumental'], tool: 'Suno V6', modelId: 'suno-v6',
        note: 'Tags negativas: vocals, choir, lyrics, drums, EDM, cheesy, happy. Deixe por baixo do som que o Seedance gera.',
        prompt: 'Eerie minimal suspense underscore for a looping 24-second short video, instrumental, seamless loop: a soft music-box melody with a slightly detuned toy piano over a low warm drone, slow 80 bpm, minor key, curious and uncanny. From 8s a faint heartbeat-like sub pulse and ticking clock textures build tension; around 14s a rising string swell and subtle 8-bit glitch textures; at 20s it drops back to the music-box melody so the end flows seamlessly into the beginning. Cinematic, minimal, high-end, like a psychological thriller title, no drums.' },
    ],
  },
  tips: [
    { title: 'Fotos reais como referência', line: 'As fichas nasceram de um vídeo de caretas. Imagem de IA como base passa a aparência artificial adiante.' },
    { title: 'Cenário vazio, com regras', line: 'O prompt diz onde fica cada coisa. Cada objeto a mais é algo que a IA pode mudar entre planos.' },
    { title: 'Expressões contidas', line: 'Peça “subtle, natural, understated”. Expressão exagerada é o que mais denuncia IA.' },
    { title: 'Linha do tempo em segundos', line: 'No máximo 3 momentos por bloco, cada um com o segundo em que acontece.' },
    { title: 'Emende pelo último quadro', line: 'Para continuar um plano, use o último quadro do anterior como primeira imagem. Acaba o “pulo” de fundo.' },
    { title: 'Termine no primeiro frame', line: 'O último bloco termina exatamente na imagem que abre o vídeo. É isso que faz o loop parecer infinito.' },
  ],
};

export interface Video {
  id: string;
  title: string;
  url: string;
  duration: string;
  description: string;
  thumbnail: string;
  comingSoon?: boolean;
}

export interface Module {
  id: string;
  title: string;
  subtitle: string;
  videos: Video[];
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  modules: Module[];
}

const CAPA_PRETA = "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/capa%20preta.png?alt=media&token=edef280c-c34d-4642-b75d-397f560a07d1";
const CAPA_VERDE = "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/capa%20verde.png?alt=media&token=e5492d95-b4b6-40e2-828a-d60bf96eac6f";

// ─────────────────────────────────────────────
// CURSO 1: Mobile Lab (curso principal)
// ─────────────────────────────────────────────
const MOBILE_LAB_MODULES: Module[] = [
  {
    id: "modulo-1",
    title: "Módulo 1",
    subtitle: "A Teoria Importa",
    videos: [
      {
        id: "m1-a01",
        title: "Aula 01 - Introdução",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=84dc06c6-cf4c-43bc-a77f-6116b190512c",
        duration: "05:12",
        description: "Boas-vindas ao curso de edição pelo celular. Vamos entender a estrutura das aulas e como aproveitar ao máximo cada conteúdo.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "m1-a02",
        title: "Aula 02 - Mercado",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=206b8284-cbcc-434a-9895-1d795a4cce27",
        duration: "12:45",
        description: "Visão geral sobre o mercado de criação de conteúdo e edição de vídeo mobile. Oportunidades e como se posicionar como um profissional.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "m1-a03",
        title: "Aula 03 - Luz",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=51393728-5097-4406-92b5-81951a2d9100",
        duration: "10:30",
        description: "Fundamentos de iluminação. Como aproveitar a luz natural, usar luz artificial de forma barata e criar contraste nos seus vídeos.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "m1-a04",
        title: "Aula 04 - Resolução",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=77dec3e8-8819-4696-b5e8-2acf586b0c99",
        duration: "08:15",
        description: "Desmistificando resoluções de vídeo: 4K, 1080p, 720p. Quando utilizar cada uma e como configurar seu aparelho para a máxima qualidade.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "m1-a05",
        title: "Aula 05 - Frames por Segundo",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=a70f9d37-a672-44c7-9d87-367a9d6a3271",
        duration: "09:40",
        description: "A diferença prática entre 24fps, 30fps e 60fps. Como usar a taxa de quadros para criar câmera lenta suave ou visual de cinema.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "m1-a06",
        title: "Aula 06 - Planos",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=f63e9d46-2604-42bd-90f3-4e710a342dc1",
        duration: "11:05",
        description: "Estudo de planos cinematográficos aplicados ao formato vertical. Plano geral, plano médio, close-up e detalhe.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "m1-a07",
        title: "Aula 07 - Enquadramento",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=2fc44524-7c0d-48c5-aa4e-ec819ea85e37",
        duration: "10:15",
        description: "Regra dos terços, linhas de força, centralização e simetria. Como posicionar o seu elemento principal para reter atenção.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "m1-a08",
        title: "Aula 08 - Formatos",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=91eb6869-071c-47a1-8b69-8a29524ea204",
        duration: "07:50",
        description: "Diferentes formatos e proporções de vídeo (9:16, 16:9, 1:1, 4:5). Entenda onde aplicar cada formato nas redes sociais.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "m1-a09",
        title: "Aula 09 - Estudo e Análise",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=aa17d24a-5e5e-4c31-885a-cc36ac636459",
        duration: "13:10",
        description: "Desenvolvendo seu repertório visual. Como assistir a vídeos analisando cortes, efeitos, ritmo e roteiro para usar em suas edições.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "m1-a10",
        title: "Aula 10 - Alinhamento",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=0a1ba864-6e76-41b2-9de3-57a7bb12c548",
        duration: "08:55",
        description: "Garantindo um visual simétrico e organizado. Como alinhar elementos gráficos, textos e o próprio vídeo na tela do smartphone.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "m1-a11",
        title: "Aula 11 - Roteiro",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=e47f83b4-bd22-4c8d-b570-f57ccd6ae9ff",
        duration: "15:20",
        description: "Como estruturar um roteiro magnético. O Gancho inicial, o desenvolvimento acelerado, gatilhos de retenção e a Chamada para Ação (CTA).",
        thumbnail: CAPA_PRETA
      },
      {
        id: "m1-a12",
        title: "Aula 12 - Pré-Produção",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=0f5c472b-7d74-48be-b219-791a2e7d396d",
        duration: "11:40",
        description: "O segredo para economizar tempo na gravação. Organização de assets, checklist de equipamentos, roupas e roteiros antes do REC.",
        thumbnail: CAPA_VERDE
      }
    ]
  },
  {
    id: "modulo-2",
    title: "Módulo 2",
    subtitle: "Captação na Prática",
    videos: [
      {
        id: "m2-a01",
        title: "Aula 01 - Configurando Sua Câmera",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=b9d7c05a-047b-4d56-b30e-1723973101a5",
        duration: "14:10",
        description: "Colocando a mão na massa. Como usar o modo manual no celular, travar foco, exposição e ajustar o balanço de brancos.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "m2-a02",
        title: "Aula 02 - Estudo de Ambiente",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=90a9d045-9cb6-4603-9175-50dcb5074dfc",
        duration: "09:35",
        description: "Avaliando locações para gravar. Como lidar com ruídos sonoros, ecos e iluminação mista em ambientes internos.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "m2-a03",
        title: "Aula 03 - Captação na Prática (Parte 1)",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=af415c63-8071-4c7d-b203-c800267b45b9",
        duration: "18:20",
        description: "Gravação real de um vídeo de conteúdo. Posicionamento de tripés, microfonação de lapela e direcionamento de olhar.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "m2-a04",
        title: "Aula 04 - Captação na Prática (Parte 2)",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=ad7058da-6d8c-4dea-906e-651ce962e151",
        duration: "16:45",
        description: "Movimentos de câmera no celular: Pan, Tilt, Dolly e Roll sem estabilizador externo. Técnicas de estabilização corporal.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "m2-a05",
        title: "Aula 05 - Captação na Prática (Parte 3)",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=ef3a3fc1-6ccd-4be3-bfb5-51be955044e1",
        duration: "13:50",
        description: "Gravação de b-rolls e inserts de cobertura. Como captar detalhes que deixam o seu corte e edição muito mais dinâmicos.",
        thumbnail: CAPA_PRETA
      }
    ]
  },
  {
    id: "modulo-3",
    title: "Módulo 3",
    subtitle: "Edição de Vídeo",
    videos: [
      {
        id: "m3-a01",
        title: "Aula 01 - Vamos Editar",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=d4a64ffa-c6c3-4b0f-b9c3-4fed3b30d149",
        duration: "11:20",
        description: "Primeiros passos no aplicativo de edição. Interface, importação de mídia, e organização da timeline.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "m3-a02",
        title: "Aula 02 - CapCut",
        url: "",
        duration: "--:--",
        description: "Aula temporariamente indisponível. Subindo o arquivo novamente para o Panda Video. Em breve de volta!",
        thumbnail: CAPA_VERDE,
        comingSoon: true
      },
      {
        id: "m3-a03",
        title: "Aula 03 - Montagem",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=2ca76add-42f4-44b2-90de-ff7191273354",
        duration: "17:30",
        description: "A arte do corte invisível e jump cuts. Criando ritmo, eliminando silêncios e mantendo o vídeo dinâmico.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "m3-a04",
        title: "Aula 04 - Trilha Sonora",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=5b8e3ea6-6dbf-422b-97fb-817b0878130e",
        duration: "14:15",
        description: "Curadoria musical e mixagem de som. Como sincronizar batidas com cortes e balancear voz de fundo com a trilha sonora.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "m3-a05",
        title: "Aula 05 - Canva",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=e0ffb5aa-9556-43eb-adaf-4cfe5a127b74",
        duration: "12:50",
        description: "Criação de elementos gráficos rápidos, capas (thumbnails) e overlays personalizados usando o Canva no celular.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "m3-a06",
        title: "Aula 06 - Conhecendo o Node Video",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=53ca6158-f595-47d2-9653-346728a3d6d8",
        duration: "18:05",
        description: "Introdução à ferramenta de edição mais avançada do mobile. Entenda a lógica de nós, camadas e interface do Node Video.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "m3-a07",
        title: "Aula 07 - Aplicando Efeito no Node Video",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=bf5aacb6-9f86-4cdc-bac7-03cdaa335b31",
        duration: "15:40",
        description: "Criando efeitos de iluminação avançados, brilho (Glows), sabre de luz e transições estilizadas nos nós.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "m3-a08",
        title: "Aula 08 - Aplicando Video 3D no Node Video",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=455db494-ae57-41e7-b53b-8e1b79766fbe",
        duration: "21:15",
        description: "Técnicas 3D mobile. Como projetar o vídeo em um espaço tridimensional, manipular câmera virtual e rotações espaciais.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "m3-a09",
        title: "Aula 09 - Finalização",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=eb111d51-1201-43dd-aa65-703b8a2d3d4a",
        duration: "10:50",
        description: "Tratamento de cor (Color Grading) e ajustes finais de contraste, saturação e curvas para dar visual de câmera profissional.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "m3-a10",
        title: "Aula 10 - Armazenamento & Backup",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=f45f55d0-81fb-40d3-8c82-f97018713e5a",
        duration: "09:10",
        description: "Não perca seus projetos! Melhores práticas de armazenamento em nuvem e backup de arquivos pesados usando o smartphone.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "m3-a11",
        title: "Aula 11 - Encerramento",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=3869ce63-e348-4184-9672-9302fd889d2c",
        duration: "06:40",
        description: "Resumo final do aprendizado técnico e próximos passos para se tornar um mestre em edição mobile.",
        thumbnail: CAPA_PRETA
      }
    ]
  },
  {
    id: "modulo-bonus",
    title: "Módulo Bônus",
    subtitle: "Aulas e Lives Extras",
    videos: [
      {
        id: "mb-l01",
        title: "Live 01 - Dissecando Edição",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=83973944-f977-444a-be00-a8b5cee2a466",
        duration: "1:02:40",
        description: "Gravação de live dissecando técnicas de edição famosas do mercado, analisando frame a frame a construção do vídeo.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "mb-l02",
        title: "Live 02 - Editando com Alunos (P1)",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=e6896420-f3b7-4084-bc25-fffb50ea9c5d",
        duration: "58:15",
        description: "Sessão prática em live revisando e corrigindo projetos de edição enviados pelos próprios alunos.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "mb-l03",
        title: "Live 02 - Editando com Alunos (P2)",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=84a5dbb0-87e8-4bc1-84cf-2b3dc4c4c6e2",
        duration: "45:30",
        description: "Continuação da análise prática de edições dos alunos, focando em storytelling e transições.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "mb-l04",
        title: "Tudo Sobre NodeVideo (Live)",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=7d1f81f4-9fdb-46cd-845e-defff66bff52",
        duration: "1:22:10",
        description: "Aulão ao vivo focado exclusivamente no Node Video. Tire todas as suas dúvidas sobre keyframes, curvas e renderização.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "mb-a01",
        title: "Aula Extra - Fechar Primeiro Contrato",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=efbf47e5-be0d-4bce-a9b3-db83fa5b57b9",
        duration: "25:10",
        description: "Como estruturar seu portfólio comercial, abordar potenciais clientes e fechar seus primeiros projetos pagos de edição.",
        thumbnail: CAPA_PRETA
      }
    ]
  }
];

// ─────────────────────────────────────────────
// CURSO 2: 3D pelo Celular (masterclass)
// ─────────────────────────────────────────────
const TRES_D_MODULES: Module[] = [
  {
    id: "3d-modulo-1",
    title: "Módulo 1",
    subtitle: "Fundamentos e Ferramentas",
    videos: [
      {
        id: "3d-a01",
        title: "Aula 01 - O que vamos fazer",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=7666e8d8-bb2b-4d7b-a5c3-300a7cf675a0",
        duration: "--:--",
        description: "Visão geral da masterclass 3D pelo Celular. Entenda tudo o que você vai aprender e o que vai conseguir produzir ao final do curso.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "3d-a02",
        title: "Aula 02 - Quando utilizar 3D nos seus vídeos",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=806d41c7-4ed5-406c-9f1e-e1d57314db70",
        duration: "--:--",
        description: "Estratégia criativa: quando o 3D agrega valor real ao seu vídeo e quando é apenas complexidade desnecessária.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "3d-a03",
        title: "Aula 03 - O que é tracking? Conhecendo o NodeVideo pt1",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=4e0e0c61-191c-42d3-9789-6528b0195f6f",
        duration: "--:--",
        description: "Introdução ao conceito de tracking e primeiros passos na interface do NodeVideo para efeitos 3D.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "3d-a04",
        title: "Aula 04 - Conhecendo o NodeVideo pt2",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=375798fe-7556-46aa-9524-27f84ef88734",
        duration: "--:--",
        description: "Aprofundando na interface e ferramentas do NodeVideo essenciais para a criação de efeitos 3D no celular.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "3d-a05",
        title: "Aula 05 - Conhecendo o NodeVideo pt3",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=26a66b78-daf0-4627-88cb-b522ed3af717",
        duration: "--:--",
        description: "Continuação do tour pelo NodeVideo: nós avançados, camadas de composição e organização do projeto.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "3d-a06",
        title: "Aula 06 - Conhecendo o NodeVideo pt4",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=fc77df72-de0f-488a-b69d-fc6aee9d9116",
        duration: "--:--",
        description: "Últimos detalhes da interface do NodeVideo antes de entrar na parte prática dos efeitos 3D.",
        thumbnail: CAPA_VERDE
      }
    ]
  },
  {
    id: "3d-modulo-2",
    title: "Módulo 2",
    subtitle: "Tracking e Efeitos 3D",
    videos: [
      {
        id: "3d-a07",
        title: "Aula 07 - Tracking 3D da Cena",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=f506f4d8-89c4-4677-a7eb-8bc150a429bd",
        duration: "--:--",
        description: "Como fazer o tracking 3D de uma cena real pelo celular para ancorar elementos virtuais no espaço.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "3d-a08",
        title: "Aula 08 - Pontos Importantes sobre Tracking 3D",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=9e07551d-a33b-4c6d-ae9e-8dab7be86b18",
        duration: "--:--",
        description: "Dicas e cuidados para um tracking preciso: superfícies, iluminação, movimento de câmera e erros comuns.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "3d-a09",
        title: "Aula 09 - Texto em 3D pt1",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=820789dc-7826-4679-b0cc-092471096fa7",
        duration: "--:--",
        description: "Criando texto tridimensional ancorado em cenas reais: configuração inicial, tipografia e posicionamento.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "3d-a10",
        title: "Aula 10 - Texto em 3D pt2",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=a02f35a7-26f9-4a8b-8637-96d8dc38a807",
        duration: "--:--",
        description: "Refinando o texto 3D: iluminação, sombra projetada, perspectiva e integração realista com a cena.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "3d-a11",
        title: "Aula 11 - Aplicando Textura de Sombra em Texto 3D",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=63c9b10b-96c9-435e-9d05-c59aa7075cee",
        duration: "--:--",
        description: "Como adicionar textura e efeito de sombra no texto 3D para um resultado mais realista e premium.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "3d-a12",
        title: "Aula 12 - Vídeo em 3D pt1",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=091067c4-7800-4e52-b8db-a644803d77ba",
        duration: "--:--",
        description: "Inserindo vídeo em um espaço 3D: como projetar footage em planos tridimensionais rastreados na cena.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "3d-a13",
        title: "Aula 13 - Vídeo em 3D pt2",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=cfbce260-7e61-4840-89cb-f3cffe7ae79a",
        duration: "--:--",
        description: "Finalizando a técnica de vídeo em 3D com ajustes de perspectiva, cor e integração com a iluminação da cena.",
        thumbnail: CAPA_PRETA
      }
    ]
  },
  {
    id: "3d-modulo-3",
    title: "Módulo 3",
    subtitle: "Objetos 3D e Animação",
    videos: [
      {
        id: "3d-a14",
        title: "Aula 14 - Inserindo Objetos 3D",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=c8d7e011-9615-44bd-a359-b3c510967c55",
        duration: "--:--",
        description: "Como importar e inserir objetos 3D (.obj/.glb) no NodeVideo e ancorá-los em cenas rastreadas.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "3d-a15",
        title: "Aula 15 - Como baixar objetos 3D",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=e5670b0e-a539-4982-9d69-1ff59f5defc8",
        duration: "--:--",
        description: "Fontes gratuitas e pagas de modelos 3D para celular. Como encontrar, baixar e preparar para usar no NodeVideo.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "3d-a16",
        title: "Aula 16 - EXTRA: Efeito 3D sem a versão Pro",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=cfaa1ab3-77a8-4fde-8906-500813cc4b3f",
        duration: "--:--",
        description: "Aula bônus: como replicar efeitos 3D impressionantes sem precisar da versão paga do NodeVideo.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "3d-a17",
        title: "Aula 17 - Aplicando objeto 3D",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=36b56c9a-1e4c-4c95-92d6-c76c91034b64",
        duration: "--:--",
        description: "Prática completa de aplicação de objeto 3D na cena: escala, rotação, posicionamento e alinhamento com a perspectiva real.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "3d-a18",
        title: "Aula 18 - Erro de objeto 3D (Como resolver)",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=285602ef-a441-4e95-90b9-271e71eb933c",
        duration: "--:--",
        description: "Solucionando os erros mais comuns ao trabalhar com objetos 3D no NodeVideo.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "3d-a19",
        title: "Aula 19 - Textura e posição de objeto 3D",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=2a8fa816-0493-4fc9-a32f-c40f910b849f",
        duration: "--:--",
        description: "Como aplicar texturas personalizadas em objetos 3D e refinar seu posicionamento na cena para máximo realismo.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "3d-a20",
        title: "Aula 20 - Aplicando textura em objeto 3D",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=e3e8f760-7e35-43b0-83fc-3c30a6b49e26",
        duration: "--:--",
        description: "Tutorial avançado de texturização: mapeamento UV, materiais especulares e glossy no NodeVideo.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "3d-a21",
        title: "Aula 21 - Smartphone 3D com vídeo inserido",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=82350a67-4532-408c-b337-8157cb27b9fa",
        duration: "--:--",
        description: "Efeito premium: crie um mockup 3D de smartphone com vídeo real rodando na tela, integrado à cena.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "3d-a22",
        title: "Aula 22 - Sombras em elementos 3D",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=ee25c176-88f0-4d17-ad9f-d789ee5e3d17",
        duration: "--:--",
        description: "Como criar e ajustar sombras realistas em elementos 3D para integrá-los naturalmente à iluminação da cena.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "3d-a23",
        title: "Aula 23 - Sombra em elemento 3D pt2",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=87f2fecb-d023-4eb3-afbb-136fe5be655e",
        duration: "--:--",
        description: "Refinamento das sombras: suavidade, direção de luz, ambient occlusion e interação com o chão.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "3d-a24",
        title: "Aula 24 - Transformando imagem em objeto 3D",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=22e89a2b-9515-4dcd-ae14-40a1dffbbedd",
        duration: "--:--",
        description: "Técnica de depth mapping: como converter uma imagem 2D em um objeto 3D manipulável no NodeVideo.",
        thumbnail: CAPA_VERDE
      }
    ]
  },
  {
    id: "3d-modulo-4",
    title: "Módulo 4",
    subtitle: "Keyframes, FOOH e Encerramento",
    videos: [
      {
        id: "3d-a25",
        title: "Aula 25 - Keyframes (O que são)",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=d01a9cbc-8faa-4249-81eb-094d146463f2",
        duration: "--:--",
        description: "Conceito de keyframes aplicado ao 3D: como criar animações suaves e controladas frame a frame.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "3d-a26",
        title: "Aula 26 - Animação de objeto 3D pt1",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=433c807b-133a-4bc4-989c-b1c0216989f6",
        duration: "--:--",
        description: "Primeira parte da animação 3D: configurando keyframes de posição, rotação e escala ao longo do tempo.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "3d-a27",
        title: "Aula 27 - Animação de objeto 3D pt2",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=7a3d42a5-8622-4431-9838-94308097ffff",
        duration: "--:--",
        description: "Refinando a animação com curvas de easing para movimentos naturais e fluidos.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "3d-a28",
        title: "Aula 28 - Animação de objeto 3D pt3",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=7937e956-65fd-4431-8bdb-4d1b5d74fca7",
        duration: "--:--",
        description: "Finalização da sequência de animação 3D com exportação otimizada para redes sociais.",
        thumbnail: CAPA_VERDE
      },
      {
        id: "3d-a29",
        title: "Aula 29 - FOOH | Efeito da Bandeira",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=85d96eed-596d-4057-9f58-6f05f189aa65",
        duration: "--:--",
        description: "Fake Out Of Home (FOOH): criando o viral efeito de bandeira/outdoor 3D em cenas reais pelo NodeVideo.",
        thumbnail: CAPA_PRETA
      },
      {
        id: "3d-a30",
        title: "Aula 30 - FOOH | Efeito da Bandeira (Adicionando detalhes)",
        url: "",
        duration: "--:--",
        description: "Refinando o efeito FOOH com detalhes adicionais, física de tecido e integração de luz ambiente.",
        thumbnail: CAPA_VERDE,
        comingSoon: true
      },
      {
        id: "3d-a31",
        title: "Aula 31 - Tira dúvidas com alunos",
        url: "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=02ca1be3-3280-45b7-a747-f1f21102be64",
        duration: "--:--",
        description: "Sessão de perguntas e respostas ao vivo com os alunos cobrindo os pontos mais desafiadores da masterclass.",
        thumbnail: CAPA_PRETA
      }
    ]
  }
];

// ─────────────────────────────────────────────
// Export: lista de cursos estruturados
// ─────────────────────────────────────────────
export const ALL_COURSES: Course[] = [
  {
    id: "mobile-lab",
    title: "Mobile Lab",
    subtitle: "Curso Completo",
    description: "Do enquadramento à edição avançada: domine a criação profissional de vídeo usando apenas o celular.",
    badge: "3 Módulos + Bônus",
    modules: MOBILE_LAB_MODULES,
  },
  {
    id: "3d-pelo-celular",
    title: "3D pelo Celular",
    subtitle: "Masterclass",
    description: "Técnicas avançadas de tracking 3D, objetos virtuais, animação e efeitos FOOH no NodeVideo.",
    badge: "4 Módulos · 31 Aulas",
    modules: TRES_D_MODULES,
  }
];

// Backward-compat export for any code still referencing COURSES_DATA
export const COURSES_DATA: Module[] = [
  ...MOBILE_LAB_MODULES,
  ...TRES_D_MODULES,
];

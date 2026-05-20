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

const CAPA_PRETA = "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/capa%20preta.png?alt=media&token=edef280c-c34d-4642-b75d-397f560a07d1";
const CAPA_VERDE = "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/capa%20verde.png?alt=media&token=e5492d95-b4b6-40e2-828a-d60bf96eac6f";

export const COURSES_DATA: Module[] = [
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
        description: "Garantindo um visual simétrico e organized. Como alinhar elementos gráficos, textos e o próprio vídeo na tela do smartphone.",
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

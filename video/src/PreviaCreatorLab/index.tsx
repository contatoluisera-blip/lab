import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate, Easing } from 'remotion';
import { CosmicDust } from '../Apresentacao/CosmicDust';
import { MobilePhoneMockup } from '../Apresentacao/MobilePhoneMockup';
import { EstudoScreen } from './EstudoScreen';
import { DiagnosticoScreen } from './DiagnosticoScreen';
import { CalculadoraScreen } from './CalculadoraScreen';
import { OrcamentoScreen } from './OrcamentoScreen';
import { FinalCardsScreen } from './FinalCardsScreen';
import { PricingScreen } from './PricingScreen';
import { IntroScreen } from './IntroScreen';

const MainSequence: React.FC = () => {
  const { width: screenWidth, height: screenHeight, fps } = useVideoConfig();
  const scaleRatio = screenHeight / 3830;
  const phoneAreaWidth = 2160 * scaleRatio;
  const phoneAreaHeight = 3830 * scaleRatio;
  const frame = useCurrentFrame();

  const showOrcamento = frame >= fps * 35.8;

  // Animação de entrada (slide in da direita)
  const slideProgress = spring({
    frame,
    fps,
    config: {
      damping: 20,
      stiffness: 35,
      mass: 2
    }
  });

  // Movimento de deslize da direita para o centro
  const translateX = interpolate(slideProgress, [0, 1], [screenWidth / 2 + 800, 0]);

  // Rotação inicial de entrada
  const initialRotateY = interpolate(slideProgress, [0, 1], [45, -25]); // Mais inclinado para mostrar a lateral
  const initialRotateX = interpolate(slideProgress, [0, 1], [30, 15]);
  const initialRotateZ = interpolate(slideProgress, [0, 1], [-15, -8]);

  // Flutuação contínua lenta após a entrada
  const floatingY = Math.sin(frame / 90) * 4 * scaleRatio;
  const floatingX = Math.cos(frame / 110) * 3 * scaleRatio;
  const floatingYOffset = Math.sin(frame / 60) * 35 * scaleRatio; // Sobe e desce mais visível com o zoom
  // Zoom out de volta para mostrar o celular inteiro (segundo 9 ao 10)
  const zoomProgress = interpolate(
    frame,
    [fps * 9, fps * 10], // Entre 9s e 10s
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) }
  );

  // Flip de 360 graus após o zoom out (segundo 10 ao 12.5)
  // Pico de velocidade no início, terminando de forma lenta e suave -> Easing.out(Easing.cubic)
  const flipProgress = interpolate(
    frame,
    [fps * 10, fps * 12.5], 
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
  );

  const flipAngle = interpolate(flipProgress, [0, 1], [0, -360]); // Gira no eixo Y
  const showDiagnostico = flipProgress >= 0.5; // Troca de tela quando está de costas (180 deg)

  // O ângulo atual sem o zoomProgress
  const currentRotateY = initialRotateY + floatingY;
  const currentRotateX = initialRotateX + floatingX;
  const currentRotateZ = initialRotateZ; // initialRotateZ é interpolado do slide, no final é constante em -8

  // Durante o zoom out, queremos forçar todos os ângulos para 0 (mockup centralizado e reto)
  const baseRotateY = interpolate(zoomProgress, [0, 1], [currentRotateY, 0]);
  const baseRotateX = interpolate(zoomProgress, [0, 1], [currentRotateX, 0]);
  const baseRotateZ = interpolate(zoomProgress, [0, 1], [currentRotateZ, 0]);

  // Aplica o flip angle em cima do baseRotateY
  const rotateY = baseRotateY + flipAngle;
  const rotateX = baseRotateX;
  const rotateZ = baseRotateZ;

  // Zoom massivo para a tela de estudos (início no zoom)
  const scaleZoomIn = 6.8 * scaleRatio; 
  // Zoom out de volta para mostrar o celular inteiro (com tamanho agradável)
  const scale = interpolate(zoomProgress, [0, 1], [scaleZoomIn, 3.5 * scaleRatio]); 
  
  // Pan animation no segundo 4 para descer a câmera (mover o celular para cima e para a esquerda)
  const panProgress = interpolate(
    frame,
    [fps * 4, fps * 7.5], 
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) }
  );

  const panOffsetX = interpolate(panProgress, [0, 1], [0, -phoneAreaWidth * 0.4]);
  const panOffsetY = interpolate(panProgress, [0, 1], [0, -phoneAreaHeight * 0.35]);

  const slideX = interpolate(slideProgress, [0, 1], [screenWidth / 2 + 1500, phoneAreaWidth * 0.15]);
  const slideY = phoneAreaHeight * 0.15;

  // Posição no final do pan (segundo 7.5)
  const preZoomX = slideX + panOffsetX;
  const preZoomY = slideY + panOffsetY;

  // Quando fazemos o zoom out (zoomProgress), zeramos a translação para centralizar
  const focusTranslateX = interpolate(zoomProgress, [0, 1], [preZoomX, 0]);
  const focusTranslateY = interpolate(zoomProgress, [0, 1], [preZoomY, 0]);

  // --- ANIMAÇÕES DA TELA DE DIAGNÓSTICO (APÓS FLIP 360) ---
  // 1. Jump Zoom to Input Field (starts at 13s)
  const jumpZoomSpring = spring({ frame: frame - fps * 13, fps, config: { damping: 14, stiffness: 60 } });
  
  // 2. Pan Lateral acompanhando a digitação do nome (13.8s a 15.5s)
  const typingPanSpring = spring({ frame: frame - fps * 14.5, fps, config: { damping: 20, stiffness: 40 } });

  // 3. Zoom para focar no botão AUDITAR (starts at 16s)
  const buttonFocusSpring = spring({ frame: frame - fps * 16, fps, config: { damping: 16, stiffness: 45 } });

  // Posição de foco (ajustada para centralizar após a translação original)
  // (Removidas as declarações duplicadas)

  // 4. Jump Zoom Out para tela inteira após o clique (starts at 17.5s)
  const finalZoomOutSpring = spring({ frame: frame - fps * 17.5, fps, config: { damping: 16, stiffness: 50 } });

  // 5. 3D Perspective approach for Results (starts at 18.0s)
  const resultsPerspectiveSpring = spring({ frame: frame - fps * 18.0, fps, config: { damping: 20, stiffness: 35 } });
  
  // 6. Jump Zoom Out para tela da Calculadora (starts at 24.0s)
  const transitionToCalcSpring = spring({ frame: frame - fps * 24.0, fps, config: { damping: 16, stiffness: 50 } });

  // 7. Jump Zoom In na Calculadora (starts at 24.7s, parallel to elements entrance)
  const calcJumpZoomProgress = interpolate(
     frame,
     [fps * 24.7, fps * 26.7], // Movimento mais rápido (2 segundos)
     [0, 1],
     { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
  );

  // 8. Scroll Animation Progress (starts at 27.0s)
  const calcScrollProgress = interpolate(
     frame,
     [fps * 27.0, fps * 32.0], 
     [0, 1],
     { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) }
  );

  // Transição de fade out/in da tela durante o flip 360 (10s a 12.5s) e durante transição para Calculadora (24.0 a 25.0)
  const contentFadeOut = interpolate(frame, [fps * 10, fps * 10.8], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const contentFadeIn = interpolate(frame, [fps * 11.2, fps * 12.5], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  
  const calcFadeOut = interpolate(frame, [fps * 24.0, fps * 24.3], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const calcFadeIn = interpolate(frame, [fps * 24.5, fps * 25.0], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  let screenOpacity = 1;
  if (frame < fps * 11) screenOpacity = contentFadeOut;
  else if (frame < fps * 24.0) screenOpacity = contentFadeIn;
  else if (frame < fps * 24.4) screenOpacity = calcFadeOut;
  else screenOpacity = calcFadeIn;

  // (showDiagnostico já declarado no topo)
  const showCalculadora = frame >= fps * 24.4;

  // Calcular posições finais sobrepondo as fases em formato de state machine
  let finalScale = scale;
  let finalX = focusTranslateX;
  let finalY = focusTranslateY + floatingYOffset;
  let finalRotateX = rotateX;
  let finalRotateY = rotateY;
  let finalRotateZ = rotateZ;

  if (frame >= fps * 10) {
     // Apply Jump Zoom (Aggressive focus on the text field)
     finalScale = interpolate(jumpZoomSpring, [0, 1], [3.5 * scaleRatio, 8.0 * scaleRatio]);
     // Input starts slightly to the left, move right
     finalX = interpolate(jumpZoomSpring, [0, 1], [0, 640 * scaleRatio]);
     // Reduce positive Y to bring the box higher up into the dead center
     finalY = interpolate(jumpZoomSpring, [0, 1], [floatingYOffset, 450 * scaleRatio + floatingYOffset]);
     
     // Apply Typing Pan (moves screen left to keep cursor centered as it types)
     finalX = interpolate(typingPanSpring, [0, 1], [finalX, 240 * scaleRatio]);
     
     // Apply Button Focus
     // Diminuir o retorno de escala (ficar mais em plano detalhe) -> 6.0
     finalScale = interpolate(buttonFocusSpring, [0, 1], [finalScale, 6.0 * scaleRatio]);
     finalX = interpolate(buttonFocusSpring, [0, 1], [finalX, 0]);
     // Movimentar agressivamente para cima (Y negativo) para revelar o botão
     finalY = interpolate(buttonFocusSpring, [0, 1], [finalY, -1300 * scaleRatio + floatingYOffset]);

     // Apply Final Zoom Out after click
     finalScale = interpolate(finalZoomOutSpring, [0, 1], [finalScale, 3.5 * scaleRatio]);
     finalX = interpolate(finalZoomOutSpring, [0, 1], [finalX, 0]);
     finalY = interpolate(finalZoomOutSpring, [0, 1], [finalY, floatingYOffset]);

     // Apply 3D Perspective Approach for Results
     finalScale = interpolate(resultsPerspectiveSpring, [0, 1], [finalScale, 5.0 * scaleRatio]);
     finalRotateX += interpolate(resultsPerspectiveSpring, [0, 1], [0, 25]); // Foco inicial de cima para baixo (como estava antes)
     finalRotateY += interpolate(resultsPerspectiveSpring, [0, 1], [0, -15]); // Tilt right
     finalX = interpolate(resultsPerspectiveSpring, [0, 1], [finalX, -100 * scaleRatio]); // Adjust pan
     // Move down slightly so the top of the screen is well visible
     finalY = interpolate(resultsPerspectiveSpring, [0, 1], [finalY, 200 * scaleRatio + floatingYOffset]); 

     // Apply Perspective Shift during scroll
     const scrollPerspectiveProgress = interpolate(
       frame,
       [fps * 19.5, fps * 23.5], // Termina o scroll antes da nova transição
       [0, 1],
       { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.exp) }
     );
     // Vai do olhar de cima para baixo (+25) para o ângulo hero (-20)
     finalRotateX += interpolate(scrollPerspectiveProgress, [0, 1], [0, -45]);
     // Ajuste em Y suave para compensar o pivot
     finalY += interpolate(scrollPerspectiveProgress, [0, 1], [0, 100 * scaleRatio]);
     // Jump Zoom: a câmera se aproxima significativamente durante a rolagem para detalhar os cards
     finalScale += interpolate(scrollPerspectiveProgress, [0, 1], [0, 2.0 * scaleRatio]);
  }

  // Final Transition to Calculadora
  if (frame >= fps * 24.0) {
     finalScale = interpolate(transitionToCalcSpring, [0, 1], [finalScale, 3.5 * scaleRatio]);
     finalRotateX = interpolate(transitionToCalcSpring, [0, 1], [finalRotateX, 0]);
     finalRotateY = interpolate(transitionToCalcSpring, [0, 1], [finalRotateY, 0]);
     finalX = interpolate(transitionToCalcSpring, [0, 1], [finalX, 0]);
     finalY = interpolate(transitionToCalcSpring, [0, 1], [finalY, floatingYOffset]);
  }

  // Jump Zoom na Calculadora
  if (frame >= fps * 24.7) {
     finalScale = interpolate(calcJumpZoomProgress, [0, 1], [finalScale, 7.5 * scaleRatio]);
     finalRotateX = interpolate(calcJumpZoomProgress, [0, 1], [finalRotateX, 15]); 
     finalRotateY = interpolate(calcJumpZoomProgress, [0, 1], [finalRotateY, 25]); // Rotação no sentido oposto (olhando pela esquerda)
     finalRotateZ = interpolate(calcJumpZoomProgress, [0, 1], [finalRotateZ, 10]); // Variação do Z invertida e restaurada ao valor anterior
     
     // Move o celular para a direita (X positivo) para que a margem esquerda (onde o texto começa) não corte. Aumentado para ver a borda.
     finalX = interpolate(calcJumpZoomProgress, [0, 1], [finalX, 380 * scaleRatio]);
     // Move o celular para baixo (Y positivo) para focar no topo
     finalY = interpolate(calcJumpZoomProgress, [0, 1], [finalY, 550 * scaleRatio + floatingYOffset]); 

     // Animação de Scroll (enquadrando parte direita inferior)
     finalX += interpolate(calcScrollProgress, [0, 1], [0, -400 * scaleRatio]); // Move celular para a esquerda para revelar a borda direita
     finalY += interpolate(calcScrollProgress, [0, 1], [0, -650 * scaleRatio]); // Move celular para cima para revelar parte inferior
     finalRotateX += interpolate(calcScrollProgress, [0, 1], [0, -20]); // Muda ângulo para olhar de baixo para cima
     
     // Leve zoom contínuo a partir de 29s para não deixar a imagem estática
     const continuousZoomProgress = interpolate(frame, [fps * 29.0, fps * 35.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
     finalScale += interpolate(continuousZoomProgress, [0, 1], [0, 1.2 * scaleRatio]); // Ganho leve de escala
  }

  // Final Transition to Orcamento (Recenter phone and zoom slightly)
  if (frame >= fps * 35.5) {
     const orcamentoProgress = interpolate(frame, [fps * 35.5, fps * 36.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) });
     
     // Zoom out so the phone doesn't fill the whole frame, e.g. finalScale = 3.5
     finalScale = interpolate(orcamentoProgress, [0, 1], [finalScale, 3.5 * scaleRatio]);
     finalX = interpolate(orcamentoProgress, [0, 1], [finalX, 0]);
     finalY = interpolate(orcamentoProgress, [0, 1], [finalY, floatingYOffset]);
     finalRotateX = interpolate(orcamentoProgress, [0, 1], [finalRotateX, 0]);
     finalRotateY = interpolate(orcamentoProgress, [0, 1], [finalRotateY, 0]);
     finalRotateZ = interpolate(orcamentoProgress, [0, 1], [finalRotateZ, 0]);
     
     // Hero shot camera movement while scrolling
     // Jump zoom agudo com curva de velocidade acentuada iniciando no segundo 36.14
     const orcamentoHeroProgress = interpolate(frame, [fps * 36.14, fps * 41.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.exp) });
     
     // Tilts camera to look from bottom up (hero shot) - intensidade aumentada
     finalRotateX += interpolate(orcamentoHeroProgress, [0, 1], [0, -40]);
     
     // Sharp jump zoom
     finalScale += interpolate(orcamentoHeroProgress, [0, 1], [0, 4.0 * scaleRatio]);
     
     // Ajusta Y para garantir que o rodapé da tela fique visível
     finalY += interpolate(orcamentoHeroProgress, [0, 1], [0, -40 * scaleRatio]);
  }

  // Saída do Celular (starts at 41.5s)
  if (frame >= fps * 41.5) {
     const phoneExitProgress = interpolate(frame, [fps * 41.5, fps * 42.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) });
     
     // Joga a tela pra baixo para fora do frame (aumentado para 4500 devido à escala massiva)
     finalY += interpolate(phoneExitProgress, [0, 1], [0, 4500 * scaleRatio]);
  }

  return (
    <AbsoluteFill style={{ perspective: '4000px', overflow: 'hidden' }}>
      {/* Cards Finais renderizados atrás do celular */}
      <FinalCardsScreen frame={frame} fps={fps} />

      {/* Planos de Preços (Carrossel) */}
      <PricingScreen frame={frame} fps={fps} />

      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        
        {/* O Container agora apenas move a posição (translate) e a escala. 
            A ROTAÇÃO DEVE ACONTECER DENTRO DO WEBGL no MobilePhoneMockup! */}
        <div 
          style={{
            transform: `translate3d(${finalX}px, ${finalY}px, 0) scale3d(${finalScale}, ${finalScale}, 1)`,
            willChange: 'transform'
          }}
        >
          <MobilePhoneMockup 
             rotationX={finalRotateX * Math.PI / 180} 
             rotationY={finalRotateY * Math.PI / 180} 
             rotationZ={finalRotateZ * Math.PI / 180}
             screenOpacity={screenOpacity}
          >
             {showOrcamento ? (
                <OrcamentoScreen frame={frame} fps={fps} />
            ) : showCalculadora ? (
                <CalculadoraScreen frame={frame} fps={fps} />
            ) : showDiagnostico ? (
                <DiagnosticoScreen frame={frame} fps={fps} />
            ) : (
                <EstudoScreen frame={frame} fps={fps} />
            )} </MobilePhoneMockup>
        </div>

      </AbsoluteFill>
    </AbsoluteFill>
  );
};

import { Sequence } from 'remotion';

export const PreviaCreatorLab: React.FC = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Opacidade do brilho cresce de 0 a 1 nos primeiros 5 segundos (fps * 5)
  const ambientLightOpacity = interpolate(
    frame,
    [0, fps * 5],
    [0, 1],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#050505' }}>
        {/* Background cósmico rolando continuamente desde o frame 0 */}
        <AbsoluteFill style={{ zIndex: 0 }}>
            <CosmicDust />
        </AbsoluteFill>

        {/* Luz ambiente global que destaca o 3D (agora aparece suavemente) */}
        <div 
          style={{ 
            position: 'absolute', 
            top: '0%', 
            right: '0%', 
            width: '1000px', 
            height: '1000px', 
            background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', 
            filter: 'blur(100px)',
            opacity: ambientLightOpacity,
            zIndex: 0
          }} 
        />

        {/* Intro Screen de 7 segundos (mantém logo enquanto o celular cobre) */}
        <Sequence from={0} durationInFrames={fps * 7}>
            <IntroScreen fps={fps} />
        </Sequence>

        {/* Main Sequence rodando após 5 segundos de intro */}
        <Sequence from={fps * 5}>
            <MainSequence />
        </Sequence>
    </AbsoluteFill>
  );
};

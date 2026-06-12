import { AbsoluteFill, Sequence } from "remotion";
import { Fase1 } from "./Fase1";
import { Fase2 } from "./Fase2";
import { Fase3 } from "./Fase3";
import { CosmicDust } from "./CosmicDust";
import { EstudoScreen } from "./EstudoScreen";
import { IaQuestionScreen } from "./IaQuestionScreen";
import { CallToActionScreen } from "./CallToActionScreen";

export const Apresentacao: React.FC = () => {
  return (
    <AbsoluteFill className="bg-[var(--color-background)] text-white font-sans overflow-hidden">
      {/* 4K Upscaler Wrapper */}
      <div style={{ transform: 'scale(2)', transformOrigin: 'top left', width: '1920px', height: '1080px' }}>
        <CosmicDust />
        
        <Sequence from={0} durationInFrames={300}>
          <Fase1 />
        </Sequence>

        <Sequence from={270} durationInFrames={450}>
          <Fase2 />
        </Sequence>

        <Sequence from={608} durationInFrames={652}>
          <Fase3 />
        </Sequence>

        <Sequence from={1260} durationInFrames={300}>
          <IaQuestionScreen />
        </Sequence>

        <Sequence from={1560} durationInFrames={380}>
          <EstudoScreen />
        </Sequence>

        <Sequence from={1940} durationInFrames={300}>
          <CallToActionScreen />
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};

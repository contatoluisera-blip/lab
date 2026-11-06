import React from 'react';
import { Composition } from 'remotion';
import { MONTAGEM_FPS, edlDurationFrames, emptyEdl, formatSize } from '../lib/montagem';
import { Montagem, MontagemProps } from './Montagem';

// Projeto Remotion publicado na AWS (npm run video:deploy). O tamanho e a duração
// saem do plano recebido, então a mesma composição serve a todos os formatos.
export const RemotionRoot: React.FC = () => (
  <Composition
    id="Montagem"
    component={Montagem}
    fps={MONTAGEM_FPS}
    width={1080}
    height={1920}
    durationInFrames={MONTAGEM_FPS}
    defaultProps={{ edl: { ...emptyEdl('9:16'), endCard: { enabled: true, title: 'Creator Lab', subtitle: 'Montagem de vídeo' } }, sources: {} } as MontagemProps}
    calculateMetadata={({ props }) => {
      const size = formatSize(props.edl.format);
      return { width: size.width, height: size.height, durationInFrames: edlDurationFrames(props.edl) };
    }}
  />
);

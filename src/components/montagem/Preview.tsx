'use client';

import React from 'react';
import { Player } from '@remotion/player';
import { Montagem } from '@/remotion/Montagem';
import { Edl, MONTAGEM_FPS, edlDurationFrames, formatSize } from '@/lib/montagem';

/** Prévia em tempo real: a mesma composição do render final, tocada no navegador (sem custo). */
export default function Preview({ edl, sources }: { edl: Edl; sources: Record<string, string> }) {
  const size = formatSize(edl.format);
  return (
    <Player
      component={Montagem}
      inputProps={{ edl, sources }}
      durationInFrames={edlDurationFrames(edl)}
      fps={MONTAGEM_FPS}
      compositionWidth={size.width}
      compositionHeight={size.height}
      controls
      acknowledgeRemotionLicense
      style={{ width: '100%', aspectRatio: `${size.width} / ${size.height}`, borderRadius: 16, overflow: 'hidden', background: '#000' }}
    />
  );
}

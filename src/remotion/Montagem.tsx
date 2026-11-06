import React from 'react';
import { AbsoluteFill, OffthreadVideo, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { END_CARD_FRAMES, Edl, EdlClip, TextPosition, clipFrames, transitionFramesAt } from '../lib/montagem';

// Composição da Montagem: o único código que desenha o vídeo final.
// A prévia (@remotion/player) e o render (AWS Lambda) usam esta mesma composição com os mesmos dados.
// `sources` liga o id de cada geração ao link do arquivo (assinado pelo servidor no render).

export interface MontagemProps {
  edl: Edl;
  sources: Record<string, string>;
  [key: string]: unknown;
}

const BRAND = { bg: '#050807', accent: '#34d399', text: '#ffffff' };

function Caption({ text, position }: { text: string; position: TextPosition }) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const justify = position === 'top' ? 'flex-start' : position === 'center' ? 'center' : 'flex-end';
  return (
    <AbsoluteFill style={{ justifyContent: justify, alignItems: 'center', padding: width * 0.07, paddingBottom: position === 'bottom' ? width * 0.22 : width * 0.07 }}>
      <div style={{
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [24, 0])}px)`,
        background: 'rgba(0,0,0,0.55)',
        color: BRAND.text,
        fontFamily: 'Inter, Helvetica, Arial, sans-serif',
        fontWeight: 800,
        fontSize: width * 0.056,
        lineHeight: 1.18,
        textAlign: 'center',
        padding: `${width * 0.02}px ${width * 0.04}px`,
        borderRadius: width * 0.025,
        maxWidth: '100%',
      }}>
        {text}
      </div>
    </AbsoluteFill>
  );
}

function Clip({ clip, src }: { clip: EdlClip; src?: string }) {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {src ? (
        <OffthreadVideo
          src={src}
          trimBefore={clip.trimStart}
          muted={clip.muted}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : null}
      {clip.text ? <Caption text={clip.text} position={clip.textPosition} /> : null}
    </AbsoluteFill>
  );
}

function EndCard({ title, subtitle }: { title: string; subtitle: string }) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.bg, justifyContent: 'center', alignItems: 'center', padding: width * 0.08 }}>
      <div style={{ opacity: enter, transform: `scale(${interpolate(enter, [0, 1], [0.94, 1])})`, textAlign: 'center', fontFamily: 'Inter, Helvetica, Arial, sans-serif' }}>
        <div style={{ width: width * 0.12, height: width * 0.012, background: BRAND.accent, borderRadius: 99, margin: '0 auto', marginBottom: width * 0.05 }} />
        <div style={{ color: BRAND.text, fontWeight: 900, fontSize: width * 0.075, lineHeight: 1.1 }}>{title}</div>
        {subtitle ? <div style={{ color: BRAND.accent, fontWeight: 600, fontSize: width * 0.042, marginTop: width * 0.035 }}>{subtitle}</div> : null}
      </div>
    </AbsoluteFill>
  );
}

export const Montagem: React.FC<MontagemProps> = ({ edl, sources }) => {
  const items: React.ReactNode[] = [];
  edl.clips.forEach((clip, i) => {
    const overlap = transitionFramesAt(edl, i);
    if (overlap > 0) {
      items.push(
        <TransitionSeries.Transition
          key={`t-${clip.id}`}
          presentation={clip.transition === 'slide' ? slide({ direction: 'from-right' }) : fade()}
          timing={linearTiming({ durationInFrames: overlap })}
        />
      );
    }
    items.push(
      <TransitionSeries.Sequence key={clip.id} durationInFrames={clipFrames(clip)}>
        <Clip clip={clip} src={sources[clip.jobId]} />
      </TransitionSeries.Sequence>
    );
  });
  if (edl.endCard.enabled) {
    items.push(
      <TransitionSeries.Sequence key="end" durationInFrames={END_CARD_FRAMES}>
        <EndCard title={edl.endCard.title || ' '} subtitle={edl.endCard.subtitle} />
      </TransitionSeries.Sequence>
    );
  }
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <TransitionSeries>{items}</TransitionSeries>
    </AbsoluteFill>
  );
};

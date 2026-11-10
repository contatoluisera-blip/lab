import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { END_CARD_FRAMES, Edl, EdlClip, LetteringSize, TextPosition, clipFrames, letteringPlace, letteringSourceKey, transitionFramesAt } from '../lib/montagem';
import type { EdlStyle } from '../lib/brand';
import { FONTS } from './fonts';

// Composição da Montagem: o único código que desenha o vídeo final.
// A prévia (@remotion/player) e o render (AWS Lambda) usam esta mesma composição com os mesmos dados.
// `sources` liga o id de cada geração ao link do arquivo (assinado pelo servidor no render).

export interface MontagemProps {
  edl: Edl;
  sources: Record<string, string>;
  [key: string]: unknown;
}

const BRAND = { bg: '#050807', accent: '#34d399', text: '#ffffff' };
const LETTERING_WIDTH: Record<LetteringSize, number> = { s: 0.34, m: 0.62, l: 0.86 };

const fontOf = (style?: EdlStyle | null) => (style ? FONTS[style.fontId] : null) || { family: 'Inter, Helvetica, Arial, sans-serif', weight: 800 };

function Lettering({ src, position, size }: { src: string; position: TextPosition; size: LetteringSize }) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const justify = position === 'top' ? 'flex-start' : position === 'center' ? 'center' : 'flex-end';
  return (
    <AbsoluteFill style={{ justifyContent: justify, alignItems: 'center', padding: width * 0.07, paddingTop: position === 'top' ? height * 0.1 : width * 0.07, paddingBottom: position === 'bottom' ? width * 0.22 : width * 0.07 }}>
      <Img src={src} style={{ width: width * LETTERING_WIDTH[size], maxHeight: height * 0.36, objectFit: 'contain', opacity: enter, transform: `scale(${interpolate(enter, [0, 1], [0.9, 1])})` }} />
    </AbsoluteFill>
  );
}

function Caption({ text, position, style }: { text: string; position: TextPosition; style?: EdlStyle | null }) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const justify = position === 'top' ? 'flex-start' : position === 'center' ? 'center' : 'flex-end';
  const font = fontOf(style);
  const box = style ? style.boxColor : 'rgba(0,0,0,0.55)';
  return (
    <AbsoluteFill style={{ justifyContent: justify, alignItems: 'center', padding: width * 0.07, paddingBottom: position === 'bottom' ? width * 0.22 : width * 0.07 }}>
      <div style={{
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [24, 0])}px)`,
        background: box || 'transparent',
        color: style?.textColor || BRAND.text,
        fontFamily: font.family,
        fontWeight: font.weight,
        textShadow: box ? undefined : `0 ${width * 0.003}px ${width * 0.016}px rgba(0,0,0,0.75)`,
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

function Clip({ clip, src, letteringSrc, style }: { clip: EdlClip; src?: string; letteringSrc?: string; style?: EdlStyle | null }) {
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
      {letteringSrc ? <Lettering src={letteringSrc} position={letteringPlace(clip)} size={clip.letteringSize || 'm'} /> : null}
      {clip.text ? <Caption text={clip.text} position={clip.textPosition} style={style} /> : null}
    </AbsoluteFill>
  );
}

function EndCard({ title, subtitle, letteringSrc, style }: { title: string; subtitle: string; letteringSrc?: string; style?: EdlStyle | null }) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const font = fontOf(style);
  const accent = style?.endAccent || BRAND.accent;
  return (
    <AbsoluteFill style={{ backgroundColor: style?.background || BRAND.bg, justifyContent: 'center', alignItems: 'center', padding: width * 0.08 }}>
      <div style={{ opacity: enter, transform: `scale(${interpolate(enter, [0, 1], [0.94, 1])})`, textAlign: 'center', fontFamily: font.family }}>
        {letteringSrc
          ? <Img src={letteringSrc} style={{ width: width * 0.62, maxHeight: width * 0.5, objectFit: 'contain', display: 'block', margin: '0 auto', marginBottom: title.trim() ? width * 0.06 : 0 }} />
          : <div style={{ width: width * 0.12, height: width * 0.012, background: accent, borderRadius: 99, margin: '0 auto', marginBottom: width * 0.05 }} />}
        <div style={{ color: style?.endText || BRAND.text, fontWeight: style ? font.weight : 900, fontSize: width * 0.075, lineHeight: 1.1 }}>{title}</div>
        {subtitle ? <div style={{ color: accent, fontWeight: style ? font.weight : 600, fontSize: width * 0.042, marginTop: width * 0.035 }}>{subtitle}</div> : null}
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
        <Clip clip={clip} src={sources[clip.jobId]} letteringSrc={clip.letteringId ? sources[letteringSourceKey(clip.letteringId)] : undefined} style={edl.style} />
      </TransitionSeries.Sequence>
    );
  });
  if (edl.endCard.enabled) {
    items.push(
      <TransitionSeries.Sequence key="end" durationInFrames={END_CARD_FRAMES}>
        <EndCard title={edl.endCard.title || ' '} subtitle={edl.endCard.subtitle} letteringSrc={edl.endCard.letteringId ? sources[letteringSourceKey(edl.endCard.letteringId)] : undefined} style={edl.style} />
      </TransitionSeries.Sequence>
    );
  }
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <TransitionSeries>{items}</TransitionSeries>
    </AbsoluteFill>
  );
};

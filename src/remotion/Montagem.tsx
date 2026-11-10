import React from 'react';
import { AbsoluteFill, Audio, Img, Loop, OffthreadVideo, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { pushCut } from '@remotion/transitions/push-cut';
import { flip } from '@remotion/transitions/flip';
import { iris } from '@remotion/transitions/iris';
import { ClipMotion, END_CARD_FRAMES, Edl, EdlClip, LetteringSize, TextAnim, TextPosition, TransitionKind, clipFrames, clipStartFrames, edlClipsFrames, letteringPlace, letteringSourceKey, musicSourceKey, transitionFramesAt } from '../lib/montagem';
import { VOICE_LEAD_FRAMES, VoiceWord, voiceSourceKey } from '../lib/voice';
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

/** Quanto do texto aparece no quadro atual (palavra por palavra e máquina de escrever). */
function revealed(text: string, anim: TextAnim, frame: number, fps: number, frames: number) {
  if (anim === 'words') {
    const words = text.split(' ');
    const per = Math.max(3, Math.min(fps * 0.35, (frames * 0.6) / words.length));
    return words.slice(0, Math.min(words.length, Math.floor(frame / per) + 1)).join(' ');
  }
  if (anim === 'typewriter') {
    const per = Math.max(1, Math.min(3, (frames * 0.5) / text.length));
    return text.slice(0, Math.min(text.length, Math.floor(frame / per) + 1));
  }
  return text;
}

function Caption({ text, position, style, anim = 'rise', frames }: { text: string; position: TextPosition; style?: EdlStyle | null; anim?: TextAnim; frames: number }) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const enter = spring({ frame, fps, config: anim === 'pop' ? { damping: 9, stiffness: 160 } : { damping: 200 } });
  const shown = revealed(text, anim, frame, fps, frames);
  const motion = anim === 'pop'
    ? `scale(${interpolate(enter, [0, 1], [0.6, 1])})`
    : anim === 'rise' ? `translateY(${interpolate(enter, [0, 1], [24, 0])}px)` : 'none';
  const justify = position === 'top' ? 'flex-start' : position === 'center' ? 'center' : 'flex-end';
  const font = fontOf(style);
  const box = style ? style.boxColor : 'rgba(0,0,0,0.55)';
  return (
    <AbsoluteFill style={{ justifyContent: justify, alignItems: 'center', padding: width * 0.07, paddingBottom: position === 'bottom' ? width * 0.22 : width * 0.07 }}>
      <div style={{
        opacity: anim === 'words' || anim === 'typewriter' ? 1 : Math.min(1, enter * 1.4),
        transform: motion,
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
        {/* Texto completo invisível reserva o espaço: a caixa não muda de tamanho enquanto as palavras entram. */}
        {shown === text ? text : <><span>{shown}</span><span style={{ visibility: 'hidden' }}>{text.slice(shown.length)}</span></>}
      </div>
    </AbsoluteFill>
  );
}

/** Zoom e pan sobre o vídeo, ao longo do clipe (o "Ken Burns" dos editores). */
function motionTransform(motion: ClipMotion | undefined, frame: number, frames: number, fps: number) {
  const t = Math.min(1, frame / Math.max(1, frames - 1));
  switch (motion) {
    case 'zoom-in': return `scale(${interpolate(t, [0, 1], [1, 1.14])})`;
    case 'zoom-out': return `scale(${interpolate(t, [0, 1], [1.14, 1])})`;
    case 'pan-left': return `scale(1.12) translateX(${interpolate(t, [0, 1], [4, -4])}%)`;
    case 'pan-right': return `scale(1.12) translateX(${interpolate(t, [0, 1], [-4, 4])}%)`;
    case 'punch-in': {
      const hit = spring({ frame: frame - Math.floor(frames * 0.45), fps, config: { damping: 14, stiffness: 220 } });
      return `scale(${interpolate(hit, [0, 1], [1, 1.22])})`;
    }
    default: return undefined;
  }
}

function Clip({ clip, src, letteringSrc, style, captions }: { clip: EdlClip; src?: string; letteringSrc?: string; style?: EdlStyle | null; captions?: boolean }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const transform = motionTransform(clip.motion, frame, clipFrames(clip), fps);
  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
      {src ? (
        <AbsoluteFill style={{ transform, transformOrigin: 'center center' }}>
          <OffthreadVideo
            src={src}
            trimBefore={clip.trimStart}
            muted={clip.muted}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </AbsoluteFill>
      ) : null}
      {letteringSrc ? <Lettering src={letteringSrc} position={letteringPlace(clip)} size={clip.letteringSize || 'm'} /> : null}
      {/* Com legenda da locução embaixo, o texto do clipe sobe para não colidir. */}
      {clip.text ? <Caption text={clip.text} position={captions && clip.textPosition === 'bottom' ? 'top' : clip.textPosition} style={style} anim={clip.textAnim} frames={clipFrames(clip)} /> : null}
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

const WATERMARK_WIDTH: Record<LetteringSize, number> = { s: 0.16, m: 0.24, l: 0.34 };

/** Marca d'água no canto, durante as cenas: imagem ou vídeo em loop (com transparência, se o arquivo tiver). */
function Watermark({ mark, src }: { mark: NonNullable<Edl['watermark']>; src: string }) {
  const { width } = useVideoConfig();
  const margin = width * 0.05;
  const box: React.CSSProperties = {
    position: 'absolute', width: width * WATERMARK_WIDTH[mark.size], opacity: mark.opacity,
    [mark.corner[0] === 't' ? 'top' : 'bottom']: margin, [mark.corner[1] === 'l' ? 'left' : 'right']: margin,
  };
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {mark.type === 'video' && mark.frames > 0 ? (
        <Loop durationInFrames={mark.frames}>
          <AbsoluteFill>
            <OffthreadVideo src={src} muted transparent style={{ ...box, height: 'auto', objectFit: 'contain' }} />
          </AbsoluteFill>
        </Loop>
      ) : (
        <Img src={src} style={{ ...box, height: 'auto', objectFit: 'contain' }} />
      )}
    </AbsoluteFill>
  );
}

/** Vinheta final: o vídeo inteiro, enquadrado sem cortar, com o áudio dele. */
function Outro({ src, muted, background }: { src: string; muted: boolean; background: string }) {
  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      <OffthreadVideo src={src} muted={muted} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </AbsoluteFill>
  );
}

/** Trilha sob o vídeo todo: entra em 0,5 s, repete se for curta e some no último 1,5 s. */
function Music({ src, volume, speech, duck }: { src: string; volume: number; speech: [number, number][]; duck: number }) {
  const { fps, durationInFrames } = useVideoConfig();
  // Abaixa a trilha enquanto há fala, com rampa de ~0,2 s nas bordas de cada trecho.
  const ramp = Math.round(fps * 0.2);
  const ducking = (f: number) => {
    let level = 1;
    for (const [a, b] of speech) {
      const k = f < a ? (a - f) / ramp : f > b ? (f - b) / ramp : 0;
      level = Math.min(level, duck + (1 - duck) * Math.min(1, Math.max(0, k)));
    }
    return level;
  };
  return (
    <Audio src={src} loop volume={f => ducking(f) * (durationInFrames < fps * 3 ? volume
      : volume * interpolate(f, [0, fps * 0.5, durationInFrames - fps * 1.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))} />
  );
}

/** Bloco de legenda (início e fim) que contém a palavra `i`. */
export function captionGroup(words: VoiceWord[], i: number): [number, number] {
  let sentenceStart = 0;
  for (let k = 0; k < words.length; k++) {
    const endsSentence = /[.!?…]$/.test(words[k].w) || k === words.length - 1;
    if (!endsSentence) continue;
    if (i <= k) {
      const n = k - sentenceStart + 1;
      const chunks = Math.ceil(n / 4);
      const size = Math.ceil(n / chunks);
      const g = Math.floor((i - sentenceStart) / size);
      const a = sentenceStart + g * size;
      return [a, Math.min(k + 1, a + size)];
    }
    sentenceStart = k + 1;
  }
  return [i, i + 1];
}

/**
 * Legenda da locução, palavra por palavra: mostra o bloco de até 4 palavras da fala atual
 * e destaca a palavra que está sendo dita.
 */
function VoiceCaption({ words, style }: { words: VoiceWord[]; style?: EdlStyle | null }) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = frame / fps;
  const i = words.findIndex(w => t < w.e);
  if (i < 0 || t < words[0].s - 0.05) return null;
  // Blocos equilibrados de até 4 palavras dentro de cada frase (5 palavras → 3 + 2).
  const [start, end] = captionGroup(words, i);
  const group = words.slice(start, end);
  const font = fontOf(style);
  const accent = style?.endAccent || '#facc15';
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', padding: width * 0.07, paddingBottom: width * 0.24 }}>
      <div style={{ textAlign: 'center', fontFamily: font.family, fontWeight: 900, fontSize: width * 0.068, lineHeight: 1.15, textTransform: 'uppercase',
        textShadow: `0 ${width * 0.004}px ${width * 0.02}px rgba(0,0,0,0.85)`, WebkitTextStroke: `${width * 0.002}px rgba(0,0,0,0.6)` }}>
        {group.map((w, k) => {
          const active = start + k === i && t >= w.s;
          return (
            <span key={k} style={{ color: active ? accent : style?.textColor || '#fff', display: 'inline-block', margin: `0 ${width * 0.01}px`,
              transform: active ? 'scale(1.08)' : undefined }}>{w.w}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function presentationFor(kind: TransitionKind, width: number, height: number) {
  switch (kind) {
    case 'slide': return slide({ direction: 'from-right' });
    case 'wipe': return wipe({ direction: 'from-left' });
    case 'push': return pushCut({ flashColor: '#ffffff', flashOpacity: 0.55 });
    case 'flip': return flip({ direction: 'from-right' });
    case 'iris': return iris({ width, height });
    default: return fade();
  }
}

export const Montagem: React.FC<MontagemProps> = ({ edl, sources }) => {
  const { width, height } = useVideoConfig();
  const items: React.ReactNode[] = [];
  edl.clips.forEach((clip, i) => {
    const overlap = transitionFramesAt(edl, i);
    if (overlap > 0) {
      items.push(
        <TransitionSeries.Transition
          key={`t-${clip.id}`}
          presentation={presentationFor(clip.transition, width, height) as ReturnType<typeof fade>}
          timing={linearTiming({ durationInFrames: overlap })}
        />
      );
    }
    items.push(
      <TransitionSeries.Sequence key={clip.id} durationInFrames={clipFrames(clip)}>
        <Clip clip={clip} src={sources[clip.jobId]} letteringSrc={clip.letteringId ? sources[letteringSourceKey(clip.letteringId)] : undefined} style={edl.style}
          captions={!!edl.voice?.captions && !!edl.voice.track?.some(v => v.clipId === clip.id)} />
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
  const outroSrc = edl.outro ? sources[letteringSourceKey(edl.outro.assetId)] : undefined;
  if (edl.outro && outroSrc) {
    items.push(
      <TransitionSeries.Sequence key="outro" durationInFrames={edl.outro.frames}>
        <Outro src={outroSrc} muted={edl.outro.muted} background={edl.style?.background || '#000'} />
      </TransitionSeries.Sequence>
    );
  }
  const markSrc = edl.watermark ? sources[letteringSourceKey(edl.watermark.assetId)] : undefined;
  const clipsFrames = edlClipsFrames(edl);
  // Locução: cada trecho começa logo depois do corte do seu clipe.
  const starts = clipStartFrames(edl);
  const voiceItems = (edl.voice?.track || []).map(v => {
    const i = edl.clips.findIndex(c => c.id === v.clipId);
    return i < 0 || !sources[voiceSourceKey(v.clipId)] ? null : { ...v, from: starts[i] + VOICE_LEAD_FRAMES, src: sources[voiceSourceKey(v.clipId)] };
  }).filter(Boolean) as { clipId: string; frames: number; words: VoiceWord[]; from: number; src: string }[];
  const speech = voiceItems.map(v => [v.from, v.from + v.frames] as [number, number]);
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <TransitionSeries>{items}</TransitionSeries>
      {edl.music && sources[musicSourceKey(edl.music.jobId, edl.music.index)]
        ? <Music src={sources[musicSourceKey(edl.music.jobId, edl.music.index)]} volume={edl.music.volume} speech={speech} duck={edl.voice?.duck ?? 1} />
        : null}
      {voiceItems.map(v => (
        <Sequence key={`voice-${v.clipId}`} from={v.from} durationInFrames={v.frames}>
          <Audio src={v.src} volume={edl.voice!.volume} />
          {edl.voice!.captions && v.words.length ? <VoiceCaption words={v.words} style={edl.style} /> : null}
        </Sequence>
      ))}
      {edl.watermark && markSrc && clipsFrames > 0 ? (
        <Sequence durationInFrames={clipsFrames}>
          <Watermark mark={edl.watermark} src={markSrc} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────
// Custos das plataformas — fonte única para o registro de custos e para o cálculo de créditos.
// Atualize aqui quando um plano mudar; o estudo completo fica em docs/custos-plataforma.md.
// Revisado em 2026-11-10 (Remotion US$ 100/mês; ElevenLabs Pro US$ 99/mês).
// ─────────────────────────────────────────────────────────────

/** Assinaturas mensais fixas da Montagem (US$). Não dependem do uso até a franquia acabar. */
export const FIXED_MONTHLY_USD = {
  /** Licença Remotion (Automators): US$ 100/mês com 10.000 renders inclusos. */
  remotion: 100,
  /** ElevenLabs Pro: US$ 99/mês com ~600 mil caracteres. */
  elevenlabs: 99,
};

export const FRANCHISES = {
  remotionRenders: 10_000,
  elevenlabsChars: 600_000,
};

/** Custo unitário de referência (US$), medido em uso real ou pela tabela do provedor. */
export const UNIT_COST_USD = {
  /** ElevenLabs Pro com a franquia toda usada: 99 / 600 mil caracteres. */
  elevenlabsPer1kChars: FIXED_MONTHLY_USD.elevenlabs / (FRANCHISES.elevenlabsChars / 1000),
  /** OpenAI gpt-4o-mini-tts (~US$ 0,015/min) + Whisper para o tempo das palavras (US$ 0,006/min). */
  openaiVoicePerMinute: 0.021,
  /** Suno V6 na KIE: 12 créditos KIE por pedido (2 versões). */
  sunoTrack: 0.06,
  /** AWS Lambda, medido: 66 s de vídeo em 1080x1920 custaram US$ 0,031. */
  awsRenderPerVideoSecond: 0.031 / 66,
  /** Licença Remotion por render com a franquia toda usada (abaixo disso, o fixo pesa mais). */
  remotionPerRenderAtFullUse: FIXED_MONTHLY_USD.remotion / FRANCHISES.remotionRenders,
};

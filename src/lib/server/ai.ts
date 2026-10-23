import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { HttpError } from './auth';

/**
 * Modelos de IA num só lugar. Para trocar um modelo, altere aqui.
 * Podem ser sobrescritos por variável de ambiente sem novo deploy de código.
 */
export const AI_MODELS = {
  openaiFast: process.env.OPENAI_MODEL_FAST || 'gpt-4o-mini',
  openaiMain: process.env.OPENAI_MODEL_MAIN || 'gpt-4o',
  anthropicMain: process.env.ANTHROPIC_MODEL_MAIN || 'claude-sonnet-4-6',
  /** Gerador de Prompts: leitura de imagem + direção técnica pedem o modelo mais capaz. */
  anthropicPrompts: process.env.ANTHROPIC_MODEL_PROMPTS || 'claude-opus-5-5',
  kieImage: process.env.KIE_MODEL_IMAGE || 'nano-banana-2',
};

export function openaiClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new HttpError(503, 'provider_unconfigured', 'A chave da OpenAI não está configurada no servidor.');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export function anthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new HttpError(503, 'provider_unconfigured', 'A chave da Anthropic não está configurada no servidor.');
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

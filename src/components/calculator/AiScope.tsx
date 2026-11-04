'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Wand2, Sparkles, FileText } from 'lucide-react';
import {
  AI_COMPLEXITY, AI_IMAGE_TOOLS, AI_VIDEO_TOOLS, AiDetails, DISCARD_LEVELS, aiDirectCosts, aiUnitCosts, estimateFromScript, fmt,
} from '@/lib/budget/engine';

const label = 'block text-sm font-medium text-gray-300 mb-1';
const hint = 'text-[10px] text-gray-500 mt-1';

/** Etapa 3 no modo IA: escopo da operação com IA, com prévia ao vivo dos custos diretos. */
export function AiScope({ ai, setAi, videoQuantity }: { ai: AiDetails; setAi: (a: AiDetails) => void; videoQuantity: number }) {
  const [script, setScript] = useState('');
  const [scriptInfo, setScriptInfo] = useState<string>('');
  const set = (patch: Partial<AiDetails>) => setAi({ ...ai, ...patch });
  const direct = useMemo(() => aiDirectCosts(ai, videoQuantity), [ai, videoQuantity]);
  const units = aiUnitCosts(ai);

  const applyScript = () => {
    const est = estimateFromScript(script);
    if (!est) { setScriptInfo('Cole o roteiro ou a narração para estimar.'); return; }
    set({ seconds_per_video: est.seconds, scenes_per_video: est.scenes });
    setScriptInfo(`${est.words} palavras faladas → cerca de ${est.seconds}s e ${est.scenes} cenas por vídeo.`);
  };

  return (
    <div className="space-y-8">
      {/* Proporção de IA */}
      <div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Quanto do vídeo é feito com IA?</h2>
            <p className="text-sm text-gray-400">100% é tudo gerado. Menos que isso mistura cenas gravadas e cenas de IA.</p>
          </div>
          <p className="text-4xl font-extrabold text-brand-mint tabular-nums">{ai.ai_share}%</p>
        </div>
        <input type="range" min={10} max={100} step={10} value={ai.ai_share} onChange={e => set({ ai_share: Number(e.target.value) })}
          className="w-full mt-4 accent-emerald-500" aria-label="Porcentagem do vídeo feita com IA" />
        <div className="flex justify-between text-[10px] text-gray-500"><span>IA de apoio</span><span>Híbrido</span><span>100% IA</span></div>
      </div>

      {/* Roteiro → duração e cenas */}
      <div className="pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold text-white mb-1">Duração e cenas</h2>
          <p className="text-sm text-gray-400">Informe direto ou cole o roteiro para estimar.</p>
        </div>
        <div>
          <label className={label}>Duração de cada vídeo (segundos)</label>
          <input type="number" min={3} value={ai.seconds_per_video} onChange={e => set({ seconds_per_video: Number(e.target.value) })} className="w-full glass-input px-3 py-2 text-sm" />
        </div>
        <div>
          <label className={label}>Cenas de IA por vídeo</label>
          <input type="number" min={1} value={ai.scenes_per_video} onChange={e => set({ scenes_per_video: Number(e.target.value) })} className="w-full glass-input px-3 py-2 text-sm" />
          <p className={hint}>Cada cena é um take gerado (em geral, de 3 a 8 segundos).</p>
        </div>
        <div className="md:col-span-2 p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
          <p className="text-sm font-semibold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-brand-mint" /> Estimar pelo roteiro (opcional)</p>
          <textarea value={script} onChange={e => setScript(e.target.value)} rows={4} placeholder="Cole aqui o roteiro ou a narração. Linhas começando com 'Cena' ou numeradas contam como cenas."
            className="w-full glass-input text-sm resize-y" />
          <div className="flex items-center gap-3 flex-wrap">
            <button type="button" onClick={applyScript} className="px-4 py-2 rounded-lg bg-brand-emerald/15 border border-brand-emerald/30 text-brand-mint text-xs font-semibold hover:border-brand-emerald/70">
              Estimar duração e cenas
            </button>
            {scriptInfo && <span className="text-xs text-gray-400">{scriptInfo}</span>}
          </div>
        </div>
      </div>

      {/* Ferramentas e custos */}
      <div className="pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold text-white mb-1">Ferramentas e custos de geração</h2>
          <p className="text-sm text-gray-400">O custo que você paga para gerar. Os preços de API vêm da tabela oficial dos provedores.</p>
        </div>
        <div>
          <label className={label}>Ferramenta de vídeo</label>
          <select value={ai.video_tool} onChange={e => set({ video_tool: e.target.value })} className="w-full glass-input px-3 py-2 text-sm">
            {AI_VIDEO_TOOLS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          {ai.video_tool === 'custom'
            ? <input type="number" step="0.01" min={0} value={ai.custom_video_cost || ''} onChange={e => set({ custom_video_cost: Number(e.target.value) })} placeholder="R$ por segundo gerado" className="w-full glass-input px-3 py-2 text-sm mt-2" />
            : <p className={hint}>{fmt(units.perSecondCost)} por segundo gerado · {units.videoTool.hint}{units.videoTool.id === 'creator-lab' ? ` (crédito a ${fmt(units.creditValue)})` : ''}</p>}
        </div>
        <div>
          <label className={label}>Tentativas por take aprovado</label>
          <select value={ai.discard_level} onChange={e => set({ discard_level: e.target.value as AiDetails['discard_level'] })} className="w-full glass-input px-3 py-2 text-sm">
            {Object.entries(DISCARD_LEVELS).map(([k, v]) => <option key={k} value={k}>{v.label} ({v.factor}x)</option>)}
          </select>
          <p className={hint}>Toda geração descartada também custa. É o item que mais engana no orçamento de IA.</p>
        </div>
        <div>
          <label className={label}>Ferramenta de imagem (frames)</label>
          <select value={ai.image_tool} onChange={e => set({ image_tool: e.target.value })} className="w-full glass-input px-3 py-2 text-sm">
            {AI_IMAGE_TOOLS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          {ai.image_tool === 'custom'
            ? <input type="number" step="0.01" min={0} value={ai.custom_image_cost || ''} onChange={e => set({ custom_image_cost: Number(e.target.value) })} placeholder="R$ por imagem" className="w-full glass-input px-3 py-2 text-sm mt-2" />
            : <p className={hint}>{fmt(units.perImageCost)} por imagem · {units.imageTool.hint}</p>}
        </div>
        <div>
          <label className={label}>Frames por cena</label>
          <input type="number" min={0} max={4} value={ai.frames_per_scene} onChange={e => set({ frames_per_scene: Number(e.target.value) })} className="w-full glass-input px-3 py-2 text-sm" />
          <p className={hint}>Imagens geradas antes de animar (primeiro e último frame). 0 se gerar direto do texto.</p>
        </div>
        <div>
          <label className={label}>Voz</label>
          <select value={ai.voice} onChange={e => set({ voice: e.target.value as AiDetails['voice'] })} className="w-full glass-input px-3 py-2 text-sm">
            <option value="nenhuma">Sem locução</option>
            <option value="ia">Voz com IA</option>
            <option value="locutor">Locutor contratado</option>
          </select>
          {ai.voice !== 'nenhuma' && (
            <input type="number" step="0.5" min={0} value={ai.voice_cost_per_min || ''} onChange={e => set({ voice_cost_per_min: Number(e.target.value) })} placeholder="R$ por minuto de áudio" className="w-full glass-input px-3 py-2 text-sm mt-2" />
          )}
        </div>
        <div>
          <label className={label}>Trilha / música (R$ no projeto)</label>
          <input type="number" min={0} value={ai.music_cost || ''} onChange={e => set({ music_cost: Number(e.target.value) })} placeholder="0" className="w-full glass-input px-3 py-2 text-sm" />
        </div>
      </div>

      {/* Trabalho humano */}
      <div className="pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold text-white mb-1">Seu trabalho de direção</h2>
          <p className="text-sm text-gray-400">IA não se dirige sozinha: roteiro, prompts, curadoria e montagem entram como horas.</p>
        </div>
        <div>
          <label className={label}>Complexidade criativa</label>
          <select value={ai.complexity} onChange={e => set({ complexity: e.target.value as AiDetails['complexity'] })} className="w-full glass-input px-3 py-2 text-sm">
            {Object.entries(AI_COMPLEXITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Rodadas de revisão com o cliente</label>
          <select value={ai.revision_rounds} onChange={e => set({ revision_rounds: Number(e.target.value) })} className="w-full glass-input px-3 py-2 text-sm">
            {[0, 1, 2, 3, 4].map(r => <option key={r} value={r}>{r} {r === 1 ? 'rodada' : 'rodadas'}</option>)}
          </select>
        </div>
        <label className="md:col-span-2 flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer">
          <input type="checkbox" checked={ai.script_included} onChange={e => set({ script_included: e.target.checked })} className="accent-emerald-500 w-4 h-4" />
          <span className="text-sm text-gray-300">O roteiro é escrito por mim (entra como hora de trabalho)</span>
        </label>
      </div>

      {/* Assinaturas */}
      <div className="pt-6 border-t border-white/5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-white">Assinaturas de IA (mensal)</h2>
          <button type="button" onClick={() => set({ subscriptions: [...ai.subscriptions, { id: Date.now().toString(), name: '', value: 0 }] })}
            className="flex items-center gap-1 px-3 h-8 rounded-full text-xs text-brand-mint hover:bg-brand-emerald/10"><Plus className="w-4 h-4" /> Adicionar</button>
        </div>
        <p className="text-sm text-gray-400 mb-4">Ferramentas que você paga todo mês (ex.: ElevenLabs, Midjourney, plano da Creator Lab). Entram rateadas pelas horas do projeto.</p>
        <div className="space-y-3">
          {ai.subscriptions.map(sub => (
            <div key={sub.id} className="flex items-center gap-3">
              <input type="text" value={sub.name} placeholder="Nome da assinatura" onChange={e => set({ subscriptions: ai.subscriptions.map(s => s.id === sub.id ? { ...s, name: e.target.value } : s) })} className="flex-[2] glass-input px-3 py-2 text-sm" />
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                <input type="number" value={sub.value || ''} onChange={e => set({ subscriptions: ai.subscriptions.map(s => s.id === sub.id ? { ...s, value: Number(e.target.value) } : s) })} className="w-full glass-input pl-8 pr-3 py-2 text-sm" />
              </div>
              <button type="button" onClick={() => set({ subscriptions: ai.subscriptions.filter(s => s.id !== sub.id) })} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg" aria-label="Remover assinatura"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {!ai.subscriptions.length && <p className="text-xs text-gray-500">Nenhuma assinatura informada.</p>}
        </div>
      </div>

      {/* Prévia ao vivo */}
      <div className="p-5 rounded-2xl border border-brand-emerald/30 bg-[linear-gradient(140deg,rgba(16,185,129,0.14),rgba(3,20,13,0.4))] space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-mint flex items-center gap-2"><Sparkles className="w-4 h-4" /> Prévia dos custos diretos de IA</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['Vídeo gerado', direct.video, `${Math.round(direct.aiSeconds)}s × ${direct.tries} tentativas`],
            ['Frames', direct.images, `${Math.round(direct.aiScenes * ai.frames_per_scene)} imagens`],
            ['Voz e trilha', direct.voice + direct.music, ai.voice === 'nenhuma' ? 'só trilha' : 'locução + trilha'],
            ['Reserva de variação', direct.risk, '20% da geração'],
          ].map(([l, v, h]) => (
            <div key={l as string}>
              <p className="text-lg font-bold text-white tabular-nums">{fmt(v as number)}</p>
              <p className="text-[11px] text-gray-400">{l as string}</p>
              <p className="text-[10px] text-gray-500">{h as string}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <p className="text-sm text-gray-300 flex items-center gap-2"><Wand2 className="w-4 h-4 text-brand-mint" /> Total direto de IA ({videoQuantity} {videoQuantity === 1 ? 'vídeo' : 'vídeos'})</p>
          <p className="text-2xl font-extrabold text-brand-mint tabular-nums">{fmt(direct.total)}</p>
        </div>
        <p className="text-[10px] text-gray-500">Sem as assinaturas mensais e sem as suas horas: esses entram no cálculo final.</p>
      </div>
    </div>
  );
}

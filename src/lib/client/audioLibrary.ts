'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { GenJob } from '@/lib/generation';
import type { LibraryAudio } from '@/lib/montagem';
import { audioTypeOf } from '@/lib/audioStudio';

/**
 * Biblioteca de áudio da pessoa (trilhas, locuções e efeitos), ao vivo.
 * Duas igualdades na consulta dispensam índice composto; a ordem vem do id (criado em ordem de tempo).
 */
export function useAudioLibrary(uid: string | null | undefined) {
  const [jobs, setJobs] = useState<GenJob[] | null>(null);
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'gen_jobs'), where('uid', '==', uid), where('kind', '==', 'audio'));
    return onSnapshot(q, snap => {
      setJobs(snap.docs.map(d => ({ ...(d.data() as GenJob), id: d.id })).sort((a, b) => (a.id < b.id ? 1 : -1)));
    }, e => { console.error('[áudio] biblioteca', e); setJobs([]); });
  }, [uid]);

  /** Locuções e efeitos prontos, no formato que a Montagem usa para a prévia. */
  const library = useMemo(() => {
    const out: Record<string, LibraryAudio> = {};
    for (const j of jobs || []) {
      const type = audioTypeOf(j);
      const o = j.outputs?.[0];
      if (j.status !== 'completed' || !type || type === 'music' || !o?.url) continue;
      out[j.id] = { audioType: type, seconds: Number(o.seconds) || 1, url: o.url, ...(j.words?.length ? { words: j.words } : {}) };
    }
    return out;
  }, [jobs]);

  return { jobs, library };
}

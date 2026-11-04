'use client';

import { ALL_COURSES } from '@/lib/coursesData';

/** Mesma chave que a área de Estudo usa para marcar aulas concluídas (neste navegador). */
export const STUDY_STORAGE_KEY = 'asa_completed_videos';

export interface CourseProgress {
  id: string;
  title: string;
  done: number;
  total: number;
  percent: number;
}

export interface StudyProgress {
  percent: number;
  done: number;
  total: number;
  courses: CourseProgress[];
  /** Próxima aula disponível ainda não concluída. */
  next: { courseTitle: string; moduleTitle: string; videoTitle: string } | null;
}

export function readStudyProgress(): StudyProgress {
  let completed: string[] = [];
  try {
    const raw = localStorage.getItem(STUDY_STORAGE_KEY);
    completed = raw ? JSON.parse(raw) : [];
  } catch { /* sem progresso salvo */ }
  const doneSet = new Set(completed);

  let next: StudyProgress['next'] = null;
  const courses = ALL_COURSES.map(course => {
    const videos = course.modules.flatMap(m => m.videos.filter(v => !v.comingSoon).map(v => ({ ...v, moduleTitle: `${m.title} · ${m.subtitle}` })));
    const done = videos.filter(v => doneSet.has(v.id)).length;
    if (!next) {
      const pending = videos.find(v => !doneSet.has(v.id));
      if (pending) next = { courseTitle: course.title, moduleTitle: pending.moduleTitle, videoTitle: pending.title };
    }
    return { id: course.id, title: course.title, done, total: videos.length, percent: videos.length ? Math.round((done / videos.length) * 100) : 0 };
  });

  const total = courses.reduce((s, c) => s + c.total, 0);
  const done = courses.reduce((s, c) => s + c.done, 0);
  return { percent: total ? Math.round((done / total) * 100) : 0, done, total, courses, next };
}

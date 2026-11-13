import { db } from '../db/db';
import { useSettings } from '../store/settings';
import type { ExportBundle, Project } from '../types';
import { isRecord } from './utils';

export async function exportAll(): Promise<ExportBundle> {
  const { claudeApiKey: _omit, ...settings } = useSettings.getState().settings;
  void _omit;
  return {
    app: 'MotionPrompter',
    version: 1,
    exportedAt: new Date().toISOString(),
    projects: await db.projects.toArray(),
    styles: await db.styles.toArray(),
    favorites: await db.favorites.toArray(),
    quiz: await db.quiz.toArray(),
    settings
  };
}

/** Importe une sauvegarde : fusion (les éléments de même identifiant sont remplacés). */
export async function importAll(raw: unknown): Promise<{ projects: number; styles: number }> {
  if (!isRecord(raw) || raw.app !== 'MotionPrompter') throw new Error('Ce fichier n’est pas une sauvegarde MotionPrompter.');
  const b = raw as unknown as ExportBundle;
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const projects = arr<Project>(b.projects).filter((p) => isRecord(p) && typeof p.id === 'string' && isRecord(p.brief));
  const styles = arr<ExportBundle['styles'][number]>(b.styles).filter((s) => isRecord(s) && typeof s.id === 'string');
  await db.transaction('rw', [db.projects, db.styles, db.favorites, db.quiz], async () => {
    await db.projects.bulkPut(projects);
    await db.styles.bulkPut(styles);
    await db.favorites.bulkPut(arr(b.favorites));
    await db.quiz.bulkPut(arr(b.quiz));
  });
  if (isRecord(b.settings)) {
    const { theme, textSize } = b.settings;
    await useSettings.getState().update({
      ...(theme === 'light' || theme === 'dark' || theme === 'system' ? { theme } : {}),
      ...(textSize === 'sm' || textSize === 'md' || textSize === 'lg' ? { textSize } : {})
    });
  }
  return { projects: projects.length, styles: styles.length };
}

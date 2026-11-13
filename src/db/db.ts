import Dexie, { type Table } from 'dexie';
import type { Favorite, Project, QuizCard, Settings, StyleTokens } from '../types';
import { template1Blanc, TEMPLATE_1_ID } from '../lib/defaultStyle';

export interface SettingsRow {
  key: 'app';
  value: Settings;
}

class MotionDB extends Dexie {
  projects!: Table<Project, string>;
  styles!: Table<StyleTokens, string>;
  favorites!: Table<Favorite, string>;
  quiz!: Table<QuizCard, string>;
  settings!: Table<SettingsRow, string>;

  constructor() {
    super('motionprompter');
    this.version(1).stores({
      projects: 'id, updatedAt, name',
      styles: 'id, name, updatedAt',
      favorites: 'termId, createdAt',
      quiz: 'termId, due, box',
      settings: 'key'
    });
  }
}

export const db = new MotionDB();

/** Insère le style préchargé s'il n'existe pas encore. */
export async function seedDatabase(): Promise<void> {
  const existing = await db.styles.get(TEMPLATE_1_ID);
  if (!existing) await db.styles.put(template1Blanc());
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.projects, db.styles, db.favorites, db.quiz, db.settings], async () => {
    await Promise.all([db.projects.clear(), db.styles.clear(), db.favorites.clear(), db.quiz.clear(), db.settings.clear()]);
  });
  await seedDatabase();
}

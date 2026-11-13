import { create } from 'zustand';
import type { TabId } from '../types';

interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'error' | 'ok';
}

interface UIState {
  tab: TabId;
  termId: string | null;
  toasts: Toast[];
  setTab: (tab: TabId) => void;
  openTerm: (id: string) => void;
  closeTerm: () => void;
  toast: (text: string, tone?: Toast['tone']) => void;
  dismiss: (id: number) => void;
}

let nextToast = 1;

export const useUI = create<UIState>((set) => ({
  tab: 'learn',
  termId: null,
  toasts: [],
  setTab: (tab) => {
    set({ tab });
    window.scrollTo({ top: 0 });
  },
  openTerm: (termId) => set({ termId }),
  closeTerm: () => set({ termId: null }),
  toast: (text, tone = 'info') => {
    const id = nextToast++;
    set((s) => ({ toasts: [...s.toasts, { id, text, tone }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
}));

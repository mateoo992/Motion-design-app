import { useEffect, useRef } from 'react';
import { getTerm } from '../glossary';
import { useUI } from '../store/ui';
import { TermDetail } from './TermDetail';
import { Icon } from './ui';

/** Panneau latéral (desktop) / feuille plein écran (mobile) affichant une fiche du glossaire. */
export function TermDrawer() {
  const termId = useUI((s) => s.termId);
  const close = useUI((s) => s.closeTerm);
  const closeRef = useRef<HTMLButtonElement>(null);
  const term = termId ? getTerm(termId) : undefined;

  useEffect(() => {
    if (!term) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [term, close]);

  if (!term) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Fiche : ${term.name}`}>
      <button type="button" className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" aria-label="Fermer la fiche" onClick={close} />
      <div className="sheet-in glass relative mt-10 flex h-[calc(100%-2.5rem)] w-full flex-col overflow-hidden rounded-t-3xl md:mt-0 md:h-full md:max-w-[480px] md:rounded-none md:rounded-l-3xl">
        <div className="flex items-center justify-end px-4 pt-3">
          <button ref={closeRef} type="button" className="btn-ghost btn-sm" onClick={close}>
            <Icon name="close" className="h-4 w-4" /> Fermer
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-1">
          <TermDetail key={term.id} term={term} />
        </div>
      </div>
    </div>
  );
}

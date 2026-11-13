import { useEffect } from 'react';
import { Layout, Toasts } from './components/Layout';
import { TermDrawer } from './components/TermDrawer';
import { seedDatabase } from './db/db';
import { AtelierScreen } from './screens/Atelier';
import { GenerateScreen } from './screens/Generate';
import { LearnScreen } from './screens/Learn';
import { ProjectsScreen } from './screens/Projects';
import { StylesScreen } from './screens/Styles';
import { useProject } from './store/project';
import { applyAppearance, useSettings } from './store/settings';
import { useUI } from './store/ui';

export default function App() {
  const hydrated = useSettings((s) => s.hydrated);
  const hydrate = useSettings((s) => s.hydrate);
  const ensure = useProject((s) => s.ensure);
  const project = useProject((s) => s.project);
  const tab = useUI((s) => s.tab);

  useEffect(() => {
    (async () => {
      await seedDatabase();
      await hydrate();
      await ensure();
    })().catch((e) => console.error(e));
  }, [hydrate, ensure]);

  // Suit le thème système quand « Système » est choisi.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyAppearance(useSettings.getState().settings);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (!hydrated || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center" aria-busy="true">
        <span className="h-8 w-8 animate-pulse rounded-full gradient-bg" aria-label="Chargement" />
      </div>
    );
  }

  return (
    <>
      <Layout>
        <div key={tab} className="fade-in">
          {tab === 'learn' && <LearnScreen />}
          {tab === 'atelier' && <AtelierScreen />}
          {tab === 'styles' && <StylesScreen />}
          {tab === 'generate' && <GenerateScreen />}
          {tab === 'projects' && <ProjectsScreen />}
        </div>
      </Layout>
      <TermDrawer />
      <Toasts />
    </>
  );
}

import { AppProvider, useApp } from './store';
import { AppShell } from './components/AppShell';
import { AuthScreen } from './pages/AuthScreen';
import { HomePage } from './pages/HomePage';
import { DiagnosePage } from './pages/DiagnosePage';
import { DiagnosisResultPage } from './pages/DiagnosisResultPage';
import { SoilPage } from './pages/SoilPage';
import { SunPage } from './pages/SunPage';
import { PlantHerePage } from './pages/PlantHerePage';
import { CalendarPage } from './pages/CalendarPage';
import { JournalPage } from './pages/JournalPage';
import { PlotsPage } from './pages/PlotsPage';
import { WeatherPage } from './pages/WeatherPage';
import { RemindersPage } from './pages/RemindersPage';
import { ComparePage } from './pages/ComparePage';
import { InsectsPage } from './pages/InsectsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { Leaf } from 'lucide-react';
import type { Page } from './types';

const PAGES: Record<Page, React.FC> = {
  home: HomePage,
  diagnose: DiagnosePage,
  'diagnosis-result': DiagnosisResultPage,
  soil: SoilPage,
  sun: SunPage,
  'plant-here': PlantHerePage,
  calendar: CalendarPage,
  journal: JournalPage,
  plots: PlotsPage,
  weather: WeatherPage,
  reminders: RemindersPage,
  compare: ComparePage,
  insects: InsectsPage,
  profile: ProfilePage,
  admin: AdminPage,
};

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7f3]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-600 text-white shadow-lift animate-pulseSoft">
          <Leaf size={32} />
        </div>
        <p className="font-display text-lg font-semibold text-forest-800">TerraCerta</p>
        <p className="text-sm text-forest-500">A carregar a sua horta…</p>
      </div>
    </div>
  );
}

function Router() {
  const { user, page, loading } = useApp();

  if (loading) return <LoadingScreen />;
  if (!user) return <AuthScreen />;

  const PageComponent = PAGES[page] ?? HomePage;
  return (
    <AppShell>
      <PageComponent />
    </AppShell>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}

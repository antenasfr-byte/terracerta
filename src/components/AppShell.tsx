import { useState, type ReactNode } from 'react';
import {
  Home, Camera, Layers, Sun, Sprout, CalendarDays, NotebookPen,
  CloudRain, Bell, Scale, Bug, User as UserIcon, Shield, Leaf,
  Menu, X, LogOut, ChevronRight,
} from 'lucide-react';
import { useApp } from '../store';
import type { Page } from '../types';

interface NavItem { page: Page; label: string; icon: ReactNode }

const NAV: NavItem[] = [
  { page: 'home', label: 'Início', icon: <Home size={20} /> },
  { page: 'diagnose', label: 'Diagnosticar', icon: <Camera size={20} /> },
  { page: 'soil', label: 'Análise da terra', icon: <Layers size={20} /> },
  { page: 'sun', label: 'Exposição solar', icon: <Sun size={20} /> },
  { page: 'plant-here', label: 'O que plantar', icon: <Sprout size={20} /> },
  { page: 'calendar', label: 'Calendário', icon: <CalendarDays size={20} /> },
  { page: 'journal', label: 'Diário da horta', icon: <NotebookPen size={20} /> },
  { page: 'plots', label: 'Terrenos', icon: <Leaf size={20} /> },
  { page: 'compare', label: 'Comparar fotos', icon: <Scale size={20} /> },
  { page: 'insects', label: 'Insetos e ervas', icon: <Bug size={20} /> },
  { page: 'weather', label: 'Meteorologia', icon: <CloudRain size={20} /> },
  { page: 'reminders', label: 'Lembretes', icon: <Bell size={20} /> },
];

const BOTTOM_NAV: NavItem[] = [
  { page: 'home', label: 'Início', icon: <Home size={22} /> },
  { page: 'diagnose', label: 'Diagnosticar', icon: <Camera size={22} /> },
  { page: 'journal', label: 'Horta', icon: <NotebookPen size={22} /> },
  { page: 'weather', label: 'Meteo', icon: <CloudRain size={22} /> },
  { page: 'profile', label: 'Perfil', icon: <UserIcon size={22} /> },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-600 text-white shadow-soft">
        <Leaf size={22} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="font-display text-lg font-semibold text-forest-900">TerraCerta</p>
          <p className="text-[11px] font-medium text-forest-500">A sua horta, mais certinha</p>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, page, navigate, signOut } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);
  if (!user) return <>{children}</>;

  const isAdmin = user.isAdmin;
  const allNav = isAdmin ? [...NAV, { page: 'admin' as Page, label: 'Painel de administração', icon: <Shield size={20} /> }] : NAV;

  return (
    <div className="min-h-screen bg-[#f6f7f3]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-forest-100 bg-white lg:flex lg:flex-col">
        <div className="px-5 py-5"><Logo /></div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {allNav.map(item => <NavButton key={item.page} item={item} active={page === item.page} onClick={() => navigate(item.page)} />)}
        </nav>
        <div className="border-t border-forest-100 p-3">
          <button onClick={() => navigate('profile')} className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-forest-50">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-100 text-sm font-bold text-forest-700">{user.name.charAt(0).toUpperCase()}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-forest-900">{user.name}</p><p className="truncate text-xs capitalize text-forest-500">Plano {user.plan}</p></div>
          </button>
          <button onClick={signOut} className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-forest-600 transition-colors hover:bg-rust-50 hover:text-rust-600"><LogOut size={16} /> Terminar sessão</button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-forest-100 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo compact />
        <button onClick={() => setDrawerOpen(true)} className="rounded-lg p-2 text-forest-700 hover:bg-forest-50" aria-label="Abrir menu"><Menu size={24} /></button>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-forest-950/40 backdrop-blur-sm animate-fadeIn" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-lift" style={{ animation: 'fadeIn .25s ease-out' }}>
            <div className="flex items-center justify-between border-b border-forest-100 px-5 py-4">
              <Logo />
              <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-1.5 text-forest-500 hover:bg-forest-50"><X size={20} /></button>
            </div>
            <nav className="space-y-1 overflow-y-auto p-3" style={{ maxHeight: 'calc(100vh - 140px)' }}>
              {allNav.map(item => <NavButton key={item.page} item={item} active={page === item.page} onClick={() => { navigate(item.page); setDrawerOpen(false); }} />)}
            </nav>
            <div className="border-t border-forest-100 p-3">
              <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-forest-600 hover:bg-rust-50 hover:text-rust-600"><LogOut size={16} /> Terminar sessão</button>
            </div>
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <main className="min-h-screen pb-24 lg:pb-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-forest-100 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex items-stretch justify-around px-1 py-1.5">
          {BOTTOM_NAV.map(item => {
            const active = page === item.page;
            return <button key={item.page} onClick={() => navigate(item.page)} className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition-colors ${active ? 'text-forest-700' : 'text-forest-400'}`}><span className={active ? 'text-forest-600' : ''}>{item.icon}</span>{item.label}</button>;
          })}
        </div>
      </nav>
    </div>
  );
}

function NavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${active ? 'bg-forest-600 text-white shadow-soft' : 'text-forest-700 hover:bg-forest-50'}`}>
      <span className={active ? 'text-white' : 'text-forest-500 group-hover:text-forest-700'}>{item.icon}</span>
      <span className="flex-1 text-left">{item.label}</span>
      {active && <ChevronRight size={16} className="text-white/70" />}
    </button>
  );
}

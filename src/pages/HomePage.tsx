import {
  Camera, Layers, Sun, Sprout, Bug, NotebookPen,
  CloudRain, Bell, AlertTriangle, ChevronRight, CalendarDays, TrendingUp,
  Droplet, Loader2, LocateFixed,
} from 'lucide-react';
import { useApp } from '../store';
import { PageShell, Card, Badge, Button } from '../components/ui';
import { WeatherWidget } from '../components/WeatherWidget';
import { useWeather } from '../lib/useWeather';
import { loadCrops, MONTH_NAMES, relativeDay } from '../data';
import { useEffect, useState } from 'react';
import type { Crop } from '../types';

export function HomePage() {
  const { user, navigate, reminders } = useApp();
  const { days, alerts, loading: weatherLoading, locationLabel, locateMe } = useWeather();
  const [monthCrops, setMonthCrops] = useState<Crop[]>([]);

  const month = new Date().getMonth() + 1;

  useEffect(() => {
    loadCrops().then(c => setMonthCrops(c.filter(crop => crop.plantMonths.includes(month))));
  }, [month]);

  if (!user) return null;

  const upcoming = reminders.filter(r => !r.done).slice(0, 3);

  const actions = [
    { label: 'Fotografar planta doente', desc: 'Diagnóstico por imagem', icon: <Camera size={26} />, page: 'diagnose' as const, tone: 'from-forest-600 to-forest-700' },
    { label: 'Analisar terra', desc: 'Qualidade do solo', icon: <Layers size={26} />, page: 'soil' as const, tone: 'from-terracotta-500 to-terracotta-600' },
    { label: 'Analisar exposição solar', desc: 'Sol e sombra do local', icon: <Sun size={26} />, page: 'sun' as const, tone: 'from-wheat-500 to-wheat-600' },
    { label: 'O que posso plantar aqui?', desc: 'Recomendações personalizadas', icon: <Sprout size={26} />, page: 'plant-here' as const, tone: 'from-leaf-500 to-leaf-600' },
    { label: 'Identificar inseto', desc: 'Praga ou benéfico?', icon: <Bug size={26} />, page: 'insects' as const, tone: 'from-sky2-500 to-sky2-600' },
    { label: 'Ver a minha horta', desc: 'Diário e terrenos', icon: <NotebookPen size={26} />, page: 'journal' as const, tone: 'from-forest-500 to-forest-600' },
  ];

  return (
    <PageShell>
      <div className="mb-6 animate-fadeIn">
        <p className="text-sm font-medium text-forest-500">Bem-vindo de volta,</p>
        <h1 className="font-display text-3xl font-semibold text-forest-900 sm:text-4xl">{user.name}</h1>
        <p className="mt-1 text-forest-600">Aqui está o estado da sua horta hoje, {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((a, i) => (
          <button key={a.page} onClick={() => navigate(a.page)} style={{ animationDelay: `${i * 40}ms` }} className="group flex animate-fadeIn items-center gap-4 overflow-hidden rounded-2xl bg-white p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${a.tone} text-white shadow-soft`}>{a.icon}</div>
            <div className="min-w-0 flex-1"><p className="font-semibold leading-tight text-forest-900">{a.label}</p><p className="mt-0.5 text-sm text-forest-500">{a.desc}</p></div>
            <ChevronRight size={20} className="shrink-0 text-forest-300 transition-transform group-hover:translate-x-1" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-forest-50 px-5 py-3">
              <div className="flex items-center gap-2"><CloudRain size={18} className="text-sky2-500" /><h3 className="font-semibold text-forest-900">Meteorologia · {locationLabel}</h3></div>
              <div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={locateMe}><LocateFixed size={14} className="mr-1" />Localizar</Button><Button variant="ghost" size="sm" onClick={() => navigate('weather')}>Detalhes <ChevronRight size={14} /></Button></div>
            </div>
            <div className="p-5">{weatherLoading ? <div className="flex items-center gap-2 text-forest-500"><Loader2 size={18} className="animate-spin" /> A carregar meteorologia…</div> : <WeatherWidget days={days} />}</div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 border-b border-forest-50 px-5 py-3"><AlertTriangle size={18} className="text-wheat-600" /><h3 className="font-semibold text-forest-900">Alertas importantes</h3></div>
            <div className="divide-y divide-forest-50">
              {alerts.length === 0 && <p className="px-5 py-6 text-center text-sm text-forest-400">Sem alertas neste momento.</p>}
              {alerts.map(a => {
                const bg = a.severity === 'alerta' ? 'bg-rust-50' : a.severity === 'aviso' ? 'bg-amber2-50' : 'bg-sky2-50';
                return (
                  <div key={a.id} className={`flex items-start gap-3 px-5 py-3 ${bg}`}>
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.severity === 'alerta' ? 'bg-rust-500' : a.severity === 'aviso' ? 'bg-amber2-500' : 'bg-sky2-500'}`} />
                    <div><p className="text-sm font-semibold text-forest-900">{a.title}</p><p className="mt-0.5 text-sm text-forest-600">{a.message}</p></div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between border-b border-forest-50 px-5 py-3">
              <div className="flex items-center gap-2"><Bell size={18} className="text-forest-600" /><h3 className="font-semibold text-forest-900">Próximos lembretes</h3></div>
              <Button variant="ghost" size="sm" onClick={() => navigate('reminders')}>Todos <ChevronRight size={14} /></Button>
            </div>
            <div className="divide-y divide-forest-50">
              {upcoming.length === 0 && <p className="px-5 py-6 text-center text-sm text-forest-400">Sem lembretes pendentes.</p>}
              {upcoming.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-50 text-forest-600"><ReminderIcon type={r.type} /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-forest-900">{r.title}</p><p className="text-xs text-forest-500">{relativeDay(r.date)}</p></div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-forest-50 px-5 py-3">
              <div className="flex items-center gap-2"><CalendarDays size={18} className="text-terracotta-500" /><h3 className="font-semibold text-forest-900">Recomendações de {MONTH_NAMES[month - 1]}</h3></div>
              <Button variant="ghost" size="sm" onClick={() => navigate('calendar')}>Calendário</Button>
            </div>
            <div className="p-5">
              <p className="mb-3 flex items-center gap-1.5 text-sm text-forest-600"><TrendingUp size={15} className="text-leaf-600" /> {monthCrops.length} culturas ideais para plantar agora</p>
              <div className="flex flex-wrap gap-2">
                {monthCrops.slice(0, 8).map(c => (
                  <button key={c.id} onClick={() => navigate('plant-here', { cropId: c.id })} className="flex items-center gap-1.5 rounded-full bg-forest-50 py-1.5 pl-2 pr-3 text-sm font-medium text-forest-700 transition-colors hover:bg-forest-100"><span>{c.icon}</span>{c.name}</button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-forest-600 to-forest-700 text-white">
            <div className="p-5">
              <Badge tone="wheat" className="mb-2 capitalize">Plano {user.plan}</Badge>
              <p className="font-display text-lg font-semibold">Aproveite ao máximo a sua horta</p>
              <p className="mt-1 text-sm text-forest-100">
                {user.plan === 'grátis' && 'Faça upgrade para análises ilimitadas, meteorologia e análise da terra.'}
                {user.plan === 'premium' && 'Já tem acesso a análises ilimitadas e meteorologia.'}
                {user.plan === 'profissional' && 'Gestão profissional com relatórios e exportação PDF.'}
              </p>
              {user.plan === 'grátis' && <Button variant="secondary" size="sm" className="mt-3" onClick={() => navigate('profile')}>Ver planos</Button>}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function ReminderIcon({ type }: { type: string }) {
  const map: Record<string, React.ReactNode> = {
    regar: <Droplet size={16} />, adubar: <Sprout size={16} />, tratamento: <Bug size={16} />, fotografia: <Camera size={16} />,
    podar: <NotebookPen size={16} />, plantar: <Sprout size={16} />, colher: <CalendarDays size={16} />,
  };
  return <>{map[type] ?? <Bell size={16} />}</>;
}

import { CloudRain, Wind, Droplets, Snowflake, Flame, AlertTriangle, Info, Bell, Loader2, MapPin, LocateFixed } from 'lucide-react';
import { useApp } from '../store';
import { PageShell, Card, SectionTitle, Button } from '../components/ui';
import { WeatherWidget } from '../components/WeatherWidget';
import { useWeather } from '../lib/useWeather';
import { formatDate } from '../data';

export function WeatherPage() {
  const { navigate } = useApp();
  const { days, alerts, loading, error, locationLabel, reload, locateMe } = useWeather();

  return (
    <PageShell>
      <SectionTitle icon={<CloudRain size={22} />} title="Meteorologia" subtitle={`Previsão para 7 dias · ${locationLabel}`} action={<div className="flex gap-2"><Button variant="outline" size="sm" onClick={locateMe}><LocateFixed size={14} className="mr-1" />Minha localização</Button><Button variant="outline" size="sm" onClick={reload}>Atualizar</Button></div>} />

      {error && <Card className="mb-6 bg-rust-50 p-4 text-sm text-rust-700"><MapPin size={16} className="mr-2 inline" />{error}</Card>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            {loading ? <div className="flex items-center gap-2 text-forest-500"><Loader2 size={18} className="animate-spin" /> A carregar meteorologia…</div> : <WeatherWidget days={days} />}
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-forest-50 px-5 py-3"><h3 className="font-semibold text-forest-900">Previsão para 7 dias</h3></div>
            <div className="divide-y divide-forest-50">
              {days.map((d, i) => {
                const date = new Date(d.date);
                const weekday = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][date.getDay()];
                return (
                  <div key={i} className="flex items-center gap-4 px-5 py-3">
                    <div className="w-28"><p className="text-sm font-semibold text-forest-900">{i === 0 ? 'Hoje' : weekday}</p><p className="text-xs text-forest-500">{formatDate(d.date)}</p></div>
                    <span className="text-2xl">{d.icon}</span>
                    <p className="flex-1 text-sm text-forest-600">{d.condition}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 text-sky2-600"><Droplets size={14} />{d.rainProbability}%</span>
                      <span className="flex items-center gap-1 text-forest-500"><Wind size={14} />{d.windKmh}</span>
                      <span className="font-semibold text-forest-900">{d.tempMax}°<span className="text-forest-400">/{d.tempMin}°</span></span>
                    </div>
                    {d.frostRisk && <Snowflake size={16} className="text-sky2-500" />}
                    {d.heatWave && <Flame size={16} className="text-rust-500" />}
                  </div>
                );
              })}
              {days.length === 0 && !loading && <p className="px-5 py-6 text-center text-sm text-forest-400">Sem dados meteorológicos.</p>}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-2 border-b border-forest-50 px-5 py-3"><AlertTriangle size={18} className="text-wheat-600" /><h3 className="font-semibold text-forest-900">Alertas da horta</h3></div>
            <div className="divide-y divide-forest-50">
              {alerts.length === 0 && <p className="px-5 py-6 text-center text-sm text-forest-400">Sem alertas neste momento.</p>}
              {alerts.map(a => {
                const bg = a.severity === 'alerta' ? 'bg-rust-50' : a.severity === 'aviso' ? 'bg-amber2-50' : 'bg-sky2-50';
                const Icon = a.severity === 'info' ? Info : AlertTriangle;
                const color = a.severity === 'alerta' ? 'text-rust-600' : a.severity === 'aviso' ? 'text-amber2-600' : 'text-sky2-600';
                return (
                  <div key={a.id} className={`px-5 py-4 ${bg}`}>
                    <div className="flex items-center gap-2"><Icon size={16} className={color} /><p className="text-sm font-semibold text-forest-900">{a.title}</p></div>
                    <p className="mt-1.5 text-sm text-forest-700">{a.message}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-sky2-500 to-sky2-600 p-5 text-white">
            <Bell size={24} />
            <p className="mt-2 font-display text-lg font-semibold">Receba alertas no seu telemóvel</p>
            <p className="mt-1 text-sm text-sky2-50">Ative os lembretes para não perder regas e tratamentos importantes.</p>
            <button onClick={() => navigate('reminders')} className="mt-3 rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/30">Ver lembretes</button>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

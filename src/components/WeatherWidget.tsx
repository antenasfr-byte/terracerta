import { CloudRain, Wind, Droplets, Snowflake, Flame } from 'lucide-react';
import type { WeatherDay } from '../types';

export function WeatherWidget({ days, compact = false }: { days: WeatherDay[]; compact?: boolean }) {
  if (!days || days.length === 0) return <p className="text-sm text-forest-400">A carregar meteorologia…</p>;
  const today = days[0];
  const next = days.slice(1, compact ? 4 : 5);
  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="text-4xl">{today.icon}</div>
        <div>
          <p className="text-3xl font-bold text-forest-900">{today.tempMax}°<span className="text-lg text-forest-400">/{today.tempMin}°</span></p>
          <p className="text-sm text-forest-600">{today.condition}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <MiniStat icon={<Droplets size={15} />} value={`${today.humidity}%`} label="Humidade" />
        <MiniStat icon={<Wind size={15} />} value={`${today.windKmh} km/h`} label="Vento" />
        <MiniStat icon={<CloudRain size={15} />} value={`${today.rainProbability}%`} label="Chuva" />
      </div>
      <div className="mt-4 flex justify-between gap-1">
        {next.map((d, i) => <ForecastDay key={i} day={d} />)}
      </div>
    </div>
  );
}

function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-lg bg-forest-50/70 py-2">
      <div className="flex items-center justify-center gap-1 text-forest-600">{icon}<span className="text-sm font-semibold text-forest-900">{value}</span></div>
      <p className="mt-0.5 text-[11px] text-forest-500">{label}</p>
    </div>
  );
}

function ForecastDay({ day }: { day: WeatherDay }) {
  const date = new Date(day.date);
  const weekday = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()];
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-center">
      <span className="text-[11px] font-semibold text-forest-500">{weekday}</span>
      <span className="text-xl">{day.icon}</span>
      <span className="text-xs font-semibold text-forest-900">{day.tempMax}°</span>
      <span className="text-[10px] text-forest-400">{day.tempMin}°</span>
      {day.frostRisk && <Snowflake size={11} className="text-sky2-500" />}
      {day.heatWave && <Flame size={11} className="text-rust-500" />}
    </div>
  );
}

export function WeatherIcon({ day }: { day: WeatherDay }) {
  return <span className="text-2xl">{day.icon}</span>;
}

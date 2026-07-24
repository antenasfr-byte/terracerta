import { useState, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useApp } from '../store';
import { PageShell, Card, Badge, SectionTitle } from '../components/ui';
import { loadCrops, MONTH_NAMES } from '../data';
import type { Crop, CropCategory } from '../types';

const CAT_LABEL: Record<CropCategory, string> = {
  legumes: 'Legumes', frutas: 'Frutas', árvores: 'Árvores', ervas: 'Ervas', flores: 'Flores', resistentes: 'Resistentes',
};

export function CalendarPage() {
  const { navigate } = useApp();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [allCrops, setAllCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCrops().then(c => { setAllCrops(c); setLoading(false); });
  }, []);

  const prev = () => setMonth(m => (m === 1 ? 12 : m - 1));
  const next = () => setMonth(m => (m === 12 ? 1 : m + 1));
  const monthCrops = allCrops.filter(c => c.plantMonths.includes(month)).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PageShell>
      <SectionTitle icon={<CalendarDays size={22} />} title="Calendário de plantação" subtitle="O que plantar em cada mês em Portugal." />

      <Card className="mb-6 p-4">
        <div className="flex items-center justify-between">
          <button onClick={prev} className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-forest-700 hover:bg-forest-100"><ChevronLeft size={20} /></button>
          <div className="text-center"><p className="font-display text-2xl font-semibold text-forest-900">{MONTH_NAMES[month - 1]}</p><p className="text-sm text-forest-500">{monthCrops.length} culturas ideais</p></div>
          <button onClick={next} className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-forest-700 hover:bg-forest-100"><ChevronRight size={20} /></button>
        </div>
        <div className="mt-4 flex gap-1 overflow-x-auto no-scrollbar">
          {MONTH_NAMES.map((m, i) => (
            <button key={m} onClick={() => setMonth(i + 1)} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${month === i + 1 ? 'bg-forest-600 text-white' : 'bg-forest-50 text-forest-600 hover:bg-forest-100'}`}>{m.slice(0, 3)}</button>
          ))}
        </div>
      </Card>

      <div className="mb-6">
        <h3 className="mb-3 font-display text-lg font-semibold text-forest-900">Plantar em {MONTH_NAMES[month - 1]}</h3>
        {loading ? <div className="flex items-center gap-2 text-forest-500"><Loader2 size={18} className="animate-spin" /> A carregar culturas…</div> : monthCrops.length === 0 ? (
          <Card className="p-8 text-center text-forest-500">Poucas culturas neste mês.</Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {monthCrops.map(c => (
              <Card key={c.id} className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{c.icon}</span>
                  <div className="flex-1"><p className="font-semibold text-forest-900">{c.name}</p><p className="text-xs text-forest-500">{CAT_LABEL[c.category]}</p></div>
                  <Badge tone={c.difficulty === 'Fácil' ? 'leaf' : c.difficulty === 'Médio' ? 'amber' : 'rust'}>{c.difficulty}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-forest-50/60 px-2 py-1.5"><p className="text-forest-500">Colheita</p><p className="font-semibold text-forest-800">{c.harvestDays}</p></div>
                  <div className="rounded-lg bg-forest-50/60 px-2 py-1.5"><p className="text-forest-500">Sol</p><p className="font-semibold text-forest-800">{c.sun}</p></div>
                </div>
                <button onClick={() => navigate('plant-here', { cropId: c.id })} className="mt-3 w-full rounded-lg bg-forest-50 py-2 text-sm font-medium text-forest-700 hover:bg-forest-100">Ver detalhes</button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-display text-lg font-semibold text-forest-900">Visão de todo o ano</h3>
        <Card className="overflow-x-auto p-4">
          <table className="w-full border-collapse text-center text-xs">
            <thead>
              <tr><th className="sticky left-0 bg-white px-2 py-2 text-left font-semibold text-forest-700">Cultura</th>{MONTH_NAMES.map(m => <th key={m} className="px-1.5 py-2 font-medium text-forest-500">{m.slice(0, 3)}</th>)}</tr>
            </thead>
            <tbody>
              {allCrops.map(c => (
                <tr key={c.id} className="border-t border-forest-50">
                  <td className="sticky left-0 bg-white px-2 py-2 text-left font-medium text-forest-800"><span className="mr-1">{c.icon}</span>{c.name}</td>
                  {Array.from({ length: 12 }).map((_, i) => {
                    const active = c.plantMonths.includes(i + 1);
                    return <td key={i} className="px-1 py-1.5">{active ? <span className="inline-block h-5 w-5 rounded-md bg-leaf-400" title={`${c.name} em ${MONTH_NAMES[i]}`} /> : <span className="inline-block h-5 w-5 rounded-md bg-forest-50" />}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-forest-400"><span className="inline-block h-3 w-3 rounded bg-leaf-400" /> Época ideal para plantar</p>
      </div>
    </PageShell>
  );
}

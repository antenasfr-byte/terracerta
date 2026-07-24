import { useState, useEffect } from 'react';
import { Sprout, Sun, Droplet, Ruler, Clock, MapPin, Filter, ChevronDown, Loader2 } from 'lucide-react';
import { useApp } from '../store';
import { PageShell, Card, Badge, Button, Select, SectionTitle } from '../components/ui';
import { loadCrops, REGION_NAMES, MONTH_NAMES } from '../data';
import type { Crop, CropCategory } from '../types';

const CATEGORIES: { id: CropCategory | 'todos'; label: string }[] = [
  { id: 'todos', label: 'Todas' }, { id: 'legumes', label: 'Legumes' }, { id: 'frutas', label: 'Frutas' },
  { id: 'árvores', label: 'Árvores' }, { id: 'ervas', label: 'Ervas aromáticas' }, { id: 'flores', label: 'Flores' }, { id: 'resistentes', label: 'Resistentes' },
];

export function PlantHerePage() {
  const { user, navPayload } = useApp();
  const month = new Date().getMonth() + 1;
  const [region, setRegion] = useState(user?.region ?? 'Estremadura');
  const [selectedMonth, setSelectedMonth] = useState(String(month));
  const [temp, setTemp] = useState('15–20 °C');
  const [sunExp, setSunExp] = useState('sol-parcial');
  const [soil, setSoil] = useState('Franca');
  const [humidity, setHumidity] = useState('Regular');
  const [space, setSpace] = useState('terra');
  const [category, setCategory] = useState<CropCategory | 'todos'>('todos');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [allCrops, setAllCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCrops().then(c => { setAllCrops(c); setLoading(false); });
  }, []);

  const monthNum = parseInt(selectedMonth);
  const seasonCrops = allCrops.filter(c => c.plantMonths.includes(monthNum));
  const filtered = seasonCrops.filter(c => {
    if (category !== 'todos' && c.category !== category) return false;
    if (sunExp === 'sombra' && c.sun.includes('Sol pleno')) return false;
    return true;
  });
  const focusCropId = navPayload.cropId as string | undefined;

  return (
    <PageShell>
      <SectionTitle icon={<Sprout size={22} />} title="O que posso plantar aqui?" subtitle="A aplicação combina o mês, a região, a temperatura, o sol e a terra para recomendar culturas." />

      <Card className="mb-6 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select label="Mês" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>{MONTH_NAMES.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}</Select>
          <Select label="Região de Portugal" value={region} onChange={e => setRegion(e.target.value)}>{REGION_NAMES.map(r => <option key={r}>{r}</option>)}</Select>
          <Select label="Temperatura atual" value={temp} onChange={e => setTemp(e.target.value)}>{['< 5 °C', '5–10 °C', '10–15 °C', '15–20 °C', '20–25 °C', '25–30 °C', '> 30 °C'].map(t => <option key={t}>{t}</option>)}</Select>
          <Select label="Exposição solar" value={sunExp} onChange={e => setSunExp(e.target.value)}><option value="sombra">Sombra</option><option value="meia-sombra">Meia-sombra</option><option value="sol-parcial">Sol parcial</option><option value="sol-pleno">Sol pleno</option></Select>
          <Select label="Tipo de terra" value={soil} onChange={e => setSoil(e.target.value)}>{['Arenosa', 'Franca', 'Argilosa', 'Muito argilosa'].map(t => <option key={t}>{t}</option>)}</Select>
          <Select label="Humidade" value={humidity} onChange={e => setHumidity(e.target.value)}>{['Seca', 'Regular', 'Húmida', 'Molhada'].map(t => <option key={t}>{t}</option>)}</Select>
          <Select label="Espaço disponível" value={space} onChange={e => setSpace(e.target.value)}><option value="terra">Terra (horta)</option><option value="vaso">Vaso</option><option value="estufa">Estufa</option></Select>
        </div>
      </Card>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-sm font-medium text-forest-600"><Filter size={15} /> Categorias:</span>
        {CATEGORIES.map(c => <button key={c.id} onClick={() => setCategory(c.id)} className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${category === c.id ? 'bg-forest-600 text-white' : 'bg-white text-forest-600 hover:bg-forest-50'}`}>{c.label}</button>)}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-forest-600">
        <Badge tone="forest"><MapPin size={12} /> {region}</Badge>
        <Badge tone="wheat">{MONTH_NAMES[monthNum - 1]}</Badge>
        <Badge tone="terracotta">{temp}</Badge>
        <Badge tone="sky">{space === 'terra' ? 'Em terra' : space === 'vaso' ? 'Em vaso' : 'Em estufa'}</Badge>
        <span className="ml-1">{filtered.length} culturas recomendadas</span>
      </div>

      {loading ? <div className="flex items-center gap-2 text-forest-500"><Loader2 size={18} className="animate-spin" /> A carregar culturas…</div> : filtered.length === 0 ? (
        <Card className="p-8 text-center text-forest-500">Nenhuma cultura recomendada para estes critérios. Tente alterar o mês ou a exposição solar.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => <CropCard key={c.id} crop={c} expanded={expanded === c.id || focusCropId === c.id} onToggle={() => setExpanded(expanded === c.id ? null : c.id)} />)}
        </div>
      )}
    </PageShell>
  );
}

function CropCard({ crop, expanded, onToggle }: { crop: Crop; expanded: boolean; onToggle: () => void }) {
  const diffTone = crop.difficulty === 'Fácil' ? 'leaf' : crop.difficulty === 'Médio' ? 'amber' : 'rust';
  return (
    <Card className="overflow-hidden">
      <button onClick={onToggle} className="flex w-full items-center gap-3 p-4 text-left">
        <span className="text-3xl">{crop.icon}</span>
        <div className="flex-1"><p className="font-semibold text-forest-900">{crop.name}</p><p className="text-xs capitalize text-forest-500">{crop.category}</p></div>
        <ChevronDown size={18} className={`text-forest-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="border-t border-forest-50 p-4 animate-fadeIn">
          <div className="mb-3 flex flex-wrap gap-2"><Badge tone={diffTone}>{crop.difficulty}</Badge><Badge tone="forest">{crop.sun}</Badge></div>
          <dl className="space-y-2.5 text-sm">
            <Detail icon={<Sprout size={15} />} label="Melhor altura" value={crop.plantMonths.map(m => MONTH_NAMES[m - 1].slice(0, 3)).join(', ')} />
            <Detail icon={<Ruler size={15} />} label="Profundidade" value={crop.depth} />
            <Detail icon={<Ruler size={15} />} label="Espaçamento" value={crop.spacing} />
            <Detail icon={<Droplet size={15} />} label="Água" value={crop.water} />
            <Detail icon={<Sun size={15} />} label="Sol" value={crop.sun} />
            <Detail icon={<Clock size={15} />} label="Até à colheita" value={crop.harvestDays} />
          </dl>
          <Button variant="outline" size="sm" className="mt-4 w-full">Adicionar à minha horta</Button>
        </div>
      )}
    </Card>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-start gap-2.5"><span className="mt-0.5 text-forest-400">{icon}</span><div><dt className="text-xs font-medium text-forest-500">{label}</dt><dd className="font-medium text-forest-900">{value}</dd></div></div>;
}

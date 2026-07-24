import { useState } from 'react';
import {
  Sun, Sunrise, Sun as SunNoon, Sunset, Camera, MapPin, Compass,
  Sparkles, TreePine, Building2, Droplet, AlertTriangle, CheckCircle2, Flame,
} from 'lucide-react';
import { useApp } from '../store';
import { PageShell, Card, Badge, Button, Select, Input, SectionTitle, EmptyState } from '../components/ui';
import { formatDate } from '../data';
import { validateImage } from '../lib/photos';
import type { SunReport, SunClass } from '../types';

const ORIENTATIONS = ['Norte', 'Sul', 'Nascente (Este)', 'Poente (Oeste)', 'Sudeste', 'Sudoeste'];
const SUN_HOURS = ['Menos de 3 horas', '3 a 4 horas', '5 a 6 horas', '7 a 8 horas', 'Mais de 8 horas'];
const SUN_HOURS_NUM = [2, 4, 6, 8, 9];

export function SunPage() {
  const { sunReports, addSunReport } = useApp();
  const [location, setLocation] = useState('');
  const [orientation, setOrientation] = useState('');
  const [hoursOpt, setHoursOpt] = useState('');
  const [obstructions, setObstructions] = useState(false);
  const [photos, setPhotos] = useState<{ morning: string | null; noon: string | null; evening: string | null }>({ morning: null, noon: null, evening: null });
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<SunReport | null>(null);

  const onPhoto = (slot: 'morning' | 'noon' | 'evening') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const dataUrl = r.result as string;
      const v = validateImage(dataUrl);
      if (!v.ok) return;
      setPhotos(p => ({ ...p, [slot]: dataUrl }));
    };
    r.readAsDataURL(f);
  };

  const hoursNum = hoursOpt === '' ? 0 : SUN_HOURS_NUM[parseInt(hoursOpt)];
  const canAnalyze = !!orientation && hoursOpt !== '';

  const analyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      const hours = hoursNum;
      let classification: SunClass = 'sombra';
      if (hours >= 6) classification = 'sol-pleno';
      else if (hours >= 4) classification = 'sol-parcial';
      else if (hours >= 2) classification = 'meia-sombra';
      else classification = 'sombra';

      const burnRisk = hours >= 7 && !obstructions ? 'alto' : hours >= 5 ? 'moderado' : 'baixo';
      const needsShadeNet = burnRisk === 'alto';
      const bestWateringHour = hours >= 6 ? 'ao nascer do dia ou ao pôr-do-sol' : 'manhã, para evitar humidade noturna';
      const suggestedPlants = plantsForClass(classification);

      const r: SunReport = {
        id: 'sun-' + Date.now(),
        date: new Date().toISOString(),
        location: location || 'Não indicada',
        orientation,
        hours,
        hasObstructions: obstructions,
        classification,
        sunHours: hours,
        burnRisk: burnRisk as 'baixo' | 'moderado' | 'alto',
        needsShadeNet,
        bestWateringHour,
        suggestedPlants,
      };
      setReport(r);
      addSunReport(r);
      setAnalyzing(false);
    }, 1400);
  };

  return (
    <PageShell>
      <SectionTitle icon={<Sun size={22} />} title="Analisar este local" subtitle="Indique a orientação, horas de sol e fotografe o local em diferentes momentos." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-forest-900"><MapPin size={18} className="text-forest-600" /> Localização</h3>
            <div className="space-y-4">
              <Input label="Local (endereço ou referência)" placeholder="Ex.: Quintal de trás, facing Sul" value={location} onChange={e => setLocation(e.target.value)} />
              <Select label="Orientação do terreno" value={orientation} onChange={e => setOrientation(e.target.value)}>
                <option value="">Selecione…</option>{ORIENTATIONS.map(o => <option key={o}>{o}</option>)}
              </Select>
              <Select label="Horas aproximadas de sol direto" value={hoursOpt} onChange={e => setHoursOpt(e.target.value)}>
                <option value="">Selecione…</option>{SUN_HOURS.map((o, i) => <option key={o} value={String(i)}>{o}</option>)}
              </Select>
              <label className="flex items-center gap-3 rounded-xl bg-forest-50/60 px-4 py-3">
                <input type="checkbox" checked={obstructions} onChange={e => setObstructions(e.target.checked)} className="h-4 w-4 accent-forest-600" />
                <span className="flex items-center gap-2 text-sm text-forest-700"><Building2 size={16} /> Existem muros, árvores ou edifícios a fazer sombra</span>
              </label>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-forest-900"><Camera size={18} className="text-wheat-600" /> Fotografias do local</h3>
            <div className="grid grid-cols-3 gap-3">
              {([
                { slot: 'morning' as const, label: 'Manhã', icon: <Sunrise size={18} /> },
                { slot: 'noon' as const, label: 'Meio-dia', icon: <SunNoon size={18} /> },
                { slot: 'evening' as const, label: 'Fim da tarde', icon: <Sunset size={18} /> },
              ]).map(p => (
                <label key={p.slot} className="group cursor-pointer">
                  <div className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-forest-200 bg-forest-50/40 text-forest-500 transition-all hover:border-forest-400">
                    {photos[p.slot] ? <img src={photos[p.slot]!} alt={p.label} className="h-full w-full rounded-lg object-cover" /> : (<><span className="text-forest-400">{p.icon}</span><span className="text-xs font-medium">{p.label}</span></>)}
                  </div>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto(p.slot)} />
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-forest-400">Fotografias opcionais mas recomendadas para avaliar a sombra ao longo do dia.</p>
          </Card>

          <Button size="lg" className="w-full" disabled={!canAnalyze || analyzing} onClick={analyze}>
            <Sparkles size={20} /> {analyzing ? 'A analisar exposição…' : 'Analisar este local'}
          </Button>
        </div>

        {/* Result */}
        <div>
          {report ? <SunResultCard report={report} /> : (
            <EmptyState icon={<Sun size={32} />} title="A análise aparecerá aqui" hint="Preencha os dados à esquerda e carregue em analisar." />
          )}
        </div>
      </div>

      {/* History */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-forest-900">Análises anteriores</h3>
          <Badge tone="neutral">{sunReports.length}</Badge>
        </div>
        {sunReports.length === 0 ? (
          <EmptyState icon={<Compass size={32} />} title="Ainda não tem análises de exposição solar" />
        ) : (
          <div className="space-y-2">
            {sunReports.map(r => (
              <Card key={r.id} className="flex items-center gap-4 p-4" onClick={() => setReport(r)}>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-wheat-100 text-wheat-700"><Sun size={24} /></div>
                <div className="flex-1">
                  <p className="font-semibold capitalize text-forest-900">{classLabel(r.classification)}</p>
                  <p className="text-sm text-forest-500">{formatDate(r.date)} · {r.location} · {r.hours} h sol</p>
                </div>
                {r.burnRisk === 'alto' && <Badge tone="rust"><Flame size={12} /> Queimadura</Badge>}
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function SunResultCard({ report }: { report: SunReport }) {
  const classColor: Record<SunClass, string> = {
    'sombra': 'from-sky2-500 to-sky2-600',
    'meia-sombra': 'from-forest-500 to-forest-600',
    'sol-parcial': 'from-wheat-500 to-wheat-600',
    'sol-pleno': 'from-terracotta-500 to-terracotta-600',
  };
  return (
    <Card className="overflow-hidden animate-scaleIn">
      <div className={`flex items-center gap-4 bg-gradient-to-br ${classColor[report.classification]} p-5 text-white`}>
        <Sun size={36} />
        <div>
          <p className="text-sm opacity-90">Classificação do local</p>
          <p className="font-display text-2xl font-semibold">{classLabel(report.classification)}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-3xl font-bold">{report.sunHours}<span className="text-lg opacity-80">h</span></p>
          <p className="text-xs opacity-90">sol direto</p>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <ResultRow icon={<Flame size={16} />} label="Risco de queimadura solar" value={<span className="capitalize">{report.burnRisk}</span>} tone={report.burnRisk === 'alto' ? 'rust' : report.burnRisk === 'moderado' ? 'amber' : 'leaf'} />
        <ResultRow icon={<TreePine size={16} />} label="Rede de sombra necessária?" value={report.needsShadeNet ? 'Sim, recomenda-se' : 'Não necessária'} tone={report.needsShadeNet ? 'amber' : 'leaf'} />
        <ResultRow icon={<Droplet size={16} />} label="Melhor horário de rega" value={report.bestWateringHour} />
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-forest-800"><CheckCircle2 size={16} className="text-leaf-600" /> Plantas adequadas para este local</p>
          <div className="flex flex-wrap gap-2">
            {report.suggestedPlants.map(p => <Badge key={p} tone="forest">{p}</Badge>)}
          </div>
        </div>
        {report.burnRisk === 'alto' && (
          <div className="flex items-start gap-2 rounded-xl bg-rust-50 px-4 py-3 text-sm text-rust-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> Plantas jovens e de folha larga podem queimar. Considere uma rede de sombra de 30–50% durante o verão.
          </div>
        )}
      </div>
    </Card>
  );
}

function ResultRow({ icon, label, value, tone = 'forest' }: { icon: React.ReactNode; label: string; value: React.ReactNode; tone?: 'forest' | 'rust' | 'amber' | 'leaf' }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-forest-50/50 px-4 py-3">
      <span className="flex items-center gap-2 text-sm text-forest-600">{icon} {label}</span>
      <Badge tone={tone}>{value}</Badge>
    </div>
  );
}

function classLabel(c: SunClass): string {
  return { 'sombra': 'Sombra', 'meia-sombra': 'Meia-sombra', 'sol-parcial': 'Sol parcial', 'sol-pleno': 'Sol pleno' }[c];
}

function plantsForClass(c: SunClass): string[] {
  if (c === 'sol-pleno') return ['Tomateiro', 'Pimentão', 'Abóbora', 'Melancia', 'Alecrim', 'Lavanda', 'Girassol'];
  if (c === 'sol-parcial') return ['Alface', 'Morangueiro', 'Couve', 'Manjericão', 'Salsa', 'Calêndula'];
  if (c === 'meia-sombra') return ['Salsa', 'Hortelã', 'Espinafre', 'Couve', 'Alface'];
  return ['Hortelã', 'Espinafre', 'Samambaia', 'Hosta', 'Begónia'];
}

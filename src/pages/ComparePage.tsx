import { useState } from 'react';
import { Scale, Camera, Upload, AlertCircle, Sparkles, ArrowLeftRight } from 'lucide-react';
import { useApp } from '../store';
import { PageShell, Card, Button, SectionTitle, EmptyState } from '../components/ui';
import { formatDate } from '../data';
import { validateImage } from '../lib/photos';

interface CompareState {
  before: string | null;
  after: string | null;
  beforeDate: string;
  afterDate: string;
}

export function ComparePage() {
  const { plants } = useApp();
  const [state, setState] = useState<CompareState>({ before: null, after: null, beforeDate: '', afterDate: '' });
  const [comparing, setComparing] = useState(false);
  const [aiNotConfigured, setAiNotConfigured] = useState(false);

  const onFile = (slot: 'before' | 'after') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const dataUrl = r.result as string;
      const v = validateImage(dataUrl);
      if (!v.ok) return;
      setState(s => ({ ...s, [slot]: dataUrl }));
    };
    r.readAsDataURL(f);
  };

  const compare = () => {
    setComparing(true);
    setAiNotConfigured(false);
    // Without AI configured, we do NOT fake a comparison result.
    // We show an honest message and let the user compare visually.
    setTimeout(() => { setComparing(false); setAiNotConfigured(true); }, 800);
  };

  const canCompare = state.before && state.after;

  return (
    <PageShell>
      <SectionTitle icon={<Scale size={22} />} title="Comparação de fotografias" subtitle="Compare fotos tiradas em datas diferentes para avaliar a evolução da planta." />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Before */}
        <PhotoSlot
          label="Antes"
          date={state.beforeDate}
          onDate={v => setState(s => ({ ...s, beforeDate: v }))}
          image={state.before}
          onFile={onFile('before')}
        />
        {/* After */}
        <PhotoSlot
          label="Depois"
          date={state.afterDate}
          onDate={v => setState(s => ({ ...s, afterDate: v }))}
          image={state.after}
          onFile={onFile('after')}
        />
      </div>

      <Button size="lg" className="mt-5 w-full" disabled={!canCompare || comparing} onClick={compare}>
        {comparing ? <><Sparkles size={20} /> A comparar…</> : <><ArrowLeftRight size={20} /> Comparar fotografias</>}
      </Button>

      {aiNotConfigured && (
        <Card className="mt-6 border-forest-200 bg-forest-50/40 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={24} className="shrink-0 text-forest-600" />
            <div>
              <p className="font-semibold text-forest-900">Comparação automática indisponível</p>
              <p className="mt-1 text-sm text-forest-700">A comparação por inteligência artificial ainda não está ligada. Pode comparar as duas fotografias visualmente lado a lado. Para ativar a comparação automática, ligue a IA de análise de fotografias no Supabase.</p>
            </div>
          </div>
        </Card>
      )}

      {plants.length === 0 && (
        <div className="mt-8">
          <EmptyState icon={<Camera size={32} />} title="Sem plantas no diário" hint="Adicione plantas no diário da horta para comparações futuras." />
        </div>
      )}
    </PageShell>
  );
}

function PhotoSlot({ label, date, onDate, image, onFile }: {
  label: string; date: string; onDate: (v: string) => void; image: string | null; onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-forest-50 px-4 py-3">
        <Camera size={16} className="text-forest-600" />
        <h3 className="font-semibold text-forest-900">{label}</h3>
      </div>
      <div className="p-4">
        {image ? (
          <div className="relative">
            <img src={image} alt={label} className="h-56 w-full rounded-xl object-cover" />
            <label className="absolute bottom-2 right-2 cursor-pointer rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-forest-700 backdrop-blur hover:bg-white">
              Trocar
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed border-forest-200 py-8 hover:border-forest-400 hover:bg-forest-50">
              <Camera size={22} className="text-forest-600" /><span className="text-xs font-medium text-forest-600">Tirar foto</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
            </label>
            <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed border-forest-200 py-8 hover:border-forest-400 hover:bg-forest-50">
              <Upload size={22} className="text-terracotta-500" /><span className="text-xs font-medium text-forest-600">Carregar</span>
              <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            </label>
          </div>
        )}
        <input type="date" value={date} onChange={e => onDate(e.target.value)} className="input-base mt-3" />
        {date && <p className="mt-1.5 text-xs text-forest-400">{formatDate(new Date(date).toISOString())}</p>}
      </div>
    </Card>
  );
}

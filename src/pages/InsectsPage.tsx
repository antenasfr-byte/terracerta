import { useState, useEffect } from 'react';
import { Bug, Camera, Upload, Search, ThumbsUp, ThumbsDown, Minus, AlertTriangle, Skull, Loader2 } from 'lucide-react';
import { useApp } from '../store';
import { PageShell, Card, Badge, Button, SectionTitle, Input } from '../components/ui';
import { loadInsects, loadWeeds } from '../data';
import { validateImage } from '../lib/photos';
import type { Insect, Weed, InsectType } from '../types';

type Tab = 'insetos' | 'ervas';

export function InsectsPage() {
  const { navigate } = useApp();
  const [tab, setTab] = useState<Tab>('insetos');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<InsectType | 'todos'>('todos');
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{ insectId: string } | null>(null);
  const [noAi, setNoAi] = useState(false);
  const [insects, setInsects] = useState<Insect[]>([]);
  const [weeds, setWeeds] = useState<Weed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadInsects(), loadWeeds()]).then(([i, w]) => { setInsects(i); setWeeds(w); setLoading(false); });
  }, []);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const dataUrl = r.result as string;
      const v = validateImage(dataUrl);
      if (!v.ok) return;
      setImage(dataUrl);
    };
    r.readAsDataURL(f);
  };
  const identify = () => {
    setAnalyzing(true);
    setNoAi(false);
    // Without AI configured, we do NOT fake an identification.
    // We show an honest message asking the user to consult the catalog below.
    setTimeout(() => { setAnalyzing(false); setNoAi(true); }, 800);
  };

  const filteredInsects = insects.filter(i => (filter === 'todos' || i.type === filter) && i.name.toLowerCase().includes(search.toLowerCase()));
  const filteredWeeds = weeds.filter(w => w.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageShell>
      <SectionTitle icon={<Bug size={22} />} title="Insetos e ervas" subtitle="Identifique pragas, insetos benéficos, ervas daninhas e plantas tóxicas." />

      <Card className="mb-6 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-forest-50 px-5 py-3"><Camera size={18} className="text-sky2-500" /><h3 className="font-semibold text-forest-900">Identificar por fotografia</h3></div>
        <div className="p-5">
          {!image ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-forest-200 py-8 hover:border-forest-400 hover:bg-forest-50"><Camera size={26} className="text-forest-600" /><span className="text-sm font-medium text-forest-700">Tirar fotografia</span><input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} /></label>
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-forest-200 py-8 hover:border-forest-400 hover:bg-forest-50"><Upload size={26} className="text-terracotta-500" /><span className="text-sm font-medium text-forest-700">Carregar imagem</span><input type="file" accept="image/*" className="hidden" onChange={onFile} /></label>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <img src={image} alt="Inseto" className="h-48 w-full max-w-sm rounded-xl object-cover" />
              {result ? (
                <div className="w-full max-w-sm">
                  {(() => { const insect = insects.find(i => i.id === result.insectId); return insect ? <InsectResultCard insect={insect} /> : <p className="text-sm text-forest-500">Não foi possível identificar.</p>; })()}
                  <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => { setImage(null); setResult(null); }}>Nova identificação</Button>
                </div>
              ) : analyzing ? <p className="flex items-center gap-2 text-forest-600"><Loader2 className="animate-spin" size={18} /> A identificar…</p> : <Button onClick={identify}><Search size={18} /> Identificar</Button>}
              {noAi && (
                <div className="mt-3 w-full max-w-sm rounded-xl bg-forest-50 p-4 text-sm text-forest-700">
                  <p className="flex items-center gap-2 font-semibold text-forest-800"><AlertTriangle size={16} /> Identificação por IA indisponível</p>
                  <p className="mt-1">A identificação automática de insetos por fotografia ainda não está ligada. Consulte o catálogo abaixo para identificar manualmente pelo nome e sinais.</p>
                  <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => { setImage(null); setNoAi(false); }}>Novo</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="mb-4 flex gap-2">
        <button onClick={() => setTab('insetos')} className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${tab === 'insetos' ? 'bg-forest-600 text-white' : 'bg-white text-forest-600 hover:bg-forest-50'}`}>Insetos</button>
        <button onClick={() => setTab('ervas')} className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${tab === 'ervas' ? 'bg-forest-600 text-white' : 'bg-white text-forest-600 hover:bg-forest-50'}`}>Ervas e invasoras</button>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1"><Input placeholder={`Procurar ${tab === 'insetos' ? 'insetos' : 'ervas'}…`} value={search} onChange={e => setSearch(e.target.value)} /></div>
        {tab === 'insetos' && <div className="flex gap-2">{(['todos', 'prejudicial', 'benéfico', 'neutro'] as const).map(f => <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-forest-600 text-white' : 'bg-white text-forest-600 hover:bg-forest-50'}`}>{f}</button>)}</div>}
      </div>

      {loading ? <div className="flex items-center gap-2 text-forest-500"><Loader2 size={18} className="animate-spin" /> A carregar…</div> : tab === 'insetos' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{filteredInsects.map(i => <InsectCard key={i.id} insect={i} onTreat={() => navigate('diagnose')} />)}</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredWeeds.map(w => (
            <Card key={w.id} className="p-4">
              <div className="flex items-start gap-3"><span className="text-3xl">{w.emoji}</span><div className="flex-1"><p className="font-semibold text-forest-900">{w.name}</p><div className="mt-1 flex flex-wrap gap-1.5">{w.invasive && <Badge tone="amber">Invasora</Badge>}{w.toxic && <Badge tone="rust"><Skull size={11} /> Tóxica</Badge>}{!w.invasive && !w.toxic && <Badge tone="leaf">Comestível/útil</Badge>}</div></div></div>
              <p className="mt-3 text-sm text-forest-600">{w.description}</p>
              <div className="mt-3 rounded-xl bg-forest-50/60 px-3 py-2.5 text-sm text-forest-700"><span className="font-semibold">Controlo: </span>{w.control}</div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function InsectCard({ insect }: { insect: Insect; onTreat: () => void }) {
  const meta = insect.type === 'prejudicial' ? { tone: 'rust' as const, icon: <ThumbsDown size={14} />, label: 'Prejudicial' } : insect.type === 'benéfico' ? { tone: 'leaf' as const, icon: <ThumbsUp size={14} />, label: 'Benéfico' } : { tone: 'neutral' as const, icon: <Minus size={14} />, label: 'Neutro' };
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3"><span className="text-3xl">{insect.emoji}</span><div className="flex-1"><p className="font-semibold text-forest-900">{insect.name}</p><Badge tone={meta.tone} className="mt-1">{meta.icon} {meta.label}</Badge></div></div>
      <p className="mt-3 text-sm text-forest-600">{insect.description}</p>
      <div className="mt-3"><p className="text-xs font-semibold text-forest-700">Sinais:</p><ul className="mt-1 space-y-0.5 text-sm text-forest-600">{insect.signs.map((s, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-forest-300">•</span>{s}</li>)}</ul></div>
      {insect.treatment && <div className="mt-3 rounded-xl bg-amber2-50 px-3 py-2.5 text-sm text-amber2-800"><span className="flex items-center gap-1 font-semibold"><AlertTriangle size={13} /> Tratamento: </span>{insect.treatment}</div>}
    </Card>
  );
}

function InsectResultCard({ insect }: { insect: Insect }) {
  const meta = insect.type === 'prejudicial' ? { tone: 'rust' as const, bg: 'bg-rust-50', label: 'Prejudicial — combater' } : insect.type === 'benéfico' ? { tone: 'leaf' as const, bg: 'bg-leaf-50', label: 'Benéfico — proteger' } : { tone: 'neutral' as const, bg: 'bg-gray-50', label: 'Neutro — sem ação necessária' };
  return (
    <Card className={`p-4 ${meta.bg}`}>
      <div className="flex items-center gap-3"><span className="text-4xl">{insect.emoji}</span><div><p className="font-semibold text-forest-900">{insect.name}</p><Badge tone={meta.tone} className="mt-1">{meta.label}</Badge></div></div>
      <p className="mt-3 text-sm text-forest-700">{insect.description}</p>
      {insect.treatment && <p className="mt-2 text-sm font-medium text-amber2-800">Tratamento: {insect.treatment}</p>}
    </Card>
  );
}

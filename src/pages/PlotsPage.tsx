import { useState } from 'react';
import { Leaf, Plus, MapPin, Ruler, Sprout } from 'lucide-react';
import { useApp } from '../store';
import { PageShell, Card, Badge, Button, Modal, Input, Select, SectionTitle, EmptyState } from '../components/ui';
import { REGION_NAMES, formatDate } from '../data';
import type { Plot, PlantEntry } from '../types';

export function PlotsPage() {
  const { plots, plants, addPlot, addPlant, navigate } = useApp();
  const [plotOpen, setPlotOpen] = useState(false);
  const [plantOpen, setPlantOpen] = useState(false);
  const [pName, setPName] = useState('');
  const [pArea, setPArea] = useState('');
  const [pLoc, setPLoc] = useState('Estremadura');
  const [plotId, setPlotId] = useState(plots[0]?.id ?? '');
  const [plName, setPlName] = useState('');
  const [plVariety, setPlVariety] = useState('');

  const savePlot = () => {
    if (!pName) return;
    const p: Plot = { id: 'plot-' + Date.now(), name: pName, area: pArea || '—', location: pLoc, createdAt: new Date().toISOString() };
    addPlot(p); setPlotOpen(false); setPName(''); setPArea('');
  };
  const savePlant = () => {
    if (!plName || !plotId) return;
    const pe: PlantEntry = { id: 'pe-' + Date.now(), plotId, name: plName, variety: plVariety, plantedAt: new Date().toISOString(), status: 'viva', notes: '' };
    addPlant(pe); setPlantOpen(false); setPlName(''); setPlVariety('');
  };

  return (
    <PageShell>
      <SectionTitle
        icon={<Leaf size={22} />}
        title="Terrenos e parcelas"
        subtitle="Crie e organize os seus terrenos e as plantas em cada um."
        action={<Button size="sm" onClick={() => setPlotOpen(true)}><Plus size={16} /> Terreno</Button>}
      />

      {plots.length === 0 ? (
        <EmptyState icon={<Leaf size={32} />} title="Ainda não tem terrenos" hint="Crie o seu primeiro terreno para começar a organizar a horta." />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {plots.map(plot => {
            const plotPlants = plants.filter(p => p.plotId === plot.id);
            return (
              <Card key={plot.id} className="overflow-hidden">
                <div className="flex items-center gap-3 bg-gradient-to-br from-forest-600 to-forest-700 p-4 text-white">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"><Leaf size={22} /></div>
                  <div className="flex-1">
                    <p className="font-display text-lg font-semibold">{plot.name}</p>
                    <p className="text-xs text-forest-100">Criado {formatDate(plot.createdAt)}</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-3 flex flex-wrap gap-3 text-sm text-forest-600">
                    <span className="flex items-center gap-1"><Ruler size={14} /> {plot.area}</span>
                    <span className="flex items-center gap-1"><MapPin size={14} /> {plot.location}</span>
                    <span className="flex items-center gap-1"><Sprout size={14} /> {plotPlants.length} plantas</span>
                  </div>
                  <div className="space-y-2">
                    {plotPlants.map(p => (
                      <div key={p.id} className="flex items-center gap-3 rounded-xl bg-forest-50/60 px-3 py-2.5">
                        <span className="text-lg">{p.status === 'colhida' ? '🌾' : p.status === 'perdida' ? '🥀' : '🌱'}</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-forest-900">{p.name}</p>
                          <p className="text-xs text-forest-500">{p.variety}</p>
                        </div>
                        <Badge tone={p.status === 'viva' ? 'leaf' : p.status === 'colhida' ? 'wheat' : 'rust'} className="capitalize">{p.status}</Badge>
                      </div>
                    ))}
                    {plotPlants.length === 0 && <p className="py-2 text-center text-sm text-forest-400">Sem plantas neste terreno.</p>}
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => { setPlotId(plot.id); setPlantOpen(true); }}><Plus size={15} /> Adicionar planta</Button>
                  <Button variant="ghost" size="sm" className="mt-1 w-full" onClick={() => navigate('journal')}>Ver no diário</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={plotOpen} onClose={() => setPlotOpen(false)} title="Novo terreno">
        <div className="space-y-4">
          <Input label="Nome do terreno" placeholder="Ex.: Horta do quintal" value={pName} onChange={e => setPName(e.target.value)} />
          <Input label="Área" placeholder="Ex.: 32 m²" value={pArea} onChange={e => setPArea(e.target.value)} />
          <Select label="Região" value={pLoc} onChange={e => setPLoc(e.target.value)}>{REGION_NAMES.map(r => <option key={r}>{r}</option>)}</Select>
          <Button className="w-full" onClick={savePlot} disabled={!pName}>Criar terreno</Button>
        </div>
      </Modal>

      <Modal open={plantOpen} onClose={() => setPlantOpen(false)} title="Adicionar planta">
        <div className="space-y-4">
          <Select label="Terreno" value={plotId} onChange={e => setPlotId(e.target.value)}>
            {plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Input label="Nome da planta" placeholder="Ex.: Tomateiro" value={plName} onChange={e => setPlName(e.target.value)} />
          <Input label="Variedade" placeholder="Ex.: Coração de boi" value={plVariety} onChange={e => setPlVariety(e.target.value)} />
          <Button className="w-full" onClick={savePlant} disabled={!plName}>Adicionar planta</Button>
        </div>
      </Modal>
    </PageShell>
  );
}


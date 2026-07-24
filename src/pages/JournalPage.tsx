import { useState } from 'react';
import {
  NotebookPen, Plus, Camera, Droplet, Sprout, FlaskConical, Bug, Coins,
  Eye, CalendarDays, MapPin,
} from 'lucide-react';
import { useApp } from '../store';
import { PageShell, Card, Badge, Button, Modal, Input, Select, Textarea, SectionTitle, EmptyState } from '../components/ui';
import { formatDate } from '../data';
import type { JournalEvent, PlantEntry } from '../types';

const EVENT_META: Record<JournalEvent['type'], { icon: React.ReactNode; tone: 'sky' | 'leaf' | 'amber' | 'rust' | 'wheat' | 'forest' | 'neutral' | 'terracotta'; label: string }> = {
  rega: { icon: <Droplet size={15} />, tone: 'sky', label: 'Rega' },
  adubação: { icon: <Sprout size={15} />, tone: 'leaf', label: 'Adubação' },
  tratamento: { icon: <FlaskConical size={15} />, tone: 'amber', label: 'Tratamento' },
  doença: { icon: <Bug size={15} />, tone: 'rust', label: 'Doença' },
  colheita: { icon: <CalendarDays size={15} />, tone: 'leaf', label: 'Colheita' },
  despesa: { icon: <Coins size={15} />, tone: 'wheat', label: 'Despesa' },
  observação: { icon: <Eye size={15} />, tone: 'forest', label: 'Observação' },
  fotografia: { icon: <Camera size={15} />, tone: 'terracotta', label: 'Fotografia' },
};

export function JournalPage() {
  const { plants, events, plots, addEvent, navigate } = useApp();
  const [selected, setSelected] = useState<PlantEntry | null>(plants[0] ?? null);
  const [addOpen, setAddOpen] = useState(false);
  const [newType, setNewType] = useState<JournalEvent['type']>('observação');
  const [newTitle, setNewTitle] = useState('');
  const [newDetail, setNewDetail] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const plantEvents = events.filter(e => e.plantEntryId === selected?.id).sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const saveEvent = () => {
    if (!selected || !newTitle) return;
    const ev: JournalEvent = {
      id: 'ev-' + Date.now(),
      plantEntryId: selected.id,
      date: new Date().toISOString(),
      type: newType,
      title: newTitle,
      detail: newDetail,
      amount: newAmount ? +newAmount : undefined,
    };
    addEvent(ev);
    setAddOpen(false); setNewTitle(''); setNewDetail(''); setNewAmount('');
  };

  const totalSpent = plantEvents.filter(e => e.type === 'despesa' && e.amount).reduce((s, e) => s + (e.amount ?? 0), 0);

  return (
    <PageShell>
      <SectionTitle
        icon={<NotebookPen size={22} />}
        title="Diário da horta"
        subtitle="Acompanhe a evolução de cada planta: rega, adubação, tratamentos, despesas e colheitas."
        action={<Button size="sm" onClick={() => setAddOpen(true)}><Plus size={16} /> Registo</Button>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Plant list */}
        <div className="lg:col-span-1">
          <h3 className="mb-3 font-semibold text-forest-900">Plantas</h3>
          <div className="space-y-2">
            {plants.map(p => {
              const plot = plots.find(pl => pl.id === p.plotId);
              return (
                <Card key={p.id} onClick={() => setSelected(p)} className={`p-3.5 ${selected?.id === p.id ? 'ring-1 ring-forest-500' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-lg">
                      {p.status === 'colhida' ? '🌾' : p.status === 'perdida' ? '🥀' : '🌱'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-forest-900">{p.name}</p>
                      <p className="truncate text-xs text-forest-500">{p.variety} · {plot?.name}</p>
                    </div>
                    <Badge tone={p.status === 'viva' ? 'leaf' : p.status === 'colhida' ? 'wheat' : 'rust'} className="capitalize">{p.status}</Badge>
                  </div>
                </Card>
              );
            })}
          </div>
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate('plots')}><Plus size={15} /> Gerir terrenos e plantas</Button>
        </div>

        {/* Timeline */}
        <div className="lg:col-span-2">
          {selected ? (
            <>
              <Card className="mb-5 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-forest-900">{selected.name}</h3>
                    <p className="text-sm text-forest-600">{selected.variety}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-forest-500">
                      <span className="flex items-center gap-1"><CalendarDays size={13} /> Plantada {formatDate(selected.plantedAt)}</span>
                      <span className="flex items-center gap-1"><MapPin size={13} /> {plots.find(p => p.id === selected.plotId)?.name}</span>
                    </div>
                  </div>
                  {totalSpent > 0 && <Badge tone="wheat"><Coins size={12} /> {totalSpent.toFixed(2)} €</Badge>}
                </div>
                {selected.notes && <p className="mt-3 rounded-xl bg-forest-50/60 px-4 py-2.5 text-sm text-forest-700">{selected.notes}</p>}
              </Card>

              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold text-forest-900">Linha do tempo</h4>
                <Button size="sm" variant="ghost" onClick={() => setAddOpen(true)}><Plus size={15} /> Adicionar</Button>
              </div>

              {plantEvents.length === 0 ? (
                <EmptyState icon={<NotebookPen size={32} />} title="Sem registos" hint="Adicione rega, tratamentos ou observações." />
              ) : (
                <div className="relative space-y-3 before:absolute before:left-[19px] before:top-2 before:h-full before:w-0.5 before:bg-forest-100">
                  {plantEvents.map(ev => {
                    const meta = EVENT_META[ev.type];
                    return (
                      <div key={ev.id} className="relative flex gap-4">
                        <div className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-[#f6f7f3] ${toneBg(meta.tone)} text-white`}>{meta.icon}</div>
                        <Card className="flex-1 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <Badge tone={meta.tone}>{meta.label}</Badge>
                            <span className="text-xs text-forest-400">{formatDate(ev.date)}</span>
                          </div>
                          <p className="mt-2 font-semibold text-forest-900">{ev.title}</p>
                          {ev.detail && <p className="mt-0.5 text-sm text-forest-600">{ev.detail}</p>}
                          {ev.amount !== undefined && <p className="mt-1 text-sm font-semibold text-wheat-700">{ev.amount.toFixed(2)} €</p>}
                        </Card>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <EmptyState icon={<NotebookPen size={32} />} title="Selecione uma planta" hint="Escolha uma planta à esquerda para ver o diário." />
          )}
        </div>
      </div>

      {/* Add event modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Adicionar registo">
        <div className="space-y-4">
          <Select label="Tipo de registo" value={newType} onChange={e => setNewType(e.target.value as JournalEvent['type'])}>
            {Object.entries(EVENT_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
          </Select>
          <Input label="Título" placeholder="Ex.: Rega profunda" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
          <Textarea label="Detalhe" placeholder="Notas adicionais…" value={newDetail} onChange={e => setNewDetail(e.target.value)} />
          {newType === 'despesa' && <Input label="Valor (€)" type="number" placeholder="0.00" value={newAmount} onChange={e => setNewAmount(e.target.value)} />}
          <Button className="w-full" onClick={saveEvent} disabled={!newTitle}>Guardar registo</Button>
        </div>
      </Modal>
    </PageShell>
  );
}

function toneBg(tone: string): string {
  const map: Record<string, string> = {
    sky: 'bg-sky2-500', leaf: 'bg-leaf-500', amber: 'bg-amber2-500', rust: 'bg-rust-500',
    wheat: 'bg-wheat-500', forest: 'bg-forest-500', neutral: 'bg-gray-400', terracotta: 'bg-terracotta-500',
  };
  return map[tone] ?? 'bg-forest-500';
}


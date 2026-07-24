import { useState } from 'react';
import { Bell, Plus, Check, Droplet, Sprout, Bug, Camera, Scissors, CalendarCheck } from 'lucide-react';
import { useApp } from '../store';
import { PageShell, Card, Badge, Button, Modal, Input, Select, SectionTitle, EmptyState } from '../components/ui';
import { relativeDay, formatDate } from '../data';
import type { Reminder } from '../types';

const TYPE_META: Record<Reminder['type'], { icon: React.ReactNode; tone: 'sky' | 'leaf' | 'amber' | 'rust' | 'terracotta' | 'forest' | 'wheat'; label: string }> = {
  regar: { icon: <Droplet size={18} />, tone: 'sky', label: 'Regar' },
  adubar: { icon: <Sprout size={18} />, tone: 'leaf', label: 'Adubar' },
  tratamento: { icon: <Bug size={18} />, tone: 'amber', label: 'Tratamento' },
  fotografia: { icon: <Camera size={18} />, tone: 'terracotta', label: 'Fotografia' },
  podar: { icon: <Scissors size={18} />, tone: 'forest', label: 'Podar' },
  plantar: { icon: <Sprout size={18} />, tone: 'leaf', label: 'Plantar' },
  colher: { icon: <CalendarCheck size={18} />, tone: 'wheat', label: 'Colher' },
};

export function RemindersPage() {
  const { reminders, toggleReminder, addReminder, plots } = useApp();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'todos' | 'pendentes' | 'feitos'>('pendentes');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Reminder['type']>('regar');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [plotId, setPlotId] = useState('');

  const filtered = reminders.filter(r => filter === 'todos' ? true : filter === 'pendentes' ? !r.done : r.done).sort((a, b) => +new Date(a.date) - +new Date(b.date));

  const save = () => {
    if (!title) return;
    const r: Reminder = { id: 'r-' + Date.now(), title, type, date: new Date(date).toISOString(), plotId: plotId || undefined, done: false };
    addReminder(r); setOpen(false); setTitle('');
  };

  const pending = reminders.filter(r => !r.done).length;

  return (
    <PageShell>
      <SectionTitle
        icon={<Bell size={22} />}
        title="Lembretes"
        subtitle={`${pending} lembretes pendentes`}
        action={<Button size="sm" onClick={() => setOpen(true)}><Plus size={16} /> Novo</Button>}
      />

      {/* Filter */}
      <div className="mb-5 flex gap-2">
        {(['pendentes', 'feitos', 'todos'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-forest-600 text-white' : 'bg-white text-forest-600 hover:bg-forest-50'}`}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Bell size={32} />} title="Sem lembretes" hint="Crie um lembrete para regar, adubar ou tratar as suas plantas." />
      ) : (
        <div className="space-y-2">
          {filtered.map(r => {
            const meta = TYPE_META[r.type];
            const plot = plots.find(p => p.id === r.plotId);
            const overdue = !r.done && new Date(r.date) < new Date();
            return (
              <Card key={r.id} className={`flex items-center gap-4 p-4 ${r.done ? 'opacity-60' : ''}`}>
                <button onClick={() => toggleReminder(r.id)} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${r.done ? 'bg-leaf-100 text-leaf-600' : `${toneBg(meta.tone)} text-white`}`}>
                  {r.done ? <Check size={20} /> : meta.icon}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold text-forest-900 ${r.done ? 'line-through' : ''}`}>{r.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-forest-500">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    {plot && <span>· {plot.name}</span>}
                    <span>· {formatDate(r.date)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${overdue ? 'text-rust-600' : 'text-forest-700'}`}>{relativeDay(r.date)}</p>
                  {overdue && <p className="text-xs text-rust-500">Atrasado</p>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Novo lembrete">
        <div className="space-y-4">
          <Input label="Título" placeholder="Ex.: Regar tomateiros" value={title} onChange={e => setTitle(e.target.value)} />
          <Select label="Tipo" value={type} onChange={e => setType(e.target.value as Reminder['type'])}>
            {Object.entries(TYPE_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
          </Select>
          <Input label="Data" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <Select label="Terreno (opcional)" value={plotId} onChange={e => setPlotId(e.target.value)}>
            <option value="">Nenhum</option>
            {plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Button className="w-full" onClick={save} disabled={!title}>Criar lembrete</Button>
        </div>
      </Modal>
    </PageShell>
  );
}

function toneBg(tone: string): string {
  const map: Record<string, string> = { sky: 'bg-sky2-500', leaf: 'bg-leaf-500', amber: 'bg-amber2-500', rust: 'bg-rust-500', terracotta: 'bg-terracotta-500', forest: 'bg-forest-500', wheat: 'bg-wheat-500' };
  return map[tone] ?? 'bg-forest-500';
}


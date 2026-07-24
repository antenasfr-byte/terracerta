import { useState, useEffect } from 'react';
import {
  Shield, Users, Sprout, Bug, FlaskConical, Package, CalendarDays, MapPin,
  Camera, Crown, Plus, Edit3, Trash2, ChevronRight, Loader2,
} from 'lucide-react';
import { useApp } from '../store';
import { PageShell, Card, Badge, SectionTitle, EmptyState } from '../components/ui';
import { supabase } from '../lib/supabase';
import { loadCrops, loadInsects, REGION_NAMES } from '../data';
import type { Crop, Insect, DiagnosisResult } from '../types';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  region: string;
  is_admin: boolean;
}

type AdminTab = 'users' | 'plants' | 'diseases' | 'pests' | 'treatments' | 'products' | 'calendar' | 'regions' | 'analyses' | 'plans';

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'users', label: 'Utilizadores', icon: <Users size={18} /> },
  { id: 'analyses', label: 'Análises', icon: <Camera size={18} /> },
  { id: 'plants', label: 'Plantas', icon: <Sprout size={18} /> },
  { id: 'diseases', label: 'Doenças', icon: <Bug size={18} /> },
  { id: 'pests', label: 'Pragas', icon: <Bug size={18} /> },
  { id: 'treatments', label: 'Tratamentos', icon: <FlaskConical size={18} /> },
  { id: 'products', label: 'Produtos', icon: <Package size={18} /> },
  { id: 'calendar', label: 'Calendários', icon: <CalendarDays size={18} /> },
  { id: 'regions', label: 'Regiões', icon: <MapPin size={18} /> },
  { id: 'plans', label: 'Planos', icon: <Crown size={18} /> },
];

const DEMO_DISEASES = [
  { id: 'd1', name: 'Oídio', crop: 'Tomateiro, cucurbitáceas', severity: 'moderada' },
  { id: 'd2', name: 'Míldio', crop: 'Tomateiro, batata', severity: 'alta' },
  { id: 'd3', name: 'Podridão apical', crop: 'Tomateiro, pimentão', severity: 'baixa' },
  { id: 'd4', name: 'Fumagina', crop: 'Citrosinos', severity: 'baixa' },
  { id: 'd5', name: 'Botrytis (mofo cinzento)', crop: 'Morangueiro, videira', severity: 'moderada' },
];

const DEMO_PRODUCTS = [
  { name: 'Enxofre molhável 1kg', price: '8,50 €', type: 'Fungicida' },
  { name: 'Sabão potássico 1L', price: '12,90 €', type: 'Inseticida' },
  { name: 'Piretrina natural 250ml', price: '15,00 €', type: 'Inseticida' },
  { name: 'Calcário agrícola 5kg', price: '6,00 €', type: 'Corretor' },
  { name: 'Composto orgânico 20kg', price: '9,50 €', type: 'Adubo' },
];

export function AdminPage() {
  const { user, diagnoses } = useApp();
  const [tab, setTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [insects, setInsects] = useState<Insect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Admin can read all profiles via the is_admin check in RLS
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setUsers(data ?? []);
    });
    Promise.all([loadCrops(), loadInsects()]).then(([c, i]) => { setCrops(c); setInsects(i); setLoading(false); });
  }, []);

  if (!user?.isAdmin) {
    return <PageShell><EmptyState icon={<Shield size={32} />} title="Acesso restrito" hint="Apenas administradores podem aceder a este painel." /></PageShell>;
  }

  const paidUsers = users.filter(u => u.plan !== 'grátis').length;

  return (
    <PageShell>
      <SectionTitle icon={<Shield size={22} />} title="Painel de administração" subtitle="Gerir utilizadores, conteúdo e configurações da aplicação." />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Utilizadores" value={users.length} icon={<Users size={20} />} tone="forest" />
        <StatCard label="Análises" value={diagnoses.length} icon={<Camera size={20} />} tone="sky" />
        <StatCard label="Culturas" value={crops.length} icon={<Sprout size={20} />} tone="leaf" />
        <StatCard label="Planos pagos" value={paidUsers} icon={<Crown size={20} />} tone="wheat" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1 p-3 h-fit">
          <nav className="space-y-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${tab === t.id ? 'bg-forest-600 text-white' : 'text-forest-700 hover:bg-forest-50'}`}>
                <span className={tab === t.id ? 'text-white' : 'text-forest-500'}>{t.icon}</span>
                <span className="flex-1 text-left">{t.label}</span>
                {tab === t.id && <ChevronRight size={14} className="text-white/70" />}
              </button>
            ))}
          </nav>
        </Card>

        <div className="lg:col-span-3">
          {loading ? <div className="flex items-center gap-2 text-forest-500"><Loader2 size={18} className="animate-spin" /> A carregar dados…</div> : (
            <>
              {tab === 'users' && <UsersTab users={users} />}
              {tab === 'analyses' && <AnalysesTab diagnoses={diagnoses} />}
              {tab === 'plants' && <PlantsTab crops={crops} />}
              {tab === 'diseases' && <DiseasesTab />}
              {tab === 'pests' && <PestsTab insects={insects.filter(i => i.type === 'prejudicial')} />}
              {tab === 'treatments' && <TreatmentsTab />}
              {tab === 'products' && <ProductsTab />}
              {tab === 'calendar' && <CalendarTab crops={crops} />}
              {tab === 'regions' && <RegionsTab />}
              {tab === 'plans' && <PlansTab users={users} />}
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: string }) {
  const colors: Record<string, string> = { forest: 'bg-forest-50 text-forest-600', sky: 'bg-sky2-50 text-sky2-600', leaf: 'bg-leaf-50 text-leaf-600', wheat: 'bg-wheat-50 text-wheat-600' };
  return <Card className="p-4"><div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${colors[tone]}`}>{icon}</div><p className="text-2xl font-bold text-forest-900">{value}</p><p className="text-sm text-forest-500">{label}</p></Card>;
}

function AdminTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-forest-50 px-5 py-3"><h3 className="font-semibold text-forest-900">{headers.length} colunas</h3><button className="flex items-center gap-1.5 rounded-lg bg-forest-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-forest-700"><Plus size={14} /> Adicionar</button></div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-forest-50/50 text-left text-xs font-semibold text-forest-600"><tr>{headers.map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-forest-50">{children}</tbody></table></div>
    </Card>
  );
}

function RowActions() {
  return <div className="flex gap-1.5"><button className="rounded-lg p-1.5 text-forest-500 hover:bg-forest-50"><Edit3 size={15} /></button><button className="rounded-lg p-1.5 text-rust-500 hover:bg-rust-50"><Trash2 size={15} /></button></div>;
}

function UsersTab({ users }: { users: AdminUser[] }) {
  return <AdminTable headers={['Utilizador', 'Email', 'Plano', 'Região', '']}>
    {users.map(u => (
      <tr key={u.id} className="hover:bg-forest-50/30">
        <td className="px-4 py-3 font-medium text-forest-900">{u.name}</td>
        <td className="px-4 py-3 text-forest-600">{u.email}</td>
        <td className="px-4 py-3"><Badge tone={u.plan === 'profissional' ? 'wheat' : u.plan === 'premium' ? 'forest' : 'neutral'} className="capitalize">{u.plan}</Badge></td>
        <td className="px-4 py-3 text-forest-600">{u.region}</td>
        <td className="px-4 py-3"><RowActions /></td>
      </tr>
    ))}
    {users.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-forest-400">Sem utilizadores registados.</td></tr>}
  </AdminTable>;
}

function AnalysesTab({ diagnoses }: { diagnoses: DiagnosisResult[] }) {
  return <AdminTable headers={['Data', 'Planta', 'Problema', 'Confiança', '']}>
    {diagnoses.map(d => (
      <tr key={d.id} className="hover:bg-forest-50/30">
        <td className="px-4 py-3 text-forest-600">{new Date(d.date).toLocaleDateString('pt-PT')}</td>
        <td className="px-4 py-3 font-medium text-forest-900">{d.plantGuess}</td>
        <td className="px-4 py-3 text-forest-600">{d.primaryProblem}</td>
        <td className="px-4 py-3"><Badge tone={d.confidenceScore >= 75 ? 'leaf' : d.confidenceScore >= 50 ? 'amber' : 'rust'}>{d.confidenceScore}%</Badge></td>
        <td className="px-4 py-3"><button className="text-sm font-medium text-forest-600 hover:text-forest-800">Corrigir</button></td>
      </tr>
    ))}
    {diagnoses.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-forest-400">Sem análises registadas.</td></tr>}
  </AdminTable>;
}

function PlantsTab({ crops }: { crops: Crop[] }) {
  return <AdminTable headers={['Cultura', 'Categoria', 'Dificuldade', 'Épocas', '']}>
    {crops.map(c => (
      <tr key={c.id} className="hover:bg-forest-50/30">
        <td className="px-4 py-3 font-medium text-forest-900"><span className="mr-1">{c.icon}</span>{c.name}</td>
        <td className="px-4 py-3 capitalize text-forest-600">{c.category}</td>
        <td className="px-4 py-3"><Badge tone={c.difficulty === 'Fácil' ? 'leaf' : c.difficulty === 'Médio' ? 'amber' : 'rust'}>{c.difficulty}</Badge></td>
        <td className="px-4 py-3 text-forest-600">{c.plantMonths.length} meses</td>
        <td className="px-4 py-3"><RowActions /></td>
      </tr>
    ))}
  </AdminTable>;
}

function DiseasesTab() {
  return <AdminTable headers={['Doença', 'Culturas afetadas', 'Gravidade', '']}>
    {DEMO_DISEASES.map(d => (
      <tr key={d.id} className="hover:bg-forest-50/30">
        <td className="px-4 py-3 font-medium text-forest-900">{d.name}</td>
        <td className="px-4 py-3 text-forest-600">{d.crop}</td>
        <td className="px-4 py-3"><Badge tone={d.severity === 'alta' ? 'rust' : d.severity === 'moderada' ? 'amber' : 'leaf'} className="capitalize">{d.severity}</Badge></td>
        <td className="px-4 py-3"><RowActions /></td>
      </tr>
    ))}
  </AdminTable>;
}

function PestsTab({ insects }: { insects: Insect[] }) {
  return <AdminTable headers={['Praga', 'Sinais', 'Tratamento', '']}>
    {insects.map(p => (
      <tr key={p.id} className="hover:bg-forest-50/30">
        <td className="px-4 py-3 font-medium text-forest-900"><span className="mr-1">{p.emoji}</span>{p.name}</td>
        <td className="px-4 py-3 text-forest-600">{p.signs.join(', ')}</td>
        <td className="px-4 py-3 text-forest-600">{p.treatment ?? '—'}</td>
        <td className="px-4 py-3"><RowActions /></td>
      </tr>
    ))}
  </AdminTable>;
}

function TreatmentsTab() {
  return <AdminTable headers={['Tratamento', 'Doses', '']}>
    {[{ n: 'Bicarbonato de sódio + óleo', k: 'biológico' }, { n: 'Enxofre molhável', k: 'convencional' }, { n: 'Sabão potássico', k: 'biológico' }, { n: 'Piretrina natural', k: 'convencional' }, { n: 'Purín de urtiga', k: 'biológico' }, { n: 'Cloreto de cálcio', k: 'biológico' }].map((t, i) => (
      <tr key={i} className="hover:bg-forest-50/30">
        <td className="px-4 py-3 font-medium text-forest-900">{t.n}</td>
        <td className="px-4 py-3"><Badge tone={t.k === 'biológico' ? 'leaf' : 'amber'} className="capitalize">{t.k}</Badge> · 1L, 5L, 10L, 16L, 20L</td>
        <td className="px-4 py-3"><RowActions /></td>
      </tr>
    ))}
  </AdminTable>;
}

function ProductsTab() {
  return <AdminTable headers={['Produto', 'Tipo', 'Preço', '']}>
    {DEMO_PRODUCTS.map((p, i) => (
      <tr key={i} className="hover:bg-forest-50/30">
        <td className="px-4 py-3 font-medium text-forest-900">{p.name}</td>
        <td className="px-4 py-3"><Badge tone="sky">{p.type}</Badge></td>
        <td className="px-4 py-3 font-semibold text-forest-900">{p.price}</td>
        <td className="px-4 py-3"><RowActions /></td>
      </tr>
    ))}
  </AdminTable>;
}

function CalendarTab({ crops }: { crops: Crop[] }) {
  return <AdminTable headers={['Cultura', 'Meses', '']}>
    {crops.slice(0, 10).map(c => (
      <tr key={c.id} className="hover:bg-forest-50/30">
        <td className="px-4 py-3 font-medium text-forest-900"><span className="mr-1">{c.icon}</span>{c.name}</td>
        <td className="px-4 py-3 text-forest-600">{c.plantMonths.join(', ')}</td>
        <td className="px-4 py-3"><RowActions /></td>
      </tr>
    ))}
  </AdminTable>;
}

function RegionsTab() {
  return <AdminTable headers={['Região', 'Estado', '']}>
    {REGION_NAMES.map(r => (
      <tr key={r} className="hover:bg-forest-50/30">
        <td className="px-4 py-3 font-medium text-forest-900">{r}</td>
        <td className="px-4 py-3"><Badge tone="leaf">Ativa</Badge></td>
        <td className="px-4 py-3"><RowActions /></td>
      </tr>
    ))}
  </AdminTable>;
}

function PlansTab({ users }: { users: AdminUser[] }) {
  const plans = [
    { name: 'Grátis', price: '0 €', users: users.filter(u => u.plan === 'grátis').length, features: '5 análises, calendário, lembretes' },
    { name: 'Premium', price: '4,90 €/mês', users: users.filter(u => u.plan === 'premium').length, features: 'Ilimitadas, meteo, terra, sol' },
    { name: 'Profissional', price: '12,90 €/mês', users: users.filter(u => u.plan === 'profissional').length, features: 'Relatórios, custos, PDF' },
  ];
  return <AdminTable headers={['Plano', 'Preço', 'Utilizadores', 'Funcionalidades', '']}>
    {plans.map(p => (
      <tr key={p.name} className="hover:bg-forest-50/30">
        <td className="px-4 py-3 font-medium text-forest-900">{p.name}</td>
        <td className="px-4 py-3 font-semibold text-forest-900">{p.price}</td>
        <td className="px-4 py-3 text-forest-600">{p.users}</td>
        <td className="px-4 py-3 text-forest-600">{p.features}</td>
        <td className="px-4 py-3"><RowActions /></td>
      </tr>
    ))}
  </AdminTable>;
}

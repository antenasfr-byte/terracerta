import { useState } from 'react';
import { User as UserIcon, MapPin, Crown, Bell, Globe, Shield, LogOut, Check, FileText, Download, Loader2 } from 'lucide-react';
import { useApp } from '../store';
import { PageShell, Card, Badge, Button, Input, Select, SectionTitle, Modal } from '../components/ui';
import { REGION_NAMES } from '../data';
import { PLANS } from './AuthScreen';


export function ProfilePage() {
  const { user, signOut, setPlan, updateProfile, navigate } = useApp();
  const [name, setName] = useState(user?.name ?? '');
  const [region, setRegion] = useState(user?.region ?? 'Estremadura');
  const [planOpen, setPlanOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const save = async () => {
    setSaving(true);
    await updateProfile(name, region);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <PageShell>
      <SectionTitle icon={<UserIcon size={22} />} title="Perfil e definições" subtitle="Gerir conta, plano e preferências." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 overflow-hidden">
          <div className="bg-gradient-to-br from-forest-600 to-forest-700 p-6 text-center text-white">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-3xl font-bold backdrop-blur">{user.name.charAt(0).toUpperCase()}</div>
            <p className="mt-3 font-display text-xl font-semibold">{user.name}</p>
            <p className="text-sm text-forest-100">{user.email}</p>
            <Badge tone="wheat" className="mt-3 capitalize">{user.plan}</Badge>
          </div>
          <div className="p-5 space-y-3">
            <Stat icon={<MapPin size={16} />} label="Região" value={user.region} />
            <Stat icon={<Crown size={16} />} label="Plano" value={user.plan} />
            <Stat icon={<Shield size={16} />} label="Tipo de conta" value={user.isAdmin ? 'Administrador' : 'Utilizador'} />
            <button onClick={signOut} className="flex w-full items-center gap-2 rounded-xl bg-rust-50 px-4 py-3 text-sm font-medium text-rust-600 hover:bg-rust-100"><LogOut size={16} /> Terminar sessão</button>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <h3 className="mb-4 font-semibold text-forest-900">Dados da conta</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Nome" value={name} onChange={e => setName(e.target.value)} />
              <Input label="Email" value={user.email} disabled />
              <Select label="Região" value={region} onChange={e => setRegion(e.target.value)}>{REGION_NAMES.map(r => <option key={r}>{r}</option>)}</Select>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={save} disabled={saving}>{saving ? <Loader2 size={16} className="animate-spin" /> : null}Guardar alterações</Button>
              {saved && <span className="flex items-center gap-1 text-sm text-leaf-600"><Check size={16} /> Guardado</span>}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-forest-900">O seu plano</h3>
              <Button variant="outline" size="sm" onClick={() => setPlanOpen(true)}>Ver planos</Button>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-forest-50 to-leaf-50 p-4">
              <div className="flex items-center justify-between">
                <div><p className="font-display text-lg font-semibold capitalize text-forest-900">Plano {user.plan}</p><p className="text-sm text-forest-600">{PLANS.find(p => p.id === user.plan)?.price}</p></div>
                <Crown className="text-wheat-500" size={28} />
              </div>
              <ul className="mt-3 space-y-1.5">{PLANS.find(p => p.id === user.plan)?.perks.map(perk => <li key={perk} className="flex items-center gap-2 text-sm text-forest-700"><Check size={15} className="text-leaf-600" /> {perk}</li>)}</ul>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 font-semibold text-forest-900">Preferências</h3>
            <div className="space-y-3">
              <Toggle icon={<Bell size={18} />} label="Notificações de lembretes" desc="Receber alertas de rega e tratamentos" defaultOn />
              <Toggle icon={<Globe size={18} />} label="Alertas meteorológicos" desc="Geada, ondas de calor e vento forte" defaultOn />
              <Toggle icon={<FileText size={18} />} label="Relatórios mensais" desc="Resumo da atividade da horta (Profissional)" defaultOn={user.plan === 'profissional'} />
            </div>
          </Card>

          {user.isAdmin && (
            <Card className="border-rust-200 p-5">
              <h3 className="mb-2 font-semibold text-forest-900">Painel de administração</h3>
              <p className="mb-3 text-sm text-forest-600">Tem acesso de administrador. Gerir utilizadores, plantas, doenças e planos.</p>
              <Button variant="secondary" onClick={() => navigate('admin')}><Shield size={16} /> Abrir painel de administração</Button>
            </Card>
          )}

          {user.plan === 'profissional' && (
            <Card className="p-5">
              <h3 className="mb-3 font-semibold text-forest-900">Exportação</h3>
              <Button variant="outline"><Download size={16} /> Exportar diário para PDF</Button>
            </Card>
          )}
        </div>
      </div>

      <Modal open={planOpen} onClose={() => setPlanOpen(false)} title="Planos TerraCerta" maxWidth="max-w-2xl">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PLANS.map(p => (
            <div key={p.id} className={`rounded-2xl border p-4 ${user.plan === p.id ? 'border-forest-500 bg-forest-50' : 'border-forest-100'}`}>
              {p.highlight && <Badge tone="wheat" className="mb-2">Popular</Badge>}
              <p className="font-display text-lg font-semibold text-forest-900">{p.name}</p>
              <p className="text-sm text-forest-500">{p.price}</p>
              <ul className="mt-3 space-y-1.5">{p.perks.map(perk => <li key={perk} className="flex items-start gap-1.5 text-xs text-forest-700"><Check size={13} className="mt-0.5 shrink-0 text-leaf-600" /> {perk}</li>)}</ul>
              <Button variant={user.plan === p.id ? 'outline' : 'primary'} size="sm" className="mt-4 w-full" disabled={user.plan === p.id} onClick={() => { setPlan(p.id); setPlanOpen(false); }}>{user.plan === p.id ? 'Plano atual' : 'Escolher'}</Button>
            </div>
          ))}
        </div>
      </Modal>
    </PageShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-xl bg-forest-50/50 px-4 py-3"><span className="text-forest-500">{icon}</span><div className="flex-1"><p className="text-xs text-forest-500">{label}</p><p className="text-sm font-semibold capitalize text-forest-900">{value}</p></div></div>;
}

function Toggle({ icon, label, desc, defaultOn }: { icon: React.ReactNode; label: string; desc: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-forest-100 p-3.5">
      <span className="text-forest-500">{icon}</span>
      <div className="flex-1"><p className="text-sm font-semibold text-forest-900">{label}</p><p className="text-xs text-forest-500">{desc}</p></div>
      <button onClick={() => setOn(!on)} className={`relative h-6 w-11 rounded-full transition-colors ${on ? 'bg-forest-600' : 'bg-forest-200'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} /></button>
    </div>
  );
}

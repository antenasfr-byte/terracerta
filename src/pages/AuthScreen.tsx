import { useState } from 'react';
import { Leaf, Mail, Lock, User as UserIcon, Sprout, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../store';
import { Button } from '../components/ui';
import type { Plan } from '../types';

const PLANS: { id: Plan; name: string; price: string; perks: string[]; highlight?: boolean }[] = [
  { id: 'grátis', name: 'Grátis', price: '0 €', perks: ['5 análises por mês', 'Calendário de plantação', 'Lembretes básicos'] },
  { id: 'premium', name: 'Premium', price: '4,90 €/mês', perks: ['Análises ilimitadas', 'Histórico completo', 'Meteorologia', 'Análise da terra', 'Exposição solar'], highlight: true },
  { id: 'profissional', name: 'Profissional', price: '12,90 €/mês', perks: ['Vários terrenos e parcelas', 'Relatórios e exportação PDF', 'Gestão de custos', 'Gestão de tratamentos'] },
];

export function AuthScreen() {
  const { signIn, signUp } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [plan, setPlan] = useState<Plan>('premium');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Preencha email e palavra-passe.'); return; }
    if (mode === 'register' && !name) { setError('Indique o seu nome.'); return; }
    if (password.length < 6) { setError('A palavra-passe deve ter pelo menos 6 caracteres.'); return; }

    setBusy(true);
    try {
      if (mode === 'login') {
        const { error: err } = await signIn(email, password);
        if (err) setError(err === 'Invalid login credentials' ? 'Email ou palavra-passe incorretos.' : err);
      } else {
        const { error: err } = await signUp(email, password, name, plan);
        if (err) setError(err);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f3] lg:grid lg:grid-cols-2">
      {/* Hero panel */}
      <div className="relative hidden overflow-hidden bg-forest-700 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #94b88c 0, transparent 40%), radial-gradient(circle at 80% 70%, #4d7f45 0, transparent 45%)' }} />
        <div className="relative">
          <div className="flex items-center gap-3 text-white">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur"><Leaf size={24} /></div>
            <div><p className="font-display text-2xl font-semibold">TerraCerta</p><p className="text-sm text-forest-100">A sua horta, mais certinha</p></div>
          </div>
        </div>
        <div className="relative space-y-6 text-white">
          <h1 className="font-display text-4xl font-semibold leading-tight">Diagnostique plantas, analise a terra e cuide da sua horta com confiança.</h1>
          <ul className="space-y-3 text-forest-50">
            {['Diagnóstico por fotografia com nível de confiança', 'Recomendações de tratamento com doses exatas', 'Calendário de plantação para todo o ano em Portugal', 'Meteorologia real e lembretes inteligentes'].map(t => (
              <li key={t} className="flex items-start gap-3"><Check size={20} className="mt-0.5 shrink-0 text-wheat-300" /><span>{t}</span></li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-forest-100/70">Os seus dados ficam guardados em segurança — cada utilizador só vê a sua horta.</p>
      </div>

      {/* Form panel */}
      <div className="flex min-h-screen items-center justify-center px-5 py-10 lg:min-h-0">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-600 text-white"><Leaf size={24} /></div>
            <div><p className="font-display text-xl font-semibold text-forest-900">TerraCerta</p><p className="text-xs text-forest-500">A sua horta, mais certinha</p></div>
          </div>

          <div className="card-surface p-6 sm:p-8">
            <div className="mb-6 flex rounded-xl bg-forest-50 p-1">
              {(['login', 'register'] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setError(''); }} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${mode === m ? 'bg-white text-forest-800 shadow-soft' : 'text-forest-500'}`}>
                  {m === 'login' ? 'Entrar' : 'Criar conta'}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'register' && (
                <Field icon={<UserIcon size={18} />}><input className="w-full bg-transparent text-sm text-forest-900 outline-none placeholder:text-forest-400" placeholder="O seu nome" value={name} onChange={e => setName(e.target.value)} /></Field>
              )}
              <Field icon={<Mail size={18} />}><input type="email" className="w-full bg-transparent text-sm text-forest-900 outline-none placeholder:text-forest-400" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
              <Field icon={<Lock size={18} />}><input type="password" className="w-full bg-transparent text-sm text-forest-900 outline-none placeholder:text-forest-400" placeholder="Palavra-passe" value={password} onChange={e => setPassword(e.target.value)} /></Field>

              {mode === 'register' && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-forest-800">Escolha o seu plano</p>
                  <div className="space-y-2">
                    {PLANS.map(p => (
                      <button type="button" key={p.id} onClick={() => setPlan(p.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${plan === p.id ? 'border-forest-500 bg-forest-50 ring-1 ring-forest-500' : 'border-forest-100 hover:border-forest-200'}`}>
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${plan === p.id ? 'border-forest-600 bg-forest-600' : 'border-forest-200'}`}>{plan === p.id && <Check size={12} className="text-white" />}</div>
                        <div className="flex-1"><p className="text-sm font-semibold text-forest-900">{p.name}</p><p className="text-xs text-forest-500">{p.price}</p></div>
                        {p.highlight && <span className="rounded-full bg-wheat-100 px-2 py-0.5 text-[10px] font-bold uppercase text-wheat-800">Popular</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="flex items-center gap-2 rounded-lg bg-rust-50 px-3 py-2 text-sm text-rust-600"><AlertCircle size={15} /> {error}</p>}

              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? <Loader2 size={20} className="animate-spin" /> : null}
                {busy ? 'A processar…' : mode === 'login' ? 'Entrar na minha horta' : 'Criar conta'}
              </Button>
            </form>

            <div className="mt-5 rounded-xl bg-forest-50/60 p-3 text-xs text-forest-600">
              <p className="font-semibold text-forest-700">Conta de administrador</p>
              <p className="mt-0.5">O administrador é criado através de registo normal. As permissões de administrador são atribuídas pelo gestor do sistema — nunca são visíveis no código.</p>
            </div>
          </div>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-forest-400"><Sprout size={14} /> Dados reais guardados no Supabase · IA pronta para ativar</p>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-forest-200 bg-white px-4 py-3 transition-colors focus-within:border-forest-500 focus-within:ring-2 focus-within:ring-forest-500/20">
      <span className="text-forest-400">{icon}</span>
      {children}
    </div>
  );
}

export { PLANS };

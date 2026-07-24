import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft, Leaf, AlertTriangle, Sparkles, Clock, Droplet, FlaskConical,
  ShieldAlert, Ban, RefreshCw, CheckCircle2, Info, Microscope, Camera,
  BookPlus, Bug, Sun, Snowflake, Wind, FlaskRound,
} from 'lucide-react';
import { useApp } from '../store';
import { PageShell, Card, Badge, Button, Progress, SectionTitle, Modal } from '../components/ui';
import { formatDate } from '../data';
import type { DiagnosisResult, DiagnosisCause } from '../types';

const causeTone: Record<DiagnosisCause['type'], 'rust' | 'amber' | 'sky' | 'wheat' | 'terracotta' | 'neutral'> = {
  'doença': 'rust', 'praga': 'amber', 'carencia': 'wheat', 'excesso': 'sky', 'queimadura': 'terracotta', 'outra': 'neutral',
};
const causeLabel: Record<DiagnosisCause['type'], string> = {
  'doença': 'Doença', 'praga': 'Praga', 'carencia': 'Carência', 'excesso': 'Excesso', 'queimadura': 'Queimadura', 'outra': 'Outra',
};

const categoryIcon: Record<string, ReactNode> = {
  'doença': <FlaskConical size={16} />,
  'praga': <Bug size={16} />,
  'carencia': <Leaf size={16} />,
  'excesso': <Droplet size={16} />,
  'queimadura': <Sun size={16} />,
  'frio': <Snowflake size={16} />,
  'vento': <Wind size={16} />,
  'produto': <FlaskRound size={16} />,
  'outra': <Info size={16} />,
};

export function DiagnosisResultPage() {
  const { navPayload, navigate, addEvent, plants } = useApp();
  const result = navPayload.result as DiagnosisResult | undefined;
  const [savedToJournal, setSavedToJournal] = useState(false);
  const [showPlantPicker, setShowPlantPicker] = useState(false);

  if (!result) {
    return (
      <PageShell>
        <Card className="p-8 text-center">
          <p className="text-forest-600">Nenhum resultado de diagnóstico selecionado.</p>
          <Button className="mt-4" onClick={() => navigate('diagnose')}>Fazer diagnóstico</Button>
        </Card>
      </PageShell>
    );
  }

  const confTone = result.confidenceScore >= 75 ? 'leaf' : result.confidenceScore >= 50 ? 'amber' : 'rust';

  const saveToJournal = async (plantId: string) => {
    if (!plantId) return;
    await addEvent({
      id: 'evt-' + Date.now(),
      plantEntryId: plantId,
      date: new Date().toISOString(),
      type: 'doença',
      title: `Diagnóstico: ${result.primaryProblem}`,
      detail: `Confiança: ${result.confidenceScore}%. ${result.visibleSigns?.join(', ') ?? ''}`,
    });
    setSavedToJournal(true);
    setShowPlantPicker(false);
  };

  return (
    <PageShell>
      <button onClick={() => navigate('diagnose')} className="mb-4 flex items-center gap-1.5 text-sm font-medium text-forest-600 hover:text-forest-800">
        <ArrowLeft size={16} /> Voltar ao diagnóstico
      </button>

      {/* Summary */}
      <Card className="mb-6 overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-forest-50 text-forest-600">
            <Microscope size={30} />
          </div>
          <div className="flex-1">
            <Badge tone={confTone}>{result.confidenceScore}% de confiança</Badge>
            <h1 className="mt-2 font-display text-2xl font-semibold text-forest-900">{result.primaryProblem}</h1>
            <p className="mt-0.5 text-forest-600">
              {result.plantGuess}
              {result.scientificName ? <span className="italic text-forest-400"> ({result.scientificName})</span> : null}
              {' · parte analisada: '}<span className="capitalize">{result.part}</span>
            </p>
            {result.problemCategory && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-forest-500">
                {categoryIcon[result.problemCategory] ?? <Info size={14} />}
                {causeLabel[result.problemCategory as DiagnosisCause['type']] ?? result.problemCategory}
              </p>
            )}
            <p className="mt-1 flex items-center gap-1 text-xs text-forest-400"><Clock size={12} /> {formatDate(result.date)}</p>
          </div>
        </div>
        {result.safetyDisclaimer && (
          <div className="border-t border-forest-50 bg-amber2-50/60 px-5 py-3">
            <p className="flex items-start gap-2 text-sm text-amber2-800">
              <Info size={16} className="mt-0.5 shrink-0" /> {result.safetyDisclaimer}
            </p>
          </div>
        )}
      </Card>

      {/* Visible signs */}
      {result.visibleSigns && result.visibleSigns.length > 0 && (
        <div className="mb-6">
          <SectionTitle icon={<Sparkles size={20} />} title="Sinais visíveis encontrados" subtitle="O que a inteligência artificial identificou na fotografia." />
          <Card className="p-5">
            <ul className="space-y-2">
              {result.visibleSigns.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-forest-700">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-leaf-600" /> {s}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Possible causes */}
      {result.causes.length > 0 && (
        <div className="mb-6">
          <SectionTitle icon={<Sparkles size={20} />} title="Causas possíveis" subtitle="Ordenadas por probabilidade. Nunca apresentado como 100% garantido." />
          <div className="space-y-3">
            {result.causes.map((c, i) => (
              <Card key={i} className="p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    {i === 0 && <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-leaf-600" />}
                    <p className="font-semibold text-forest-900">{c.label}</p>
                  </div>
                  <Badge tone={causeTone[c.type]}>{causeLabel[c.type]}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={c.probability} tone={causeTone[c.type]} />
                  <span className="w-12 text-right text-sm font-bold text-forest-800">{c.probability}%</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Immediate actions */}
      {result.immediateActions && result.immediateActions.length > 0 && (
        <div className="mb-6">
          <SectionTitle icon={<CheckCircle2 size={20} />} title="O que fazer imediatamente" subtitle="Ações de baixo risco, prioritárias." />
          <Card className="p-5">
            <ul className="space-y-2">
              {result.immediateActions.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-forest-700">
                  <span className="mt-0.5 shrink-0 text-forest-400">{i + 1}.</span> {a}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Biological + Conventional actions */}
      <div className="mb-6">
        <SectionTitle icon={<FlaskConical size={20} />} title="Recomendações de tratamento" subtitle="Prioridade a opções de baixo risco." />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {result.biologicalActions && result.biologicalActions.length > 0 && (
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 bg-leaf-50 px-5 py-3">
                <Leaf size={18} className="text-leaf-600" />
                <p className="font-semibold text-forest-900">Opções biológicas</p>
                <Badge tone="leaf" className="ml-auto">Recomendado</Badge>
              </div>
              <div className="p-5">
                <ul className="space-y-2">
                  {result.biologicalActions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-forest-700">
                      <Leaf size={14} className="mt-0.5 shrink-0 text-leaf-500" /> {a}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
          {result.conventionalActions && result.conventionalActions.length > 0 && (
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 bg-amber2-50 px-5 py-3">
                <FlaskConical size={18} className="text-amber2-600" />
                <p className="font-semibold text-forest-900">Opções convencionais</p>
                <Badge tone="amber" className="ml-auto">Verificar DGAV</Badge>
              </div>
              <div className="p-5">
                <ul className="space-y-2">
                  {result.conventionalActions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-forest-700">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber2-600" /> {a}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 rounded-xl bg-amber2-50 px-4 py-3 text-sm text-amber2-800">
                  <strong>Aviso:</strong> Confirme sempre a autorização do produto em Portugal (DGAV), a dose e o período de segurança.
                </div>
              </div>
            </Card>
          )}
        </div>
        {result.treatments.length > 0 && (
          <div className="mt-4 space-y-4">
            {result.treatments.map(t => (
              <Card key={t.id} className="overflow-hidden">
                <div className={`flex items-center gap-2 px-5 py-3 ${t.kind === 'biológico' ? 'bg-leaf-50' : 'bg-amber2-50'}`}>
                  <Leaf size={18} className={t.kind === 'biológico' ? 'text-leaf-600' : 'text-amber2-600'} />
                  <p className="font-semibold text-forest-900">{t.name}</p>
                  <Badge tone={t.kind === 'biológico' ? 'leaf' : 'amber'} className="ml-auto capitalize">{t.kind}</Badge>
                </div>
                <div className="space-y-4 p-5">
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-forest-800"><Droplet size={15} className="text-sky2-500" /> Dose por litro de água</p>
                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      {t.doses.map(d => (
                        <div key={d.liters} className="rounded-lg bg-forest-50/70 py-2">
                          <p className="text-[11px] font-medium text-forest-500">{d.liters} L</p>
                          <p className="mt-0.5 text-xs font-bold text-forest-900">{d.amount}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <InfoTile icon={<Clock size={15} />} label="Melhor horário" value={t.bestHour} />
                    <InfoTile icon={<RefreshCw size={15} />} label="Espera antes da colheita" value={`${t.waitDays} dias`} />
                  </div>
                  {t.warnings.length > 0 && (
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-forest-800"><ShieldAlert size={15} className="text-rust-500" /> Avisos de segurança</p>
                      <ul className="space-y-1">
                        {t.warnings.map((w, i) => <li key={i} className="flex items-start gap-2 rounded-lg bg-rust-50 px-3 py-2 text-sm text-rust-700"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{w}</li>)}
                      </ul>
                    </div>
                  )}
                  {t.doNotMix.length > 0 && (
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-forest-800"><Ban size={15} className="text-amber2-600" /> Não misturar com</p>
                      <div className="flex flex-wrap gap-1.5">
                        {t.doNotMix.map((m, i) => <Badge key={i} tone="amber">{m}</Badge>)}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Safety warnings */}
      {result.safetyWarnings && result.safetyWarnings.length > 0 && (
        <div className="mb-6">
          <SectionTitle icon={<ShieldAlert size={20} />} title="Avisos de segurança" />
          <Card className="border-rust-200 bg-rust-50/40 p-5">
            <ul className="space-y-2">
              {result.safetyWarnings.map((w, i) => (
                <li key={i} className="flex items-start gap-2 rounded-lg bg-rust-50 px-3 py-2 text-sm text-rust-700">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {w}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* New photos required + recheck */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {result.newPhotosRequired && result.newPhotosRequired.length > 0 && (
          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-forest-900"><Camera size={18} className="text-forest-600" /> Fotografias adicionais necessárias</h3>
            <ul className="space-y-2 text-sm text-forest-700">
              {result.newPhotosRequired.map((p, i) => (
                <li key={i} className="flex items-start gap-2"><span className="text-forest-400">•</span> {p}</li>
              ))}
            </ul>
          </Card>
        )}
        <Card className="bg-gradient-to-br from-forest-50 to-leaf-50 p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-forest-900"><RefreshCw size={18} className="text-forest-600" /> Quando voltar a verificar</h3>
          <p className="text-sm text-forest-600">Volte a fotografar a planta dentro de <strong className="text-forest-900">{result.recheckDays} dias</strong> para comparar a evolução.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('compare')}>Ir para comparação de fotos</Button>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" size="lg" className="flex-1" onClick={() => navigate('diagnose')}>
          <Camera size={20} /> Voltar a fotografar
        </Button>
        <Button size="lg" className="flex-1" onClick={() => { if (plants.length === 1) saveToJournal(plants[0].id); else setShowPlantPicker(true); }} disabled={savedToJournal || plants.length === 0}>
          {savedToJournal ? <><CheckCircle2 size={20} /> Guardado no diário</> : <><BookPlus size={20} /> Guardar no diário da planta</>}
        </Button>
      </div>
      {plants.length === 0 && (
        <p className="mt-2 text-center text-sm text-forest-400">Adicione uma planta no separador "Diário da horta" para guardar no diário.</p>
      )}
      {plants.length > 1 && !savedToJournal && (
        <Modal open={showPlantPicker} onClose={() => setShowPlantPicker(false)} title="Escolha a planta">
          <div className="space-y-2">
            {plants.map(p => (
              <button key={p.id} onClick={() => saveToJournal(p.id)} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all border-forest-100 hover:border-forest-200 hover:bg-forest-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-lg">{p.status === 'colhida' ? '🌾' : p.status === 'perdida' ? '🥀' : '🌱'}</div>
                <div className="min-0 flex-1"><p className="font-semibold text-forest-900">{p.name}</p><p className="text-xs text-forest-500">{p.variety}</p></div>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </PageShell>
  );
}

function InfoTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-forest-50/70 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-forest-500">{icon} {label}</p>
      <p className="mt-1 text-sm font-semibold text-forest-900">{value}</p>
    </div>
  );
}

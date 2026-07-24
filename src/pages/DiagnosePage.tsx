import { useState } from 'react';
import {
  Camera, Upload, Image as ImageIcon, Leaf, Apple, TreePine, Sprout, Bug,
  Mountain, ChevronRight, Sparkles, AlertCircle, Clock, Loader2, AlertTriangle,
  Zap,
} from 'lucide-react';
import { useApp } from '../store';
import { PageShell, Card, Badge, Button, SectionTitle, EmptyState } from '../components/ui';
import { supabase } from '../lib/supabase';
import { uploadPhoto, validateImage, compressImage } from '../lib/photos';
import { capturePhoto, isNativePlatform } from '../lib/camera';
import { loadTreatments, formatDate } from '../data';
import type { DiagnosisResult, Page, Treatment } from '../types';

const SYMPTOM_OPTIONS = [
  { id: 'manchas', label: 'Manchas nas folhas' },
  { id: 'amarelecimento', label: 'Amarelecimento' },
  { id: 'enrolamento', label: 'Enrolamento de folhas' },
  { id: 'podridao', label: 'Podridão' },
  { id: 'secagem', label: 'Secagem' },
  { id: 'deformacao', label: 'Deformação' },
] as const;

const WATERING_OPTIONS = [
  { id: 'normal', label: 'Normal' },
  { id: 'excesso', label: 'Excesso de rega' },
  { id: 'falta', label: 'Falta de rega' },
  { id: 'desconhecida', label: 'Não sei' },
] as const;

const SUN_OPTIONS = [
  { id: 'sol-pleno', label: 'Sol pleno' },
  { id: 'sol-parcial', label: 'Sol parcial' },
  { id: 'sombra', label: 'Sombra' },
  { id: 'desconhecida', label: 'Não sei' },
] as const;

const PARTS = [
  { id: 'folha', label: 'Folhas', icon: <Leaf size={22} />, hint: 'Manchas, amarelecimento, enrolamento' },
  { id: 'fruto', label: 'Frutos', icon: <Apple size={22} />, hint: 'Podridão, manchas, deformação' },
  { id: 'caule', label: 'Caule', icon: <TreePine size={22} />, hint: 'Rachas, secreções, escurecimento' },
  { id: 'raiz', label: 'Raízes', icon: <Sprout size={22} />, hint: 'Apodrecimento, nós, cor' },
  { id: 'inseto', label: 'Insetos', icon: <Bug size={22} />, hint: 'Colónias, ovos, teias' },
  { id: 'terra', label: 'Terra junto à planta', icon: <Mountain size={22} />, hint: 'Cor, humidade, fungos' },
] as const;

export function DiagnosePage() {
  const { user, navigate, diagnoses, addDiagnosis } = useApp();
  const [part, setPart] = useState<typeof PARTS[number]['id'] | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [plantName, setPlantName] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [watering, setWatering] = useState<string>('desconhecida');
  const [sunExposure, setSunExposure] = useState<string>('desconhecida');
  const [analyzing, setAnalyzing] = useState(false);
  const [lowConfidence, setLowConfidence] = useState<{ message: string; suggestions: string[] } | null>(null);
  const [aiNotConfigured, setAiNotConfigured] = useState(false);
  const [notAPlant, setNotAPlant] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const handleCapture = async (mode: 'camera' | 'gallery') => {
    setUploadError(null);
    setCapturing(true);
    try {
      const result = await capturePhoto(mode);
      if (!result) { setCapturing(false); return; }
      const v = validateImage(result.dataUrl);
      if (!v.ok) { setUploadError(v.error ?? 'Imagem inválida.'); setCapturing(false); return; }
      const compressed = await compressImage(result.dataUrl);
      setImage(compressed);
    } catch {
      setUploadError('Não foi possível obter a fotografia. Tente novamente.');
    } finally {
      setCapturing(false);
    }
  };

  const analyze = async () => {
    if (!image || !part || !user) return;
    setAnalyzing(true);
    setLowConfidence(null);
    setAiNotConfigured(false);
    setNotAPlant(null);
    setError(null);
    setQuotaError(false);

    try {
      const uploaded = await uploadPhoto(user.id, image, 'diagnosis');
      if (!uploaded) { setError('Não foi possível guardar a fotografia. Tente novamente.'); setAnalyzing(false); return; }
      const base64 = image.includes(',') ? image.split(',')[1] : image;

      const symptomsText = selectedSymptoms.length > 0
        ? SYMPTOM_OPTIONS.filter(s => selectedSymptoms.includes(s.id)).map(s => s.label).join(', ')
        : '';

      const funcUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/plant-diagnosis`;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(funcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({
          imageBase64: base64,
          storagePath: uploaded?.path,
          part,
          plantName: plantName || undefined,
          region: user.region || undefined,
          symptoms: symptomsText || undefined,
          watering: watering || undefined,
          sunExposure: sunExposure || undefined,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        if (res.status === 429) { setError(errBody.error || 'Atingiu o limite de diagnósticos por hora.'); }
        else if (res.status === 401) { setError('Sessão expirada. Inicie sessão novamente.'); }
        else if (res.status === 502 && errBody.error?.includes('429')) {
          setQuotaError(true);
        } else { setError(errBody.error || `Erro ${res.status}`); }
        setAnalyzing(false);
        return;
      }

      const data = await res.json();

      if (data.status === 'ai_not_configured') {
        setAiNotConfigured(true);
        setAnalyzing(false);
        return;
      }

      if (data.status === 'not_a_plant') {
        setNotAPlant(data.message || 'A imagem não parece conter uma planta reconhecível.');
        setAnalyzing(false);
        return;
      }

      if (data.status === 'low_confidence') {
        setLowConfidence({ message: data.message, suggestions: data.suggestions ?? [] });
        setAnalyzing(false);
        return;
      }

      if (data.status !== 'ok') {
        setError('Resposta inválida da inteligência artificial.');
        setAnalyzing(false);
        return;
      }

      const problemKey = extractProblemKey(data.primary_diagnosis || data.primary_problem || '');
      const treatments: Treatment[] = await loadTreatments(problemKey);

      const result: DiagnosisResult = {
        id: 'diag-' + Date.now(),
        date: data.timestamp || new Date().toISOString(),
        part,
        plantGuess: data.plant_name || data.plant_guess || 'Não identificado',
        scientificName: data.scientific_name || '',
        confidence: data.confidence_level || (data.confidence_score >= 75 ? 'high' : data.confidence_score >= 50 ? 'medium' : 'low'),
        confidenceScore: data.confidence_score,
        primaryProblem: data.primary_diagnosis || data.primary_problem || '',
        problemCategory: data.problem_category || '',
        causes: (data.possible_causes ?? []).map((c: { label: string; probability: number; type: string }) => ({
          label: c.label, probability: c.probability, type: c.type as DiagnosisResult['causes'][number]['type'],
        })).sort((a: { probability: number }, b: { probability: number }) => b.probability - a.probability),
        treatments,
        recheckDays: data.follow_up_days || data.recheck_days || 7,
        note: data.safety_disclaimer || data.note || '',
        visibleSigns: data.visible_signs ?? [],
        immediateActions: data.immediate_actions ?? [],
        biologicalActions: data.biological_actions ?? [],
        conventionalActions: data.conventional_actions ?? [],
        safetyWarnings: data.safety_warnings ?? [],
        newPhotosRequired: data.new_photos_required ?? [],
        safetyDisclaimer: data.safety_disclaimer || '',
      };

      await supabase.from('diagnoses').insert({
        photo_id: uploaded.photoId, part,
        plant_guess: result.plantGuess,
        plant_name: result.plantGuess,
        scientific_name: result.scientificName,
        confidence: result.confidence, confidence_score: result.confidenceScore,
        primary_problem: result.primaryProblem,
        problem_category: result.problemCategory,
        recheck_days: result.recheckDays,
        note: result.note,
        visible_signs: result.visibleSigns,
        immediate_actions: result.immediateActions,
        biological_actions: result.biologicalActions,
        conventional_actions: result.conventionalActions,
        safety_warnings: data.safety_warnings ?? [],
        new_photos_required: data.new_photos_required ?? [],
        safety_disclaimer: result.safetyDisclaimer,
        ai_raw: data.ai_raw, model_version: data.model_version || '',
      });

      addDiagnosis(result);
      setAnalyzing(false);
      navigate('diagnosis-result', { result });
    } catch {
      setAnalyzing(false);
      setError('Não foi possível analisar a fotografia. Verifique a ligação à internet e tente novamente.');
    }
  };

  return (
    <PageShell>
      <SectionTitle icon={<Camera size={22} />} title="Diagnosticar planta" subtitle="Tire uma fotografia ou carregue uma imagem da zona afetada." />

      <div className="mb-6">
        <p className="mb-2 text-sm font-semibold text-forest-800">1. O que vai fotografar?</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PARTS.map(p => (
            <button key={p.id} onClick={() => setPart(p.id)} className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${part === p.id ? 'border-forest-500 bg-forest-50 ring-1 ring-forest-500' : 'border-forest-100 bg-white hover:border-forest-200'}`}>
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${part === p.id ? 'bg-forest-600 text-white' : 'bg-forest-50 text-forest-600'}`}>{p.icon}</span>
              <div className="min-w-0"><p className="text-sm font-semibold text-forest-900">{p.label}</p><p className="truncate text-xs text-forest-500">{p.hint}</p></div>
            </button>
          ))}
        </div>
      </div>

      {part && (
        <div className="mb-6 animate-fadeIn">
          <p className="mb-2 text-sm font-semibold text-forest-800">2. Adicione a fotografia</p>
          {uploadError && (
            <div className="mb-3 rounded-xl bg-rust-50 px-4 py-3 text-sm text-rust-700">
              <AlertCircle size={16} className="mr-1.5 inline" /> {uploadError}
            </div>
          )}
          {!image ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={() => handleCapture('camera')}
                disabled={capturing}
                className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-forest-200 bg-forest-50/40 py-10 transition-all hover:border-forest-400 hover:bg-forest-50 disabled:opacity-50"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-600 text-white shadow-soft transition-transform group-hover:scale-105">
                  {capturing ? <Loader2 size={26} className="animate-spin" /> : <Camera size={26} />}
                </span>
                <div className="text-center"><p className="font-semibold text-forest-900">Tirar fotografia</p><p className="text-sm text-forest-500">{isNativePlatform() ? 'Abrir câmara do dispositivo' : 'Use a câmara do dispositivo'}</p></div>
              </button>
              <button
                onClick={() => handleCapture('gallery')}
                disabled={capturing}
                className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-forest-200 bg-white py-10 transition-all hover:border-forest-400 hover:bg-forest-50 disabled:opacity-50"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-terracotta-500 text-white shadow-soft transition-transform group-hover:scale-105">
                  {capturing ? <Loader2 size={26} className="animate-spin" /> : <Upload size={26} />}
                </span>
                <div className="text-center"><p className="font-semibold text-forest-900">Escolher da galeria</p><p className="text-sm text-forest-500">Seleccionar uma imagem existente</p></div>
              </button>
            </div>
          ) : (
            <Card className="overflow-hidden">
              <div className="relative">
                <img src={image} alt="Fotografia enviada" className="max-h-80 w-full object-cover" />
                <button onClick={() => setImage(null)} className="absolute right-3 top-3 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-forest-700 backdrop-blur hover:bg-white">Trocar imagem</button>
                <div className="absolute left-3 top-3"><Badge tone="forest">{PARTS.find(p => p.id === part)?.label}</Badge></div>
              </div>
              <div className="p-5">
                {/* Context inputs — no free-text prompts to the AI */}
                <div className="mb-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-forest-700">Nome da planta <span className="text-forest-400">(opcional)</span></label>
                    <input
                      type="text"
                      value={plantName}
                      onChange={e => setPlantName(e.target.value)}
                      placeholder="Ex: Tomateiro, Roseira…"
                      className="w-full rounded-xl border border-forest-200 bg-white px-4 py-2.5 text-sm text-forest-900 outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20"
                      maxLength={60}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-forest-700">Sintomas observados <span className="text-forest-400">(opcional)</span></label>
                    <div className="flex flex-wrap gap-2">
                      {SYMPTOM_OPTIONS.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedSymptoms(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                          className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${selectedSymptoms.includes(s.id) ? 'border-forest-500 bg-forest-50 text-forest-800 ring-1 ring-forest-500' : 'border-forest-200 bg-white text-forest-600 hover:border-forest-300'}`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-forest-700">Rega</label>
                      <select value={watering} onChange={e => setWatering(e.target.value)} className="w-full rounded-xl border border-forest-200 bg-white px-3 py-2.5 text-sm text-forest-900 outline-none focus:border-forest-500">
                        {WATERING_OPTIONS.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-forest-700">Exposição solar</label>
                      <select value={sunExposure} onChange={e => setSunExposure(e.target.value)} className="w-full rounded-xl border border-forest-200 bg-white px-3 py-2.5 text-sm text-forest-900 outline-none focus:border-forest-500">
                        {SUN_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {analyzing ? (
                  <div className="flex items-center gap-3 rounded-xl bg-forest-50 px-4 py-4">
                    <Loader2 size={20} className="animate-spin text-forest-600" />
                    <div><p className="font-semibold text-forest-900">A analisar a fotografia…</p><p className="text-sm text-forest-500">A inteligência artificial está a identificar a planta e possíveis problemas.</p></div>
                  </div>
                ) : (
                  <Button size="lg" className="w-full" onClick={analyze}><Sparkles size={20} /> Analisar fotografia</Button>
                )}
                <p className="mt-3 flex items-center gap-1.5 text-xs text-forest-400"><AlertCircle size={13} /> O resultado nunca é 100% garantido — use como orientação.</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {lowConfidence && (
        <Card className="mb-6 animate-scaleIn border-amber2-200 bg-amber2-50/60 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={24} className="shrink-0 text-amber2-600" />
            <div>
              <p className="font-semibold text-amber2-900">Confiança baixa — não é possível diagnosticar</p>
              <p className="mt-1 text-sm text-amber2-800">{lowConfidence.message}</p>
              <ul className="mt-3 space-y-1 text-sm text-amber2-800">
                {lowConfidence.suggestions.map((s, i) => <li key={i} className="flex items-start gap-2"><span className="text-amber2-500">•</span>{s}</li>)}
              </ul>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => { setLowConfidence(null); setImage(null); }}>Tirar nova fotografia</Button>
            </div>
          </div>
        </Card>
      )}

      {aiNotConfigured && (
        <Card className="mb-6 animate-scaleIn border-sky2-200 bg-sky2-50/60 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={24} className="shrink-0 text-sky2-600" />
            <div>
              <p className="font-semibold text-sky2-900">Inteligência artificial ainda não ligada</p>
              <p className="mt-1 text-sm text-sky2-800">A estrutura para análise por IA está pronta, mas a chave da API ainda não foi configurada. Quando estiver ativa, a fotografia será analisada automaticamente e o diagnóstico aparecerá aqui.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('profile')}>Ver instruções de configuração</Button>
            </div>
          </div>
        </Card>
      )}

      {notAPlant && (
        <Card className="mb-6 animate-scaleIn border-amber2-200 bg-amber2-50/60 p-5">
          <div className="flex items-start gap-3">
            <ImageIcon size={24} className="shrink-0 text-amber2-600" />
            <div>
              <p className="font-semibold text-amber2-900">Imagem não reconhecida como planta</p>
              <p className="mt-1 text-sm text-amber2-800">{notAPlant}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => { setNotAPlant(null); setImage(null); }}>Tentar outra fotografia</Button>
            </div>
          </div>
        </Card>
      )}

      {quotaError && (
        <Card className="mb-6 animate-scaleIn border-amber2-200 bg-amber2-50/60 p-5">
          <div className="flex items-start gap-3">
            <Zap size={24} className="shrink-0 text-amber2-600" />
            <div>
              <p className="font-semibold text-amber2-900">Serviço de IA temporariamente indisponível</p>
              <p className="mt-1 text-sm text-amber2-800">O serviço de inteligência artificial atingiu o limite de utilização da chave API. Não foi gerado qualquer diagnóstico e nada foi guardado.</p>
              <p className="mt-2 text-sm text-amber2-700">Pode voltar a tentar mais tarde. A sua fotografia foi guardada e estará pronta para análise assim que o serviço estiver disponível.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setQuotaError(false)}>Entendido</Button>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <Card className="mb-6 animate-scaleIn border-rust-200 bg-rust-50/60 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={24} className="shrink-0 text-rust-600" />
            <div>
              <p className="font-semibold text-rust-900">Não foi possível concluir a análise</p>
              <p className="mt-1 text-sm text-rust-800">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setError(null)}>Tentar novamente</Button>
            </div>
          </div>
        </Card>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-forest-900">Análises recentes</h3>
          <Badge tone="neutral">{diagnoses.length}</Badge>
        </div>
        {diagnoses.length === 0 ? (
          <EmptyState icon={<ImageIcon size={32} />} title="Ainda não tem análises" hint="Faça o seu primeiro diagnóstico acima." />
        ) : (
          <div className="space-y-2">
            {diagnoses.slice(0, 5).map(d => (
              <Card key={d.id} onClick={() => navigate('diagnosis-result' as Page, { result: d })} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest-50 text-forest-600"><PartIcon part={d.part} /></div>
                  <div className="min-w-0 flex-1"><p className="truncate font-semibold text-forest-900">{d.primaryProblem}</p><p className="truncate text-sm text-forest-500">{d.plantGuess}</p></div>
                  <div className="text-right"><ConfidenceBadge score={d.confidenceScore} /><p className="mt-0.5 flex items-center gap-1 text-xs text-forest-400"><Clock size={11} /> {formatDate(d.date)}</p></div>
                  <ChevronRight size={18} className="text-forest-300" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function PartIcon({ part }: { part: string }) {
  const map: Record<string, React.ReactNode> = { folha: <Leaf size={20} />, fruto: <Apple size={20} />, caule: <TreePine size={20} />, raiz: <Sprout size={20} />, inseto: <Bug size={20} />, terra: <Mountain size={20} /> };
  return <>{map[part] ?? <Leaf size={20} />}</>;
}

function ConfidenceBadge({ score }: { score: number }) {
  const tone = score >= 75 ? 'leaf' : score >= 50 ? 'amber' : 'rust';
  return <Badge tone={tone as 'leaf' | 'amber' | 'rust'}>{score}% confiança</Badge>;
}

function extractProblemKey(problem: string): string {
  const p = problem.toLowerCase();
  if (p.includes('oídio') || p.includes('oidio')) return 'oídio';
  if (p.includes('pulga') || p.includes('pulgão') || p.includes('afídeo')) return 'pulgas-folhas';
  if (p.includes('cálcio') || p.includes('calcio')) return 'falta-calcio';
  return 'default';
}

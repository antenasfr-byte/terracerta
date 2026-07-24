import { useState } from 'react';
import {
  Layers, Camera, Upload, FlaskConical, Eye, Sparkles, CheckCircle2,
  Award,
} from 'lucide-react';
import { useApp } from '../store';
import { PageShell, Card, Badge, Button, Select, Input, SectionTitle, Progress, EmptyState } from '../components/ui';
import { formatDate } from '../data';
import { validateImage } from '../lib/photos';
import type { SoilAnswers, SoilTests, SoilReport, SoilRating } from '../types';

const COLOR_OPTS = ['Castanho-escuro', 'Castanho', 'Castanho-claro', 'Amarelado', 'Acinzentado', 'Vermelho'];
const TEXTURE_OPTS = ['Arenosa', 'Franca', 'Argilosa', 'Muito argilosa', 'Pedregosa'];
const HUMIDITY_OPTS = ['Seca', 'Húmida', 'Molhada', 'Encharcada'];
const DRAINAGE_OPTS = ['Rápida', 'Adequada', 'Lenta', 'Má (accumula água)'];
const ORGANIC_OPTS = ['Sem matéria orgânica visível', 'Pouca', 'Razoável', 'Abundante'];
const SMELL_OPTS = ['Sem cheiro', 'Cheiro a terra boa', 'Cheiro azedo', 'Cheiro a podre'];
const WORMS_OPTS = ['Nenhuma', 'Poucas', 'Várias', 'Muitas'];

export function SoilPage() {
  const { soilReports, addSoilReport } = useApp();
  const [image, setImage] = useState<string | null>(null);
  const [answers, setAnswers] = useState<SoilAnswers>({
    color: '', texture: '', humidity: '', drainage: '', compacted: '', organic: '', smell: '', worms: '',
  });
  const [tests, setTests] = useState<SoilTests>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<SoilReport | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadError(null);
    const r = new FileReader();
    r.onload = () => {
      const dataUrl = r.result as string;
      const v = validateImage(dataUrl);
      if (!v.ok) { setUploadError(v.error ?? 'Imagem inválida.'); return; }
      setImage(dataUrl);
    };
    r.readAsDataURL(f);
  };

  const allAnswered = Object.values(answers).every(Boolean);

  const analyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      const { score, rating, recommendations } = evaluate(answers, tests);
      const r: SoilReport = {
        id: 'soil-' + Date.now(),
        date: new Date().toISOString(),
        rating, score, answers, tests, recommendations,
      };
      setReport(r);
      addSoilReport(r);
      setAnalyzing(false);
    }, 1400);
  };

  return (
    <PageShell>
      <SectionTitle icon={<Layers size={22} />} title="Análise da terra" subtitle="Fotografe a terra e responda a perguntas simples sobre o seu solo." />

      <div className="mb-5 rounded-xl bg-sky2-50 px-4 py-3 text-sm text-sky2-800">
        <strong>Importante:</strong> Esta análise baseia-se na sua observação visual e nos valores que introduzir. Não substitui uma análise laboratorial de solo. Os valores de pH e nutrientes só são usados se introduzidos a partir de um teste ou sensor real.
      </div>

      {/* Photo */}
      <Card className="mb-6 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-forest-50 px-5 py-3">
          <Camera size={18} className="text-terracotta-500" />
          <h3 className="font-semibold text-forest-900">Fotografia da terra</h3>
        </div>
        <div className="p-5">
          {uploadError && (
            <div className="mb-3 rounded-xl bg-rust-50 px-4 py-2.5 text-sm text-rust-700">{uploadError}</div>
          )}
          {image ? (
            <div className="relative">
              <img src={image} alt="Terra" className="max-h-60 w-full rounded-xl object-cover" />
              <button onClick={() => setImage(null)} className="absolute right-3 top-3 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-forest-700 backdrop-blur hover:bg-white">Trocar</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-forest-200 py-8 hover:border-forest-400 hover:bg-forest-50">
                <Camera size={28} className="text-forest-600" /><span className="text-sm font-medium text-forest-700">Tirar fotografia</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
              </label>
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-forest-200 py-8 hover:border-forest-400 hover:bg-forest-50">
                <Upload size={28} className="text-terracotta-500" /><span className="text-sm font-medium text-forest-700">Carregar imagem</span>
                <input type="file" accept="image/*" className="hidden" onChange={onFile} />
              </label>
            </div>
          )}
          <p className="mt-3 text-xs text-forest-400">A fotografia é opcional e serve apenas para avaliação visual — não substitui uma análise laboratorial.</p>
        </div>
      </Card>

      {/* Questions */}
      <div className="mb-6">
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-forest-900"><Eye size={20} className="text-forest-600" /> Observação visual</h3>
        <Card className="p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Cor da terra" value={answers.color} onChange={e => setAnswers(a => ({ ...a, color: e.target.value }))}>
              <option value="">Selecione…</option>{COLOR_OPTS.map(o => <option key={o}>{o}</option>)}
            </Select>
            <Select label="Textura" value={answers.texture} onChange={e => setAnswers(a => ({ ...a, texture: e.target.value }))}>
              <option value="">Selecione…</option>{TEXTURE_OPTS.map(o => <option key={o}>{o}</option>)}
            </Select>
            <Select label="Humidade" value={answers.humidity} onChange={e => setAnswers(a => ({ ...a, humidity: e.target.value }))}>
              <option value="">Selecione…</option>{HUMIDITY_OPTS.map(o => <option key={o}>{o}</option>)}
            </Select>
            <Select label="Drenagem" value={answers.drainage} onChange={e => setAnswers(a => ({ ...a, drainage: e.target.value }))}>
              <option value="">Selecione…</option>{DRAINAGE_OPTS.map(o => <option key={o}>{o}</option>)}
            </Select>
            <Select label="Terra compactada?" value={answers.compacted} onChange={e => setAnswers(a => ({ ...a, compacted: e.target.value }))}>
              <option value="">Selecione…</option>{COMPACTION_OPTS.map(o => <option key={o}>{o}</option>)}
            </Select>
            <Select label="Matéria orgânica" value={answers.organic} onChange={e => setAnswers(a => ({ ...a, organic: e.target.value }))}>
              <option value="">Selecione…</option>{ORGANIC_OPTS.map(o => <option key={o}>{o}</option>)}
            </Select>
            <Select label="Cheiro" value={answers.smell} onChange={e => setAnswers(a => ({ ...a, smell: e.target.value }))}>
              <option value="">Selecione…</option>{SMELL_OPTS.map(o => <option key={o}>{o}</option>)}
            </Select>
            <Select label="Minhocas" value={answers.worms} onChange={e => setAnswers(a => ({ ...a, worms: e.target.value }))}>
              <option value="">Selecione…</option>{WORMS_OPTS.map(o => <option key={o}>{o}</option>)}
            </Select>
          </div>
        </Card>
      </div>

      {/* Lab tests */}
      <div className="mb-6">
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-forest-900"><FlaskConical size={20} className="text-sky2-500" /> Resultados de testes (opcional)</h3>
        <Card className="p-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Input label="pH" type="number" step="0.1" placeholder="6.5" value={tests.ph ?? ''} onChange={e => setTests(t => ({ ...t, ph: e.target.value ? +e.target.value : undefined }))} />
            <Input label="Humidade %" type="number" placeholder="40" value={tests.moisture ?? ''} onChange={e => setTests(t => ({ ...t, moisture: e.target.value ? +e.target.value : undefined }))} />
            <Input label="Temp. (°C)" type="number" placeholder="18" value={tests.temperature ?? ''} onChange={e => setTests(t => ({ ...t, temperature: e.target.value ? +e.target.value : undefined }))} />
            <Input label="Azoto (N)" type="number" placeholder="120" value={tests.nitrogen ?? ''} onChange={e => setTests(t => ({ ...t, nitrogen: e.target.value ? +e.target.value : undefined }))} />
            <Input label="Fósforo (P)" type="number" placeholder="45" value={tests.phosphorus ?? ''} onChange={e => setTests(t => ({ ...t, phosphorus: e.target.value ? +e.target.value : undefined }))} />
            <Input label="Potássio (K)" type="number" placeholder="180" value={tests.potassium ?? ''} onChange={e => setTests(t => ({ ...t, potassium: e.target.value ? +e.target.value : undefined }))} />
            <Input label="Salinidade" type="number" step="0.1" placeholder="2.0" value={tests.salinity ?? ''} onChange={e => setTests(t => ({ ...t, salinity: e.target.value ? +e.target.value : undefined }))} />
          </div>
          <p className="mt-3 text-xs text-forest-400">Introduza os valores se tiver kits de teste ou um sensor. Caso contrário, a análise baseia-se apenas na observação visual.</p>
          <div className="mt-2 rounded-xl bg-amber2-50 px-3 py-2 text-xs text-amber2-800">
            <strong>Avaliação visual vs. medição:</strong> Os valores de pH, azoto, fósforo e potássio só são considerados se introduzidos a partir de um teste ou sensor real. A fotografia da terra não permite medir estes valores.
          </div>
        </Card>
      </div>

      {/* Analyze */}
      <Button size="lg" className="mb-8 w-full" disabled={!allAnswered || analyzing} onClick={analyze}>
        <Sparkles size={20} /> {analyzing ? 'A analisar a terra…' : 'Analisar terra'}
      </Button>

      {/* Result */}
      {report && <SoilResultCard report={report} />}

      {/* History */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-forest-900">Análises anteriores</h3>
          <Badge tone="neutral">{soilReports.length}</Badge>
        </div>
        {soilReports.length === 0 ? (
          <EmptyState icon={<Layers size={32} />} title="Ainda não tem análises de terra" />
        ) : (
          <div className="space-y-2">
            {soilReports.map(r => (
              <Card key={r.id} className="flex items-center gap-4 p-4" onClick={() => setReport(r)}>
                <RatingBadge rating={r.rating} />
                <div className="flex-1">
                  <p className="font-semibold capitalize text-forest-900">Terra {r.rating}</p>
                  <p className="text-sm text-forest-500">{formatDate(r.date)} · {r.score}/100</p>
                </div>
                <Progress value={r.score} tone={ratingTone(r.rating)} />
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

const COMPACTION_OPTS = ['Não, solta', 'Pouco compactada', 'Compactada', 'Muito dura'];

function SoilResultCard({ report }: { report: SoilReport }) {
  return (
    <Card className="overflow-hidden animate-scaleIn">
      <div className="flex items-center gap-4 bg-gradient-to-br from-terracotta-500 to-terracotta-600 p-5 text-white">
        <Award size={36} />
        <div>
          <p className="text-sm text-terracotta-50">Classificação da terra</p>
          <p className="font-display text-2xl font-semibold capitalize">{report.rating}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-3xl font-bold">{report.score}<span className="text-lg text-terracotta-50">/100</span></p>
        </div>
      </div>
      <div className="p-5">
        <h4 className="mb-3 flex items-center gap-2 font-semibold text-forest-900"><CheckCircle2 size={18} className="text-leaf-600" /> Recomendações para melhorar</h4>
        <ul className="space-y-2">
          {report.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2 rounded-xl bg-forest-50/60 px-4 py-2.5 text-sm text-forest-800">
              <Sparkles size={15} className="mt-0.5 shrink-0 text-terracotta-500" /> {rec}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function RatingBadge({ rating }: { rating: SoilRating }) {
  return <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-xs font-bold ${ratingColor(rating)}`}><span className="capitalize">{rating}</span></div>;
}
function ratingColor(r: SoilRating) {
  return r === 'muito boa' ? 'bg-leaf-100 text-leaf-700' : r === 'boa' ? 'bg-forest-100 text-forest-700' : r === 'razoável' ? 'bg-wheat-100 text-wheat-800' : 'bg-rust-100 text-rust-700';
}
function ratingTone(r: SoilRating): 'leaf' | 'forest' | 'wheat' | 'rust' {
  return r === 'muito boa' ? 'leaf' : r === 'boa' ? 'forest' : r === 'razoável' ? 'wheat' : 'rust';
}

// Scoring logic
function evaluate(answers: SoilAnswers, tests: SoilTests): { score: number; rating: SoilRating; recommendations: string[] } {
  let score = 50;
  const recs: string[] = [];

  // color
  if (answers.color === 'Castanho-escuro') score += 12;
  else if (answers.color === 'Castanho') score += 6;
  else if (answers.color === 'Amarelado' || answers.color === 'Acinzentado') { score -= 8; recs.push('Adicionar composto ou matéria orgânica para escurecer e enriquecer o solo.'); }

  // texture
  if (answers.texture === 'Franca') score += 12;
  else if (answers.texture === 'Arenosa') { score -= 4; recs.push('Misturar composto e turfa para reter mais água e nutrientes em solos arenosos.'); }
  else if (answers.texture === 'Argilosa' || answers.texture === 'Muito argilosa') { score -= 8; recs.push('Adicionar areia grossa e matéria orgânica para melhorar a drenagem em solos argilosos.'); }

  // drainage
  if (answers.drainage === 'Adequada') score += 10;
  else if (answers.drainage === 'Rápida') { score -= 4; recs.push('Adicionar matéria orgânica para melhorar a retenção de água.'); }
  else if (answers.drainage.startsWith('Má')) { score -= 12; recs.push('Melhorar a drenagem: criar camadas elevadas, adicionar areia ou instalar drenos.'); }

  // compacted
  if (answers.compacted === 'Não, solta') score += 8;
  else if (answers.compacted === 'Compactada' || answers.compacted === 'Muito dura') { score -= 10; recs.push('Relgar ou escavar para arejar a terra compactada; adicionar composto.'); }

  // organic
  if (answers.organic === 'Abundante') score += 12;
  else if (answers.organic === 'Razoável') score += 5;
  else if (answers.organic.startsWith('Sem')) { score -= 10; recs.push('Incorporar estrume curtido ou composto maduro para aumentar a matéria orgânica.'); }

  // worms
  if (answers.worms === 'Muitas' || answers.worms === 'Várias') score += 10;
  else if (answers.worms === 'Nenhuma') { score -= 6; recs.push('A ausência de minhocas indica solo pobre — adicione matéria orgânica e evite pesticidas.'); }

  // smell
  if (answers.smell === 'Cheiro a terra boa') score += 6;
  else if (answers.smell === 'Cheiro azedo' || answers.smell === 'Cheiro a podre') { score -= 10; recs.push('Cheiro azedo indica excesso de água ou decomposição anaeróbia — melhore a drenagem e areje.'); }

  // lab tests
  if (tests.ph !== undefined) {
    if (tests.ph >= 6.2 && tests.ph <= 7.2) score += 8;
    else { score -= 6; recs.push(`Corrigir o pH (${tests.ph}): aplicar calcário agrícola se ácido (<6) ou enxofre se alcalino (>7,5).`); }
  }
  if (tests.nitrogen !== undefined && tests.nitrogen < 80) recs.push('Azoto baixo: adubar com estrume curtido ou adubo rico em azoto.');
  if (tests.phosphorus !== undefined && tests.phosphorus < 30) recs.push('Fósforo baixo: aplicar fosfato natural ou farinha de ossos.');
  if (tests.potassium !== undefined && tests.potassium < 120) recs.push('Potássio baixo: aplicar cinzas de madeira ou sulfato de potássio.');
  if (tests.salinity !== undefined && tests.salinity > 4) { score -= 10; recs.push('Salinidade elevada: lavar o solo com rega abundante e melhorar a drenagem.'); }

  score = Math.max(0, Math.min(100, score));
  const rating: SoilRating = score >= 80 ? 'muito boa' : score >= 60 ? 'boa' : score >= 40 ? 'razoável' : 'fraca';
  if (recs.length === 0) recs.push('A terra está em bom estado! Mantenha a adição regular de composto e rotação de culturas.');

  return { score, rating, recommendations: Array.from(new Set(recs)) };
}

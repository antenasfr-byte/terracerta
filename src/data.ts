import { supabase } from './lib/supabase';
import type { Crop, Insect, Weed, Treatment } from './types';

// Region names (static — not in DB)
export const REGION_NAMES = [
  'Minho', 'Trás-os-Montes', 'Douro Litoral', 'Beira Litoral',
  'Beira Interior', 'Estremadura', 'Ribatejo', 'Alto Alentejo',
  'Baixo Alentejo', 'Algarve', 'Madeira', 'Açores',
];

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// ── Async catalog loaders (fetch from Supabase) ──────────────────────
export async function loadCrops(): Promise<Crop[]> {
  const { data, error } = await supabase.from('crops').select('*').order('name');
  if (error || !data) return [];
  return data.map((c: Record<string, unknown>) => ({
    id: c.id as string, name: c.name as string, category: c.category as Crop['category'], icon: c.icon as string,
    plantMonths: (c.plant_months as number[]) ?? [], depth: c.depth as string, spacing: c.spacing as string,
    water: c.water as string, sun: c.sun as string, harvestDays: c.harvest_days as string, difficulty: c.difficulty as Crop['difficulty'],
  }));
}

export async function loadInsects(): Promise<Insect[]> {
  const { data, error } = await supabase.from('insects').select('*').order('name');
  if (error || !data) return [];
  return data.map((i: Record<string, unknown>) => ({
    id: i.id as string, name: i.name as string, type: i.type as Insect['type'], emoji: i.emoji as string,
    description: i.description as string, signs: (i.signs as string[]) ?? [], treatment: (i.treatment as string) ?? undefined,
  }));
}

export async function loadWeeds(): Promise<Weed[]> {
  const { data, error } = await supabase.from('weeds').select('*').order('name');
  if (error || !data) return [];
  return data.map((w: Record<string, unknown>) => ({
    id: w.id as string, name: w.name as string, emoji: w.emoji as string, invasive: w.invasive as boolean,
    toxic: w.toxic as boolean, description: w.description as string, control: w.control as string,
  }));
}

export async function loadTreatments(problemKey: string): Promise<Treatment[]> {
  const { data, error } = await supabase
    .from('treatments')
    .select('*')
    .or(`problem_key.eq.${problemKey},problem_key.eq.default`)
    .order('kind');
  if (error || !data) return [];
  return data.map((t: Record<string, unknown>) => ({
    id: t.id as string, name: t.name as string, kind: t.kind as Treatment['kind'], doses: (t.doses as Treatment['doses']) ?? [],
    bestHour: t.best_hour as string, waitDays: t.wait_days as number,
    warnings: (t.warnings as string[]) ?? [], doNotMix: (t.do_not_mix as string[]) ?? [],
  }));
}

// ── Date utilities ────────────────────────────────────────────────────
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
}
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
}
export function relativeDay(iso: string): string {
  const diff = Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Ontem';
  if (diff < 0) return `há ${Math.abs(diff)} dias`;
  return `em ${diff} dias`;
}

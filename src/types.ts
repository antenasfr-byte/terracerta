// TerraCerta — tipos centrais (demonstração)

export type Plan = 'grátis' | 'premium' | 'profissional';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  isAdmin: boolean;
  region: string;
  createdAt: string;
}

export type Page =
  | 'home'
  | 'diagnose'
  | 'diagnosis-result'
  | 'soil'
  | 'sun'
  | 'plant-here'
  | 'calendar'
  | 'journal'
  | 'plots'
  | 'weather'
  | 'reminders'
  | 'compare'
  | 'insects'
  | 'profile'
  | 'admin';

export type Confidence = 'low' | 'medium' | 'high';

export interface DiagnosisCause {
  label: string;
  probability: number; // 0-100
  type: 'doença' | 'praga' | 'carencia' | 'excesso' | 'queimadura' | 'outra';
}

export interface TreatmentDose {
  liters: 1 | 5 | 10 | 16 | 20;
  amount: string;
}

export interface Treatment {
  id: string;
  name: string;
  kind: 'biológico' | 'convencional';
  doses: TreatmentDose[];
  bestHour: string;
  waitDays: number; // dias antes da colheita
  warnings: string[];
  doNotMix: string[];
}

export interface DiagnosisResult {
  id: string;
  date: string;
  part: 'folha' | 'fruto' | 'caule' | 'raiz' | 'inseto' | 'terra';
  plantGuess: string;
  scientificName?: string;
  confidence: Confidence;
  confidenceScore: number;
  primaryProblem: string;
  problemCategory?: string;
  causes: DiagnosisCause[];
  treatments: Treatment[];
  recheckDays: number;
  note: string;
  visibleSigns?: string[];
  immediateActions?: string[];
  biologicalActions?: string[];
  conventionalActions?: string[];
  safetyWarnings?: string[];
  newPhotosRequired?: string[];
  safetyDisclaimer?: string;
}

// Soil
export type SoilRating = 'fraca' | 'razoável' | 'boa' | 'muito boa';

export interface SoilAnswers {
  color: string;
  texture: string;
  humidity: string;
  drainage: string;
  compacted: string;
  organic: string;
  smell: string;
  worms: string;
}

export interface SoilTests {
  ph?: number;
  moisture?: number;
  temperature?: number;
  nitrogen?: number; // azoto
  phosphorus?: number; // fósforo
  potassium?: number; // potássio
  salinity?: number;
}

export interface SoilReport {
  id: string;
  date: string;
  rating: SoilRating;
  score: number; // 0-100
  answers: SoilAnswers;
  tests: SoilTests;
  recommendations: string[];
}

// Sun exposure
export type SunClass = 'sombra' | 'meia-sombra' | 'sol-parcial' | 'sol-pleno';

export interface SunReport {
  id: string;
  date: string;
  location: string;
  orientation: string;
  hours: number;
  hasObstructions: boolean;
  classification: SunClass;
  sunHours: number;
  burnRisk: 'baixo' | 'moderado' | 'alto';
  needsShadeNet: boolean;
  bestWateringHour: string;
  suggestedPlants: string[];
}

// Calendar / planting
export type CropCategory = 'legumes' | 'frutas' | 'árvores' | 'ervas' | 'flores' | 'resistentes';

export interface Crop {
  id: string;
  name: string;
  category: CropCategory;
  icon: string; // emoji
  plantMonths: number[]; // 1-12
  depth: string;
  spacing: string;
  water: string;
  sun: string;
  harvestDays: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
}

// Insects / weeds
export type InsectType = 'prejudicial' | 'benéfico' | 'neutro';

export interface Insect {
  id: string;
  name: string;
  type: InsectType;
  emoji: string;
  description: string;
  signs: string[];
  treatment?: string;
}

export interface Weed {
  id: string;
  name: string;
  emoji: string;
  invasive: boolean;
  toxic: boolean;
  description: string;
  control: string;
}

// Garden journal
export interface Plot {
  id: string;
  name: string;
  area: string;
  location: string;
  createdAt: string;
}

export interface PlantEntry {
  id: string;
  plotId: string;
  name: string;
  variety: string;
  plantedAt: string;
  status: 'viva' | 'colhida' | 'perdida';
  photo?: string;
  notes: string;
}

export interface JournalEvent {
  id: string;
  plantEntryId: string;
  date: string;
  type: 'rega' | 'adubação' | 'tratamento' | 'doença' | 'colheita' | 'despesa' | 'observação' | 'fotografia';
  title: string;
  detail: string;
  amount?: number;
  photo?: string;
}

// Reminders
export interface Reminder {
  id: string;
  title: string;
  type: 'regar' | 'adubar' | 'tratamento' | 'fotografia' | 'podar' | 'plantar' | 'colher';
  date: string;
  plotId?: string;
  done: boolean;
}

// Weather
export interface WeatherDay {
  date: string;
  tempMin: number;
  tempMax: number;
  condition: string;
  icon: string;
  rainProbability: number;
  rainMm: number;
  windKmh: number;
  humidity: number;
  frostRisk: boolean;
  heatWave: boolean;
}

export interface WeatherAlert {
  id: string;
  severity: 'info' | 'aviso' | 'alerta';
  title: string;
  message: string;
}

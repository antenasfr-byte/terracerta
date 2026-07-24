import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import type {
  User, Page, DiagnosisResult, SoilReport, SunReport,
  Reminder, Plot, PlantEntry, JournalEvent, Plan, Treatment,
} from './types';
import { supabase } from './lib/supabase';
import { scheduleReminderNotifications, cancelReminderNotification, requestNotificationPermission } from './lib/notifications';
import type { Session } from '@supabase/supabase-js';

interface AppState {
  user: User | null;
  page: Page;
  session: Session | null;
  loading: boolean;
  // data stores (loaded from Supabase)
  diagnoses: DiagnosisResult[];
  soilReports: SoilReport[];
  sunReports: SunReport[];
  reminders: Reminder[];
  plots: Plot[];
  plants: PlantEntry[];
  events: JournalEvent[];
  navPayload: Record<string, unknown>;
}

interface AppContextValue extends AppState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string, plan: Plan) => Promise<{ error: string | null }>;
  signOut: () => void;
  navigate: (page: Page, payload?: Record<string, unknown>) => void;
  refreshData: () => Promise<void>;
  addDiagnosis: (d: DiagnosisResult) => void;
  addSoilReport: (r: SoilReport) => void;
  addSunReport: (r: SunReport) => void;
  toggleReminder: (id: string) => Promise<void>;
  addReminder: (r: Reminder) => Promise<void>;
  addPlot: (p: Plot) => Promise<void>;
  addPlant: (p: PlantEntry) => Promise<void>;
  addEvent: (e: JournalEvent) => Promise<void>;
  setPlan: (plan: Plan) => Promise<void>;
  updateProfile: (name: string, region: string) => Promise<{ error: string | null }>;
}

const AppContext = createContext<AppContextValue | null>(null);

function mapUser(session: Session | null, profile: { id: string; email: string; name: string; region: string; plan: string; is_admin: boolean; created_at: string } | null): User | null {
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? profile?.email ?? '',
    name: profile?.name ?? session.user.email?.split('@')[0] ?? '',
    plan: (profile?.plan as Plan) ?? 'grátis',
    isAdmin: profile?.is_admin ?? false,
    region: profile?.region ?? 'Estremadura',
    createdAt: profile?.created_at ?? new Date().toISOString(),
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<Page>('home');
  const [navPayload, setNavPayload] = useState<Record<string, unknown>>({});

  const [diagnoses, setDiagnoses] = useState<DiagnosisResult[]>([]);
  const [soilReports, setSoilReports] = useState<SoilReport[]>([]);
  const [sunReports, setSunReports] = useState<SunReport[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [plants, setPlants] = useState<PlantEntry[]>([]);
  const [events, setEvents] = useState<JournalEvent[]>([]);

  // Load profile from profiles table
  const loadProfile = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, name, region, plan, is_admin, created_at')
      .eq('id', uid)
      .maybeSingle();
    return data;
  }, []);

  // Load all user data from Supabase
  const refreshData = useCallback(async () => {
    if (!session?.user) return;

    const [plotsRes, plantsRes, remindersRes, diagnosesRes, soilRes, sunRes, eventsRes] = await Promise.all([
      supabase.from('plots').select('*').order('created_at', { ascending: false }),
      supabase.from('plants').select('*').order('planted_at', { ascending: false }),
      supabase.from('reminders').select('*').order('due_date', { ascending: true }),
      supabase.from('diagnoses').select('*, causes:diagnosis_causes(*)').order('created_at', { ascending: false }),
      supabase.from('soil_reports').select('*').order('created_at', { ascending: false }),
      supabase.from('sun_reports').select('*').order('created_at', { ascending: false }),
      supabase.from('journal_events').select('*').order('created_at', { ascending: false }),
    ]);

    setPlots((plotsRes.data ?? []) as Plot[]);
    setPlants((plantsRes.data ?? []) as PlantEntry[]);
    setReminders((remindersRes.data ?? []) as Reminder[]);
    setDiagnoses((diagnosesRes.data ?? []).map((d: Record<string, unknown>) => ({
      id: d.id as string,
      date: d.created_at as string,
      part: d.part as DiagnosisResult['part'],
      plantGuess: (d.plant_name as string) || (d.plant_guess as string),
      scientificName: d.scientific_name as string,
      confidence: d.confidence as DiagnosisResult['confidence'],
      confidenceScore: d.confidence_score as number,
      primaryProblem: d.primary_problem as string,
      problemCategory: d.problem_category as string,
      causes: ((d.causes as Array<Record<string, unknown>>) ?? [])
        .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
        .map(c => ({ label: c.label as string, probability: c.probability as number, type: c.type as DiagnosisResult['causes'][number]['type'] })),
      treatments: [] as Treatment[],
      recheckDays: d.recheck_days as number,
      note: d.note as string,
      visibleSigns: d.visible_signs as string[],
      immediateActions: d.immediate_actions as string[],
      biologicalActions: d.biological_actions as string[],
      conventionalActions: d.conventional_actions as string[],
      safetyWarnings: d.safety_warnings as string[],
      newPhotosRequired: d.new_photos_required as string[],
      safetyDisclaimer: d.safety_disclaimer as string,
    })) as DiagnosisResult[]);
    setSoilReports((soilRes.data ?? []) as unknown as SoilReport[]);
    setSunReports((sunRes.data ?? []) as unknown as SunReport[]);
    setEvents((eventsRes.data ?? []) as JournalEvent[]);
  }, [session]);

  // Initialize: listen to auth state changes
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        const profile = await loadProfile(s.user.id);
        if (mounted) {
          setUser(mapUser(s, profile as Record<string, unknown> as { id: string; email: string; name: string; region: string; plan: string; is_admin: boolean; created_at: string }));
          await refreshData();
        }
      }
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      (async () => {
        setSession(s);
        if (s?.user) {
          const profile = await loadProfile(s.user.id);
          setUser(mapUser(s, profile as Record<string, unknown> as { id: string; email: string; name: string; region: string; plan: string; is_admin: boolean; created_at: string }));
          await refreshData();
        } else {
          setUser(null);
        }
        setLoading(false);
      })();
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [loadProfile, refreshData]);

  // Schedule local notifications for existing reminders on load (permission already granted or denied previously)
  useEffect(() => {
    if (session?.user) scheduleReminderNotifications(reminders);
  }, [reminders, session]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string, plan: Plan) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, plan } },
    });
    if (error) return { error: error.message };
    // Profile is created automatically by the handle_new_user trigger.
    // If the trigger didn't create it (edge case), create a minimal one —
    // but NEVER set is_admin or plan here; the trigger handles plan, and
    // is_admin is always false for self-signup.
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        name,
      });
    }
    return { error: null };
  }, []);

  const signOut = useCallback(() => {
    supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setPage('home');
    setDiagnoses([]); setSoilReports([]); setSunReports([]);
    setReminders([]); setPlots([]); setPlants([]); setEvents([]);
  }, []);

  const navigate = useCallback((p: Page, payload: Record<string, unknown> = {}) => {
    setPage(p); setNavPayload(payload); window.scrollTo(0, 0);
  }, []);

  const addDiagnosis = useCallback((d: DiagnosisResult) => {
    setDiagnoses(prev => [d, ...prev]);
  }, []);

  const addSoilReport = useCallback(async (r: SoilReport) => {
    setSoilReports(prev => [r, ...prev]);
    const { id, date, ...rest } = r;
    void id; void date;
    await supabase.from('soil_reports').insert(rest);
  }, []);

  const addSunReport = useCallback(async (r: SunReport) => {
    setSunReports(prev => [r, ...prev]);
    const { id, date, ...rest } = r;
    void id; void date;
    await supabase.from('sun_reports').insert(rest);
  }, []);

  const toggleReminder = useCallback(async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    const newDone = !reminder.done;
    setReminders(prev => prev.map(r => r.id === id ? { ...r, done: newDone } : r));
    await supabase.from('reminders').update({ done: newDone }).eq('id', id);
    if (newDone) await cancelReminderNotification(id);
    else await scheduleReminderNotifications(reminders.map(r => r.id === id ? { ...r, done: false } : r));
  }, [reminders]);

  const addReminder = useCallback(async (r: Reminder) => {
    // Request notification permission only at the moment the user creates a reminder
    await requestNotificationPermission();
    setReminders(prev => [r, ...prev]);
    const { plotId, ...rest } = r;
    await supabase.from('reminders').insert({
      ...rest,
      plot_id: plotId || null,
      due_date: r.date,
    });
    await scheduleReminderNotifications([r, ...reminders]);
  }, [reminders]);

  const addPlot = useCallback(async (p: Plot) => {
    setPlots(prev => [p, ...prev]);
    await supabase.from('plots').insert({
      name: p.name, area: p.area, location: p.location,
    });
  }, []);

  const addPlant = useCallback(async (p: PlantEntry) => {
    setPlants(prev => [p, ...prev]);
    await supabase.from('plants').insert({
      plot_id: p.plotId, name: p.name, variety: p.variety,
      planted_at: p.plantedAt, status: p.status, notes: p.notes,
    });
  }, []);

  const addEvent = useCallback(async (e: JournalEvent) => {
    setEvents(prev => [e, ...prev]);
    await supabase.from('journal_events').insert({
      plant_id: e.plantEntryId, type: e.type, title: e.title,
      detail: e.detail, amount: e.amount ?? null,
    });
  }, []);

  const setPlan = useCallback(async (_plan: Plan) => {
    void _plan;
    // Plan changes are NOT allowed from the frontend.
    // Subscriptions and plan upgrades must go through a server-side flow
    // (e.g. Stripe checkout handled by an edge function with service_role).
    // This is a no-op to prevent privilege escalation.
  }, []);

  const updateProfile = useCallback(async (name: string, region: string) => {
    if (!user) return { error: 'Sem sessão' };
    setUser(u => u ? { ...u, name, region } : u);
    const { error } = await supabase.from('profiles').update({ name, region }).eq('id', user.id);
    return { error: error?.message ?? null };
  }, [user]);

  const value = useMemo<AppContextValue>(() => ({
    user, page, session, loading,
    diagnoses, soilReports, sunReports, reminders, plots, plants, events, navPayload,
    signIn, signUp, signOut, navigate, refreshData,
    addDiagnosis, addSoilReport, addSunReport,
    toggleReminder, addReminder, addPlot, addPlant, addEvent,
    setPlan, updateProfile,
  }), [user, page, session, loading, diagnoses, soilReports, sunReports, reminders, plots, plants, events, navPayload, signIn, signUp, signOut, navigate, refreshData, addDiagnosis, addSoilReport, addSunReport, toggleReminder, addReminder, addPlot, addPlant, addEvent, setPlan, updateProfile]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

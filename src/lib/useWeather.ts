import { useEffect, useState, useCallback } from 'react';
import { fetchWeather, getCurrentLocation, DEFAULT_LOCATION } from '../lib/weather';
import type { WeatherDay, WeatherAlert } from '../types';
import type { GeoLocation } from '../lib/weather';

export function useWeather() {
  const [days, setDays] = useState<WeatherDay[]>([]);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>('Lisboa (predefinida)');
  const [usingLocation, setUsingLocation] = useState(false);

  const load = useCallback(async (geo?: GeoLocation) => {
    setLoading(true);
    setError(null);
    try {
      const { days: d, alerts: a } = await fetchWeather(geo ?? DEFAULT_LOCATION);
      setDays(d);
      setAlerts(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar meteorologia');
    } finally {
      setLoading(false);
    }
  }, []);

  const locateMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const geo = await getCurrentLocation();
      setLocationLabel('A sua localização');
      setUsingLocation(true);
      await load(geo);
    } catch {
      setLocationLabel('Lisboa (predefinida)');
      setUsingLocation(false);
      await load(DEFAULT_LOCATION);
    }
  }, [load]);

  useEffect(() => { load(); }, [load]);

  return { days, alerts, loading, error, locationLabel, usingLocation, reload: () => load(usingLocation ? undefined : undefined), locateMe };
}

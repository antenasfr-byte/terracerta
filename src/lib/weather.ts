// Real weather via Open-Meteo (free, no API key required)
// https://open-meteo.com/en/docs

import type { WeatherDay, WeatherAlert } from '../types';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  label?: string;
}

// Get the user's current geolocation from the browser
export function getCurrentLocation(): Promise<GeoLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não suportada neste dispositivo.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(new Error('Não foi possível obter a localização: ' + err.message)),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  });
}

// Map WMO weather codes to description + icon
function wmoToCondition(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: 'Céu limpo', icon: '☀️' };
  if (code <= 2) return { condition: 'Sol e nuvens soltas', icon: '⛅' };
  if (code === 3) return { condition: 'Nublado', icon: '☁️' };
  if (code <= 48) return { condition: 'Névoa', icon: '🌫️' };
  if (code <= 57) return { condition: 'Chuvisco', icon: '🌦️' };
  if (code <= 67) return { condition: 'Chuva', icon: '🌧️' };
  if (code <= 77) return { condition: 'Neve', icon: '🌨️' };
  if (code <= 82) return { condition: 'Aguaceiros', icon: '🌧️' };
  if (code <= 86) return { condition: 'Aguaceiros de neve', icon: '🌨️' };
  if (code <= 99) return { condition: 'Trovoada', icon: '⛈️' };
  return { condition: 'Desconhecido', icon: '❓' };
}

// Fetch 7-day forecast from Open-Meteo
export async function fetchWeather(geo: GeoLocation): Promise<{ days: WeatherDay[]; alerts: WeatherAlert[] }> {
  const url = `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${geo.latitude}&longitude=${geo.longitude}` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,` +
    `precipitation_sum,wind_speed_10m_max,relative_humidity_2m_max` +
    `&timezone=auto&forecast_days=7`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao obter meteorologia (${res.status})`);
  const data = await res.json();

  const daily = data.daily;
  const days: WeatherDay[] = [];
  const alerts: WeatherAlert[] = [];

  for (let i = 0; i < daily.time.length; i++) {
    const code = daily.weather_code[i];
    const { condition, icon } = wmoToCondition(code);
    const tempMin = Math.round(daily.temperature_2m_min[i]);
    const tempMax = Math.round(daily.temperature_2m_max[i]);
    const rainProb = daily.precipitation_probability_max?.[i] ?? 0;
    const rainMm = daily.precipitation_sum?.[i] ?? 0;
    const windKmh = Math.round(daily.wind_speed_10m_max?.[i] ?? 0);
    const humidity = daily.relative_humidity_2m_max?.[i] ?? 50;
    const frostRisk = tempMin <= 2;
    const heatWave = tempMax >= 33;

    days.push({
      date: daily.time[i] + 'T00:00:00',
      tempMin, tempMax, condition, icon,
      rainProbability: rainProb, rainMm, windKmh, humidity,
      frostRisk, heatWave,
    });

    // Generate alerts for today + tomorrow
    if (i <= 1) {
      if (windKmh >= 25) {
        alerts.push({
          id: `wind-${i}`,
          severity: 'aviso',
          title: 'Vento moderado a forte',
          message: `Vento previsto de ${windKmh} km/h. Não aplicar tratamentos de pulverização — risco de deriva.`,
        });
      }
      if (rainProb >= 60) {
        alerts.push({
          id: `rain-${i}`,
          severity: 'info',
          title: 'Chuva prevista',
          message: `Probabilidade de chuva ${rainProb}%. Regar ao final do dia não é necessário.`,
        });
      }
      if (frostRisk) {
        alerts.push({
          id: `frost-${i}`,
          severity: 'alerta',
          title: 'Risco de geada',
          message: `Temperatura mínima de ${tempMin} °C. Proteger plantas sensíveis (tomate, pimentão, feijão).`,
        });
      }
      if (heatWave) {
        alerts.push({
          id: `heat-${i}`,
          severity: 'alerta',
          title: 'Onda de calor',
          message: `Temperatura máxima de ${tempMax} °C. Regar ao nascer do dia e ao pôr-do-sol. Proteger plantas do calor.`,
        });
      }
    }
  }

  return { days, alerts: alerts.slice(0, 4) };
}

// Fallback: Lisbon coordinates if geolocation is denied
export const DEFAULT_LOCATION: GeoLocation = { latitude: 38.7223, longitude: -9.1393, label: 'Lisboa' };

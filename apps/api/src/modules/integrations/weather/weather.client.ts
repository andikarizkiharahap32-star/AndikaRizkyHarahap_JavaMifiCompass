import { WeatherForecast } from '../integrations.types';
import { CircuitBreaker } from '../circuit-breaker';

// Coordinates for capital / major travel hubs
const HUB_COORDINATES: Record<string, { lat: number; lng: number }> = {
  JP: { lat: 35.6762, lng: 139.6503 }, // Tokyo
  CN: { lat: 39.9042, lng: 116.4074 }, // Beijing
  SG: { lat: 1.3521, lng: 103.8198 }, // Singapore
  MY: { lat: 3.139, lng: 101.6869 }, // Kuala Lumpur
  SA: { lat: 21.3891, lng: 39.8579 }, // Makkah
  TH: { lat: 13.7563, lng: 100.5018 }, // Bangkok
  KR: { lat: 37.5665, lng: 126.978 }, // Seoul
  FR: { lat: 48.8566, lng: 2.3522 }, // Paris
  GB: { lat: 51.5074, lng: -0.1278 }, // London
  ID: { lat: -6.2088, lng: 106.8456 }, // Jakarta
};

export class WeatherClient {
  private readonly baseUrl = process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com';
  private readonly circuitBreaker = new CircuitBreaker('Open-Meteo', { timeoutMs: 4000 });
  private readonly cache = new Map<string, { data: WeatherForecast; expiresAt: number }>();

  async getWeather(countryCode: string): Promise<WeatherForecast | null> {
    const code = countryCode.toUpperCase();
    const cached = this.cache.get(code);

    if (cached && Date.now() < cached.expiresAt) {
      return { ...cached.data, isCached: true };
    }

    const coords = HUB_COORDINATES[code] || { lat: 0, lng: 0 };

    return this.circuitBreaker.execute(
      async () => {
        const url = `${this.baseUrl}/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current_weather=true`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Open-Meteo error: ${res.statusText}`);

        const data = (await res.json()) as any;
        const cur = data.current_weather;

        const weatherCode = cur?.weathercode ?? 0;
        const condition = this.mapWeatherCode(weatherCode);

        const forecast: WeatherForecast = {
          countryCode: code,
          temperatureC: Math.round(cur?.temperature ?? 25),
          condition: condition.text,
          conditionIcon: condition.icon,
          isCached: false,
          timestamp: new Date().toISOString(),
        };

        // Cache for 30 minutes
        this.cache.set(code, { data: forecast, expiresAt: Date.now() + 30 * 60 * 1000 });
        return forecast;
      },
      () => {
        // Fallback: cached data even if expired, or sensible default
        if (cached) return { ...cached.data, isCached: true };
        return {
          countryCode: code,
          temperatureC: 24,
          condition: 'Partly Cloudy',
          conditionIcon: '⛅',
          isCached: true,
          timestamp: new Date().toISOString(),
        };
      },
    );
  }

  private mapWeatherCode(code: number): { text: string; icon: string } {
    if (code === 0) return { text: 'Clear Sky', icon: '☀️' };
    if (code <= 3) return { text: 'Partly Cloudy', icon: '⛅' };
    if (code <= 48) return { text: 'Foggy', icon: '🌫️' };
    if (code <= 65) return { text: 'Rainy', icon: '🌧️' };
    if (code <= 75) return { text: 'Snowy', icon: '❄️' };
    return { text: 'Thunderstorm', icon: '⛈️' };
  }
}

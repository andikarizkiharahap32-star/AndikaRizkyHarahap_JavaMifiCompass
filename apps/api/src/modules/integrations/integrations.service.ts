import { Injectable } from '@nestjs/common';
import { WeatherClient } from './weather/weather.client';
import { CurrencyClient } from './currency/currency.client';
import { CountriesClient } from './countries/countries.client';
import { DestinationReadinessCard } from './integrations.types';
import { MockEsimAdapter } from './esim/mock-esim.adapter';

@Injectable()
export class IntegrationsService {
  private readonly weatherClient = new WeatherClient();
  private readonly currencyClient = new CurrencyClient();
  private readonly countriesClient = new CountriesClient();
  readonly esimAdapter = new MockEsimAdapter();

  async getDestinationReadiness(countryCode: string): Promise<DestinationReadinessCard> {
    const code = countryCode.toUpperCase();

    // Fetch all 3 keyless public APIs in parallel
    const [countryInfo, weather, exchangeRate] = await Promise.all([
      this.countriesClient.getCountryInfo(code),
      this.weatherClient.getWeather(code),
      this.currencyClient.getExchangeRate(code),
    ]);

    const isChina = code === 'CN';
    const isSaudi = code === 'SA';
    const isJapan = code === 'JP';

    let tipsId = 'Bawa power bank dan aktifkan roaming saat mendarat.';
    let tipsEn = 'Bring a power bank and enable data roaming upon landing.';
    let plugType = 'Type C / G';

    if (isChina) {
      tipsId = 'Aplikasi Google, WA, dan IG diblokir. JavaMifi WiFi/eSIM menyertakan bypass VPN aktif otomatis.';
      tipsEn = 'Google, WA & IG are blocked in China. JavaMifi Pocket WiFi comes with pre-configured VPN.';
      plugType = 'Type A / C / I';
    } else if (isSaudi) {
      tipsId = 'Cocok untuk ibadah Umrah/Haji. Paket WiFi dapat dibagi untuk keluarga hingga 5 perangkat sekaligus.';
      tipsEn = 'Ideal for Umrah and Hajj pilgrims. Share 1 WiFi router across family members.';
      plugType = 'Type G (UK 3-pin)';
    } else if (isJapan) {
      tipsId = 'Jaringan 4G/5G sangat luas di seluruh Jepang termasuk Shinkansen dan daerah pegunungan.';
      tipsEn = 'High-speed 4G/5G coverage throughout Japan including high-speed Shinkansen trains.';
      plugType = 'Type A / B (2 flat pins, 100V)';
    }

    return {
      countryCode: code,
      countryInfo,
      weather,
      exchangeRate,
      tips: {
        id: tipsId,
        en: tipsEn,
        requiresVpn: isChina,
        plugType,
      },
    };
  }
}

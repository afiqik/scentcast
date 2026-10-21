import {
  weatherService,
  filterAndRankPerfumesByWeather,
  getPerfumeTimeSuitability,
  isColdTemperature,
  isNightTime,
  getMalaysianCurrentHour,
  calculateSkinTemperature,
  calculateOlfactoryMetrics
} from '../services/weatherService.js';
import { perfumeService } from '../services/perfumeService.js';
import { t, formatLongevity, translateNotes } from '../services/i18nService.js';
import { formatImageUrl, DEFAULT_FLACON_PLACEHOLDER } from '../services/storageService.js';

let selectedAccord = 'all';
let activeRegionFilter = 'all'; // 'all' | 'peninsular' | 'sabah' | 'sarawak' | 'highlands'

const REGION_MAP = {
  peninsular: 'Semenanjung',
  sabah: 'Sabah',
  sarawak: 'Sarawak',
  highlands: 'Tanah Tinggi'
};

const CONDITION_MAP = {
  'Terik Lembap': 'weather.conditions.humidHeat',
  'Panas Tropika': 'weather.conditions.tropicalHeat',
  'Lembap Pesisir': 'weather.conditions.coastalHumid',
  'Lembap Hujan Tropika': 'weather.conditions.tropicalRain',
  'Haba Bandar Terik': 'weather.conditions.urbanScorching',
  'Angin Muara Lembap': 'weather.conditions.humidEstuary',
  'Angin Pantai & Lembap': 'weather.conditions.humidBeach',
  'Bayu Laut Pesisir': 'weather.conditions.coastalSeaBreeze',
  'Panas Tropika Selatan': 'weather.conditions.southernHeat',
  'Tropika Pesisir Selat': 'weather.conditions.straitCoastal',
  'Hangat Pesisir Selat': 'weather.conditions.warmStrait',
  'Hangat Lembap Pedalaman': 'weather.conditions.humidInland',
  'Haba Lembah Kinta': 'weather.conditions.kintaValley',
  'Panas Terik Dataran': 'weather.conditions.plainsScorching',
  'Bayu Kepulauan Tropika': 'weather.conditions.tropicalIsland',
  'Panas Terik Utara': 'weather.conditions.northernScorching',
  'Lembap Pantai Timur': 'weather.conditions.eastCoastHumid',
  'Bayu Laut Tropika': 'weather.conditions.tropicalSeaBreeze',
  'Lembap Pesisir Timur': 'weather.conditions.eastCoastCoastal',
  'Dingin & Berkabus': 'weather.conditions.coolMisty',
  'Dingin Segar Pergunungan': 'weather.conditions.mountainCool',
  'Lembap Pesisir Borneo': 'weather.conditions.borneoCoastal',
  'Bayu Laut Sulu': 'weather.conditions.suluSeaBreeze',
  'Tropika Lembap Timur': 'weather.conditions.easternHumid',
  'Hujan Tropika Lembap': 'weather.conditions.humidTropicalRain',
  'Pesisir Laut China Selatan': 'weather.conditions.southChinaSea',
  'Lembap Sungai Rajang': 'weather.conditions.rajangRiver',
  'Tropika': 'weather.conditions.tropical'
};

function translateCondition(cond) {
  if (!cond) return '';
  const key = CONDITION_MAP[cond];
  return key ? t(key) : cond;
}

function translateRegion(region) {
  if (!region) return '';
  const map = {
    'Semenanjung': 'weather.regions.peninsular',
    'Sabah': 'weather.regions.sabah',
    'Sarawak': 'weather.regions.sarawak',
    'Tanah Tinggi': 'weather.regions.highlands'
  };
  return map[region] ? t(map[region]) : region;
}

function translateSprayAdvice(advice, humidity, temp) {
  if (humidity > 80) return t('weather.sprayAdviceHighHumidity');
  if (humidity < 50) return t('weather.sprayAdviceDryAir');
  if (humidity < 55) return t('weather.sprayAdviceDryAirPulse');
  if (temp >= 33) return t('weather.sprayAdviceExtremeHeat');
  return t('weather.sprayAdviceStandard');
}

function translateProjectionHold(hold) {
  if (!hold) return '';
  return formatLongevity(hold);
}

export async function renderWeatherView() {
  // Ensure real-time live data is fetched from Open-Meteo
  await weatherService.fetchAllCitiesLiveWeather();
  const weather = weatherService.getCurrentWeather();
  const allCitiesList = weatherService.getAllCitiesWeather();
  const activeCityId = weatherService.getActiveCity() || 'kl';
  const isLive = weatherService.getIsLive();
  const perfumes = await perfumeService.getAllPerfumes();

  // Regional Filter for the 27 Cities
  const filteredCities = allCitiesList.filter(c => {
    if (activeRegionFilter === 'all') return true;
    const targetRegion = REGION_MAP[activeRegionFilter];
    return c.region === targetRegion;
  });

  const tempVal = Math.round(Number(weather.temperature ?? weather.temp ?? 31));
  const humidityVal = Math.round(Number(weather.humidity ?? 78));
  const windVal = Number(weather.windSpeed ?? 10);
  const metrics = calculateOlfactoryMetrics(tempVal, humidityVal, windVal);
  const skinTemp = metrics.skinTemp || calculateSkinTemperature(tempVal);
  const evaporationRate = metrics.evaporationRate;
  const projectionHold = metrics.projectionHold;
  const recommendedFamily = metrics.recommendedFamily;
  const sprayAdvice = metrics.sprayAdvice;

  const isCold = isColdTemperature(tempVal);
  const currentHour = getMalaysianCurrentHour();
  const isNight = isNightTime(currentHour);

  // Dynamic filter & ranking for perfumes using Weather Recommendation Algorithm
  let recommended = filterAndRankPerfumesByWeather(perfumes, weather, { selectedAccord, hour: currentHour });

  if (recommended.length === 0) recommended = perfumes.slice(0, 4);

  const regionTabs = [
    { id: 'all', label: t('weather.regions.all') },
    { id: 'peninsular', label: t('weather.regions.peninsular') },
    { id: 'sabah', label: t('weather.regions.sabah') },
    { id: 'sarawak', label: t('weather.regions.sarawak') },
    { id: 'highlands', label: t('weather.regions.highlands') }
  ];

  return `
  <div class="w-full px-4 md:px-8 pt-28 pb-16 max-w-max-width mx-auto space-y-8">
    <!-- Top Header Banner -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div class="space-y-1.5">
        <div class="flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full neu-inset text-xs font-headline text-atmospheric-blue uppercase tracking-wider font-semibold">
            <span class="w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-sunset-amber'}"></span>
            ${isLive ? 'Open-Meteo Live API' : t('weather.metFeed')}
          </span>
          <span class="text-xs text-outline font-mono">${t('weather.rtdbSync')} (${allCitiesList.length} ${t('weather.cityCount')})</span>
          <button id="refresh-weather-btn" class="neu-button px-2.5 py-1 rounded-full text-xs font-headline font-semibold text-deep-navy hover:text-atmospheric-blue flex items-center gap-1 cursor-pointer transition-all ml-1 shadow-sm active:scale-95" title="${t('weather.refreshWeatherTitle')}">
            <span class="material-symbols-outlined text-xs">refresh</span>
            <span>${t('weather.refreshWeather')}</span>
          </button>
        </div>
        <h1 class="font-headline text-2xl sm:text-3xl md:text-4xl text-deep-navy font-bold tracking-tight">
          ${t('weather.title')}
        </h1>
        <p class="font-body text-xs md:text-sm text-on-surface-variant max-w-2xl">
          ${t('weather.subtitle')}
        </p>
      </div>

      <!-- Quick Active City Indicator -->
      <div class="neu-flat p-3 rounded-2xl flex items-center gap-3 shrink-0">
        <div class="w-10 h-10 rounded-xl neu-inset flex items-center justify-center text-sunset-amber">
          <span class="material-symbols-outlined text-xl fill-1">location_on</span>
        </div>
        <div>
          <span class="text-[10px] font-headline uppercase text-outline block">${t('weather.activeStation')}</span>
          <span class="font-headline text-sm font-bold text-deep-navy">${weather.name || weather.cityName}</span>
        </div>
      </div>
    </div>

    <!-- Section 1: Prominent Active City Highlight Card -->
    <div class="neu-flat rounded-3xl p-6 md:p-8 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-hairline pb-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-atmospheric-blue animate-ping"></span>
            <h2 class="font-headline text-2xl md:text-3xl font-bold text-deep-navy">
              ${weather.name || weather.cityName}
            </h2>
            <span class="neu-inset px-3 py-0.5 rounded-full text-xs font-headline text-atmospheric-blue font-bold">
              ${translateRegion(weather.region)}
            </span>
          </div>
          <p class="text-xs text-on-surface-variant mt-1 font-body">
            ${t('weather.weatherStatusPrefix', { city: weather.name || weather.cityName, temp: weather.temperature || weather.temp, humidity: weather.humidity, advice: translateSprayAdvice(weather.sprayAdvice, weather.humidity, weather.temperature || weather.temp) })}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="neu-inset px-3 py-1 rounded-full text-xs font-mono text-outline">
            ${t('weather.stationHeaderTTL', { stationId: weather.id || weather.cityId })}
          </span>
          ${isLive ? `
            <span class="neu-inset px-2.5 py-1 rounded-full text-[10px] font-mono text-emerald-600 font-bold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              LIVE
            </span>
          ` : ''}
        </div>
      </div>

      <!-- 4 Core Real-time Atmospheric Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Metric 1: Suhu Sebenar -->
        <div class="neu-inset rounded-2xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-headline text-outline uppercase tracking-wider">${t('weather.temperature')}</span>
            <div class="w-7 h-7 rounded-full neu-flat flex items-center justify-center text-atmospheric-blue">
              <span class="material-symbols-outlined text-sm">device_thermostat</span>
            </div>
          </div>
          <div class="my-2 flex items-baseline gap-1">
            <span class="font-headline text-4xl text-deep-navy font-bold">${weather.temperature || weather.temp}°</span>
            <span class="font-mono text-sm text-on-surface-variant font-bold">C</span>
          </div>
          <div class="flex items-center justify-between text-[10px] text-outline pt-1">
            <span>${t('weather.feelsLike')}: ${weather.heatIndex || 37}°C</span>
            <span class="text-sunset-amber font-semibold font-mono">${translateCondition(weather.condition)}</span>
          </div>
        </div>

        <!-- Metric 2: Kelembapan Relatif -->
        <div class="neu-inset rounded-2xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-headline text-outline uppercase tracking-wider">${t('weather.humidity')}</span>
            <div class="w-7 h-7 rounded-full neu-flat flex items-center justify-center text-atmospheric-blue">
              <span class="material-symbols-outlined text-sm">humidity_high</span>
            </div>
          </div>
          <div class="my-2 flex items-baseline gap-1">
            <span class="font-headline text-4xl text-deep-navy font-bold">${weather.humidity}%</span>
            <span class="font-mono text-sm text-atmospheric-blue font-bold">RH</span>
          </div>
          <div class="flex items-center justify-between text-[10px] text-outline pt-1">
            <span>${t('weather.status')}: ${weather.humidity > 80 ? t('weather.highHumidity') : t('weather.moderateHumidity')}</span>
            <span class="text-atmospheric-blue font-semibold">${t('weather.tropical')}</span>
          </div>
        </div>

        <!-- Metric 3: Kelajuan Angin -->
        <div class="neu-inset rounded-2xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-headline text-outline uppercase tracking-wider">${t('weather.windSpeed')}</span>
            <div class="w-7 h-7 rounded-full neu-flat flex items-center justify-center text-atmospheric-blue">
              <span class="material-symbols-outlined text-sm">air</span>
            </div>
          </div>
          <div class="my-2 flex items-baseline gap-1">
            <span class="font-headline text-4xl text-deep-navy font-bold">${weather.windSpeed || 10}</span>
            <span class="font-mono text-xs text-on-surface-variant font-bold">${t('weather.speedUnit')}</span>
          </div>
          <div class="flex items-center justify-between text-[10px] text-outline pt-1">
            <span>${t('weather.breeze')}</span>
            <span class="text-atmospheric-blue font-mono font-bold">${t('weather.stable')}</span>
          </div>
        </div>

        <!-- Metric 4: Keadaan Cuaca -->
        <div class="neu-inset rounded-2xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-headline text-outline uppercase tracking-wider">${t('weather.condition')}</span>
            <div class="w-7 h-7 rounded-full neu-flat flex items-center justify-center text-sunset-amber">
              <span class="material-symbols-outlined text-sm fill-1">wb_sunny</span>
            </div>
          </div>
          <div class="my-2">
            <span class="font-headline text-xl text-deep-navy font-bold block truncate">${translateCondition(weather.condition)}</span>
            <span class="text-[10px] text-outline font-mono">UV ${weather.uvIndex || 8.5} • ${t('weather.heatLabel')} ${weather.heatIndex || 38}°C</span>
          </div>
          <div class="flex items-center justify-between text-[10px] text-outline pt-1">
            <span class="text-atmospheric-blue font-semibold">${t('weather.metSensor')}</span>
            <span class="text-sunset-amber font-mono font-bold">${t('weather.sensorActive')}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: 5 Olfactory Science Cards -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-headline text-xl md:text-2xl font-bold text-deep-navy">
            ${t('weather.scienceTitle')}
          </h2>
          <p class="text-xs text-on-surface-variant">
            ${t('weather.scienceSubtitle')}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <!-- Olfactory Card 1: Suhu Kulit (+2.8°C) -->
        <div class="neu-flat rounded-2xl p-5 flex flex-col justify-between space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-sunset-amber"></span>
              <span class="text-xs font-headline font-bold text-deep-navy">${t('weather.skinTemp')}</span>
            </div>
            <span class="neu-inset px-2.5 py-0.5 rounded-full text-[10px] font-mono text-atmospheric-blue font-bold">
              ${t('weather.skinTempFormulaBadge')}
            </span>
          </div>
          <div class="my-1">
            <span class="font-headline text-3xl font-bold text-deep-navy">${skinTemp}°C</span>
            <span class="text-xs text-outline block mt-0.5 font-body">
              ${t('weather.skinFormulaSubtitle', { temp: tempVal })}
            </span>
          </div>
          <p class="text-[11px] text-on-surface-variant font-body leading-relaxed">
            ${t('weather.skinTempDesc')}
          </p>
        </div>

        <!-- Olfactory Card 2: Kadar Penyejatan (Evaporation Rate) -->
        <div class="neu-flat rounded-2xl p-5 flex flex-col justify-between space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-atmospheric-blue"></span>
              <span class="text-xs font-headline font-bold text-deep-navy">${t('weather.evaporationRate')}</span>
            </div>
            <span class="neu-inset px-2.5 py-0.5 rounded-full text-[10px] font-mono text-atmospheric-blue font-bold">
              ${t('weather.molecularKinetics')}
            </span>
          </div>
          <div class="my-1 flex items-baseline gap-2">
            <span class="font-headline text-3xl font-bold text-deep-navy">${evaporationRate}</span>
            <span class="text-xs font-headline text-sunset-amber font-bold">${t('weather.volatility')}</span>
          </div>
          <p class="text-[11px] text-on-surface-variant font-body leading-relaxed">
            ${t('weather.evaporationDesc', { temp: tempVal, speed: windVal })}
          </p>
        </div>

        <!-- Olfactory Card 3: Jangkaan Ketahanan (Projection Hold) -->
        <div class="neu-flat rounded-2xl p-5 flex flex-col justify-between space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span class="text-xs font-headline font-bold text-deep-navy">${t('weather.projectionHold')}</span>
            </div>
            <span class="neu-inset px-2.5 py-0.5 rounded-full text-[10px] font-mono text-emerald-600 font-bold">
              ${t('weather.sillageRadius')}
            </span>
          </div>
          <div class="my-1">
            <span class="font-headline text-2xl sm:text-3xl font-bold text-deep-navy">${translateProjectionHold(projectionHold)}</span>
          </div>
          <p class="text-[11px] text-on-surface-variant font-body leading-relaxed">
            ${t('weather.projectionDesc')}
          </p>
        </div>

        <!-- Olfactory Card 4: Famili Disyorkan (Recommended Family) -->
        <div class="neu-flat rounded-2xl p-5 flex flex-col justify-between space-y-3 md:col-span-2 lg:col-span-1">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-sunset-amber"></span>
              <span class="text-xs font-headline font-bold text-deep-navy">${t('weather.recommendedFamily')}</span>
            </div>
            <span class="neu-inset px-2.5 py-0.5 rounded-full text-[10px] font-headline text-sunset-amber font-bold">
              ${t('weather.optimalMatch')}
            </span>
          </div>
          <div class="my-1">
            <span class="font-headline text-lg sm:text-xl font-bold text-atmospheric-blue block leading-snug">
              ${recommendedFamily}
            </span>
          </div>
          <p class="text-[11px] text-on-surface-variant font-body leading-relaxed">
            ${t('weather.familyDesc')}
          </p>
        </div>

        <!-- Olfactory Card 5: Nasihat Semburan (Spray Advice) -->
        <div class="neu-flat rounded-2xl p-5 flex flex-col justify-between space-y-3 md:col-span-2 lg:col-span-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-atmospheric-blue"></span>
              <span class="text-xs font-headline font-bold text-deep-navy">${t('weather.sprayAdvice')}</span>
            </div>
            <span class="neu-inset px-2.5 py-0.5 rounded-full text-[10px] font-headline text-atmospheric-blue font-bold">
              ${t('weather.applicationTechnique')}
            </span>
          </div>
          <div class="my-1">
            <p class="text-xs sm:text-sm text-deep-navy font-semibold font-body leading-relaxed">
              ${translateSprayAdvice(sprayAdvice, humidityVal, tempVal)}
            </p>
          </div>
          <div class="flex flex-wrap gap-2 pt-1 border-t border-border-hairline text-[11px] text-on-surface-variant">
            <span>${t('weather.sprayTipCollar')}</span>
            <span>${t('weather.sprayTipMoisturize')}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 3: 27 Malaysian Cities Grid with Regional Filter Tabs -->
    <div class="neu-flat rounded-3xl p-6 md:p-8 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="font-headline text-xl md:text-2xl font-bold text-deep-navy">
              ${t('weather.stationNetworkTitle')}
            </h2>
            <span class="neu-inset px-2.5 py-0.5 rounded-full text-xs font-mono text-atmospheric-blue font-bold">
              ${filteredCities.length} ${t('weather.cityCount')}
            </span>
          </div>
          <p class="text-xs text-on-surface-variant mt-0.5">
            ${t('weather.stationNetworkSubtitle')}
          </p>
        </div>

        <!-- Regional Filter Tabs -->
        <div class="neu-inset p-1.5 rounded-full flex items-center gap-1 overflow-x-auto max-w-full">
          ${regionTabs.map(tab => `
            <button class="region-tab-btn px-3.5 py-1.5 rounded-full font-headline text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeRegionFilter === tab.id
                ? 'neu-button text-atmospheric-blue shadow-sm'
                : 'text-on-surface-variant hover:text-deep-navy'
            }" data-region="${tab.id}" type="button">
              ${tab.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Cities Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pt-2">
        ${filteredCities.map(c => {
          const isActive = (activeCityId === c.id || activeCityId === c.cityId);
          return `
            <button class="city-card-btn p-3.5 rounded-2xl flex flex-col justify-between text-left transition-all duration-200 cursor-pointer group ${
              isActive
                ? 'neu-inset ring-2 ring-atmospheric-blue bg-atmospheric-blue/5'
                : 'neu-flat hover:-translate-y-0.5 hover:shadow-md'
            }" data-city-id="${c.id}" type="button">
              <div class="flex items-center justify-between w-full mb-2">
                <span class="text-[10px] font-headline uppercase font-bold tracking-wider ${
                  isActive ? 'text-atmospheric-blue' : 'text-outline'
                }">
                  ${translateRegion(c.region)}
                </span>
                ${isActive ? `
                  <span class="w-2 h-2 rounded-full bg-atmospheric-blue animate-pulse"></span>
                ` : ''}
              </div>
              <div>
                <h4 class="font-headline text-sm font-bold text-deep-navy group-hover:text-atmospheric-blue transition-colors truncate">
                  ${c.name}
                </h4>
                <div class="flex items-baseline gap-1 mt-1">
                  <span class="font-headline text-lg font-bold text-deep-navy">${c.temperature || c.temp}°</span>
                  <span class="text-[11px] font-mono text-outline font-semibold">C</span>
                  <span class="text-[11px] font-mono text-atmospheric-blue ml-auto font-semibold">${c.humidity}%</span>
                </div>
              </div>
              <div class="mt-2 pt-2 border-t border-border-hairline/60 flex items-center justify-between text-[10px]">
                <span class="text-on-surface-variant truncate">${translateCondition(c.condition)}</span>
                ${isActive ? `
                  <span class="font-headline text-atmospheric-blue font-bold uppercase text-[9px]">${t('weather.selected')}</span>
                ` : ''}
              </div>
            </button>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Section 4: Olfactory Perfume Match Filter & Recommendations -->
    <div class="space-y-6">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div class="flex flex-wrap items-center gap-2.5 mb-1.5">
            <h2 class="font-headline text-xl sm:text-2xl text-deep-navy font-bold tracking-tight">${t('weather.recommendedPerfumes')}</h2>
            <span class="neu-inset px-3 py-1 rounded-full text-xs font-headline font-bold text-atmospheric-blue whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 shadow-inner">
              <span class="w-1.5 h-1.5 rounded-full bg-atmospheric-blue animate-pulse"></span>
              <span class="whitespace-nowrap">${recommended.length} ${t('weather.perfumesMatching')}</span>
            </span>
          </div>
          <p class="text-xs text-on-surface-variant">
            ${t('weather.perfumesMatchingDesc', { condition: translateCondition(weather.condition), temp: tempVal, humidity: humidityVal })}
          </p>
          <div class="flex flex-wrap items-center gap-2 mt-2">
            ${isCold ? `
              <span class="neu-inset px-2.5 py-1 rounded-full text-[11px] font-headline font-bold text-blue-500 flex items-center gap-1.5 shadow-inner">
                <span class="material-symbols-outlined text-xs">ac_unit</span>
                <span>${t('weather.badgeCold', { temp: tempVal })}</span>
              </span>
            ` : isNight ? `
              <span class="neu-inset px-2.5 py-1 rounded-full text-[11px] font-headline font-bold text-indigo-400 flex items-center gap-1.5 shadow-inner">
                <span class="material-symbols-outlined text-xs">dark_mode</span>
                <span>${t('weather.badgeNighttime')}</span>
              </span>
            ` : `
              <span class="neu-inset px-2.5 py-1 rounded-full text-[11px] font-headline font-bold text-sunset-amber flex items-center gap-1.5 shadow-inner">
                <span class="material-symbols-outlined text-xs">wb_sunny</span>
                <span>${t('weather.badgeDaytime')}</span>
              </span>
            `}
          </div>
        </div>

        <!-- Accord Filter Buttons -->
        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <button class="filter-accord-btn neu-button px-3.5 py-1.5 rounded-full text-xs font-headline cursor-pointer transition-all ${selectedAccord === 'all' ? 'neu-inset text-atmospheric-blue font-bold shadow-inner' : 'text-on-surface-variant hover:text-deep-navy'}" data-val="all">
            ${t('weather.regions.all')}
          </button>
          <button class="filter-accord-btn neu-button px-3.5 py-1.5 rounded-full text-xs font-headline cursor-pointer transition-all ${selectedAccord === 'citrus' ? 'neu-inset text-atmospheric-blue font-bold shadow-inner' : 'text-on-surface-variant hover:text-deep-navy'}" data-val="citrus">
            Citrus / Fresh
          </button>
          <button class="filter-accord-btn neu-button px-3.5 py-1.5 rounded-full text-xs font-headline cursor-pointer transition-all ${selectedAccord === 'aquatic' ? 'neu-inset text-atmospheric-blue font-bold shadow-inner' : 'text-on-surface-variant hover:text-deep-navy'}" data-val="aquatic">
            Aquatic Marine
          </button>
          <button class="filter-accord-btn neu-button px-3.5 py-1.5 rounded-full text-xs font-headline cursor-pointer transition-all ${selectedAccord === 'woody' ? 'neu-inset text-atmospheric-blue font-bold shadow-inner' : 'text-on-surface-variant hover:text-deep-navy'}" data-val="woody">
            Woody Aromatic
          </button>
          <button class="filter-accord-btn neu-button px-3.5 py-1.5 rounded-full text-xs font-headline cursor-pointer transition-all ${selectedAccord === 'gourmand' ? 'neu-inset text-atmospheric-blue font-bold shadow-inner' : 'text-on-surface-variant hover:text-deep-navy'}" data-val="gourmand">
            Gourmand
          </button>
          <button id="reset-filters-btn" class="neu-button px-2.5 py-1.5 rounded-full text-xs text-outline hover:text-deep-navy cursor-pointer transition-all" title="${t('weather.resetFilters')}">
            <span class="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>
      </div>

      <!-- Perfume Cards Grid (Strictly Zero Price) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${recommended.map(p => {
          const pGender = (p.gender || 'unisex').toLowerCase();
          const genderText = pGender === 'male' ? t('card.genderMale') : pGender === 'female' ? t('card.genderFemale') : t('card.genderUnisex');
          const notes = translateNotes((p.notes?.top || []).slice(0, 2).join(', ') || 'Citrus, Woods');
          const timeSuitability = p.timeSuitability || getPerfumeTimeSuitability(p);
          const timeBadgeClass = timeSuitability === 'Day'
            ? 'text-amber-500'
            : timeSuitability === 'Night'
            ? 'text-indigo-400'
            : 'text-atmospheric-blue';
          const timeBadgeLabel = timeSuitability === 'Versatile'
            ? 'Versatile (Day & Night)'
            : timeSuitability;
          const timeBadgeIcon = timeSuitability === 'Day'
            ? 'wb_sunny'
            : timeSuitability === 'Night'
            ? 'dark_mode'
            : 'all_inclusive';

          return `
          <div class="neu-flat rounded-2xl p-5 flex flex-col justify-between group hover:-translate-y-1 transition-all">
            <div class="flex gap-4 items-start mb-4">
              <div class="w-24 h-24 neu-inset rounded-xl p-2 flex items-center justify-center shrink-0">
                <img src="${formatImageUrl(p.imageUrl) || DEFAULT_FLACON_PLACEHOLDER}" alt="${p.name}" class="max-h-full object-contain group-hover:scale-105 transition-transform" onerror="this.onerror=null; this.src='${DEFAULT_FLACON_PLACEHOLDER}';">
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[10px] font-headline text-sunset-amber font-bold flex items-center gap-0.5">
                    <span class="material-symbols-outlined text-xs">bolt</span> ${p.matchPercentage || 92}% ${t('weather.matchLabel')}
                  </span>
                  <span class="text-[10px] font-headline text-outline uppercase">${p.brand}</span>
                </div>
                <h3 class="font-headline text-base text-deep-navy font-bold truncate">${p.name}</h3>
                <span class="text-xs text-on-surface-variant font-mono block mb-2">${p.type || 'Eau de Parfum'}</span>
                <div class="text-xs text-on-surface-variant flex items-center gap-1">
                  <span class="text-outline">${t('weather.notesLabel')}:</span>
                  <span class="text-deep-navy font-semibold truncate">${notes}</span>
                </div>
                <div class="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                  <span class="text-outline">${t('perfume.longevity')}:</span>
                  <span class="text-atmospheric-blue font-bold">${translateProjectionHold(p.longevity || '7 - 9 Jam')}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-border-hairline gap-2 flex-wrap">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="neu-inset px-2.5 py-1 rounded-full text-xs font-headline font-bold text-atmospheric-blue">${genderText}</span>
                <span class="neu-inset px-2.5 py-1 rounded-full text-xs font-headline font-bold ${timeBadgeClass} flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs">${timeBadgeIcon}</span>
                  <span>${timeBadgeLabel}</span>
                </span>
              </div>
              <a href="#/detail/${p.id}" class="neu-button px-4 py-1.5 rounded-full font-headline text-xs font-bold text-atmospheric-blue hover:text-deep-navy transition-all shrink-0">
                ${t('weather.viewDetail')}
              </a>
            </div>
          </div>
        `;
        }).join('')}
      </div>
    </div>
  </div>
  `;
}

export function attachWeatherListeners() {
  // Regional tab filter buttons
  document.querySelectorAll('.region-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeRegionFilter = btn.getAttribute('data-region') || 'all';
      window.dispatchEvent(new Event('hashchange'));
    });
  });

  // 27 Cities Grid click -> set active city
  document.querySelectorAll('.city-card-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const cityId = btn.getAttribute('data-city-id');
      if (cityId) {
        await weatherService.setActiveCity(cityId);
        window.dispatchEvent(new Event('hashchange'));
      }
    });
  });

  // Accord filter buttons
  document.querySelectorAll('.filter-accord-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedAccord = btn.getAttribute('data-val') || 'all';
      window.dispatchEvent(new Event('hashchange'));
    });
  });

  // Reset filters button
  document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
    selectedAccord = 'all';
    activeRegionFilter = 'all';
    window.dispatchEvent(new Event('hashchange'));
  });

  // Real-time Refresh Weather button
  const refreshBtn = document.getElementById('refresh-weather-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.classList.add('opacity-50', 'pointer-events-none');
      const icon = refreshBtn.querySelector('.material-symbols-outlined');
      if (icon) icon.classList.add('animate-spin');
      try {
        await weatherService.refreshAllCitiesWeather(true);
        window.dispatchEvent(new Event('hashchange'));
      } catch (err) {
        console.error('Refresh weather failed:', err);
        if (icon) icon.classList.remove('animate-spin');
        refreshBtn.classList.remove('opacity-50', 'pointer-events-none');
      }
    });
  }
}

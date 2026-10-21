import {
  weatherService,
  calculateSkinTemperature,
  calculateOlfactoryMetrics,
  filterAndRankPerfumesByWeather
} from '../services/weatherService.js';
import { perfumeService } from '../services/perfumeService.js';
import { authService } from '../services/authService.js';
import { openAuthModal } from '../components/AuthModal.js';
import { renderPerfumeCard, attachPerfumeCardListeners } from '../components/PerfumeCard.js';
import { t, formatLongevity } from '../services/i18nService.js';

let activeCategoryFilter = 'all';

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

export async function renderHomeView() {
  await weatherService.fetchAllCitiesLiveWeather();
  const weather = weatherService.getCurrentWeather();
  const perfumes = await perfumeService.getAllPerfumes();

  const temp = Math.round(Number(weather.temperature ?? weather.temp ?? 32));
  const humidity = Math.round(Number(weather.humidity ?? 78));
  const windSpeed = Number(weather.windSpeed ?? 10);
  const metrics = calculateOlfactoryMetrics(temp, humidity, windSpeed);
  const skinTemp = metrics.skinTemp || calculateSkinTemperature(temp);

  // Weather-optimized recommendation ranking (strictly excludes Day-only perfumes if cold <20C or night >7PM)
  const rankedPerfumes = filterAndRankPerfumesByWeather(perfumes, weather);

  // Filter curated perfumes for tropical discovery grid
  let curated = rankedPerfumes;
  if (activeCategoryFilter === 'aquatic') {
    curated = rankedPerfumes.filter(p => {
      const acc = (p.accords || []).map(a => typeof a === 'string' ? a : a.name);
      return acc.some(a => a.toLowerCase().includes('aquatic') || a.toLowerCase().includes('citrus') || a.toLowerCase().includes('fresh'));
    });
  } else if (activeCategoryFilter === 'woody') {
    curated = rankedPerfumes.filter(p => {
      const acc = (p.accords || []).map(a => typeof a === 'string' ? a : a.name);
      return acc.some(a => a.toLowerCase().includes('woody') || a.toLowerCase().includes('amber') || a.toLowerCase().includes('oud'));
    });
  } else if (activeCategoryFilter === 'gourmand') {
    curated = rankedPerfumes.filter(p => {
      const acc = (p.accords || []).map(a => typeof a === 'string' ? a : a.name);
      return acc.some(a => a.toLowerCase().includes('gourmand') || a.toLowerCase().includes('vanilla') || a.toLowerCase().includes('sweet'));
    });
  }

  if (curated.length === 0) {
    curated = rankedPerfumes.length > 0 ? rankedPerfumes : perfumes;
  }

  return `
  <div class="flex flex-col w-full">
    <!-- Hero Section with Live Weather Summary -->
    <section class="relative w-full px-4 md:px-8 pt-28 pb-14">
      <div class="max-w-max-width mx-auto flex flex-col items-center text-center">
        <!-- Live Weather Summary Pill (linking to #/cuaca) -->
        <a href="#/cuaca" class="neu-flat rounded-full px-4 py-2 inline-flex items-center gap-2 mb-6 transition-transform hover:scale-[1.02] cursor-pointer" title="${t('home.seeAllCities')}">
          <div class="flex items-center gap-1.5 text-atmospheric-blue">
            <span class="relative flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-atmospheric-blue opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-atmospheric-blue"></span>
            </span>
            <span class="font-mono text-[11px] uppercase tracking-wider text-deep-navy font-bold">${t('home.weatherStation')}</span>
          </div>
          <span class="w-1 h-1 rounded-full bg-outline-variant"></span>
          <div class="flex items-center gap-2 font-mono text-xs text-on-surface-variant">
            <span id="home-pill-city" class="font-bold text-deep-navy">${weather.name || 'Kuala Lumpur'}</span>
            <span>•</span>
            <span id="home-pill-temp" class="flex items-center gap-0.5 text-deep-navy">
              <span class="material-symbols-outlined text-xs text-sunset-amber fill-1">wb_sunny</span> ${temp}°C
            </span>
            <span>•</span>
            <span id="home-pill-hum" class="text-atmospheric-blue font-semibold">${humidity}% RH</span>
            <span>•</span>
            <span id="home-pill-skin" class="neu-inset px-2 py-0.5 rounded-full text-sunset-amber font-bold text-[10px]">${t('home.skinTemp')} ${skinTemp}°C</span>
          </div>
        </a>

        <!-- Hero Typography -->
        <h1 class="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-deep-navy max-w-4xl tracking-tight leading-tight mb-4 font-bold">
          ${t('home.heroH1')}
        </h1>
        <p id="home-hero-desc" class="font-body text-sm sm:text-base md:text-lg text-on-surface-variant max-w-2xl mb-8 leading-relaxed">
          ${t('home.heroDesc', { temp, humidity })}
        </p>

        <!-- Dual Action Buttons -->
        <div class="flex flex-wrap items-center justify-center gap-3 mb-10">
          <a href="#/cuaca" class="px-6 py-3.5 rounded-full bg-atmospheric-blue text-white font-headline text-xs font-bold flex items-center gap-2 shadow-lg transition-all duration-200 hover:brightness-105 active:scale-95">
            <span class="material-symbols-outlined text-base">air</span>
            <span>${t('home.btnWeather')}</span>
          </a>
          <a href="#/dupe" class="neu-button px-6 py-3.5 rounded-full text-deep-navy font-headline text-xs font-bold flex items-center gap-2 transition-all duration-200 hover:text-atmospheric-blue active:scale-95">
            <span class="material-symbols-outlined text-base text-atmospheric-blue">compare_arrows</span>
            <span>${t('home.btnDupe')}</span>
          </a>
        </div>

        <!-- Subtle Olfactory Metrics Row (4 Dynamic Stat Cards) -->
        <div id="home-hero-metrics-row" class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
          <div class="neu-flat rounded-2xl p-4 text-left">
            <span class="text-[11px] font-headline uppercase text-outline block mb-1">${t('home.evapRate')}</span>
            <div class="font-headline text-2xl font-bold text-deep-navy flex items-center justify-between">
              <span id="hero-stat-evap">${metrics.evaporationRate}</span>
              <span class="material-symbols-outlined text-sunset-amber text-base">thermostat</span>
            </div>
            <span class="text-[11px] text-on-surface-variant">${t('home.evapFactor')}</span>
          </div>

          <div class="neu-flat rounded-2xl p-4 text-left">
            <span class="text-[11px] font-headline uppercase text-outline block mb-1">${t('home.sillageProj')}</span>
            <div class="font-headline text-xl sm:text-2xl font-bold text-deep-navy flex items-center justify-between">
              <span id="hero-stat-sillage">${translateProjectionHold(metrics.projectionHold)}</span>
              <span class="material-symbols-outlined text-atmospheric-blue text-base">waves</span>
            </div>
            <span class="text-[11px] text-on-surface-variant">${t('home.sillageRadius')}</span>
          </div>

          <div class="neu-flat rounded-2xl p-4 text-left">
            <span class="text-[11px] font-headline uppercase text-outline block mb-1">${t('home.recFamily')}</span>
            <div class="font-headline text-sm sm:text-base font-bold text-deep-navy flex items-center justify-between" title="${metrics.recommendedFamily}">
              <span id="hero-stat-family" class="line-clamp-1">${metrics.recommendedFamily}</span>
              <span class="material-symbols-outlined text-atmospheric-blue text-base shrink-0 ml-1">spa</span>
            </div>
            <span class="text-[11px] text-on-surface-variant">${t('home.optimumToday')}</span>
          </div>

          <div class="neu-flat rounded-2xl p-4 text-left">
            <span class="text-[11px] font-headline uppercase text-outline block mb-1">${t('home.indexedCollection')}</span>
            <div class="font-headline text-2xl font-bold text-deep-navy flex items-center justify-between">
              <span>${perfumes.length}+</span>
              <span class="material-symbols-outlined text-sunset-amber text-base">auto_awesome</span>
            </div>
            <span class="text-[11px] text-on-surface-variant">${t('home.tropicalReady')}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick Search Section (routes to #/cari?q=...) -->
    <section class="w-full px-4 md:px-8 py-4">
      <div class="max-w-max-width mx-auto">
        <div class="neu-flat rounded-3xl p-6 md:p-8">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <span class="text-[11px] uppercase tracking-widest text-atmospheric-blue font-bold block mb-1 font-headline">${t('home.quickSearchTitle')}</span>
              <h2 class="font-headline text-xl md:text-2xl text-deep-navy font-bold tracking-tight">${t('home.quickSearchSubtitle')}</h2>
            </div>
            <span class="text-xs text-on-surface-variant max-w-sm">
              ${t('home.quickSearchDesc')}
            </span>
          </div>

          <!-- Quick Search Bar -->
          <form id="home-quick-search-form" class="neu-inset rounded-full p-1.5 pl-4 flex items-center gap-2 mb-4">
            <span class="material-symbols-outlined text-outline">search</span>
            <input id="home-quick-search-input" class="w-full bg-transparent border-0 outline-none text-sm text-deep-navy placeholder:text-outline font-body" placeholder="${t('home.quickSearchPlaceholder')}" type="text">
            <button type="submit" class="neu-button px-5 py-2 rounded-full font-headline text-xs font-bold text-deep-navy hover:text-atmospheric-blue transition-colors flex items-center gap-1 shrink-0 cursor-pointer">
              <span>${t('home.searchBtn')}</span>
              <span class="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </form>

          <!-- Quick Search Topic Pills -->
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-[11px] font-headline text-outline uppercase tracking-wider mr-1">${t('home.quickSearchLabel')}</span>
            <button class="quick-search-pill neu-button px-3.5 py-1.5 rounded-full text-xs font-headline font-semibold text-deep-navy hover:text-atmospheric-blue transition-all flex items-center gap-1.5 cursor-pointer" data-term="Citrus">
              <span class="w-1.5 h-1.5 rounded-full bg-sunset-amber"></span>
              <span>Citrus</span>
            </button>
            <button class="quick-search-pill neu-button px-3.5 py-1.5 rounded-full text-xs font-headline font-semibold text-deep-navy hover:text-atmospheric-blue transition-all flex items-center gap-1.5 cursor-pointer" data-term="Aquatic">
              <span class="w-1.5 h-1.5 rounded-full bg-atmospheric-blue"></span>
              <span>Aquatic</span>
            </button>
            <button class="quick-search-pill neu-button px-3.5 py-1.5 rounded-full text-xs font-headline font-semibold text-deep-navy hover:text-atmospheric-blue transition-all flex items-center gap-1.5 cursor-pointer" data-term="Aventus">
              <span class="w-1.5 h-1.5 rounded-full bg-atmospheric-blue"></span>
              <span>Aventus</span>
            </button>
            <button class="quick-search-pill neu-button px-3.5 py-1.5 rounded-full text-xs font-headline font-semibold text-deep-navy hover:text-atmospheric-blue transition-all flex items-center gap-1.5 cursor-pointer" data-term="Turathi">
              <span class="w-1.5 h-1.5 rounded-full bg-atmospheric-blue"></span>
              <span>Turathi Blue</span>
            </button>
            <button class="quick-search-pill neu-button px-3.5 py-1.5 rounded-full text-xs font-headline font-semibold text-deep-navy hover:text-atmospheric-blue transition-all flex items-center gap-1.5 cursor-pointer" data-term="Woody">
              <span class="w-1.5 h-1.5 rounded-full bg-outline"></span>
              <span>Woody</span>
            </button>
            <button class="quick-search-pill neu-button px-3.5 py-1.5 rounded-full text-xs font-headline font-semibold text-deep-navy hover:text-atmospheric-blue transition-all flex items-center gap-1.5 cursor-pointer" data-term="Amber">
              <span class="w-1.5 h-1.5 rounded-full bg-sunset-amber"></span>
              <span>Amber</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Dynamic Weather Olfactory Recommendation Card -->
    <section class="w-full px-4 md:px-8 py-6">
      <div class="max-w-max-width mx-auto">
        <div class="neu-flat rounded-3xl p-6 md:p-8 border border-border-hairline">
          <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div class="space-y-2 max-w-xl">
              <div class="flex items-center gap-2">
                <span class="neu-inset px-2.5 py-0.5 rounded-full text-[10px] font-headline text-atmospheric-blue uppercase font-bold">
                  ${t('home.dynamicAnalysis')}
                </span>
                <span id="home-advisory-city" class="text-xs text-outline font-mono">${weather.name || 'Kuala Lumpur'}</span>
              </div>
              <h2 class="font-headline text-xl md:text-2xl text-deep-navy font-bold tracking-tight">
                ${t('home.sprayAdviceTitle')} <span id="home-advisory-family" class="text-atmospheric-blue">${metrics.recommendedFamily}</span>
              </h2>
              <p id="home-advisory-text" class="font-body text-xs md:text-sm text-on-surface-variant leading-relaxed">
                ${translateSprayAdvice(metrics.sprayAdvice, humidity, temp)}
              </p>
            </div>

            <!-- Sensor Metric Mini-Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
              <div class="neu-inset rounded-2xl p-3 text-center">
                <span class="text-[10px] text-outline font-headline uppercase block">${t('home.skinTemp')}</span>
                <span id="home-advisory-skintemp" class="font-headline text-lg font-bold text-deep-navy">${skinTemp}°C</span>
                <span class="text-[9px] text-on-surface-variant block mt-0.5">${t('home.skinTempBody')}</span>
              </div>
              <div class="neu-inset rounded-2xl p-3 text-center">
                <span class="text-[10px] text-outline font-headline uppercase block">${t('home.evapRate')}</span>
                <span id="home-advisory-evap" class="font-headline text-lg font-bold text-deep-navy">${metrics.evaporationRate}</span>
                <span class="text-[9px] text-on-surface-variant block mt-0.5">${t('home.evapTropical')}</span>
              </div>
              <div class="neu-inset rounded-2xl p-3 text-center col-span-2 sm:col-span-1">
                <span class="text-[10px] text-outline font-headline uppercase block">${t('home.sillageProj')}</span>
                <span id="home-advisory-sillage" class="font-headline text-lg font-bold text-deep-navy">${translateProjectionHold(metrics.projectionHold)}</span>
                <span class="text-[9px] text-on-surface-variant block mt-0.5">${t('home.holdDurability')}</span>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-border-hairline flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span class="text-on-surface-variant">
              ${t('home.weatherStationFooter')}
            </span>
            <a href="#/cuaca" class="text-atmospheric-blue font-headline font-bold hover:underline flex items-center gap-1">
              <span>${t('home.seeAllCities')}</span>
              <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Curated Fragrance Discovery Grid (Using Reusable PerfumeCard) -->
    <section class="w-full px-4 md:px-8 py-8">
      <div class="max-w-max-width mx-auto">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="neu-inset px-2.5 py-0.5 rounded-full text-[10px] font-headline text-atmospheric-blue uppercase font-bold">${t('home.provenTropical')}</span>
              <span class="text-[11px] font-headline text-outline">${t('home.curatedCatalog')}</span>
            </div>
            <h2 class="font-headline text-2xl md:text-3xl text-deep-navy font-bold tracking-tight">${t('home.curatedTitle')}</h2>
          </div>

          <!-- Filter Tabs -->
          <div class="flex items-center gap-2">
            <button class="home-filter-tab neu-button px-3.5 py-1.5 rounded-full text-xs font-headline font-bold transition-all cursor-pointer ${activeCategoryFilter === 'all' ? 'neu-inset text-atmospheric-blue shadow-inner' : 'text-on-surface-variant'}" data-cat="all">
              ${t('home.allProfiles')}
            </button>
            <button class="home-filter-tab neu-button px-3.5 py-1.5 rounded-full text-xs font-headline font-bold transition-all cursor-pointer ${activeCategoryFilter === 'aquatic' ? 'neu-inset text-atmospheric-blue shadow-inner' : 'text-on-surface-variant'}" data-cat="aquatic">
              ${t('home.aquaticFresh')}
            </button>
            <button class="home-filter-tab neu-button px-3.5 py-1.5 rounded-full text-xs font-headline font-bold transition-all cursor-pointer ${activeCategoryFilter === 'woody' ? 'neu-inset text-atmospheric-blue shadow-inner' : 'text-on-surface-variant'}" data-cat="woody">
              ${t('home.woodyAmber')}
            </button>
            <button class="home-filter-tab neu-button px-3.5 py-1.5 rounded-full text-xs font-headline font-bold transition-all cursor-pointer ${activeCategoryFilter === 'gourmand' ? 'neu-inset text-atmospheric-blue shadow-inner' : 'text-on-surface-variant'}" data-cat="gourmand">
              ${t('home.gourmandSweet')}
            </button>
          </div>
        </div>

        <!-- Reusable Perfume Card Grid -->
        <div id="home-perfume-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-2">
          ${curated.slice(0, 8).map(p => renderPerfumeCard(p)).join('')}
        </div>

        <div class="mt-8 text-center">
          <a href="#/direktori" class="neu-button px-8 py-3 rounded-full font-headline text-xs font-bold text-deep-navy hover:text-atmospheric-blue inline-flex items-center gap-2 transition-all">
            <span>${t('home.openFullDir')}</span>
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
        </div>
      </div>
    </section>

    <!-- Community & Experience Section -->
    <section class="w-full px-4 md:px-8 py-10 mb-6">
      <div class="max-w-max-width mx-auto">
        <div class="neu-flat rounded-3xl p-6 md:p-8">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div class="lg:col-span-7 space-y-4">
              <span class="text-[10px] font-headline uppercase tracking-widest text-atmospheric-blue font-bold block">
                ${t('home.smartDiscovery')}
              </span>
              <h3 class="font-headline text-2xl md:text-3xl text-deep-navy font-bold tracking-tight">
                ${t('home.saveHeartTitle')}
              </h3>
              <p class="font-body text-xs md:text-sm text-on-surface-variant leading-relaxed">
                ${t('home.saveHeartDesc')}
              </p>
              <div class="flex flex-wrap items-center gap-4 pt-2">
                <a href="#/profil" class="neu-button px-6 py-2.5 rounded-full font-headline text-xs font-bold text-deep-navy hover:text-atmospheric-blue inline-flex items-center gap-2 transition-all">
                  <span class="material-symbols-outlined text-red-500 text-sm fill-1">favorite</span>
                  <span>${t('home.openMyCollection')}</span>
                </a>
                <a href="#/dupe" class="neu-button px-6 py-2.5 rounded-full font-headline text-xs font-bold text-deep-navy hover:text-atmospheric-blue inline-flex items-center gap-2 transition-all">
                  <span class="material-symbols-outlined text-atmospheric-blue text-sm">compare_arrows</span>
                  <span>${t('home.dupeArabVsLocal')}</span>
                </a>
              </div>
            </div>

            <div class="lg:col-span-5">
              <div class="neu-inset rounded-2xl p-5 space-y-3">
                <div class="flex items-center justify-between text-xs font-headline font-bold text-deep-navy">
                  <span>${t('home.coreFeatures')}</span>
                  <span class="text-atmospheric-blue">${t('home.free100')}</span>
                </div>
                <ul class="space-y-2 text-xs text-on-surface-variant font-body">
                  <li class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-atmospheric-blue text-sm">check_circle</span>
                    <span>${t('home.feat1')}</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-atmospheric-blue text-sm">check_circle</span>
                    <span>${t('home.feat2')}</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-atmospheric-blue text-sm">check_circle</span>
                    <span>${t('home.feat3')}</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-atmospheric-blue text-sm">check_circle</span>
                    <span>${t('home.feat4')}</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-atmospheric-blue text-sm">check_circle</span>
                    <span>${t('home.feat5')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
  `;
}

export function attachHomeListeners() {
  // Attach interactive listeners for the rendered perfume cards (Love ❤️ button + card click)
  const gridEl = document.getElementById('home-perfume-grid');
  attachPerfumeCardListeners(gridEl || document);

  // Quick search form submission -> routes to #/cari?q=...
  const form = document.getElementById('home-quick-search-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('home-quick-search-input');
    const q = input?.value.trim();
    if (q) {
      window.location.hash = `#/cari?q=${encodeURIComponent(q)}`;
    }
  });

  // Quick search pill buttons -> routes to #/cari?q=...
  document.querySelectorAll('.quick-search-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const term = btn.getAttribute('data-term');
      if (term) {
        window.location.hash = `#/cari?q=${encodeURIComponent(term)}`;
      }
    });
  });

  // Category filter tabs
  document.querySelectorAll('.home-filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeCategoryFilter = tab.getAttribute('data-cat') || 'all';
      window.dispatchEvent(new Event('hashchange'));
    });
  });

  // Reactive Live Weather Sync for Hero & Advisory Sections
  if (typeof window !== 'undefined' && !window.__homeWeatherSyncAttached) {
    window.__homeWeatherSyncAttached = true;
    weatherService.subscribe(() => {
      const curWeather = weatherService.getCurrentWeather();
      if (!curWeather) return;
      const curTemp = Math.round(Number(curWeather.temperature ?? curWeather.temp ?? 32));
      const curHum = Math.round(Number(curWeather.humidity ?? 78));
      const curWind = Number(curWeather.windSpeed ?? 10);
      const curMetrics = calculateOlfactoryMetrics(curTemp, curHum, curWind);
      const curSkin = curMetrics.skinTemp || calculateSkinTemperature(curTemp);

      // Update Live Summary Pill
      const pillCity = document.getElementById('home-pill-city');
      if (pillCity) pillCity.textContent = curWeather.name || 'Kuala Lumpur';
      const pillTemp = document.getElementById('home-pill-temp');
      if (pillTemp) pillTemp.innerHTML = `<span class="material-symbols-outlined text-xs text-sunset-amber fill-1">wb_sunny</span> ${curTemp}°C`;
      const pillHum = document.getElementById('home-pill-hum');
      if (pillHum) pillHum.textContent = `${curHum}% RH`;
      const pillSkin = document.getElementById('home-pill-skin');
      if (pillSkin) pillSkin.textContent = `${t('home.skinTemp')} ${curSkin}°C`;

      // Update Hero Description
      const heroDescEl = document.getElementById('home-hero-desc');
      if (heroDescEl) heroDescEl.textContent = t('home.heroDesc', { temp: curTemp, humidity: curHum });

      // Update 4 Hero Stat Cards
      const statEvap = document.getElementById('hero-stat-evap');
      if (statEvap) statEvap.textContent = curMetrics.evaporationRate;
      const statSillage = document.getElementById('hero-stat-sillage');
      if (statSillage) statSillage.textContent = translateProjectionHold(curMetrics.projectionHold);
      const statFamily = document.getElementById('hero-stat-family');
      if (statFamily) {
        statFamily.textContent = curMetrics.recommendedFamily;
        statFamily.parentElement?.setAttribute('title', curMetrics.recommendedFamily);
      }

      // Update Weather Spray Advisory Section
      const advCity = document.getElementById('home-advisory-city');
      if (advCity) advCity.textContent = curWeather.name || 'Kuala Lumpur';
      const advFam = document.getElementById('home-advisory-family');
      if (advFam) advFam.textContent = curMetrics.recommendedFamily;
      const advText = document.getElementById('home-advisory-text');
      if (advText) advText.textContent = translateSprayAdvice(curMetrics.sprayAdvice, curHum, curTemp);
      const advSkin = document.getElementById('home-advisory-skintemp');
      if (advSkin) advSkin.textContent = `${curSkin}°C`;
      const advEvap = document.getElementById('home-advisory-evap');
      if (advEvap) advEvap.textContent = curMetrics.evaporationRate;
      const advSil = document.getElementById('home-advisory-sillage');
      if (advSil) advSil.textContent = translateProjectionHold(curMetrics.projectionHold);
    });
  }
}

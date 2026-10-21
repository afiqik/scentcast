import { rtdb } from '../firebase.js';
import { ref, onValue, set, get } from 'firebase/database';
import { initialWeatherData } from '../data/seedData.js';

export const MALAYSIAN_CITIES_COORDINATES = {
  // Semenanjung (18 bandar)
  'kl': { id: 'kl', name: 'Kuala Lumpur', region: 'Semenanjung', lat: 3.1390, lon: 101.6869, defaultCondition: 'Terik Lembap' },
  'putrajaya': { id: 'putrajaya', name: 'Putrajaya', region: 'Semenanjung', lat: 2.9264, lon: 101.6964, defaultCondition: 'Panas Tropika' },
  'shah-alam': { id: 'shah-alam', name: 'Shah Alam', region: 'Semenanjung', lat: 3.0738, lon: 101.5183, defaultCondition: 'Lembap Hujan Tropika' },
  'petaling-jaya': { id: 'petaling-jaya', name: 'Petaling Jaya', region: 'Semenanjung', lat: 3.1073, lon: 101.6067, defaultCondition: 'Haba Bandar Terik' },
  'klang': { id: 'klang', name: 'Klang', region: 'Semenanjung', lat: 3.0449, lon: 101.4456, defaultCondition: 'Angin Muara Lembap' },
  'george-town': { id: 'george-town', name: 'George Town', region: 'Semenanjung', lat: 5.4141, lon: 100.3288, defaultCondition: 'Angin Pantai & Lembap' },
  'bayan-lepas': { id: 'bayan-lepas', name: 'Bayan Lepas', region: 'Semenanjung', lat: 5.2950, lon: 100.2650, defaultCondition: 'Bayu Laut Pesisir' },
  'johor-bahru': { id: 'johor-bahru', name: 'Johor Bahru', region: 'Semenanjung', lat: 1.4927, lon: 103.7414, defaultCondition: 'Panas Tropika Selatan' },
  'batu-pahat': { id: 'batu-pahat', name: 'Batu Pahat', region: 'Semenanjung', lat: 1.8548, lon: 102.9325, defaultCondition: 'Tropika Pesisir Selat' },
  'melaka': { id: 'melaka', name: 'Melaka', region: 'Semenanjung', lat: 2.1896, lon: 102.2501, defaultCondition: 'Hangat Pesisir Selat' },
  'seremban': { id: 'seremban', name: 'Seremban', region: 'Semenanjung', lat: 2.7258, lon: 101.9424, defaultCondition: 'Hangat Lembap Pedalaman' },
  'ipoh': { id: 'ipoh', name: 'Ipoh', region: 'Semenanjung', lat: 4.5975, lon: 101.0901, defaultCondition: 'Haba Lembah Kinta' },
  'alor-setar': { id: 'alor-setar', name: 'Alor Setar', region: 'Semenanjung', lat: 6.1248, lon: 100.3678, defaultCondition: 'Panas Terik Dataran' },
  'langkawi': { id: 'langkawi', name: 'Langkawi', region: 'Semenanjung', lat: 6.3500, lon: 99.8000, defaultCondition: 'Bayu Kepulauan Tropika' },
  'kangar': { id: 'kangar', name: 'Kangar', region: 'Semenanjung', lat: 6.4414, lon: 100.1986, defaultCondition: 'Panas Terik Utara' },
  'kota-bharu': { id: 'kota-bharu', name: 'Kota Bharu', region: 'Semenanjung', lat: 6.1254, lon: 102.2386, defaultCondition: 'Lembap Pantai Timur' },
  'kuala-terengganu': { id: 'kuala-terengganu', name: 'Kuala Terengganu', region: 'Semenanjung', lat: 5.3117, lon: 103.1324, defaultCondition: 'Bayu Laut Tropika' },
  'kuantan': { id: 'kuantan', name: 'Kuantan', region: 'Semenanjung', lat: 3.8077, lon: 103.3260, defaultCondition: 'Lembap Pesisir Timur' },

  // Tanah Tinggi (2 bandar)
  'genting-highlands': { id: 'genting-highlands', name: 'Genting Highlands', region: 'Tanah Tinggi', lat: 3.4241, lon: 101.7933, defaultCondition: 'Dingin & Berkabus' },
  'cameron-highlands': { id: 'cameron-highlands', name: 'Cameron Highlands', region: 'Tanah Tinggi', lat: 4.4716, lon: 101.3789, defaultCondition: 'Dingin Segar Pergunungan' },

  // Sabah (4 bandar)
  'kota-kinabalu': { id: 'kota-kinabalu', name: 'Kota Kinabalu', region: 'Sabah', lat: 5.9804, lon: 116.0735, defaultCondition: 'Lembap Pesisir Borneo' },
  'sandakan': { id: 'sandakan', name: 'Sandakan', region: 'Sabah', lat: 5.8402, lon: 118.1179, defaultCondition: 'Bayu Laut Sulu' },
  'tawau': { id: 'tawau', name: 'Tawau', region: 'Sabah', lat: 4.2498, lon: 117.8871, defaultCondition: 'Tropika Lembap Timur' },
  'labuan': { id: 'labuan', name: 'Labuan', region: 'Sabah', lat: 5.2831, lon: 115.2308, defaultCondition: 'Lembap Pesisir' },

  // Sarawak (3 bandar)
  'kuching': { id: 'kuching', name: 'Kuching', region: 'Sarawak', lat: 1.5533, lon: 110.3592, defaultCondition: 'Hujan Tropika Lembap' },
  'miri': { id: 'miri', name: 'Miri', region: 'Sarawak', lat: 4.3995, lon: 113.9914, defaultCondition: 'Pesisir Laut China Selatan' },
  'sibu': { id: 'sibu', name: 'Sibu', region: 'Sarawak', lat: 2.3000, lon: 111.8167, defaultCondition: 'Lembap Sungai Rajang' }
};

export const REQUIRED_MALAYSIAN_CITIES = [
  'kl',
  'putrajaya',
  'labuan',
  'shah-alam',
  'petaling-jaya',
  'klang',
  'george-town',
  'bayan-lepas',
  'johor-bahru',
  'batu-pahat',
  'melaka',
  'seremban',
  'ipoh',
  'alor-setar',
  'langkawi',
  'kangar',
  'kota-bharu',
  'kuala-terengganu',
  'kuantan',
  'genting-highlands',
  'cameron-highlands',
  'kota-kinabalu',
  'sandakan',
  'tawau',
  'kuching',
  'miri',
  'sibu'
];

export const CITY_ALIASES = {
  'kuala-lumpur': 'kl',
  'penang': 'george-town',
  'jb': 'johor-bahru',
  'kk': 'kota-kinabalu',
  'genting': 'genting-highlands'
};

export const TTL_MS = 30 * 60 * 1000; // 30 minutes TTL for live forecasts

// Olfactory Scientific Formulas
export function calculateSkinTemperature(ambientTemp) {
  return Number((Number(ambientTemp) + 2.8).toFixed(1));
}

export function calculateEvaporationRate(temp, windSpeed = 10) {
  const base = temp / 25;
  const windFactor = 1 + (windSpeed / 50);
  return Number((base * windFactor).toFixed(1));
}

export function calculateProjectionHold(temp, humidity) {
  const t = Number(temp);
  if (t < 20) {
    return '7 - 10 Jam';
  } else if (t > 27) {
    return '4 - 6 Jam';
  }
  return '6 - 8 Jam';
}

export function getRecommendedOlfactoryFamily(temp, humidity) {
  const t = Number(temp);
  if (t < 20) {
    return 'Amber / Woody / Warm Spicy';
  } else if (t > 27) {
    return 'Aquatic Marine / Fresh Citrus';
  }
  return 'Floral / Aromatic / Fresh Spicy';
}

export function getSprayAdvice(temp, humidity) {
  if (humidity > 80) {
    return 'Kelembapan tinggi (>80% RH): Sembur pada kolar atau fabrik pakaian untuk elak molekul dihanyutkan peluh.';
  } else if (humidity < 50) {
    return 'Udara agak kering: Lembapkan kulit dengan losyen tanpa bau sebelum menyembur untuk unjuran optimum.';
  } else if (humidity < 55) {
    return 'Udara kering. Gunakan pelembap kulit atau losyen tanpa wangian sebelum menyembur titik nadi (pergelangan tangan & leher).';
  } else if (temp >= 33) {
    return 'Cuaca panas terik: Hadkan 3-4 semburan pada titik nadi (leher & pergelangan tangan).';
  }
  return 'Semburan standard 4-5 semburan pada nadi dan pakaian.';
}

export function determineConditionFromWeatherCode(code, temp, defaultCondition) {
  // WMO weather code interpretation for Malaysian tropical climate:
  // 51, 53, 55 (drizzle), 61, 63, 65 (rain), 80, 81, 82 (showers), 95, 96, 99 (thunderstorm)
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 99)) {
    return 'Lembap Hujan Tropika';
  }
  if (code === 45 || code === 48) {
    return 'Dingin & Berkabus';
  }
  if (temp <= 22) {
    return defaultCondition || 'Dingin Segar Pergunungan';
  }
  if (temp >= 33) {
    return 'Terik Lembap';
  }
  return defaultCondition || 'Panas Tropika';
}

export function calculateOlfactoryMetrics(temp, humidity, windSpeed = 10) {
  const skinTemp = calculateSkinTemperature(temp);
  const evapRateVal = calculateEvaporationRate(temp, windSpeed);
  const projectionHold = calculateProjectionHold(temp, humidity);
  const recommendedFamily = getRecommendedOlfactoryFamily(temp, humidity);
  const sprayAdvice = getSprayAdvice(temp, humidity);

  return {
    skinTemp,
    evaporationRate: `${evapRateVal.toFixed(1)}x`,
    evaporationRateVal: evapRateVal,
    projectionHold,
    recommendedFamily,
    sprayAdvice
  };
}

/**
 * Normalizes and extracts whenToWear time suitability: 'Day' | 'Night' | 'Versatile'
 */
export function getPerfumeTimeSuitability(perfume) {
  if (!perfume) return 'Versatile';
  const rawTimes = perfume.whenToWear?.time;
  let timesList = [];
  if (Array.isArray(rawTimes)) {
    timesList = rawTimes.map(s => String(s).toLowerCase().trim());
  } else if (typeof rawTimes === 'string' && rawTimes.trim()) {
    timesList = rawTimes.split(',').map(s => s.toLowerCase().trim());
  }

  const hasVersatile = timesList.some(t => t.includes('versatile') || t.includes('versatil') || t.includes('day & night') || t.includes('siang & malam'));
  const hasDay = timesList.some(t => t === 'day' || t === 'siang');
  const hasNight = timesList.some(t => t === 'night' || t === 'malam');

  if (hasVersatile || (hasDay && hasNight)) {
    return 'Versatile';
  }
  if (hasDay && !hasNight) {
    return 'Day';
  }
  if (hasNight && !hasDay) {
    return 'Night';
  }

  // Fallback: check occasions if time is not explicit
  const rawOccasions = perfume.whenToWear?.occasions || perfume.whenToWear?.occasion;
  let occList = [];
  if (Array.isArray(rawOccasions)) occList = rawOccasions.map(s => String(s).toLowerCase());
  else if (typeof rawOccasions === 'string') occList = rawOccasions.toLowerCase().split(',');

  const occHasNight = occList.some(o => o.includes('malam') || o.includes('night') || o.includes('temu janji'));
  const occHasDay = occList.some(o => o.includes('siang') || o.includes('day') || o.includes('sukan') || o.includes('pantai'));

  if (occHasNight && !occHasDay) return 'Night';
  if (occHasDay && !occHasNight) return 'Day';

  return 'Versatile';
}

/**
 * Returns current Malaysian local hour (0-23, UTC+8)
 */
export function getMalaysianCurrentHour() {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kuala_Lumpur',
      hour: 'numeric',
      hour12: false
    });
    return parseInt(formatter.format(new Date()), 10);
  } catch (e) {
    const utcHours = new Date().getUTCHours();
    return (utcHours + 8) % 24;
  }
}

/**
 * Checks if a given hour represents night time (after 7 PM / 19:00, or before 7 AM)
 */
export function isNightTime(hour = getMalaysianCurrentHour()) {
  return hour >= 19 || hour < 7;
}

/**
 * Cold temperature threshold (< 20°C e.g. Genting Highlands 14°C)
 */
export function isColdTemperature(temp) {
  return Number(temp) < 20;
}

/**
 * Authoritative Weather Recommendation Algorithm:
 * - Suhu sejuk (< 20°C, cth. Genting Highlands 14°C): Jangan syorkan Day-only. Prioritaskan Night atau Versatile.
 * - Waktu malam (selepas 7 PM): Utamakan Night dan Versatile, serta sembunyikan Day-only.
 * - Versatile: Boleh dicadangkan untuk kedua-dua suhu dan waktu (Siang & Malam).
 */
export function filterAndRankPerfumesByWeather(perfumes, weather = {}, options = {}) {
  if (!Array.isArray(perfumes) || perfumes.length === 0) return [];

  const temp = Number(weather.temperature ?? weather.temp ?? 31);
  const hour = options.hour !== undefined ? options.hour : getMalaysianCurrentHour();
  const isCold = isColdTemperature(temp);
  const isNight = isNightTime(hour);
  const selectedAccord = (options.selectedAccord || 'all').toLowerCase();

  // 1. Filter eligible perfumes
  let eligible = perfumes.filter(p => {
    // Accord filter if active
    if (selectedAccord !== 'all') {
      const accords = p.accords || p.mainAccords || [];
      const matchAccord = accords.some(a => {
        const name = typeof a === 'string' ? a : a.name;
        return (name || '').toLowerCase().includes(selectedAccord);
      });
      if (!matchAccord) return false;
    }

    const suitability = getPerfumeTimeSuitability(p);

    // Rule: Cold (< 20°C) -> Do NOT recommend strictly Day-only perfumes
    if (isCold && suitability === 'Day') {
      return false;
    }

    // Rule: Night (after 7 PM) -> Hide strictly Day-only perfumes
    if (isNight && suitability === 'Day') {
      return false;
    }

    return true;
  });

  // If filtering excluded all due to accord constraint, fallback to eligible without accord filter
  if (eligible.length === 0 && selectedAccord !== 'all') {
    eligible = perfumes.filter(p => {
      const suitability = getPerfumeTimeSuitability(p);
      if (isCold && suitability === 'Day') return false;
      if (isNight && suitability === 'Day') return false;
      return true;
    });
  }

  // Safety fallback if catalog is empty after filters
  if (eligible.length === 0) {
    eligible = perfumes.filter(p => getPerfumeTimeSuitability(p) !== 'Day');
    if (eligible.length === 0) eligible = perfumes.slice(0, 4);
  }

  // 2. Score & Rank perfumes
  const scored = eligible.map(p => {
    let score = Number(p.matchPercentage || p.matchScore || 85);
    const suitability = getPerfumeTimeSuitability(p);
    const accordsList = (p.accords || p.mainAccords || []).map(a => (typeof a === 'string' ? a : a.name).toLowerCase());

    if (isCold) {
      // Prioritize Night and Versatile, especially warm/gourmand/amber/spicy
      if (suitability === 'Night') score += 15;
      else if (suitability === 'Versatile') score += 10;

      const hasWarmAccords = accordsList.some(a =>
        a.includes('gourmand') || a.includes('amber') || a.includes('warm') || a.includes('spicy') || a.includes('vanilla') || a.includes('cinnamon')
      );
      if (hasWarmAccords) score += 12;
    } else if (isNight) {
      // Prioritize Night and Versatile
      if (suitability === 'Night') score += 14;
      else if (suitability === 'Versatile') score += 10;
    } else {
      // Daytime & Warm/Hot: Prioritize Day and Versatile, fresh/aquatic/citrus
      if (suitability === 'Day') score += 12;
      else if (suitability === 'Versatile') score += 10;
      else if (suitability === 'Night') score -= 10;

      const hasFreshAccords = accordsList.some(a =>
        a.includes('aquatic') || a.includes('citrus') || a.includes('fresh') || a.includes('marine')
      );
      if (hasFreshAccords) score += 8;
    }

    return { perfume: p, score, suitability };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.map(s => ({
    ...s.perfume,
    matchPercentage: Math.min(99, Math.max(70, Math.round(s.score))),
    timeSuitability: s.suitability
  }));
}

class WeatherService {
  constructor() {
    this.activeCityId = 'kl';
    this.citiesCache = { ...initialWeatherData.cities };
    this.currentWeather = this.citiesCache.kl || initialWeatherData.cities.kl;
    this.allCities = this.citiesCache;
    this.activeSensorsCount = 27;
    this.liveUsersCount = 48;
    this.latestTelemetry = null;
    this.isLive = false;
    this.lastLiveFetch = null;
    this.liveFetchPromise = null;
    this.listeners = new Set();
    this.citySubscribers = new Map(); // cityId -> Set of callbacks
    this.init();
  }

  normalizeCityId(cityId) {
    if (!cityId) return 'kl';
    const clean = String(cityId).toLowerCase().trim();
    const mapped = CITY_ALIASES[clean] || clean;
    if (REQUIRED_MALAYSIAN_CITIES.includes(mapped)) return mapped;
    return 'kl';
  }

  getIsLive() {
    return this.isLive;
  }

  getLastSyncTime() {
    return this.lastLiveFetch;
  }

  async syncSensorTelemetry(weatherData) {
    if (!weatherData) return;
    try {
      const payload = {
        stationId: weatherData.id || weatherData.cityId || this.activeCityId || 'kl',
        stationName: weatherData.name || weatherData.cityName || 'Kuala Lumpur',
        region: weatherData.region || 'Semenanjung',
        temperature: Number(weatherData.temperature || weatherData.temp || 31),
        skinTemp: Number(weatherData.skinTemp || (Number(weatherData.temperature || weatherData.temp || 31) + 2.8).toFixed(1)),
        humidity: Number(weatherData.humidity || 78),
        windSpeed: Number(weatherData.windSpeed || 10),
        evaporationRate: weatherData.evaporationRate || '3.4x',
        projectionHold: weatherData.projectionHold || '4 - 6 Jam',
        recommendedFamily: weatherData.recommendedFamily || 'Aquatic Marine / Fresh Aromatic',
        condition: weatherData.condition || 'Tropika',
        uvIndex: Number(weatherData.uvIndex || 8.5),
        heatIndex: Number(weatherData.heatIndex || 37),
        status: 'ONLINE',
        isLive: Boolean(this.isLive),
        lastSync: Date.now(),
        updatedAt: new Date().toISOString()
      };
      this.latestTelemetry = payload;
      const sensorRef = ref(rtdb, 'sensors/currentWeather');
      await set(sensorRef, payload);
    } catch (err) {
      console.warn('[RTDB] Telemetry sync notice:', err);
    }
  }

  subscribeSensorTelemetry(callback) {
    if (typeof callback !== 'function') return () => {};

    // Immediately dispatch cached or current telemetry
    if (this.latestTelemetry) {
      try { callback(this.latestTelemetry); } catch (e) { console.error(e); }
    } else {
      const cur = this.getCurrentWeather();
      if (cur) {
        const initPayload = {
          stationId: cur.id || cur.cityId || this.activeCityId || 'kl',
          stationName: cur.name || cur.cityName || 'Kuala Lumpur',
          region: cur.region || 'Semenanjung',
          temperature: Number(cur.temperature || cur.temp || 31),
          skinTemp: Number(cur.skinTemp || (Number(cur.temperature || cur.temp || 31) + 2.8).toFixed(1)),
          humidity: Number(cur.humidity || 78),
          windSpeed: Number(cur.windSpeed || 10),
          evaporationRate: cur.evaporationRate || '3.4x',
          projectionHold: cur.projectionHold || '4 - 6 Jam',
          recommendedFamily: cur.recommendedFamily || 'Aquatic Marine / Fresh Aromatic',
          condition: cur.condition || 'Tropika',
          uvIndex: Number(cur.uvIndex || 8.5),
          heatIndex: Number(cur.heatIndex || 37),
          status: 'ONLINE',
          isLive: Boolean(this.isLive),
          lastSync: Date.now(),
          updatedAt: new Date().toISOString()
        };
        this.latestTelemetry = initPayload;
        try { callback(initPayload); } catch (e) { console.error(e); }
      }
    }

    try {
      const sensorRef = ref(rtdb, 'sensors/currentWeather');
      const unsub = onValue(sensorRef, (snap) => {
        if (snap.exists()) {
          const val = snap.val();
          this.latestTelemetry = val;
          try { callback(val); } catch (e) { console.error(e); }
        }
      }, (err) => {
        console.warn('[RTDB] Sensor telemetry subscription notice:', err);
      });
      return () => {
        try {
          if (typeof unsub === 'function') unsub();
        } catch (_) {}
      };
    } catch (err) {
      console.warn('[RTDB] Fallback local sensor telemetry subscription:', err);
      return () => {};
    }
  }

  /**
   * Fetches real-time live meteorological data for all 27 Malaysian cities from Open-Meteo API.
   * Performs an optimized single batch request using comma-separated coordinates.
   * Resilient fallback guarantees zero application crashes on offline, rate limit, or network errors.
   */
  async fetchAllCitiesLiveWeather(force = false) {
    const now = Date.now();

    // Return in-flight fetch promise if already requesting
    if (this.liveFetchPromise) {
      return this.liveFetchPromise;
    }

    // Use fresh cache if available and not forced
    if (!force && this.isLive && this.lastLiveFetch && (now - this.lastLiveFetch < TTL_MS)) {
      return this.citiesCache;
    }

    this.liveFetchPromise = (async () => {
      try {
        const cityEntries = Object.entries(MALAYSIAN_CITIES_COORDINATES);
        const lats = cityEntries.map(([_, c]) => c.lat).join(',');
        const lons = cityEntries.map(([_, c]) => c.lon).join(',');
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,apparent_temperature,weather_code,uv_index&timezone=auto`;

        // Resilient timeout controller (8 seconds max)
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 8000) : null;

        const response = await fetch(apiUrl, {
          signal: controller ? controller.signal : undefined
        });

        if (timeoutId) clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Open-Meteo API responded with status ${response.status}`);
        }

        const data = await response.json();
        const results = Array.isArray(data) ? data : [data];

        const updatedCities = { ...this.citiesCache };

        cityEntries.forEach(([cid, config], idx) => {
          const raw = results[idx]?.current;
          if (!raw) return;

          const baseline = initialWeatherData.cities[cid] || initialWeatherData.cities.kl;
          const temp = Math.round(raw.temperature_2m ?? baseline.temp ?? 31);
          const humidity = Math.round(raw.relative_humidity_2m ?? baseline.humidity ?? 78);
          const windSpeed = Math.round(raw.wind_speed_10m ?? baseline.windSpeed ?? 10);
          const heatIndex = Math.round(raw.apparent_temperature ?? temp);
          const uvIndex = Number((raw.uv_index !== undefined ? raw.uv_index : (baseline.uvIndex || 8.5)).toFixed(1));
          const weatherCode = raw.weather_code ?? 0;
          const condition = determineConditionFromWeatherCode(weatherCode, temp, config.defaultCondition);

          const metrics = calculateOlfactoryMetrics(temp, humidity, windSpeed);

          const cityWeatherObj = {
            id: cid,
            cityId: cid,
            name: config.name,
            cityName: config.name,
            region: config.region,
            temp: temp,
            temperature: temp,
            humidity: humidity,
            windSpeed: windSpeed,
            condition: condition,
            uvIndex: uvIndex,
            heatIndex: heatIndex,
            weatherCode: weatherCode,
            ...metrics,
            statusMessage: `Cuaca ${config.name} ${temp}°C, ${humidity}% RH. ${metrics.sprayAdvice}`,
            source: 'open-meteo',
            isLive: true,
            cachedAt: now,
            updatedAt: new Date().toISOString(),
            ttlMs: TTL_MS
          };

          updatedCities[cid] = cityWeatherObj;
        });

        // Set aliases for backward compatibility
        updatedCities['kuala-lumpur'] = updatedCities['kl'];
        updatedCities['penang'] = updatedCities['george-town'];
        updatedCities['jb'] = updatedCities['johor-bahru'];
        updatedCities['kk'] = updatedCities['kota-kinabalu'];
        updatedCities['genting'] = updatedCities['genting-highlands'];

        this.citiesCache = updatedCities;
        this.allCities = updatedCities;
        this.isLive = true;
        this.lastLiveFetch = now;

        const activeNorm = this.normalizeCityId(this.activeCityId);
        this.currentWeather = this.citiesCache[activeNorm] || this.citiesCache.kl;

        // Sync telemetry to RTDB sensors node
        await this.syncSensorTelemetry(this.currentWeather);

        this.notify();
        return this.citiesCache;
      } catch (err) {
        console.warn('[Open-Meteo] Live weather fetch encountered an issue, preserving resilient fallback data:', err);
        // Fallback gracefully without crashing
        this.isLive = false;
        if (!this.citiesCache || Object.keys(this.citiesCache).length === 0) {
          this.citiesCache = { ...initialWeatherData.cities };
        }
        this.allCities = this.citiesCache;
        const activeNorm = this.normalizeCityId(this.activeCityId);
        this.currentWeather = this.citiesCache[activeNorm] || initialWeatherData.cities[activeNorm] || initialWeatherData.cities.kl;
        this.notify();
        return this.citiesCache;
      } finally {
        this.liveFetchPromise = null;
      }
    })();

    return this.liveFetchPromise;
  }

  async refreshAllCitiesWeather(force = true) {
    return this.fetchAllCitiesLiveWeather(force);
  }

  async init() {
    try {
      // 1. Seed or sync active city
      const activeCityRef = ref(rtdb, 'weather/activeCity');
      onValue(activeCityRef, (snap) => {
        const remoteActive = snap.val();
        if (remoteActive && remoteActive !== this.activeCityId) {
          const norm = this.normalizeCityId(remoteActive);
          this.activeCityId = norm;
          this.currentWeather = this.citiesCache[norm] || initialWeatherData.cities[norm] || initialWeatherData.cities.kl;
          this.syncSensorTelemetry(this.currentWeather);
          this.notify();
        }
      }, (err) => console.warn('[RTDB] activeCity listener notice:', err));

      // 2. Listen to cities node in RTDB
      const citiesNodeRef = ref(rtdb, 'weather/cities');
      onValue(citiesNodeRef, (snap) => {
        if (snap.exists()) {
          const remoteCities = snap.val();
          Object.keys(remoteCities).forEach(cid => {
            this.citiesCache[cid] = remoteCities[cid];
          });
          this.allCities = this.citiesCache;
          this.currentWeather = this.citiesCache[this.activeCityId] || initialWeatherData.cities[this.activeCityId] || initialWeatherData.cities.kl;
          this.notify();
        }
      }, (err) => console.warn('[RTDB] cities node listener notice:', err));

      // 3. Seed cities to RTDB if missing or unpopulated
      try {
        const checkSnap = await get(citiesNodeRef);
        if (!checkSnap.exists()) {
          console.log('[RTDB] Seeding 27 Malaysian cities to RTDB weather/cities...');
          const payload = {};
          REQUIRED_MALAYSIAN_CITIES.forEach(cid => {
            payload[cid] = this.citiesCache[cid] || initialWeatherData.cities[cid];
          });
          await set(citiesNodeRef, payload);
        }
      } catch (seedErr) {
        console.warn('[RTDB] Seed check notice:', seedErr);
      }

      // 4. Fetch real-time live Open-Meteo weather for all 27 cities in browser environment
      if (typeof window !== 'undefined') {
        await this.fetchAllCitiesLiveWeather();
        this.syncSensorTelemetry(this.currentWeather);
      }
    } catch (err) {
      console.warn('[RTDB] Using resilient local Malaysian weather engine fallback:', err);
      this.currentWeather = initialWeatherData.cities.kl;
      this.allCities = initialWeatherData.cities;
      this.notify();
    }
  }

  getActiveCity() {
    return this.activeCityId;
  }

  async setActiveCity(cityId) {
    const normalized = this.normalizeCityId(cityId);
    this.activeCityId = normalized;

    // Load weather (from cache or RTDB or fresh)
    const weather = await this.getWeather(normalized);
    this.currentWeather = weather;
    await this.syncSensorTelemetry(weather);
    this.notify();

    try {
      const activeRef = ref(rtdb, 'weather/activeCity');
      await set(activeRef, normalized);
    } catch (err) {
      console.warn('[RTDB] Could not set remote active city:', err);
    }

    return weather;
  }

  async setCity(cityId) {
    return this.setActiveCity(cityId);
  }

  getCurrentWeather() {
    if (!this.currentWeather) {
      this.currentWeather = this.citiesCache[this.activeCityId] || initialWeatherData.cities[this.activeCityId] || initialWeatherData.cities.kl;
    }
    return this.currentWeather;
  }

  async getWeather(cityId) {
    const norm = this.normalizeCityId(cityId);
    const now = Date.now();

    // 1. Check in-memory cache with TTL
    const local = this.citiesCache[norm];
    if (local && local.cachedAt && (now - local.cachedAt < TTL_MS)) {
      return local;
    }

    // 2. Fetch fresh weather batch if cache is missing or stale
    try {
      await this.fetchAllCitiesLiveWeather();
      return this.citiesCache[norm] || initialWeatherData.cities[norm] || initialWeatherData.cities.kl;
    } catch (err) {
      console.warn(`[Weather] getWeather fetch error for ${norm}, utilizing cached data:`, err);
      return this.citiesCache[norm] || initialWeatherData.cities[norm] || initialWeatherData.cities.kl;
    }
  }

  getAllCitiesWeather() {
    return REQUIRED_MALAYSIAN_CITIES.map(cid => {
      return this.citiesCache[cid] || initialWeatherData.cities[cid];
    });
  }

  subscribeCityWeather(cityId, callback) {
    const norm = this.normalizeCityId(cityId);

    // Provide immediate cached payload if available
    const immediate = this.citiesCache[norm] || initialWeatherData.cities[norm];
    if (immediate) {
      try { callback(immediate); } catch (e) { console.error(e); }
    }

    try {
      const cityRef = ref(rtdb, `weather/cities/${norm}`);
      const unsub = onValue(cityRef, (snap) => {
        if (snap.exists()) {
          const val = snap.val();
          this.citiesCache[norm] = val;
          if (this.activeCityId === norm) {
            this.currentWeather = val;
            this.syncSensorTelemetry(val);
            this.notify();
          }
          try { callback(val); } catch (e) { console.error(e); }
        }
      }, (err) => {
        console.warn(`[RTDB] Real-time subscription notice for ${norm}:`, err);
      });
      return unsub;
    } catch (err) {
      console.warn(`[RTDB] Fallback local subscription for ${norm}:`, err);
      return () => {};
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback({
      city: this.getCurrentWeather(),
      activeCityId: this.activeCityId,
      allCities: this.citiesCache,
      liveUsers: this.liveUsersCount,
      isLive: this.isLive
    });
    return () => this.listeners.delete(callback);
  }

  notify() {
    const payload = {
      city: this.getCurrentWeather(),
      activeCityId: this.activeCityId,
      allCities: this.citiesCache,
      liveUsers: this.liveUsersCount,
      isLive: this.isLive
    };
    this.listeners.forEach(cb => {
      try { cb(payload); } catch (e) { console.error(e); }
    });
  }
}

export const weatherService = new WeatherService();
export const subscribeSensorTelemetry = (callback) => weatherService.subscribeSensorTelemetry(callback);
export default weatherService;

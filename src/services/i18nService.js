import bmDict from '../i18n/bm.json' with { type: 'json' };
import enDict from '../i18n/en.json' with { type: 'json' };

const LANG_STORAGE_KEY = 'scentcast-lang';
export const DICTIONARIES = {
  bm: bmDict,
  en: enDict
};

export class I18nService {
  constructor(storage = typeof globalThis.localStorage !== 'undefined' ? globalThis.localStorage : null) {
    this.storage = storage;
    this.currentLang = 'bm';
    this.listeners = new Set();
    this.initI18n();
  }

  initI18n() {
    let saved = 'bm';
    try {
      if (this.storage) {
        const stored = this.storage.getItem(LANG_STORAGE_KEY);
        if (stored === 'bm' || stored === 'en') {
          saved = stored;
        }
      }
    } catch (e) {
      console.warn('[i18n] Storage access failed:', e);
    }

    this.currentLang = saved;
    this.syncDocumentLang(saved);
    return this.currentLang;
  }

  syncDocumentLang(lang) {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('lang', lang === 'bm' ? 'ms' : 'en');
    }
  }

  getLanguage() {
    return this.currentLang;
  }

  setLanguage(lang) {
    const targetLang = lang === 'en' ? 'en' : 'bm';
    this.currentLang = targetLang;

    try {
      if (this.storage) {
        this.storage.setItem(LANG_STORAGE_KEY, targetLang);
      }
    } catch (e) {
      console.warn('[i18n] Error saving language:', e);
    }

    this.syncDocumentLang(targetLang);
    this.notify();
    return targetLang;
  }

  toggleLanguage() {
    const next = this.currentLang === 'bm' ? 'en' : 'bm';
    this.setLanguage(next);
    return next;
  }

  t(key, params = {}) {
    if (!key || typeof key !== 'string') return '';

    const lang = this.currentLang;
    const dict = DICTIONARIES[lang] || DICTIONARIES.bm;
    const fallbackDict = lang === 'bm' ? DICTIONARIES.en : DICTIONARIES.bm;

    const resolveKey = (d, path) => {
      if (!d) return null;
      const parts = path.split('.');
      let cur = d;
      for (const part of parts) {
        if (cur && typeof cur === 'object' && part in cur) {
          cur = cur[part];
        } else {
          return null;
        }
      }
      return typeof cur === 'string' ? cur : null;
    };

    let translation = resolveKey(dict, key) ?? resolveKey(fallbackDict, key) ?? key;

    // Parameter interpolation: {count}, {brand}, etc.
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([k, v]) => {
        translation = translation.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }

    return translation;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.currentLang);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.currentLang);
      } catch (err) {
        console.error('[i18n] Listener error:', err);
      }
    });
  }
}

export const i18nService = new I18nService();

export function initI18n() {
  return i18nService.initI18n();
}

export function t(key, params) {
  return i18nService.t(key, params);
}

export function setLanguage(lang) {
  return i18nService.setLanguage(lang);
}

export function getLanguage() {
  return i18nService.getLanguage();
}

export function toggleLanguage() {
  return i18nService.toggleLanguage();
}

/**
 * Bidirectional fragrance notes mapping dictionary
 */
export const NOTE_TRANSLATIONS = {
  'nanas berasap': { bm: 'Nanas Berasap', en: 'Smoky Pineapple' },
  'smoky pineapple': { bm: 'Nanas Berasap', en: 'Smoky Pineapple' },
  'nanas berasap (smoky pineapple)': { bm: 'Nanas Berasap', en: 'Smoky Pineapple' },
  'coklat susu, gula hangat': { bm: 'Coklat Susu, Gula Hangat', en: 'Milk Chocolate, Warm Sugar' },
  'milk chocolate, warm sugar': { bm: 'Coklat Susu, Gula Hangat', en: 'Milk Chocolate, Warm Sugar' },
  'coklat susu': { bm: 'Coklat Susu', en: 'Milk Chocolate' },
  'milk chocolate': { bm: 'Coklat Susu', en: 'Milk Chocolate' },
  'gula hangat': { bm: 'Gula Hangat', en: 'Warm Sugar' },
  'warm sugar': { bm: 'Gula Hangat', en: 'Warm Sugar' },
  'oren': { bm: 'Oren', en: 'Orange' },
  'orange': { bm: 'Oren', en: 'Orange' },
  'neroli bersih, lada hitam': { bm: 'Neroli Bersih, Lada Hitam', en: 'Clean Neroli, Black Pepper' },
  'clean neroli, black pepper': { bm: 'Neroli Bersih, Lada Hitam', en: 'Clean Neroli, Black Pepper' },
  'neroli bersih': { bm: 'Neroli Bersih', en: 'Clean Neroli' },
  'clean neroli': { bm: 'Neroli Bersih', en: 'Clean Neroli' },
  'lada hitam': { bm: 'Lada Hitam', en: 'Black Pepper' },
  'black pepper': { bm: 'Lada Hitam', en: 'Black Pepper' },
  'kayu manis': { bm: 'Kayu Manis', en: 'Cinnamon' },
  'cinnamon': { bm: 'Kayu Manis', en: 'Cinnamon' },
  'kayu manis (cinnamon)': { bm: 'Kayu Manis', en: 'Cinnamon' },
  'buah pala': { bm: 'Buah Pala', en: 'Nutmeg' },
  'nutmeg': { bm: 'Buah Pala', en: 'Nutmeg' },
  'buah pala (nutmeg)': { bm: 'Buah Pala', en: 'Nutmeg' },
  'kelapa muda': { bm: 'Kelapa Muda', en: 'Young Coconut' },
  'young coconut': { bm: 'Kelapa Muda', en: 'Young Coconut' },
  'lemon calabria': { bm: 'Lemon Calabria', en: 'Calabrian Lemon' },
  'calabrian lemon': { bm: 'Lemon Calabria', en: 'Calabrian Lemon' },
  'epal': { bm: 'Epal', en: 'Apple' },
  'apple': { bm: 'Epal', en: 'Apple' },
  'garam laut tropika': { bm: 'Garam Laut Tropika', en: 'Tropical Sea Salt' },
  'tropical sea salt': { bm: 'Garam Laut Tropika', en: 'Tropical Sea Salt' },
  'bergamot segar': { bm: 'Bergamot Segar', en: 'Fresh Bergamot' },
  'fresh bergamot': { bm: 'Bergamot Segar', en: 'Fresh Bergamot' },
  'limau gedang segar (grapefruit)': { bm: 'Limau Gedang Segar', en: 'Fresh Grapefruit' },
  'limau gedang segar': { bm: 'Limau Gedang Segar', en: 'Fresh Grapefruit' },
  'fresh grapefruit': { bm: 'Limau Gedang Segar', en: 'Fresh Grapefruit' },
  'kecacang kayu manis': { bm: 'Kecacang Kayu Manis', en: 'Cinnamon Bark' },
  'cinnamon bark': { bm: 'Kecacang Kayu Manis', en: 'Cinnamon Bark' },
  'rempah sejuk': { bm: 'Rempah Sejuk', en: 'Cool Spices' },
  'cool spices': { bm: 'Rempah Sejuk', en: 'Cool Spices' },
  'kayu birch': { bm: 'Kayu Birch', en: 'Birch Wood' },
  'birch wood': { bm: 'Kayu Birch', en: 'Birch Wood' },
  'kurma manis (dates)': { bm: 'Kurma Manis', en: 'Sweet Dates' },
  'kurma manis': { bm: 'Kurma Manis', en: 'Sweet Dates' },
  'sweet dates': { bm: 'Kurma Manis', en: 'Sweet Dates' },
  'iris lembut': { bm: 'Iris Lembut', en: 'Soft Iris' },
  'soft iris': { bm: 'Iris Lembut', en: 'Soft Iris' },
  'ambroxan pekat': { bm: 'Ambroxan Pekat', en: 'Rich Ambroxan' },
  'rich ambroxan': { bm: 'Ambroxan Pekat', en: 'Rich Ambroxan' },
  'kayu gaharu lembut': { bm: 'Kayu Gaharu Lembut', en: 'Soft Agarwood' },
  'soft agarwood': { bm: 'Kayu Gaharu Lembut', en: 'Soft Agarwood' },
  'nilam (patchouli)': { bm: 'Nilam', en: 'Patchouli' },
  'nilam': { bm: 'Nilam', en: 'Patchouli' },
  'amber lembut': { bm: 'Amber Lembut', en: 'Soft Amber' },
  'soft amber': { bm: 'Amber Lembut', en: 'Soft Amber' },
  'cendana': { bm: 'Cendana', en: 'Sandalwood' },
  'sandalwood': { bm: 'Cendana', en: 'Sandalwood' }
};

/**
 * Format longevity string according to active or specified language.
 * In EN mode:
 * - "Jam" -> "Hours"
 * - "Panas Terik" -> "Hot Weather"
 * - "(Harian)" -> "(Daily)"
 * - "(AC Mall/Offis)" -> "(AC Mall/Office)"
 * In BM mode:
 * - "Hours" -> "Jam"
 */
export function formatLongevity(val, customLang) {
  const lang = customLang || (i18nService ? i18nService.getLanguage() : 'bm');
  if (!val || typeof val !== 'string') {
    return lang === 'en' ? '8 - 10 Hours' : '8 - 10 Jam';
  }

  if (lang === 'en') {
    const dict = DICTIONARIES.en;
    const hotWeatherText = dict?.longevityPhrases?.hotWeather || 'Hot Weather';
    const dailyText = dict?.longevityPhrases?.daily || '(Daily)';
    const acMallText = dict?.longevityPhrases?.acMallOffice || '(AC Mall/Office)';
    const hoursText = dict?.longevityPhrases?.hours || 'Hours';

    let formatted = val;
    formatted = formatted.replace(/Panas\s+Terik/gi, hotWeatherText);
    formatted = formatted.replace(/\(?\bHarian\b\)?/gi, (match) => {
      const hasParens = match.startsWith('(') && match.endsWith(')');
      return hasParens ? dailyText : dailyText.replace(/[()]/g, '');
    });
    formatted = formatted.replace(/\(?AC\s+Mall\/Offis\)?/gi, () => acMallText);
    formatted = formatted.replace(/\bjam\b/gi, hoursText);
    return formatted;
  }

  if (lang === 'bm') {
    let formatted = val;
    formatted = formatted.replace(/\bhours?\b/gi, 'Jam');
    formatted = formatted.replace(/Hot\s+Weather/gi, 'Panas Terik');
    formatted = formatted.replace(/\(?\bDaily\b\)?/gi, (match) => {
      const hasParens = match.startsWith('(') && match.endsWith(')');
      return hasParens ? '(Harian)' : 'Harian';
    });
    formatted = formatted.replace(/\(?AC\s+Mall\/Office\)?/gi, '(AC Mall/Offis)');
    return formatted;
  }

  return val;
}

/**
 * Normalizes any gender input (Malay, English, etc.) to canonical 'male' | 'female' | 'unisex'
 */
export function normalizeGender(val) {
  if (!val) return 'unisex';
  const str = String(val).toLowerCase().trim();
  if (
    str === 'male' ||
    str === 'men' ||
    str === 'man' ||
    str === 'lelaki' ||
    str.startsWith('lelaki') ||
    str.includes('(male)')
  ) {
    return 'male';
  }
  if (
    str === 'female' ||
    str === 'women' ||
    str === 'woman' ||
    str === 'wanita' ||
    str === 'perempuan' ||
    str.startsWith('wanita') ||
    str.includes('(female)')
  ) {
    return 'female';
  }
  return 'unisex';
}

/**
 * Accord translations mapping from Malay to English standard
 */
export const ACCORD_TRANSLATIONS = {
  'sitrus': 'Citrus',
  'citrus': 'Citrus',
  'kayu': 'Woody',
  'kayuan': 'Woody',
  'woody': 'Woody',
  'rempah hangat': 'Warm Spicy',
  'warm spicy': 'Warm Spicy',
  'rempah segar': 'Fresh Spicy',
  'fresh spicy': 'Fresh Spicy',
  'bunga': 'Floral',
  'bungaan': 'Floral',
  'floral': 'Floral',
  'manis': 'Sweet',
  'sweet': 'Sweet',
  'segar': 'Fresh',
  'fresh': 'Fresh',
  'berasap': 'Smoky',
  'smoky': 'Smoky',
  'akuatik': 'Aquatic',
  'aquatic': 'Aquatic',
  'hijau': 'Green',
  'green': 'Green',
  'kasturi': 'Musky',
  'musky': 'Musky',
  'bedak': 'Powdery',
  'pudar': 'Powdery',
  'powdery': 'Powdery',
  'vanila': 'Vanilla',
  'vanilla': 'Vanilla',
  'kulit': 'Leather',
  'leather': 'Leather',
  'buah': 'Fruity',
  'buahan': 'Fruity',
  'fruity': 'Fruity',
  'karamel': 'Caramel',
  'caramel': 'Caramel',
  'koko': 'Chocolate',
  'coklat': 'Chocolate',
  'chocolate': 'Chocolate',
  'tanah': 'Earthy',
  'earthy': 'Earthy',
  'herba': 'Herbal',
  'herbal': 'Herbal',
  'tembakau': 'Tobacco',
  'tobacco': 'Tobacco',
  'aromatik': 'Aromatic',
  'aromatic': 'Aromatic'
};

/**
 * When-to-wear translations mapping from Malay to English standard
 */
export const WHEN_TO_WEAR_TRANSLATIONS = {
  // Times
  'siang': 'Day',
  'malam': 'Night',
  'pagi': 'Morning',
  'petang': 'Evening',
  'versatile': 'Versatile',
  'versatil': 'Versatile',
  'siang & malam': 'Versatile',
  'day & night': 'Versatile',
  'siang dan malam': 'Versatile',
  'day and night': 'Versatile',
  // Occasions & Settings
  'pejabat': 'Office',
  'luar panas lembap': 'Outdoor Warm & Humid',
  'luar panas': 'Outdoor Warm & Humid',
  'panas lembap': 'Outdoor Warm & Humid',
  'kasual': 'Casual',
  'harian': 'Daily',
  'acara rasmi': 'Formal Events',
  'rasmi': 'Formal Events',
  'malam romantis': 'Date Night',
  'kencan': 'Date Night',
  'sukan': 'Sports & Active',
  'kuliah & kasual': 'Campus & Casual',
  'kuliah': 'Campus',
  'pejabat berhawa dingin': 'Air-Conditioned Office',
  // Weather Suitability
  'terik lembap': 'Hot & Humid',
  'panas tropika': 'Tropical Heat',
  'sepanjang tahun (tropika)': 'Year-Round (Tropical)',
  'sepanjang tahun': 'Year-Round (Tropical)',
  'bilik berhawa dingin': 'Air-Conditioned / Indoor',
  'bilik aircond': 'Air-Conditioned / Indoor',
  'hujan tropika': 'Tropical Rain',
  'dingin & berkabus': 'Cool & Misty',
  'dingin segar pergunungan': 'Mountain Fresh & Cool'
};

/**
 * Auto-translate any Malay term/sentence in fragrance metadata to English standard
 */
export function autoTranslateToEnglish(input) {
  if (!input || typeof input !== 'string') return input || '';
  let str = input.trim();
  const lower = str.toLowerCase();

  // 1. Direct match in when to wear or accords
  if (WHEN_TO_WEAR_TRANSLATIONS[lower]) return WHEN_TO_WEAR_TRANSLATIONS[lower];
  if (ACCORD_TRANSLATIONS[lower]) return ACCORD_TRANSLATIONS[lower];

  // 2. Direct note translation check
  if (NOTE_TRANSLATIONS[lower]) return NOTE_TRANSLATIONS[lower].en;

  // 3. Handle accords with percentages e.g. "Sitrus 85%" -> "Citrus 85%"
  const accordPctMatch = str.match(/^(.+?)\s+(\d+%)$/);
  if (accordPctMatch) {
    const accName = accordPctMatch[1].trim().toLowerCase();
    const pct = accordPctMatch[2];
    const translatedName = ACCORD_TRANSLATIONS[accName] || (NOTE_TRANSLATIONS[accName]?.en) || accordPctMatch[1].trim();
    return `${translatedName} ${pct}`;
  }

  // 4. Longevity translation
  str = str.replace(/\bjam\b/gi, 'Hours');
  str = str.replace(/Panas\s+Terik/gi, 'Hot Weather');
  str = str.replace(/\(?\bHarian\b\)?/gi, '(Daily)');
  str = str.replace(/\(?AC\s+Mall\/Offis\)?/gi, '(AC Mall/Office)');

  // 5. Replace known BM terms inside comma-separated or sentence strings
  Object.entries(WHEN_TO_WEAR_TRANSLATIONS).forEach(([bmKey, enVal]) => {
    const escaped = bmKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(`\\b${escaped}\\b`, 'gi');
    str = str.replace(rx, enVal);
  });

  Object.entries(ACCORD_TRANSLATIONS).forEach(([bmKey, enVal]) => {
    const escaped = bmKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(`\\b${escaped}\\b`, 'gi');
    str = str.replace(rx, enVal);
  });

  return str;
}


/**
 * Translate a single fragrance note string into active or specified language.
 */
export function translateNote(note, customLang) {
  if (!note || typeof note !== 'string') return note || '';
  const lang = customLang || (i18nService ? i18nService.getLanguage() : 'bm');
  const trimmed = note.trim();
  const lower = trimmed.toLowerCase();

  // Direct lookup
  if (NOTE_TRANSLATIONS[lower]) {
    return NOTE_TRANSLATIONS[lower][lang] || (lang === 'en' ? NOTE_TRANSLATIONS[lower].en : NOTE_TRANSLATIONS[lower].bm);
  }

  // Handle parenthetical English format: e.g. "Kayu Manis (Cinnamon)"
  const parenMatch = trimmed.match(/^(.+?)\s*\((.+?)\)$/);
  if (parenMatch) {
    const bmPart = parenMatch[1].trim();
    const enPart = parenMatch[2].trim();
    if (lang === 'en') {
      const matchLookup = NOTE_TRANSLATIONS[enPart.toLowerCase()] || NOTE_TRANSLATIONS[bmPart.toLowerCase()];
      return matchLookup?.en || enPart;
    } else {
      const matchLookup = NOTE_TRANSLATIONS[bmPart.toLowerCase()] || NOTE_TRANSLATIONS[enPart.toLowerCase()];
      return matchLookup?.bm || bmPart;
    }
  }

  return trimmed;
}

/**
 * Translate fragrance notes list (array or comma-separated string) into active or specified language.
 */
export function translateNotes(notesInput, customLang) {
  if (!notesInput) return '';
  const lang = customLang || (i18nService ? i18nService.getLanguage() : 'bm');

  if (Array.isArray(notesInput)) {
    return notesInput.map(n => translateNote(n, lang));
  }

  if (typeof notesInput === 'string') {
    const trimmed = notesInput.trim();
    const lower = trimmed.toLowerCase();
    if (NOTE_TRANSLATIONS[lower]) {
      return NOTE_TRANSLATIONS[lower][lang] || trimmed;
    }

    if (trimmed.includes(',')) {
      return trimmed
        .split(',')
        .map(part => translateNote(part.trim(), lang))
        .join(', ');
    }

    return translateNote(trimmed, lang);
  }

  return notesInput;
}


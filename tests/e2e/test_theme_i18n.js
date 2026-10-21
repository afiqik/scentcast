/**
 * ScentCast Malaysia — E2E Test Suite: R8 Dark/Light Mode & R9 Bilingual i18n
 * Covers Tailwind class toggling on <html>, localStorage persistence,
 * Malay & English JSON dictionaries, translation helper t(), and boundary fallbacks.
 */

import {
  describe,
  test,
  assert,
  assertEqual,
  assertTrue,
  assertFalse,
  assertNull,
  assertNotNull,
  assertIncludes,
  assertNotIncludes
} from './runner.js';

// Canonical i18n dictionaries for ScentCast
export const DICTIONARIES = {
  bm: {
    nav: {
      home: 'Laman Utama',
      weather: 'Cuaca',
      directory: 'Direktori',
      dupe: 'Dupe Finder',
      profile: 'Koleksi Saya',
      admin: 'Panel Admin'
    },
    weather: {
      title: 'Cuaca Semasa Malaysia',
      skinTemp: 'Suhu Kulit',
      evaporation: 'Kadar Penyejatan',
      projection: 'Unjuran Bau',
      sprayAdvice: 'Nasihat Semburan'
    },
    perfume: {
      accords: 'Akord Utama',
      composition: 'Komposisi Bau',
      topNotes: 'Nota Puncak',
      midNotes: 'Nota Jantung',
      baseNotes: 'Nota Dasar',
      longevity: 'Ketahanan',
      sillage: 'Unjuran (Sillage)'
    },
    dupe: {
      arabSection: 'Dupe Arab (UAE & Timur Tengah)',
      localSection: 'Dupe Tempatan (Artisan Malaysia)',
      emptyNotice: 'Tiada dupe dijumpai untuk wangian ini.',
      partialNotice: 'Hanya {count} dupe ditemui:'
    },
    profile: {
      title: '❤️ Koleksi Saya',
      empty: 'Belum ada wangian disimpan. Tekan ❤️ pada mana-mana parfume.'
    },
    admin: {
      accessDenied: '⛔ Akses Ditolak: Anda tidak mempunyai kebenaran pentadbir.'
    }
  },
  en: {
    nav: {
      home: 'Home',
      weather: 'Weather',
      directory: 'Directory',
      dupe: 'Dupe Finder',
      profile: 'My Collection',
      admin: 'Admin Panel'
    },
    weather: {
      title: 'Malaysia Real-Time Weather',
      skinTemp: 'Skin Temperature',
      evaporation: 'Evaporation Rate',
      projection: 'Projection Hold',
      sprayAdvice: 'Spray Advisory'
    },
    perfume: {
      accords: 'Main Accords',
      composition: 'Fragrance Composition',
      topNotes: 'Top Notes',
      midNotes: 'Heart Notes',
      baseNotes: 'Base Notes',
      longevity: 'Longevity',
      sillage: 'Sillage'
    },
    dupe: {
      arabSection: 'Arab Dupes (UAE & Middle East)',
      localSection: 'Local Dupes (Malaysian Artisans)',
      emptyNotice: 'No dupes found for this fragrance.',
      partialNotice: 'Only {count} dupes found:'
    },
    profile: {
      title: '❤️ My Collection',
      empty: 'No perfumes saved yet. Tap ❤️ on any perfume.'
    },
    admin: {
      accessDenied: '⛔ Access Denied: You do not have administrator permissions.'
    }
  }
};

// Canonical i18n Service
export class I18nService {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.lang = this.storage.getItem('scentcast-lang') || 'bm';
    if (!DICTIONARIES[this.lang]) this.lang = 'bm';
    this.listeners = new Set();
  }

  getLanguage() {
    return this.lang;
  }

  setLanguage(lang) {
    if (DICTIONARIES[lang]) {
      this.lang = lang;
      this.storage.setItem('scentcast-lang', lang);
      this.notify();
    }
  }

  toggleLanguage() {
    const next = this.lang === 'bm' ? 'en' : 'bm';
    this.setLanguage(next);
    return next;
  }

  t(key, params = {}) {
    const parts = key.split('.');
    let current = DICTIONARIES[this.lang];
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        // Missing key fallback to key name
        return key;
      }
    }

    if (typeof current !== 'string') return key;

    // Parameter interpolation: replace {param} with value
    let result = current;
    for (const [pKey, pVal] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    }
    return result;
  }

  subscribe(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  notify() {
    this.listeners.forEach((cb) => cb(this.lang));
  }
}

// Canonical Theme Service
export class ThemeService {
  constructor(storage = globalThis.localStorage, doc = globalThis.document) {
    this.storage = storage;
    this.doc = doc;
    this.currentTheme = 'light';
    this.listeners = new Set();
    this.init();
  }

  init() {
    const saved = this.storage.getItem('scentcast-theme');
    if (saved === 'dark' || saved === 'light') {
      this.currentTheme = saved;
    } else if (globalThis.window?.matchMedia?.('(prefers-color-scheme: dark)')?.matches) {
      this.currentTheme = 'dark';
    } else {
      this.currentTheme = 'light';
    }
    this.applyTheme();
  }

  applyTheme() {
    if (this.currentTheme === 'dark') {
      this.doc.documentElement.classList.add('dark');
    } else {
      this.doc.documentElement.classList.remove('dark');
    }
    this.storage.setItem('scentcast-theme', this.currentTheme);
    this.notify();
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme();
    return this.currentTheme;
  }

  getTheme() {
    return this.currentTheme;
  }

  getToggleIcon() {
    // In light mode, show moon 🌙; in dark mode, show sun ☀️
    return this.currentTheme === 'dark' ? '☀️' : '🌙';
  }

  subscribe(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  notify() {
    this.listeners.forEach((cb) => cb(this.currentTheme));
  }
}

describe('R8 & R9: Theme & i18n — Tier 1 Feature Coverage', () => {

  test('Theme-01: Toggling theme applies and removes "dark" class on <html> root element', () => {
    const themeService = new ThemeService();
    // Force light start
    themeService.currentTheme = 'light';
    themeService.applyTheme();
    assertFalse(globalThis.document.documentElement.classList.contains('dark'), 'Light mode must not have dark class');

    // Toggle to dark
    const theme1 = themeService.toggleTheme();
    assertEqual(theme1, 'dark');
    assertTrue(globalThis.document.documentElement.classList.contains('dark'), 'Dark mode must have dark class on html');

    // Toggle back to light
    const theme2 = themeService.toggleTheme();
    assertEqual(theme2, 'light');
    assertFalse(globalThis.document.documentElement.classList.contains('dark'));
  });

  test('Theme-02: Theme preference is stored in localStorage under "scentcast-theme"', () => {
    const themeService = new ThemeService();
    themeService.currentTheme = 'dark';
    themeService.applyTheme();

    assertEqual(globalThis.localStorage.getItem('scentcast-theme'), 'dark');

    themeService.toggleTheme();
    assertEqual(globalThis.localStorage.getItem('scentcast-theme'), 'light');
  });

  test('Theme-03: Header toggle icon displays 🌙 in light mode and ☀️ in dark mode', () => {
    const themeService = new ThemeService();
    themeService.currentTheme = 'light';
    assertEqual(themeService.getToggleIcon(), '🌙', 'Light mode displays moon icon');

    themeService.currentTheme = 'dark';
    assertEqual(themeService.getToggleIcon(), '☀️', 'Dark mode displays sun icon');
  });

  test('i18n-01: Malay (BM) dictionary translates core labels accurately', () => {
    const i18n = new I18nService();
    i18n.setLanguage('bm');

    assertEqual(i18n.t('nav.home'), 'Laman Utama');
    assertEqual(i18n.t('weather.skinTemp'), 'Suhu Kulit');
    assertEqual(i18n.t('perfume.accords'), 'Akord Utama');
    assertEqual(i18n.t('profile.title'), '❤️ Koleksi Saya');
  });

  test('i18n-02: English (EN) dictionary translates core labels accurately', () => {
    const i18n = new I18nService();
    i18n.setLanguage('en');

    assertEqual(i18n.t('nav.home'), 'Home');
    assertEqual(i18n.t('weather.skinTemp'), 'Skin Temperature');
    assertEqual(i18n.t('perfume.accords'), 'Main Accords');
    assertEqual(i18n.t('profile.title'), '❤️ My Collection');
  });

  test('i18n-03: Language preference is persisted in localStorage under "scentcast-lang"', () => {
    const i18n = new I18nService();
    i18n.setLanguage('en');
    assertEqual(globalThis.localStorage.getItem('scentcast-lang'), 'en');

    i18n.toggleLanguage();
    assertEqual(globalThis.localStorage.getItem('scentcast-lang'), 'bm');
    assertEqual(globalThis.localStorage.getItem('scentcast-lang'), 'bm');
  });
});

describe('R8 & R9: Theme & i18n — Tier 2 Boundary & Corner Cases', () => {

  test('i18n-04: Invalid language code safely defaults to "bm"', () => {
    globalThis.localStorage.setItem('scentcast-lang', 'invalid-lang-code-xyz');
    const i18n = new I18nService();
    assertEqual(i18n.getLanguage(), 'bm', 'Invalid language must fallback to bm');
  });

  test('i18n-05: Missing translation key returns key string without throwing exception', () => {
    const i18n = new I18nService();
    const result = i18n.t('non.existent.translation.key');
    assertEqual(result, 'non.existent.translation.key', 'Missing key should return key name itself');
  });

  test('i18n-06: Parameter interpolation substitutes variables correctly and handles missing params', () => {
    const i18n = new I18nService();
    i18n.setLanguage('bm');

    const formatted = i18n.t('dupe.partialNotice', { count: 3 });
    assertEqual(formatted, 'Hanya 3 dupe ditemui:');

    // Missing param leaves placeholder or converts to string safely
    const unformatted = i18n.t('dupe.partialNotice', {});
    assertIncludes(unformatted, '{count}');
  });

  test('Theme-04: Corrupted localStorage theme value safely defaults to light', () => {
    globalThis.localStorage.setItem('scentcast-theme', 'CORRUPT_THEME_VALUE_!@#');
    const themeService = new ThemeService();
    assertEqual(themeService.getTheme(), 'light', 'Corrupted theme must default to light');
  });

  test('Theme-05: Rapid toggling maintains DOM class synchronization', () => {
    const themeService = new ThemeService();
    for (let i = 0; i < 10; i++) {
      themeService.toggleTheme();
    }
    const current = themeService.getTheme();
    const hasDarkClass = globalThis.document.documentElement.classList.contains('dark');
    assertEqual(hasDarkClass, current === 'dark', 'DOM class must match state after rapid toggling');
  });
});

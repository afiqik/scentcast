const THEME_STORAGE_KEY = 'scentcast-theme';

export class ThemeService {
  constructor(
    storage = typeof globalThis.localStorage !== 'undefined' ? globalThis.localStorage : null,
    doc = typeof globalThis.document !== 'undefined' ? globalThis.document : null
  ) {
    this.storage = storage;
    this.doc = doc;
    this.currentTheme = 'light';
    this.listeners = new Set();
    this.initTheme();
  }

  getTheme() {
    return this.currentTheme;
  }

  getToggleIcon() {
    return this.currentTheme === 'dark' ? '☀️' : '🌙';
  }

  initTheme() {
    let saved = null;
    try {
      if (this.storage) {
        saved = this.storage.getItem(THEME_STORAGE_KEY);
      }
    } catch {}

    let theme = 'light';
    if (saved === 'dark' || saved === 'light') {
      theme = saved;
    } else if (
      typeof globalThis.window !== 'undefined' &&
      globalThis.window.matchMedia &&
      globalThis.window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      theme = 'dark';
    }

    this.applyTheme(theme);

    // Listen for OS changes if no manual preference stored
    if (typeof globalThis.window !== 'undefined' && globalThis.window.matchMedia) {
      try {
        globalThis.window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
          if (!this.storage?.getItem(THEME_STORAGE_KEY)) {
            this.applyTheme(e.matches ? 'dark' : 'light');
          }
        });
      } catch {}
    }

    return this.currentTheme;
  }

  init() {
    return this.initTheme();
  }

  applyTheme(theme = this.currentTheme) {
    this.currentTheme = theme;
    if (this.storage) {
      try {
        this.storage.setItem(THEME_STORAGE_KEY, this.currentTheme);
      } catch {}
    }
    const root = this.doc?.documentElement || (typeof document !== 'undefined' ? document.documentElement : null);
    if (root?.classList) {
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    }
    this.notify();
  }

  toggleTheme() {
    const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
    return nextTheme;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.currentTheme);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.currentTheme);
      } catch (err) {
        console.error('[ThemeService] Subscriber error:', err);
      }
    });
  }
}

export const themeService = new ThemeService();

export function initTheme() {
  return themeService.initTheme();
}

export function toggleTheme() {
  return themeService.toggleTheme();
}

export function getTheme() {
  return themeService.getTheme();
}

export function getToggleIcon() {
  return themeService.getToggleIcon();
}

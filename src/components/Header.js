import { weatherService } from '../services/weatherService.js';
import { authService } from '../services/authService.js';
import { themeService } from '../services/themeService.js';
import { i18nService, t } from '../services/i18nService.js';

export function renderHeader(currentRoute) {
  const weather = weatherService.getCurrentWeather();
  const user = authService.getCurrentUser();
  const isGuest = authService.isGuest();
  const theme = themeService.getTheme();
  const lang = i18nService.getLanguage();

  const navItems = [
    { id: 'laman-utama', label: t('nav.home'), path: '/' },
    { id: 'cuaca', label: t('nav.weather'), path: '/cuaca' },
    { id: 'dupe', label: t('nav.dupe'), path: '/dupe' },
    { id: 'direktori', label: t('nav.directory'), path: '/direktori' },
    { id: 'tentang-kami', label: t('nav.about'), path: '/tentang-kami' }
  ];

  if (authService.isAdmin()) {
    navItems.push({ id: 'admin', label: t('nav.admin'), path: '/admin' });
  }

  return `
  <header class="fixed top-0 left-0 right-0 z-50 py-2 sm:py-3 px-2 sm:px-4 md:px-8">
    <div class="max-w-max-width mx-auto flex items-center justify-between flex-nowrap neu-glass rounded-full px-3.5 sm:px-5 py-2 md:px-6 md:py-2.5 border border-border-hairline transition-all">
      <!-- Left: Brand Logo -->
      <div class="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <a href="#/" class="flex items-center gap-2 sm:gap-2.5 transition-transform active:scale-95 group" title="ScentCast Malaysia">
          <div class="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full neu-inset flex items-center justify-center p-1 shrink-0 overflow-hidden bg-white/70 dark:bg-slate-800/70 shadow-sm border border-border-hairline group-hover:border-atmospheric-blue/30 transition-all">
            <img src="/new-logo.png" alt="ScentCast Logo" class="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-300 group-hover:scale-110" />
          </div>
          <div class="flex flex-col justify-center">
            <div class="flex items-center gap-1">
              <span class="font-headline text-base sm:text-lg tracking-tight text-deep-navy font-bold leading-none">ScentCast</span>
              <span class="neu-inset px-1.5 py-0.5 rounded-full text-[9px] tracking-wider text-atmospheric-blue uppercase font-bold">MY</span>
            </div>
            <span class="text-[9px] uppercase tracking-widest text-atmospheric-blue leading-tight font-semibold mt-0.5">Fragrance Intelligence</span>
          </div>
        </a>
      </div>

      <!-- Center: Navigation Links -->
      <nav class="hidden lg:flex items-center gap-1.5 xl:gap-2.5 p-0.5 rounded-full shrink flex-nowrap">
        ${navItems.map(item => {
          const isActive = currentRoute === item.id || 
            (item.id === 'cuaca' && currentRoute === 'cadangan-cuaca') || 
            (item.id === 'dupe' && currentRoute === 'dupe-finder') || 
            (item.id === 'laman-utama' && (!currentRoute || currentRoute === ''));
          return `
            <a href="#${item.path}" class="px-2.5 xl:px-3.5 py-1.5 rounded-full text-xs font-headline font-semibold whitespace-nowrap shrink-0 transition-all duration-200 ${
              isActive 
                ? 'neu-inset text-atmospheric-blue shadow-inner' 
                : 'text-on-surface-variant hover:text-deep-navy hover:neu-button'
            }">
              ${item.label}
            </a>
          `;
        }).join('')}
      </nav>

      <!-- Right: Live Weather, Search, Theme & Lang Toggles, Profile -->
      <div class="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0 justify-end ml-auto flex-nowrap">
        <!-- Live RTDB Weather Pill (Compact on medium screens, hiding text labels) -->
        <button id="header-weather-btn" onclick="window.location.hash='#/cuaca'" title="${t('nav.changeCity')}" class="flex items-center gap-1 neu-inset rounded-full px-2 sm:px-2.5 py-1 sm:py-1.5 text-on-surface-variant font-mono text-[11px] sm:text-xs hover:border hover:border-atmospheric-blue/30 transition-all cursor-pointer shrink-0">
          <span class="material-symbols-outlined text-sunset-amber text-xs sm:text-sm fill-1">wb_sunny</span>
          <span class="font-bold text-deep-navy">${weather.name ? weather.name.split(' ')[0] : 'KL'} ${weather.temperature || weather.temp || 32}°C</span>
          <span class="hidden xl:inline text-outline">•</span>
          <span class="hidden xl:inline text-atmospheric-blue font-semibold">${weather.humidity || 78}% RH</span>
          <span class="relative flex h-1.5 w-1.5 ml-0.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-atmospheric-blue opacity-75"></span>
            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-atmospheric-blue"></span>
          </span>
        </button>

        <!-- Quick Search Pill (Compact on md, expanded on xl) -->
        <div class="hidden md:flex items-center neu-inset rounded-full px-2.5 py-1 sm:py-1.5 gap-1 shrink-0">
          <button id="header-search-btn" type="button" class="flex items-center justify-center text-outline hover:text-atmospheric-blue cursor-pointer transition-colors bg-transparent border-0 p-0" title="${t('nav.search')}">
            <span class="material-symbols-outlined text-sm">search</span>
          </button>
          <input id="header-search-input" class="bg-transparent border-0 outline-none text-deep-navy placeholder:text-outline text-xs w-16 lg:w-20 xl:w-28 focus:w-36 transition-all duration-300 font-body" placeholder="${t('nav.searchPlaceholder')}" type="text">
        </div>

        <!-- Theme Toggle Button -->
        <button id="toggle-theme-btn" title="${theme === 'dark' ? t('common.themeLight') : t('common.themeDark')}" class="neu-button w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold text-deep-navy hover:text-atmospheric-blue transition-all cursor-pointer shrink-0" type="button">
          <span>${theme === 'dark' ? '☀️' : '🌙'}</span>
        </button>

        <!-- Language Toggle Button -->
        <button id="toggle-lang-btn" title="BM / EN" class="neu-button px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full flex items-center gap-1 text-[10px] sm:text-[11px] font-headline font-bold text-deep-navy hover:text-atmospheric-blue transition-all cursor-pointer shrink-0" type="button">
          <span class="material-symbols-outlined text-xs text-atmospheric-blue">translate</span>
          <span>${lang.toUpperCase()}</span>
        </button>

        <!-- Profile Avatar / Login Button -->
        ${isGuest ? `
          <button id="open-auth-btn" class="neu-button px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5 text-xs font-headline font-bold text-atmospheric-blue hover:text-deep-navy transition-all shrink-0">
            <span class="material-symbols-outlined text-sm">login</span>
            <span>${t('nav.login')}</span>
          </button>
        ` : `
          <a id="user-profile-btn" href="#/profil" class="shrink-0 p-0.5 rounded-full border border-atmospheric-blue/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-sm" title="${t('nav.profile')}">
            ${user?.photoURL ? `
              <img src="${user.photoURL}" alt="Avatar" class="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';">
            ` : `
              <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-atmospheric-blue text-white flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                ${(user?.displayName || user?.username || user?.email || 'V')[0].toUpperCase()}
              </div>
            `}
          </a>
        `}

        <!-- Mobile Menu Toggle Button -->
        <button id="mobile-menu-toggle" class="lg:hidden neu-button p-1.5 sm:p-2 rounded-full flex items-center justify-center text-deep-navy shrink-0">
          <span class="material-symbols-outlined text-base">menu</span>
        </button>
      </div>
    </div>

    <!-- Mobile Navigation Drawer -->
    <div id="mobile-menu-drawer" class="hidden lg:hidden max-w-max-width mx-auto mt-2 neu-flat rounded-2xl p-4 flex flex-col gap-2">
      ${navItems.map(item => `
        <a href="#${item.path}" class="px-4 py-2 rounded-xl text-sm font-headline font-semibold text-deep-navy hover:neu-inset hover:text-atmospheric-blue transition-all">
          ${item.label}
        </a>
      `).join('')}
    </div>
  </header>
  `;
}

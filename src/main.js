import './style.css';
import { weatherService } from './services/weatherService.js';
import { authService } from './services/authService.js';
import { presenceService } from './services/presenceService.js';
import { renderHeader } from './components/Header.js';
import { renderFooter } from './components/Footer.js';
import { openAuthModal } from './components/AuthModal.js';
import { initTheme, toggleTheme } from './services/themeService.js';
import { initI18n, setLanguage, getLanguage, t } from './services/i18nService.js';

import { renderHomeView, attachHomeListeners } from './views/HomeView.js';
import { renderWeatherView, attachWeatherListeners } from './views/WeatherView.js';
import { renderDupeView, attachDupeListeners } from './views/DupeView.js';
import { renderDirectoryView, attachDirectoryListeners } from './views/DirectoryView.js';
import { renderSearchView, attachSearchListeners } from './views/SearchView.js';
import { renderDetailView, attachDetailListeners } from './views/DetailView.js';
import { renderProfileView, attachProfileListeners } from './views/ProfileView.js';
import { renderAboutView, attachAboutListeners } from './views/AboutView.js';
import { renderAdminView, attachAdminListeners, renderAccessDenied } from './views/AdminView.js';
import { renderNotFoundView, attachNotFoundListeners } from './views/NotFoundView.js';
import { renderDetailSkeleton, renderSkeletonGrid } from './components/SkeletonLoader.js';

// Initialize Theme, Bilingual Localization & Live Presence
initTheme();
initI18n();
presenceService.initPresence(authService.getCurrentUser());

// Canonical Route Mapping matching R10 & R1 Specifications
export const ROUTE_MAP = {
  '': 'HomeView',
  'laman-utama': 'HomeView',
  'cuaca': 'WeatherView',
  'cadangan-cuaca': 'WeatherView',
  'direktori': 'DirectoryView',
  'cari': 'SearchView',
  'detail': 'DetailView',
  'dupe': 'DupeView',
  'dupe-finder': 'DupeView',
  'profil': 'ProfileView',
  'admin': 'AdminView',
  'tentang-kami': 'AboutView',
  '404': 'NotFoundView'
};

/**
 * Canonical SPA Route Parser matching R10 Specifications.
 * Maps canonical routes, extracts route parameters and query strings,
 * normalizes hash variations, and provides safe 404 fallback.
 */
export function parseRoute(hash) {
  const raw = hash || (typeof window !== 'undefined' ? window.location.hash : '#/') || '#/';
  // Normalize leading hash and optional slash
  const clean = raw.replace(/^#\/?/, '');
  // Split path from query string
  const [pathPart, queryPart] = clean.split('?');
  const segments = pathPart ? pathPart.split('/').filter(Boolean) : [];

  const mainRoute = segments[0] || 'laman-utama';
  const param = segments[1] || null;

  // Parse query parameters
  const query = {};
  if (queryPart) {
    queryPart.split('&').forEach((pair) => {
      if (!pair) return;
      const [k, v] = pair.split('=');
      if (k) {
        query[decodeURIComponent(k)] = v !== undefined ? decodeURIComponent(v.replace(/\+/g, ' ')) : '';
      }
    });
  }

  const isUnknown = !(mainRoute in ROUTE_MAP);
  const viewName = isUnknown ? 'NotFoundView' : ROUTE_MAP[mainRoute];

  return {
    raw,
    path: mainRoute,
    route: mainRoute,
    param,
    query,
    viewName,
    isUnknown
  };
}

/**
 * Backward-compatible helper returning current parsed route
 */
export function getRouteInfo() {
  const hash = typeof window !== 'undefined' ? window.location.hash : '#/';
  return parseRoute(hash);
}

/**
 * Main Application Lifecycle Renderer.
 * Coordinates route resolution, asynchronous HTML rendering, DOM injection,
 * and view-specific event listener attachment.
 */
export async function renderApp() {
  const routeInfo = parseRoute(typeof window !== 'undefined' ? window.location.hash : '#/');
  const { path: route, param, query, viewName, isUnknown } = routeInfo;

  // Requirement R1: Canonical auto-redirect for unknown/invalid routes to #/404
  if (isUnknown && typeof window !== 'undefined' && window.location) {
    if (window.location.hash !== '#/404') {
      if (typeof window.location.replace === 'function') {
        window.location.replace('#/404');
      } else {
        window.location.hash = '#/404';
      }
    }
  }

  // 1. Render Global Header
  const headerHtml = renderHeader(route);

  // 1b. Smooth Transition: Show skeleton placeholder while target view loads
  const appEl = typeof document !== 'undefined' ? document.getElementById('app') : null;
  const mainEl = appEl ? appEl.querySelector('main') : null;
  if (mainEl) {
    if (viewName === 'DetailView') {
      mainEl.innerHTML = renderDetailSkeleton();
    } else if (viewName === 'DirectoryView' || viewName === 'SearchView') {
      mainEl.innerHTML = `
        <div class="w-full px-4 md:px-8 pt-28 pb-16 max-w-max-width mx-auto space-y-8">
          <div class="h-8 w-64 bg-slate-300/60 dark:bg-slate-700/60 rounded animate-pulse"></div>
          ${renderSkeletonGrid(8)}
        </div>
      `;
    }
  }

  // 2. Render Target View asynchronously
  let mainHtml = '';
  switch (viewName) {
    case 'WeatherView':
      mainHtml = await renderWeatherView();
      break;
    case 'DirectoryView':
      mainHtml = await renderDirectoryView();
      break;
    case 'SearchView':
      mainHtml = await renderSearchView(query);
      break;
    case 'DetailView':
      mainHtml = await renderDetailView(param || 'turathi-blue');
      break;
    case 'DupeView':
      mainHtml = await renderDupeView();
      break;
    case 'ProfileView':
      if (authService.isGuest()) {
        openAuthModal('login');
      }
      mainHtml = await renderProfileView();
      break;
    case 'AdminView':
      if (!authService.isAdmin()) {
        mainHtml = renderAccessDenied();
      } else {
        mainHtml = await renderAdminView();
      }
      break;
    case 'AboutView':
      mainHtml = await renderAboutView();
      break;
    case 'NotFoundView':
      mainHtml = renderNotFoundView({
        type: query?.type,
        perfumeId: query?.id || query?.perfumeId
      });
      break;
    case 'HomeView':
    default:
      mainHtml = await renderHomeView();
      break;
  }

  // 3. Render Global Footer
  const footerHtml = renderFooter();

  // 4. Assemble Application Shell into #app DOM
  if (appEl) {
    appEl.innerHTML = `
      ${headerHtml}
      <main class="flex-1 w-full bg-ice-white dark:bg-[#0B1120]">
        ${mainHtml}
      </main>
      ${footerHtml}
    `;
  }

  // 5. Clean Lifecycle: Attach Event Listeners After DOM Mounting
  if (typeof document !== 'undefined') {
    attachHeaderListeners();

    switch (viewName) {
      case 'WeatherView':
        attachWeatherListeners();
        break;
      case 'DirectoryView':
        attachDirectoryListeners();
        break;
      case 'SearchView':
        attachSearchListeners();
        break;
      case 'DetailView':
        attachDetailListeners();
        break;
      case 'DupeView':
        attachDupeListeners();
        break;
      case 'ProfileView':
        attachProfileListeners();
        break;
      case 'AdminView':
        attachAdminListeners();
        break;
      case 'AboutView':
        attachAboutListeners();
        break;
      case 'NotFoundView':
        attachNotFoundListeners();
        break;
      case 'HomeView':
      default:
        attachHomeListeners();
        break;
    }
  }

  // 6. Smooth Scroll to Top on Navigation
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/**
 * Attach Header event listeners (search, toggles, auth, drawer).
 */
export function attachHeaderListeners() {
  if (typeof document === 'undefined') return;

  // Mobile drawer toggle
  document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => {
    const drawer = document.getElementById('mobile-menu-drawer');
    drawer?.classList.toggle('hidden');
  });

  // Open Auth Modal
  document.getElementById('open-auth-btn')?.addEventListener('click', () => {
    openAuthModal('login');
  });

  // Toggle Theme (Dark / Light)
  document.getElementById('toggle-theme-btn')?.addEventListener('click', () => {
    toggleTheme();
    renderApp();
  });

  // Toggle Language (BM / EN)
  document.getElementById('toggle-lang-btn')?.addEventListener('click', () => {
    const current = getLanguage();
    setLanguage(current === 'bm' ? 'en' : 'bm');
    renderApp();
  });

  // Quick weather click -> navigate to weather view
  document.getElementById('header-weather-btn')?.addEventListener('click', () => {
    window.location.hash = '#/cuaca';
  });

  // Header search input & search button -> navigate to #/cari?q=...
  const searchInput = document.getElementById('header-search-input');
  const searchBtn = document.getElementById('header-search-btn');

  const executeHeaderSearch = () => {
    const q = searchInput?.value.trim();
    if (q) {
      window.location.hash = `#/cari?q=${encodeURIComponent(q)}`;
    }
  };

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeHeaderSearch();
    }
  });

  searchBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    executeHeaderSearch();
  });
}

// Subscribe to Realtime Database for Live Weather updates
weatherService.subscribe(() => {
  if (typeof document === 'undefined') return;
  const weather = weatherService.getCurrentWeather();
  const weatherBtn = document.getElementById('header-weather-btn');
  if (weatherBtn) {
    weatherBtn.innerHTML = `
      <span class="material-symbols-outlined text-sunset-amber text-sm fill-1">wb_sunny</span>
      <span class="font-bold text-deep-navy">${weather.name ? weather.name.split(' ')[0] : 'KL'} ${weather.temperature || weather.temp || 32}°C</span>
      <span class="hidden sm:inline text-outline">•</span>
      <span class="hidden sm:inline text-atmospheric-blue font-semibold">${weather.humidity || 78}% RH</span>
      <span class="relative flex h-2 w-2 ml-0.5">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-atmospheric-blue opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-atmospheric-blue"></span>
      </span>
    `;
  }
});

// Subscribe to Auth state changes
authService.subscribe(({ user }) => {
  presenceService.initPresence(user);
  if (typeof window !== 'undefined') {
    renderApp();
  }
});

// Browser Routing Event Listeners
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    renderApp();
  });

  window.addEventListener('DOMContentLoaded', () => {
    renderApp();
  });
}

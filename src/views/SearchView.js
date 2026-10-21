import { perfumeService } from '../services/perfumeService.js';
import { renderPerfumeCard, attachPerfumeCardListeners } from '../components/PerfumeCard.js';
import { t } from '../services/i18nService.js';

let activeSearchQuery = '';
let selectedGender = 'all';
let selectedAccord = 'all';
let selectedBrand = 'all';

function extractQueryFromHash() {
  const hash = window.location.hash || '';
  const queryPart = hash.split('?')[1] || '';
  const params = new URLSearchParams(queryPart);
  return params.get('q') || '';
}

export async function renderSearchView(initialQuery = null) {
  // Read query parameter from hash URL or parameter
  const rawQ = initialQuery !== null ? (typeof initialQuery === 'object' ? (initialQuery.q || '') : initialQuery) : extractQueryFromHash();
  activeSearchQuery = rawQ.trim();

  // Fetch all perfumes (service ensures local cache / Firestore sync)
  await perfumeService.getAllPerfumes();

  // Execute full-text search with facets
  const results = perfumeService.searchPerfumes(activeSearchQuery, {
    gender: selectedGender,
    accord: selectedAccord,
    brand: selectedBrand
  });

  const accordsList = ['all', 'Citrus', 'Aquatic', 'Woody', 'Gourmand', 'Floral', 'Amber'];
  const genderList = [
    { id: 'all', label: t('search.allGenders') },
    { id: 'male', label: t('search.male') },
    { id: 'female', label: t('search.female') },
    { id: 'unisex', label: t('search.unisex') }
  ];

  return `
  <div class="w-full px-4 md:px-8 pt-28 pb-16 max-w-max-width mx-auto space-y-8">
    <!-- Search Header & Real-time Input Box -->
    <div class="space-y-4">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span class="text-[10px] font-headline uppercase tracking-widest text-atmospheric-blue font-bold block mb-1">
            ${t('search.engineBadge')}
          </span>
          <h1 class="font-headline text-3xl font-bold text-deep-navy tracking-tight">
            ${t('search.searchTitle')}
          </h1>
          <p class="font-body text-xs md:text-sm text-on-surface-variant mt-1">
            ${t('search.searchDesc')}
          </p>
        </div>

        <!-- Result count badge -->
        <div class="neu-inset px-4 py-1.5 rounded-full flex items-center gap-2 self-start md:self-auto">
          <span class="w-2 h-2 rounded-full bg-atmospheric-blue"></span>
          <span class="font-mono text-xs font-bold text-deep-navy">${results.length} ${t('search.foundCount')}</span>
        </div>
      </div>

      <!-- In-Page Interactive Search Box -->
      <div class="neu-flat rounded-2xl p-3 md:p-4">
        <form id="search-view-form" class="flex items-center gap-2.5 neu-inset rounded-xl px-4 py-2.5">
          <span class="material-symbols-outlined text-atmospheric-blue text-xl">search</span>
          <input
            id="search-view-input"
            type="text"
            value="${activeSearchQuery}"
            placeholder="${t('search.placeholder')}"
            class="bg-transparent border-0 outline-none text-deep-navy placeholder:text-outline text-xs md:text-sm w-full font-body"
            autocomplete="off"
          />
          ${activeSearchQuery ? `
            <button id="clear-search-btn" type="button" class="text-outline hover:text-deep-navy transition-colors p-1" title="Padam carian">
              <span class="material-symbols-outlined text-base">close</span>
            </button>
          ` : ''}
          <button
            type="submit"
            class="neu-button px-4 py-1.5 rounded-full font-headline text-xs font-bold text-deep-navy hover:text-atmospheric-blue shrink-0 transition-all cursor-pointer"
          >
            ${t('home.searchBtn') || 'Cari'}
          </button>
        </form>
      </div>
    </div>

    <!-- Facet Filter Trays -->
    <div class="neu-flat rounded-2xl p-4 md:p-6 space-y-4">
      <!-- Gender Filters -->
      <div>
        <span class="text-xs font-headline font-bold text-deep-navy block mb-2">${t('search.gender')}</span>
        <div class="flex flex-wrap gap-2">
          ${genderList.map(g => `
            <button
              class="search-gender-btn neu-button px-3.5 py-1.5 rounded-full text-xs font-headline transition-all cursor-pointer ${
                selectedGender === g.id ? 'neu-inset text-atmospheric-blue font-bold shadow-inner' : 'text-on-surface-variant'
              }"
              data-gender="${g.id}"
            >
              ${g.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Accord Filters -->
      <div>
        <span class="text-xs font-headline font-bold text-deep-navy block mb-2">${t('search.accord')}</span>
        <div class="flex flex-wrap gap-2">
          ${accordsList.map(accord => `
            <button
              class="search-accord-btn neu-button px-3.5 py-1.5 rounded-full text-xs font-headline transition-all cursor-pointer ${
                selectedAccord.toLowerCase() === accord.toLowerCase() ? 'neu-inset text-atmospheric-blue font-bold shadow-inner' : 'text-on-surface-variant'
              }"
              data-accord="${accord}"
            >
              ${accord === 'all' ? t('search.allAccords') : accord}
            </button>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Search Results Grid / Empty State -->
    ${results.length > 0 ? `
      <div id="search-results-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-2">
        ${results.map(p => renderPerfumeCard(p)).join('')}
      </div>
    ` : `
      <div class="neu-flat rounded-3xl p-10 md:p-14 text-center space-y-4 max-w-xl mx-auto">
        <div class="w-16 h-16 rounded-full neu-inset flex items-center justify-center mx-auto text-atmospheric-blue">
          <span class="material-symbols-outlined text-3xl">search_off</span>
        </div>
        <h3 class="font-headline text-xl font-bold text-deep-navy">
          ${t('search.noResults')}
        </h3>
        <p class="font-body text-xs md:text-sm text-on-surface-variant leading-relaxed">
          ${activeSearchQuery
            ? `Kami tidak menemui sebarang padanan bagi kata kunci "<span class="font-bold text-deep-navy">${activeSearchQuery}</span>".`
            : `Tiada wangian yang sepadan dengan penapis yang dipilih.`
          }
          ${t('search.tryOther')}
        </p>
        <div class="pt-2">
          <button
            id="reset-search-btn"
            class="neu-button px-6 py-2 rounded-full font-headline text-xs font-bold text-deep-navy hover:text-atmospheric-blue transition-all cursor-pointer"
          >
            ${t('weather.resetFilters') || 'Tetapkan Semula Carian'}
          </button>
        </div>
      </div>
    `}
  </div>
  `;
}

export function attachSearchListeners() {
  // In-page search form submit
  const searchForm = document.getElementById('search-view-form');
  const searchInput = document.getElementById('search-view-input');

  const triggerSearch = (query) => {
    const q = (query !== undefined ? query : searchInput?.value || '').trim();
    const hash = q ? `#/cari?q=${encodeURIComponent(q)}` : '#/cari';
    window.location.hash = hash;
  };

  searchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    triggerSearch();
  });

  // Clear search input button
  document.getElementById('clear-search-btn')?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    triggerSearch('');
  });

  // Reset filters & query
  document.getElementById('reset-search-btn')?.addEventListener('click', () => {
    selectedGender = 'all';
    selectedAccord = 'all';
    selectedBrand = 'all';
    window.location.hash = '#/cari';
  });

  // Gender filter pills
  document.querySelectorAll('.search-gender-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedGender = btn.getAttribute('data-gender') || 'all';
      window.dispatchEvent(new Event('hashchange'));
    });
  });

  // Accord filter pills
  document.querySelectorAll('.search-accord-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedAccord = btn.getAttribute('data-accord') || 'all';
      window.dispatchEvent(new Event('hashchange'));
    });
  });

  // Attach love toggle and navigation listeners to PerfumeCards
  attachPerfumeCardListeners(document);
}

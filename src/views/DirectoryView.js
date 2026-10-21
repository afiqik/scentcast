import { perfumeService } from '../services/perfumeService.js';
import { renderPerfumeCard, attachPerfumeCardListeners } from '../components/PerfumeCard.js';
import { t } from '../services/i18nService.js';

let selectedAccord = 'all';
let selectedGender = 'all';
let selectedNote = 'all';
let dirSearchQuery = '';
let sortBy = 'rating';

export async function renderDirectoryView() {
  const allPerfumes = await perfumeService.getAllPerfumes();

  // Multi-filtering by Search Query, Fragrance Notes, Accord, and Gender
  let filtered = allPerfumes.filter(p => {
    // 1. Explicit Search Query Filter (name, brand, notes, accords, searchTokens)
    if (dirSearchQuery) {
      const q = dirSearchQuery.toLowerCase().trim();
      const inName = (p.name || '').toLowerCase().includes(q);
      const inBrand = (p.brand || '').toLowerCase().includes(q);
      const inTokens = (p.searchTokens || []).some(tk => typeof tk === 'string' && tk.includes(q));
      const inNotes = Object.values(p.notes || {}).flat().some(n => (typeof n === 'string' ? n : '').toLowerCase().includes(q));
      const inAccords = (p.accords || []).concat((p.mainAccords || []).map(m => m.name)).some(a => (typeof a === 'string' ? a : '').toLowerCase().includes(q));
      if (!inName && !inBrand && !inTokens && !inNotes && !inAccords) {
        return false;
      }
    }

    // 2. Fragrance Notes Filter (e.g. Vanilla, Bergamot, Amber, Rose, Lavender, Oudh, Citrus)
    if (selectedNote !== 'all') {
      const targetNote = selectedNote.toLowerCase();
      const allNotes = Object.values(p.notes || {}).flat().map(n => (typeof n === 'string' ? n : '').toLowerCase());
      const allAccords = (p.accords || []).concat((p.mainAccords || []).map(m => m.name)).map(a => (typeof a === 'string' ? a : '').toLowerCase());
      const inNotes = allNotes.some(n => n.includes(targetNote));
      const inAccords = allAccords.some(a => a.includes(targetNote));
      const inTokens = (p.searchTokens || []).some(tk => typeof tk === 'string' && tk.includes(targetNote));
      if (!inNotes && !inAccords && !inTokens) {
        return false;
      }
    }

    // 3. Accord / Olfactory Family Filter
    if (selectedAccord !== 'all') {
      const accords = p.accords || [];
      const mainAccords = (p.mainAccords || []).map(m => m.name);
      const allAccords = [...accords, ...mainAccords].map(a =>
        (typeof a === 'string' ? a : a.name).toLowerCase()
      );
      if (!allAccords.some(a => a.includes(selectedAccord.toLowerCase()))) {
        return false;
      }
    }

    // 4. Gender Filter
    if (selectedGender !== 'all') {
      const pGender = (p.gender || 'unisex').toLowerCase();
      if (pGender !== selectedGender.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  // Sorting options: Rating (Penarafan), Name A-Z, Longevity (Ketahanan)
  // Strictly ZERO price sorting (purged price-low, price-high, priceMYR)
  if (sortBy === 'rating') {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sortBy === 'name') {
    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (sortBy === 'longevity') {
    filtered.sort((a, b) => (b.climateScore || 0) - (a.climateScore || 0));
  }

  const accordOptions = [
    { id: 'all', label: t('directory.allAccords') },
    { id: 'citrus', label: 'Citrus' },
    { id: 'aquatic', label: 'Aquatic' },
    { id: 'woody', label: 'Woody' },
    { id: 'gourmand', label: 'Gourmand' },
    { id: 'floral', label: 'Floral' },
    { id: 'amber', label: 'Amber' }
  ];

  const noteOptions = [
    { id: 'all', label: t('directory.allNotes') || 'Semua Nota' },
    { id: 'vanilla', label: 'Vanilla' },
    { id: 'bergamot', label: 'Bergamot' },
    { id: 'amber', label: 'Amber' },
    { id: 'rose', label: 'Rose' },
    { id: 'lavender', label: 'Lavender' },
    { id: 'oudh', label: 'Oudh' },
    { id: 'citrus', label: 'Citrus' }
  ];

  const genderOptions = [
    { id: 'all', label: t('directory.allGenders') },
    { id: 'male', label: t('perfume.male') },
    { id: 'female', label: t('perfume.female') },
    { id: 'unisex', label: t('perfume.unisex') }
  ];

  return `
  <div class="w-full px-4 md:px-8 pt-28 pb-16 max-w-max-width mx-auto space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <span class="text-[10px] font-headline uppercase tracking-widest text-atmospheric-blue font-bold block mb-1">
          ${t('directory.openDb')}
        </span>
        <h1 class="font-headline text-3xl font-bold text-deep-navy tracking-tight">
          ${t('directory.dirTitle')}
        </h1>
        <p class="font-body text-xs md:text-sm text-on-surface-variant mt-1">
          ${t('directory.catalogDesc')}
        </p>
      </div>

      <!-- Sorting dropdown (Rating, Name, Longevity) with High Contrast Styling -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-headline text-outline">${t('directory.sortLabel')}</span>
        <div class="neu-inset rounded-full px-3 py-1.5 flex items-center border border-border-hairline">
          <select id="sort-select" class="bg-transparent border-0 outline-none text-xs font-headline font-bold text-deep-navy cursor-pointer">
            <option value="rating" ${sortBy === 'rating' ? 'selected' : ''}>${t('directory.sortRating')}</option>
            <option value="name" ${sortBy === 'name' ? 'selected' : ''}>${t('directory.sortName')}</option>
            <option value="longevity" ${sortBy === 'longevity' ? 'selected' : ''}>${t('directory.sortLongevity')}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Explicit Directory Search Bar Component -->
    <div class="neu-flat rounded-2xl p-4 md:p-5 border border-border-hairline">
      <form id="dir-search-form" class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div class="neu-inset rounded-xl px-4 py-2.5 flex items-center gap-2.5 flex-1">
          <span class="material-symbols-outlined text-outline text-lg">search</span>
          <input
            type="text"
            id="dir-search-input"
            class="bg-transparent border-0 outline-none text-xs sm:text-sm font-body text-deep-navy placeholder:text-outline w-full"
            placeholder="${t('directory.searchPlaceholder')}"
            value="${dirSearchQuery}"
          />
          ${dirSearchQuery ? `
            <button type="button" id="dir-search-clear-btn" class="text-outline hover:text-deep-navy cursor-pointer p-0.5" title="Kosongkan carian">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          ` : ''}
        </div>
        <button
          type="submit"
          id="dir-search-btn"
          class="neu-button px-6 py-2.5 rounded-xl font-headline text-xs font-bold text-atmospheric-blue hover:text-deep-navy flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-all"
        >
          <span class="material-symbols-outlined text-sm">search</span>
          <span>${t('directory.searchBtn')}</span>
        </button>
      </form>
    </div>

    <!-- Multi-Filter Trays (Gender, Accords, Fragrance Notes) -->
    <div class="neu-flat rounded-2xl p-4 md:p-6 space-y-5 border border-border-hairline">
      <!-- Gender Filter -->
      <div>
        <span class="text-xs font-headline font-bold text-deep-navy block mb-2">${t('directory.genderLabel')}</span>
        <div class="flex flex-wrap gap-2">
          ${genderOptions.map(g => `
            <button
              class="dir-gender-btn neu-button px-3.5 py-1.5 rounded-full text-xs font-headline transition-all cursor-pointer ${
                selectedGender === g.id ? 'neu-inset text-atmospheric-blue font-bold shadow-inner' : 'text-on-surface-variant'
              }"
              data-val="${g.id}"
            >
              ${g.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Accord / Fragrance Family Filter -->
      <div>
        <span class="text-xs font-headline font-bold text-deep-navy block mb-2">${t('directory.accordLabel')}</span>
        <div class="flex flex-wrap gap-2">
          ${accordOptions.map(a => `
            <button
              class="dir-accord-btn neu-button px-3.5 py-1.5 rounded-full text-xs font-headline transition-all cursor-pointer ${
                selectedAccord.toLowerCase() === a.id.toLowerCase() ? 'neu-inset text-atmospheric-blue font-bold shadow-inner' : 'text-on-surface-variant'
              }"
              data-val="${a.id}"
            >
              ${a.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Fragrance Notes Filter (Replaces Brand Filter) -->
      <div>
        <span class="text-xs font-headline font-bold text-deep-navy block mb-2">${t('directory.notesLabel')}</span>
        <div class="flex flex-wrap gap-2">
          ${noteOptions.map(n => `
            <button
              class="dir-note-btn neu-button px-3.5 py-1.5 rounded-full text-xs font-headline transition-all cursor-pointer ${
                selectedNote.toLowerCase() === n.id.toLowerCase() ? 'neu-inset text-atmospheric-blue font-bold shadow-inner' : 'text-on-surface-variant'
              }"
              data-val="${n.id}"
            >
              ${n.label}
            </button>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Cards Grid (Using Reusable PerfumeCard with 2-Column Mobile Grid) -->
    ${filtered.length > 0 ? `
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-2">
        ${filtered.map(p => renderPerfumeCard(p)).join('')}
      </div>
    ` : `
      <div class="neu-flat rounded-3xl p-10 text-center space-y-3 max-w-md mx-auto border border-border-hairline">
        <span class="material-symbols-outlined text-4xl text-outline">search_off</span>
        <h3 class="font-headline text-lg font-bold text-deep-navy">${t('directory.noResults')}</h3>
        <p class="font-body text-xs text-on-surface-variant">
          ${t('directory.noResultsDesc')}
        </p>
      </div>
    `}
  </div>
  `;
}

export function attachDirectoryListeners() {
  // Search Form Submit
  document.getElementById('dir-search-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('dir-search-input');
    dirSearchQuery = input ? input.value.trim() : '';
    window.dispatchEvent(new Event('hashchange'));
  });

  // Search Clear Button
  document.getElementById('dir-search-clear-btn')?.addEventListener('click', () => {
    dirSearchQuery = '';
    window.dispatchEvent(new Event('hashchange'));
  });

  // Gender Filter
  document.querySelectorAll('.dir-gender-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedGender = btn.getAttribute('data-val');
      window.dispatchEvent(new Event('hashchange'));
    });
  });

  // Accord Filter
  document.querySelectorAll('.dir-accord-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedAccord = btn.getAttribute('data-val');
      window.dispatchEvent(new Event('hashchange'));
    });
  });

  // Fragrance Note Filter
  document.querySelectorAll('.dir-note-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedNote = btn.getAttribute('data-val');
      window.dispatchEvent(new Event('hashchange'));
    });
  });

  // Sort Select Dropdown
  document.getElementById('sort-select')?.addEventListener('change', (e) => {
    sortBy = e.target.value;
    window.dispatchEvent(new Event('hashchange'));
  });

  // Attach love toggle and navigation listeners to PerfumeCards
  attachPerfumeCardListeners(document);
}

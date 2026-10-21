import { perfumeService } from '../services/perfumeService.js';
import { authService } from '../services/authService.js';
import { openAuthModal } from '../components/AuthModal.js';
import { i18nService, t, formatLongevity } from '../services/i18nService.js';
import { formatImageUrl, DEFAULT_FLACON_PLACEHOLDER } from '../services/storageService.js';

export const UAE_FLAG_ICON = `<svg class="w-6 h-4.5 sm:w-7 sm:h-5 rounded-xs shadow-xs inline-block shrink-0 align-middle" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg" aria-label="UAE"><path fill="#00732f" d="M0 0h640v160H0z"/><path fill="#fff" d="M0 160h640v160H0z"/><path fill="#000" d="M0 320h640v160H0z"/><path fill="#f00" d="M0 0h200v480H0z"/></svg>`;

export const MALAYSIA_FLAG_ICON = `<svg class="w-6 h-4.5 sm:w-7 sm:h-5 rounded-xs shadow-xs inline-block shrink-0 align-middle" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg" aria-label="Malaysia"><g fill-rule="evenodd" stroke-width="1pt"><path fill="#f7f7f7" d="M0 0h640v480H0z"/><path fill="#cc0001" d="M0 0h640v34.3H0zm0 68.6h640v34.3H0zm0 68.5h640v34.3H0zm0 68.6h640V240H0zm0 68.6h640v34.3H0zm0 68.5h640v34.3H0zm0 68.6h640V480H0z"/><path fill="#000066" d="M0 0h320v240H0z"/><path fill="#fc0" d="M228.6 120a68.6 68.6 0 1 1-137.2 0 68.6 68.6 0 0 1 137.2 0zm-17.1 0a51.4 51.4 0 1 0-102.9 0 51.4 51.4 0 0 0 102.9 0z"/><polygon fill="#fc0" points="180,68.6 185.3,101.4 214.3,86.2 196.4,113.9 228.6,120 196.4,126.1 214.3,153.8 185.3,138.6 180,171.4 174.7,138.6 145.7,153.8 163.6,126.1 131.4,120 163.6,113.9 145.7,86.2 174.7,101.4"/></g></svg>`;

export const GLOBE_ICON = `<span class="inline-flex items-center text-xl shrink-0" aria-label="Globe">🌐</span>`;

// Canonical Arab brand whitelist
export const ARAB_BRANDS = [
  'Afnan',
  'Armaf',
  'Lattafa',
  'Al-Rehab',
  'Ajmal',
  'Rasasi',
  'Swiss Arabian',
  'Maison Alhambra',
  'Fragrance World',
  'Reyane Tradition',
  'Al Haramain',
  'Rue Broca',
  'Paris Corner'
];

// Canonical Local Malaysian artisan brands
export const LOCAL_MALAYSIAN_BRANDS = [
  'The Scent Supply Co',
  'ScentLab Malaysia',
  'Artisan Scents KL',
  'Wangi Artisan MY'
];

// In-memory dupe database representing designer-to-dupe mapping
export const DUPE_DATABASE = {
  'bvlgari tygar': {
    target: 'Bvlgari Tygar',
    arab: [
      { id: 'turathi-blue', name: 'Turathi Blue', brand: 'Afnan', matchPercent: 95, longevity: '8 - 10 Jam', sillage: '2.0 m', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3jpdjR1-jN4k95RKMnbmQv3KSxbJAisoPxl0IAXal2m4gfmo0DB9tdbP_7hUI7exVMfaIxHwqdlz2M8I8O3-Gho9wEEVT5QF91P5YJe9kMAamYXM8XWppdIYivYwTmDxTC2lRzotbBVWn-N4HpZQpzl2lIc5FCWdenqmbWOeIPLeUr1FpxBEh4tFEUjtNqRJEU2TkRZ6EkzHI2nkDIUHR0PuGwBbq3zJ37p7aN1us5v0EkTxPdgEORw' },
      { id: 'theoreme', name: 'Theoreme Pour Homme', brand: 'Rue Broca', matchPercent: 93, longevity: '7 - 9 Jam', sillage: '1.8 m' },
      { id: 'al-qiam-silver', name: 'Al Qiam Silver', brand: 'Lattafa', matchPercent: 91, longevity: '7 - 9 Jam', sillage: '1.7 m' }
    ],
    local: [
      { id: 'tygar-ssc', name: 'Tiger Citrus Amber', brand: 'The Scent Supply Co', matchPercent: 92, longevity: '7 - 9 Jam', sillage: '1.8 m' }
    ]
  },
  'creed aventus': {
    target: 'Creed Aventus',
    arab: [
      { id: 'cdnim', name: 'Club de Nuit Intense Man', brand: 'Armaf', matchPercent: 94, longevity: '9 - 12 Jam', sillage: '2.5 m', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4_UUUDGSTIvXgyR_LWr2H8R26dO3G2pDT_YFYThla2tsg8HD6JOSK3DoyTH0TIJ84Uf46F9ZocU-I_6oPw5ltkNJYDRQW-ToxMO9hszjvXsyNuaX_QcIm2Z-O_rfEKt_6BuW73PJFpI5VU651SOCdJWnUqux8rn5tcldlBKOwgEHzlSD0qWDQsYl9waKX1TRehkrWY9gqfJkRTh2jJQhJKloREzxEuE7GeQdrdfm0rJpfJOFIVUE6nw' },
      { id: 'supremacy-silver', name: 'Supremacy Silver', brand: 'Afnan', matchPercent: 90, longevity: '8 - 10 Jam', sillage: '2.0 m' },
      { id: 'laventure', name: "L'Aventure", brand: 'Al Haramain', matchPercent: 89, longevity: '7 - 9 Jam', sillage: '1.8 m' },
      { id: 'shaheen-silver', name: 'Shaheen Silver', brand: 'Lattafa', matchPercent: 88, longevity: '7 - 9 Jam', sillage: '1.7 m' },
      { id: 'insurrection-pure-ii', name: 'Insurrection II Pure', brand: 'Reyane Tradition', matchPercent: 85, longevity: '6 - 8 Jam', sillage: '1.5 m' },
      { id: 'extra-dupe-6', name: 'Aventus Clone 6', brand: 'Armaf', matchPercent: 82, longevity: '6 Jam', sillage: '1.2 m' }
    ],
    local: [
      { id: 'aventus-ssc', name: 'Smoky Pineapple Birch', brand: 'The Scent Supply Co', matchPercent: 91, longevity: '7 - 9 Jam', sillage: '1.9 m' }
    ]
  },
  "kilian angels' share": {
    target: "Kilian Angels' Share",
    arab: [
      { id: 'khamrah', name: 'Khamrah', brand: 'Lattafa', matchPercent: 93, longevity: '10 - 14 Jam', sillage: '2.5 m', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOyxjhFy3ptNS0lmhonwEkK5ZukLhjoRpzDRR2tG1Ik0KsytaP5OaY4irqDopFcY0ivQRkxDUPblXP3ykkSyymJGNFh74YGPV_XDJPwHd4o-l_0aC0wU_7KXyvjA8GxgjvaPP8xZHlP9P_FZ5WZAXJzaOVteYMbK7pQgcOZ067qyoxRhTecqr8jo5VSKpjjXruPh9z0ft9v8vHrUszpfRaxswr29GA_qtA5IhV-h018eIW7W7-Ozn58w' },
      { id: 'cocktail-intense', name: 'Cocktail Intense', brand: 'Fragrance World', matchPercent: 90, longevity: '8 - 10 Jam', sillage: '2.0 m' },
      { id: 'kismet-angel', name: 'Kismet Angel', brand: 'Maison Alhambra', matchPercent: 89, longevity: '8 - 10 Jam', sillage: '1.8 m' }
    ],
    local: [
      { id: 'sweet-dates-ssc', name: 'Sweet Dates & Cognac', brand: 'The Scent Supply Co', matchPercent: 88, longevity: '7 - 9 Jam', sillage: '1.7 m' }
    ]
  },
  'ysl babycat': {
    target: 'YSL Babycat',
    arab: [
      { id: 'rifaaqat', name: 'Rifaaqat', brand: 'Paris Corner', matchPercent: 93, longevity: '9 - 11 Jam', sillage: '2.2 m' },
      { id: 'bobcat', name: 'Bobcat', brand: 'Maison Alhambra', matchPercent: 90, longevity: '8 - 10 Jam', sillage: '2.0 m' }
    ],
    local: [
      { id: 'wild-vanilla-suede', name: 'Wild Vanilla Suede', brand: 'The Scent Supply Co', matchPercent: 89, longevity: '7 - 9 Jam', sillage: '1.8 m' }
    ]
  },
  "prada l'homme": {
    target: "Prada L'Homme",
    arab: [
      { id: 'evoke-gold', name: 'Evoke Gold For Him', brand: 'Ajmal', matchPercent: 94, longevity: '7 - 9 Jam', sillage: '1.8 m' }
    ],
    local: [
      { id: 'clean-iris-amber', name: 'Clean Iris Amber', brand: 'The Scent Supply Co', matchPercent: 90, longevity: '7 - 8 Jam', sillage: '1.6 m' }
    ]
  },
  'jo malone wood sage & sea salt': {
    target: 'Jo Malone Wood Sage & Sea Salt',
    arab: [
      { id: 'milestone', name: 'Club de Nuit Milestone', brand: 'Armaf', matchPercent: 88, longevity: '7 - 9 Jam', sillage: '1.8 m' }
    ],
    local: [
      { id: 'sea-salt-bergamot', name: 'Sea Salt & Bergamot', brand: 'The Scent Supply Co', matchPercent: 94, longevity: '6 - 8 Jam', sillage: '1.6 m' }
    ]
  },
  'zero-dupes-fragrance': {
    target: 'Rare Niche Elixir',
    arab: [],
    local: []
  }
};

/**
 * Canonical dupe resolution engine
 * Matches designer queries, enforces max 5 cap per section,
 * and generates required conditional notices.
 */
export function findDupes(designerQuery) {
  if (!designerQuery || !designerQuery.trim()) {
    return { status: 'empty', arab: [], local: [] };
  }

  const cleanQuery = designerQuery.toLowerCase().trim();

  // Find matching entry in database
  const matchKey = Object.keys(DUPE_DATABASE).find((k) =>
    k === cleanQuery || cleanQuery.includes(k) || k.includes(cleanQuery)
  );

  if (!matchKey) {
    return {
      status: 'not_found',
      arab: [],
      local: [],
      message: t('dupe.noDupesFound') || 'Tiada dupe dijumpai untuk wangian ini.'
    };
  }

  const entry = DUPE_DATABASE[matchKey];

  // Apply maximum 5 cap per section
  const arabDupes = (entry.arab || []).slice(0, 5);
  const localDupes = (entry.local || []).slice(0, 5);

  return {
    status: 'success',
    target: entry.target,
    arab: arabDupes,
    arabNotice: getDupeSectionNotice(arabDupes),
    local: localDupes,
    localNotice: getDupeSectionNotice(localDupes)
  };
}

/**
 * Returns dynamic bilingual section notice for dupe list counts.
 * E.g. "Hanya 3 dupe ditemui:" (BM) vs "Only 3 dupes found:" (EN).
 */
export function getDupeSectionNotice(list) {
  const count = Array.isArray(list) ? list.length : (typeof list === 'number' ? list : 0);
  if (count === 0) {
    return t('dupe.noDupesFound') || 'Tiada dupe dijumpai untuk wangian ini.';
  }
  if (count === 1) {
    return t('dupe.singleDupeFound') || (i18nService.getLanguage() === 'en' ? 'Only 1 dupe found:' : 'Hanya 1 dupe ditemui:');
  }
  if (count < 5) {
    return t('dupe.countFound', { count }) || (i18nService.getLanguage() === 'en' ? `Only ${count} dupes found:` : `Hanya ${count} dupe ditemui:`);
  }
  return t('dupe.topDupesFound') || (i18nService.getLanguage() === 'en' ? 'Top 5 dupes found:' : '5 dupe terbaik ditemui:');
}

let activeSearchQuery = '';

/**
 * Renders the Separated Dupe Finder View (#/dupe)
 * Strictly separates matches into 🇦🇪 Dupe Arab and 🇲🇾 Dupe Tempatan.
 * Strictly ZERO price elements (no RM, MYR, price comparisons, or savings amounts).
 */
export async function renderDupeView() {
  const hash = window.location.hash || '';
  if (hash.includes('?q=')) {
    const queryPart = hash.split('?q=')[1];
    activeSearchQuery = decodeURIComponent(queryPart || '').trim();
  } else {
    activeSearchQuery = '';
  }

  const allPerfumes = await perfumeService.getAllPerfumes();
  const dupeResult = findDupes(activeSearchQuery);

  // Dynamically integrate matching perfumes from Firestore / perfumeService
  const cleanQ = (activeSearchQuery || '').toLowerCase().trim();
  if (cleanQ) {
    const dynamicDupes = allPerfumes.filter(p => {
      if (!p.isDupe && !p.originalDesignerRef && !p.dupeOf) return false;
      const ref = (p.originalDesignerRef || p.dupeOf || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return ref.includes(cleanQ) || cleanQ.includes(ref) || name.includes(cleanQ);
    });

    if (dynamicDupes.length > 0) {
      if (dupeResult.status === 'not_found' || dupeResult.status === 'empty') {
        dupeResult.status = 'success';
        dupeResult.target = activeSearchQuery;
      }

      dynamicDupes.forEach(p => {
        const isLocal = (p.dupeCategory === 'MY') ||
          (!p.dupeCategory && (
            (p.origin || p.originCountry || '').toUpperCase() === 'MY' ||
            LOCAL_MALAYSIAN_BRANDS.some(b => (p.brand || '').toLowerCase().includes(b.toLowerCase()))
          ));
        const targetList = isLocal ? dupeResult.local : dupeResult.arab;

        if (!targetList.some(d => d.id === p.id)) {
          targetList.push({
            id: p.id,
            name: p.name,
            brand: p.brand,
            matchPercent: p.matchScore || p.matchPercent || 92,
            longevity: p.longevity || '8 - 10 Jam',
            sillage: p.sillageDistance || p.sillage || '2.0 m',
            imageUrl: p.imageUrl || p.image,
            origin: p.origin || p.originCountry || (isLocal ? 'MY' : 'Other')
          });
        }
      });

      dupeResult.arabNotice = getDupeSectionNotice(dupeResult.arab);
      dupeResult.localNotice = getDupeSectionNotice(dupeResult.local);
    }
  }

  const user = authService.getCurrentUser();
  const savedIds = Array.isArray(user?.savedPerfumes) ? user.savedPerfumes : [];

  // Helper to render individual dupe card
  const renderDupeCard = (dupe) => {
    const isLiked = savedIds.includes(dupe.id);
    const matchScore = dupe.matchPercent || dupe.matchScore || 90;
    const longevity = formatLongevity(dupe.longevity || '7 - 9 Jam');
    const sillage = dupe.sillage || dupe.sillageDistance || '1.8 m';
    const flaconImg = formatImageUrl(dupe.imageUrl) || DEFAULT_FLACON_PLACEHOLDER;

    return `
    <div class="neu-flat rounded-2xl p-2.5 sm:p-5 flex flex-col justify-between group hover:-translate-y-1 transition-all relative" data-id="${dupe.id}">
      <div>
        <!-- Recessed Image Cavity -->
        <div class="neu-inset rounded-xl p-2 sm:p-4 mb-2 sm:mb-3 flex items-center justify-center relative overflow-hidden h-28 sm:h-40">
          <div class="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10">
            <span class="neu-flat rounded-full px-1.5 sm:px-2.5 py-0.5 text-[8px] sm:text-[10px] font-headline text-atmospheric-blue font-bold">
              ${matchScore}% ${t('detail.dnaMatch') || 'Match'}
            </span>
          </div>

          <!-- Interactive Love Button (❤️ SVG) -->
          <button
            class="dupe-love-btn absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full neu-flat flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-20 cursor-pointer ${isLiked ? 'neu-inset' : ''}"
            data-id="${dupe.id}"
            title="${isLiked ? t('card.unlike') : t('card.like')}"
            type="button"
          >
            <svg class="w-3 h-3 sm:w-4 sm:h-4 transition-colors ${isLiked ? 'text-red-500 fill-current' : 'text-outline hover:text-red-500'}" viewBox="0 0 24 24" fill="${isLiked ? '#ef4444' : 'none'}" stroke="${isLiked ? '#ef4444' : 'currentColor'}" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>

          <img src="${flaconImg}" alt="${dupe.name}" class="h-20 sm:h-28 object-contain group-hover:scale-105 transition-transform duration-300" onerror="this.onerror=null; this.src='${DEFAULT_FLACON_PLACEHOLDER}';">
        </div>

        <!-- Brand & Details -->
        <div class="mb-0.5 sm:mb-1 text-[9px] sm:text-[10px] font-headline flex items-center justify-between gap-1">
          <span class="text-outline uppercase font-semibold tracking-wider truncate block">${dupe.brand}</span>
          ${dupe.origin ? `<span class="neu-inset px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-atmospheric-blue uppercase shrink-0">${dupe.origin}</span>` : ''}
        </div>

        <h3 class="font-headline text-xs sm:text-base text-deep-navy font-bold leading-snug mb-1 sm:mb-2 group-hover:text-atmospheric-blue transition-colors line-clamp-1" title="${dupe.name}">
          ${dupe.name}
        </h3>

        <!-- Match Score Badge -->
        <div class="inline-flex items-center gap-1 neu-inset px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-headline font-bold text-atmospheric-blue mb-2 sm:mb-3">
          <span class="material-symbols-outlined text-[10px] sm:text-xs">verified</span>
          <span>${t('dupe.matchLabel')} ${matchScore}%</span>
        </div>
      </div>

      <!-- Performance Specs (Longevity & Sillage) -->
      <div class="pt-2 sm:pt-3 border-t border-border-hairline space-y-1.5 sm:space-y-2">
        <div class="flex items-center justify-between text-[9px] sm:text-[11px] font-headline">
          <span class="text-on-surface-variant flex items-center gap-0.5 sm:gap-1 font-mono">
            <span class="material-symbols-outlined text-[10px] sm:text-xs text-atmospheric-blue">schedule</span>
            <span class="truncate">${longevity}</span>
          </span>
          <span class="text-on-surface-variant flex items-center gap-0.5 sm:gap-1 font-mono">
            <span class="material-symbols-outlined text-[10px] sm:text-xs text-atmospheric-blue">air</span>
            <span>${sillage}</span>
          </span>
        </div>

        <a href="#/detail/${dupe.id}" class="neu-button w-full py-1 sm:py-1.5 rounded-full font-headline text-[10px] sm:text-xs font-bold text-center text-deep-navy hover:text-atmospheric-blue block transition-colors active:scale-95 shadow-xs">
          ${t('dupe.viewDetail')}
        </a>
      </div>
    </div>
    `;
  };

  return `
  <div class="w-full px-4 md:px-8 pt-28 pb-16 max-w-max-width mx-auto space-y-10">
    <!-- Header & Search Input -->
    <div class="text-center max-w-3xl mx-auto space-y-4">
      <div class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full neu-inset text-xs font-headline text-atmospheric-blue uppercase font-bold">
        <span class="material-symbols-outlined text-xs">compare_arrows</span>
        <span>${t('dupe.engineBadge')}</span>
      </div>
      <h1 class="font-headline text-3xl sm:text-4xl md:text-5xl font-bold text-deep-navy tracking-tight">
        ${t('dupe.title')}
      </h1>
      <p class="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed">
        ${t('dupe.engineDesc')}
      </p>

      <!-- Search Input Form -->
      <form id="dupe-search-form" class="neu-inset rounded-full p-2 pl-5 flex items-center gap-3 mt-6 max-w-2xl mx-auto">
        <span class="material-symbols-outlined text-outline">search</span>
        <input
          id="dupe-search-input"
          value="${activeSearchQuery}"
          type="text"
          placeholder="${t('dupe.searchPlaceholder')}"
          class="w-full bg-transparent border-0 outline-none text-sm text-deep-navy font-body placeholder:text-outline"
        >
        <button type="submit" class="neu-button px-6 py-2.5 rounded-full font-headline text-xs font-bold text-deep-navy hover:text-atmospheric-blue transition-colors flex items-center gap-1 shrink-0 cursor-pointer">
          <span>${t('dupe.searchButton')}</span>
          <span class="material-symbols-outlined text-xs">arrow_forward</span>
        </button>
      </form>


    </div>

    <!-- Active Search Target Notice -->
    ${dupeResult.target ? `
      <div class="neu-flat rounded-2xl p-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-atmospheric-blue">target</span>
          <span class="font-headline text-sm text-deep-navy font-bold">${t('dupe.targetPerfume')}</span>
          <span class="neu-inset px-3 py-0.5 rounded-full font-headline text-xs text-atmospheric-blue font-bold">${dupeResult.target}</span>
        </div>
      </div>
    ` : ''}

    <!-- SECTION 1: 🇲🇾 Dupe Tempatan / Local Dupes -->
    <section class="space-y-4" id="local-dupe-section">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-hairline">
        <div class="flex items-center gap-2 sm:gap-2.5">
          <span class="inline-flex items-center shrink-0">${MALAYSIA_FLAG_ICON}</span>
          <h2 class="font-headline text-lg sm:text-xl md:text-2xl font-bold text-deep-navy tracking-tight">${t('dupe.localSection')}</h2>
        </div>
        <div class="text-xs font-mono text-on-surface-variant">
          ${getDupeSectionNotice(dupeResult.local)}
        </div>
      </div>

      ${dupeResult.local && dupeResult.local.length > 0 ? `
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-2">
          ${dupeResult.local.map(renderDupeCard).join('')}
        </div>
      ` : `
        <div class="neu-inset rounded-2xl p-8 text-center space-y-2">
          <p class="font-headline text-sm font-semibold text-on-surface-variant">
            ${t('dupe.noDupesFound')}
          </p>
        </div>
      `}
    </section>

    <!-- SECTION 2: 🌐 Other Dupes (International) -->
    <section class="space-y-4 pt-4" id="arab-dupe-section">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-hairline">
        <div class="flex items-center gap-2 sm:gap-2.5">
          <span class="inline-flex items-center text-xl shrink-0" aria-label="Globe">🌐</span>
          <h2 class="font-headline text-lg sm:text-xl md:text-2xl font-bold text-deep-navy tracking-tight">${t('dupe.arabSection')}</h2>
        </div>
        <div class="text-xs font-mono text-on-surface-variant">
          ${getDupeSectionNotice(dupeResult.arab)}
        </div>
      </div>

      ${dupeResult.arab && dupeResult.arab.length > 0 ? `
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-2">
          ${dupeResult.arab.map(renderDupeCard).join('')}
        </div>
      ` : `
        <div class="neu-inset rounded-2xl p-8 text-center space-y-2">
          <p class="font-headline text-sm font-semibold text-on-surface-variant">
            ${t('dupe.noDupesFound')}
          </p>
        </div>
      `}
    </section>
  </div>
  `;
}

/**
 * Attaches interactive listeners for DupeView.
 * Handles search submission, quick-chip clicks, and ❤️ love button toggles.
 */
export function attachDupeListeners() {
  // Search form submission
  document.getElementById('dupe-search-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('dupe-search-input');
    const val = input ? input.value.trim() : '';
    if (val) {
      window.location.hash = `#/dupe?q=${encodeURIComponent(val)}`;
    }
  });

  // Love button click handler on dupe cards
  document.querySelectorAll('.dupe-love-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (authService.isGuest()) {
        openAuthModal('login');
        return;
      }

      const perfumeId = btn.getAttribute('data-id');
      if (!perfumeId) return;

      try {
        const isNowLiked = await perfumeService.toggleSavePerfume(perfumeId);
        btn.classList.toggle('neu-inset', isNowLiked);
        btn.title = isNowLiked ? t('card.unlike') : t('card.like');
        const svg = btn.querySelector('svg');
        if (svg) {
          if (isNowLiked) {
            svg.setAttribute('fill', '#ef4444');
            svg.setAttribute('stroke', '#ef4444');
            svg.classList.add('text-red-500', 'fill-current');
            svg.classList.remove('text-outline');
          } else {
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            svg.classList.remove('text-red-500', 'fill-current');
            svg.classList.add('text-outline');
          }
        }
      } catch (err) {
        console.warn('[DupeView] Error toggling love:', err);
      }
    });
  });
}

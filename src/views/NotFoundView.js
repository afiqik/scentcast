import { t } from '../services/i18nService.js';

/**
 * Custom 404 Not Found View
 * Displays a Neumorphic card with a fragrance flask SVG icon,
 * bilingual error messaging, and navigation triggers to Home and Directory.
 *
 * @param {Object} [options={}]
 * @param {string} [options.type] - 'perfume' if triggered by a missing perfume ID
 * @param {string} [options.perfumeId] - The requested perfume ID if not found
 * @returns {string} HTML string
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderNotFoundView(options = {}) {
  const opts = options || {};
  const isPerfume = opts.type === 'perfume' || Boolean(opts.perfumeId);
  const title = isPerfume ? (t('notFound.perfumeNotFound') || 'Wangian Tidak Ditemui') : (t('notFound.title') || 'Halaman Tidak Ditemui');
  const desc = isPerfume
    ? (t('notFound.perfumeNotFoundDesc') || 'Wangian yang anda cari tiada dalam katalog kami atau telah dialihkan.')
    : (t('notFound.desc') || 'Haruman yang anda cari seolah-olah telah hilang ditiup bayu tropika. Halaman ini tidak wujud atau URL tidak tepat.');
  const backHomeLabel = t('notFound.backHome') || 'Kembali ke Laman Utama';
  const exploreDirLabel = t('notFound.exploreDirectory') || 'Terokai Direktori';

  return `
  <div id="not-found-view" class="w-full px-4 md:px-8 pt-28 pb-20 max-w-xl mx-auto text-center space-y-6">
    <div class="neu-flat rounded-3xl p-8 md:p-12 space-y-6">
      <!-- Neumorphic Fragrance Flask Cavity -->
      <div class="w-24 h-24 rounded-3xl neu-inset mx-auto flex items-center justify-center text-atmospheric-blue relative">
        <svg class="w-14 h-14 text-atmospheric-blue drop-shadow-sm" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <!-- Atomizer nozzle & actuator -->
          <rect x="27" y="6" width="10" height="7" rx="2" class="fill-atmospheric-blue/20 stroke-atmospheric-blue" />
          <path d="M32 6V3M27 3h10" />
          <!-- Flacon collar & neck -->
          <rect x="25" y="13" width="14" height="6" rx="1.5" class="fill-sunset-amber/20 stroke-sunset-amber" />
          <!-- Flacon glass shoulders and bottle body -->
          <path d="M21 19h22l7 9v26a4 4 0 01-4 4H18a4 4 0 01-4-4V28l7-9z" class="fill-atmospheric-blue/10 stroke-atmospheric-blue" />
          <!-- Fragrance liquid level -->
          <path d="M16 42c5-2 10 2 16 0s10-2 16 0" stroke-dasharray="2 2" class="stroke-sunset-amber" />
          <!-- Spray droplet particles -->
          <circle cx="46" cy="5" r="1" class="fill-atmospheric-blue stroke-none" />
          <circle cx="52" cy="9" r="1.5" class="fill-atmospheric-blue stroke-none" />
          <circle cx="49" cy="2" r="1" class="fill-sunset-amber stroke-none" />
        </svg>

        <!-- Minimalist 404 indicator badge -->
        <div class="absolute -bottom-1 -right-1 w-8 h-8 rounded-full neu-flat flex items-center justify-center text-sunset-amber font-mono font-bold text-xs">
          404
        </div>
      </div>

      <!-- Status Code Pill -->
      <div class="inline-block neu-inset px-4 py-1.5 rounded-full text-xs font-mono font-bold text-atmospheric-blue">
        404 • ${title}
      </div>

      <!-- Error Title & Description -->
      <div class="space-y-3">
        <h1 class="font-headline text-2xl sm:text-3xl font-bold text-deep-navy">
          ${title}
        </h1>
        <p class="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-md mx-auto">
          ${desc}
        </p>
        ${isPerfume && opts.perfumeId ? `
          <div class="pt-1">
            <span class="neu-inset px-3 py-1 rounded-full text-[11px] font-mono text-outline">
              ID: ${escapeHtml(opts.perfumeId)}
            </span>
          </div>
        ` : ''}
      </div>

      <!-- Navigation Actions -->
      <div class="pt-4 flex flex-wrap items-center justify-center gap-3">
        <a
          href="#/"
          class="neu-button px-6 py-3 rounded-full font-headline text-xs font-bold text-deep-navy hover:text-atmospheric-blue inline-flex items-center gap-2 transition-all cursor-pointer"
        >
          <span class="material-symbols-outlined text-sm">home</span>
          <span>${backHomeLabel}</span>
        </a>
        <a
          href="#/direktori"
          class="neu-button px-6 py-3 rounded-full font-headline text-xs font-bold text-atmospheric-blue hover:text-deep-navy inline-flex items-center gap-2 transition-all cursor-pointer"
        >
          <span class="material-symbols-outlined text-sm">explore</span>
          <span>${exploreDirLabel}</span>
        </a>
      </div>
    </div>
  </div>
  `;
}

/**
 * Event listener attacher for NotFoundView
 */
export function attachNotFoundListeners() {
  // Navigation anchors are declarative hash routes; no custom listeners required
}

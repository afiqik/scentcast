import { authService } from '../services/authService.js';
import { perfumeService } from '../services/perfumeService.js';
import { openAuthModal } from './AuthModal.js';
import { t, formatLongevity, translateNotes } from '../services/i18nService.js';
import { formatImageUrl, DEFAULT_FLACON_PLACEHOLDER } from '../services/storageService.js';
import { getPerfumeTimeSuitability } from '../services/weatherService.js';

/**
 * Reusable Perfume Card Component
 * Renders compact perfume card with flacon image, name, brand, gender badge,
 * accords, performance indicators, and interactive Love button (❤️ SVG).
 * Strictly ZERO price elements (no currency, budget).
 * Strictly ZERO long marketing descriptions.
 */
export function renderPerfumeCard(perfume, options = {}) {
  if (!perfume) return '';

  const user = authService.getCurrentUser();
  const isLiked = typeof options.isLiked === 'boolean'
    ? options.isLiked
    : (user?.savedPerfumes?.includes(perfume.id) || false);

  const gender = (perfume.gender || 'unisex').toLowerCase();
  const genderLabel = gender === 'male' ? t('card.genderMale') : gender === 'female' ? t('card.genderFemale') : t('card.genderUnisex');

  const timeSuit = perfume.timeSuitability || getPerfumeTimeSuitability(perfume);
  const timeBadgeClass = timeSuit === 'Day'
    ? 'text-amber-500'
    : timeSuit === 'Night'
    ? 'text-indigo-400'
    : 'text-atmospheric-blue';
  const timeBadgeIcon = timeSuit === 'Day' ? 'wb_sunny' : timeSuit === 'Night' ? 'dark_mode' : 'all_inclusive';
  const timeBadgeTitle = timeSuit === 'Versatile' ? 'Versatile (Day & Night)' : timeSuit;

  // Accords extraction (up to 3 tags)
  const accordTags = [];
  if (Array.isArray(perfume.mainAccords) && perfume.mainAccords.length > 0) {
    perfume.mainAccords.slice(0, 3).forEach(a => accordTags.push(a.name));
  } else if (Array.isArray(perfume.accords) && perfume.accords.length > 0) {
    perfume.accords.slice(0, 3).forEach(a => {
      accordTags.push(typeof a === 'string' ? a : a.name);
    });
  }

  // Performance metrics (clean pills)
  const longevity = formatLongevity(perfume.longevity || '8 - 10 Hours');
  const sillage = perfume.sillageDistance || perfume.sillage || '2.0 m';
  const rating = perfume.rating !== undefined && perfume.rating !== null ? Number(perfume.rating) : 0;
  const shopeeUrl = perfume.shopeeUrl || `https://shopee.com.my/search?keyword=${encodeURIComponent(perfume.name || '')}`;
  const otherUrl = perfume.tiktokUrl || perfume.otherUrl || `https://www.google.com/search?q=${encodeURIComponent((perfume.brand || '') + ' ' + (perfume.name || '') + ' official')}`;
  const hasOtherUrl = Boolean(perfume.tiktokUrl || perfume.otherUrl);

  // Fragrance notes localized for active language
  const rawNotes = perfume.notes?.top || perfume.topNotes || perfume.notes;
  const notes = rawNotes
    ? translateNotes(Array.isArray(rawNotes) ? rawNotes.slice(0, 2).join(', ') : rawNotes)
    : '';

  return `
  <div class="perfume-card neu-flat rounded-2xl p-2.5 sm:p-4 flex flex-col justify-between group hover:-translate-y-1 transition-all cursor-pointer relative" data-id="${perfume.id}" ${notes ? `data-notes="${notes}"` : ''}>
    <div>
      <!-- Recessed Image Cavity -->
      <div class="neu-inset rounded-xl p-2 sm:p-4 mb-2 sm:mb-3 flex items-center justify-center relative overflow-hidden h-28 sm:h-44">
        <!-- Time Suitability Badge only (EDP/EDT badge removed) -->
        <div class="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex items-center gap-1 z-10 flex-wrap">
          <span class="neu-flat rounded-full px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-headline ${timeBadgeClass} font-bold inline-flex items-center gap-0.5" title="${timeBadgeTitle}">
            <span class="material-symbols-outlined text-[9px] sm:text-[10px]">${timeBadgeIcon}</span>
            <span>${timeSuit}</span>
          </span>
        </div>

        <!-- Interactive Love Button (❤️ SVG) -->
        <button
          class="love-toggle-btn absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full neu-flat flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-20 cursor-pointer ${isLiked ? 'neu-inset' : ''}"
          data-id="${perfume.id}"
          title="${isLiked ? t('card.unlike') : t('card.like')}"
          type="button"
        >
          <svg class="w-3 h-3 sm:w-4 sm:h-4 transition-colors ${isLiked ? 'text-red-500 fill-current' : 'text-outline hover:text-red-500'}" viewBox="0 0 24 24" fill="${isLiked ? '#ef4444' : 'none'}" stroke="${isLiked ? '#ef4444' : 'currentColor'}" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        </button>

        <!-- Flacon Bottle Image -->
        <img src="${formatImageUrl(perfume.imageUrl) || DEFAULT_FLACON_PLACEHOLDER}" alt="${perfume.name}" class="h-20 sm:h-32 object-contain group-hover:scale-105 transition-transform duration-300" onerror="this.onerror=null; this.src='${DEFAULT_FLACON_PLACEHOLDER}';">
      </div>

      <!-- Brand & Gender Classification -->
      <div class="flex items-center justify-between mb-0.5 sm:mb-1 text-[9px] sm:text-[10px] font-headline">
        <span class="text-outline uppercase font-semibold tracking-wider truncate max-w-[65px] sm:max-w-[140px]">${perfume.brand}</span>
        <span class="neu-inset px-1.5 sm:px-2 py-0.5 rounded-full text-atmospheric-blue font-bold text-[8px] sm:text-[10px]">${genderLabel}</span>
      </div>

      <!-- Perfume Name -->
      <h3 class="font-headline text-xs sm:text-sm md:text-base text-deep-navy font-bold leading-snug mb-1 sm:mb-2 group-hover:text-atmospheric-blue transition-colors line-clamp-1" title="${perfume.name}">
        ${perfume.name}
      </h3>

      <!-- Accords / Scent Profile Tags -->
      <div class="flex flex-wrap gap-1 mb-2 sm:mb-3">
        ${accordTags.map(tag => `
          <span class="neu-inset px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-mono text-on-surface-variant font-medium">
            ${tag}
          </span>
        `).join('')}
      </div>
    </div>

    <!-- Bottom Section: Performance Pills, E-Commerce Links & Detail Link -->
    <div class="pt-2 border-t border-border-hairline space-y-1.5 sm:space-y-2.5">
      <div class="flex items-center justify-between text-[9px] sm:text-[11px] font-headline">
        <span class="text-on-surface-variant flex items-center gap-0.5 sm:gap-1 font-mono">
          <span class="material-symbols-outlined text-[10px] sm:text-xs text-atmospheric-blue">schedule</span>
          <span class="truncate">${longevity}</span>
        </span>
        <span class="text-on-surface-variant flex items-center gap-0.5 sm:gap-1 font-mono">
          <span class="material-symbols-outlined text-[10px] sm:text-xs text-atmospheric-blue">air</span>
          <span class="truncate">${sillage}</span>
        </span>
      </div>

      <!-- E-Commerce Branded Buttons (Shopee & TikTok Shop) -->
      <div class="flex flex-wrap gap-2 pt-0.5">
        <a
          href="${shopeeUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="shopee-card-btn flex-1 min-w-[90px] flex items-center justify-center gap-1 sm:gap-1.5 py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-lg sm:rounded-xl bg-[#ee4d2d] text-white text-[9px] sm:text-[11px] font-headline font-bold hover:brightness-110 active:scale-95 transition-all text-center shadow-sm"
          title="Shopee"
        >
          <svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M19.5 7.5h-2.25V6a5.25 5.25 0 00-10.5 0v1.5H4.5A1.5 1.5 0 003 9v11.25A2.25 2.25 0 005.25 22.5h13.5A2.25 2.25 0 0021 20.25V9a1.5 1.5 0 00-1.5-1.5zm-10.5-1.5a3.75 3.75 0 017.5 0v1.5h-7.5V6zm10.5 14.25a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75h15v10.5z"/>
          </svg>
          <span>Shopee</span>
        </a>
        <a
          href="${otherUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="other-link-card-btn flex-1 min-w-[90px] flex items-center justify-center gap-1 sm:gap-1.5 py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-lg sm:rounded-xl bg-atmospheric-blue text-white text-[9px] sm:text-[11px] font-headline font-bold hover:brightness-110 active:scale-95 transition-all text-center shadow-sm"
          title="${hasOtherUrl ? 'Official Website / Other Link' : 'Search Online'}"
        >
          <svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-none stroke-current shrink-0" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span>Others</span>
        </a>
      </div>

      <a href="#/detail/${perfume.id}" class="perfume-detail-link neu-button w-full py-1 sm:py-1.5 rounded-full font-headline text-[10px] sm:text-xs font-bold text-center text-deep-navy hover:text-atmospheric-blue block transition-colors active:scale-95 shadow-xs">
        ${t('card.viewDetails')}
      </a>
    </div>
  </div>
  `;
}

/**
 * Attach interactive listeners for rendered Perfume Cards.
 * Handles love toggle (with guest login gate) and whole-card navigation.
 */
export function attachPerfumeCardListeners(container = document, onToggle = null) {
  // Real-time live card image sync across views without manual refresh
  if (typeof window !== 'undefined' && !window.__perfumeCardLiveSyncAttached) {
    window.__perfumeCardLiveSyncAttached = true;
    window.addEventListener('scentcast:perfumeUpdated', (e) => {
      const id = e.detail?.id || e.detail?.perfume?.id;
      const imageUrl = e.detail?.imageUrl || e.detail?.perfume?.imageUrl;
      if (id && imageUrl) {
        document.querySelectorAll(`.perfume-card[data-id="${id}"] img, [data-perfume-id="${id}"] img`).forEach(img => {
          if (img) img.src = imageUrl;
        });
      }
    });
  }

  // Love button click handler
  container.querySelectorAll('.love-toggle-btn').forEach(btn => {
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

        // Optimistic DOM update of the clicked button
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

        if (typeof onToggle === 'function') {
          onToggle(perfumeId, isNowLiked);
        }
      } catch (err) {
        console.warn('[PerfumeCard] Error toggling love:', err);
      }
    });
  });

  // E-commerce store buttons click handler (prevent bubbling)
  container.querySelectorAll('.shopee-card-btn, .other-link-card-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });

  // Clicking card body navigates to detail view
  container.querySelectorAll('.perfume-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.love-toggle-btn') || e.target.closest('a')) {
        return;
      }
      const id = card.getAttribute('data-id');
      if (id) {
        window.location.hash = `#/detail/${id}`;
      }
    });
  });
}

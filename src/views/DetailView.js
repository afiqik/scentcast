import { perfumeService, calculatePerfumeRating } from '../services/perfumeService.js';
import { authService } from '../services/authService.js';
import { openAuthModal } from '../components/AuthModal.js';
import { renderPerfumeCard, attachPerfumeCardListeners } from '../components/PerfumeCard.js';
import { t, formatLongevity as formatLongevityHelper, translateNote, translateNotes } from '../services/i18nService.js';
import { renderDetailSkeleton } from '../components/SkeletonLoader.js';
import { renderNotFoundView } from './NotFoundView.js';
import { formatImageUrl, DEFAULT_FLACON_PLACEHOLDER } from '../services/storageService.js';
import { getPerfumeTimeSuitability } from '../services/weatherService.js';

let activePerfumeId = 'turathi-blue';
let activePerfume = null;
let commentsUnsubscribe = null;
let currentComments = [];
let editingCommentId = null;
let replyBoxCommentId = null;
let selectedStarRating = 5;

/**
 * Returns distinct olfactory theme colors for Fragrantica-style stacked accord bars
 */
export function getAccordColor(name) {
  const n = (name || '').toLowerCase().trim();
  if (n.includes('citrus') || n.includes('lemon') || n.includes('bergamot') || n.includes('orange')) {
    return { bg: '#eab308', text: '#ffffff' }; // Yellow/Citrus
  }
  if (n.includes('woody') || n.includes('wood') || n.includes('cedar') || n.includes('sandalwood') || n.includes('vetiver')) {
    return { bg: '#854d0e', text: '#ffffff' }; // Earthy Brown
  }
  if (n.includes('warm spicy') || n.includes('cinnamon') || n.includes('nutmeg') || n.includes('clove')) {
    return { bg: '#dc2626', text: '#ffffff' }; // Warm Spicy Red
  }
  if (n.includes('fresh spicy') || n.includes('cardamom') || n.includes('pepper') || n.includes('ginger')) {
    return { bg: '#16a34a', text: '#ffffff' }; // Fresh Herbal Green
  }
  if (n.includes('aquatic') || n.includes('marine') || n.includes('sea') || n.includes('ocean') || n.includes('ozonic')) {
    return { bg: '#0284c7', text: '#ffffff' }; // Marine Azure Blue
  }
  if (n.includes('aromatic') || n.includes('herbal') || n.includes('lavender') || n.includes('rosemary')) {
    return { bg: '#0f766e', text: '#ffffff' }; // Aromatic Deep Teal
  }
  if (n.includes('amber') || n.includes('oriental') || n.includes('balsamic') || n.includes('resinous')) {
    return { bg: '#d97706', text: '#ffffff' }; // Golden Amber
  }
  if (n.includes('vanilla') || n.includes('sweet') || n.includes('gourmand') || n.includes('caramel') || n.includes('tonka')) {
    return { bg: '#be185d', text: '#ffffff' }; // Sweet Magenta
  }
  if (n.includes('fruity') || n.includes('apple') || n.includes('peach') || n.includes('berry') || n.includes('pineapple')) {
    return { bg: '#ea580c', text: '#ffffff' }; // Fruity Coral Orange
  }
  if (n.includes('leather') || n.includes('smoky') || n.includes('tobacco') || n.includes('smoke') || n.includes('incense')) {
    return { bg: '#451a03', text: '#ffffff' }; // Dark Saddle Brown
  }
  if (n.includes('floral') || n.includes('rose') || n.includes('jasmine') || n.includes('white floral') || n.includes('neroli')) {
    return { bg: '#ec4899', text: '#ffffff' }; // Floral Pink
  }
  if (n.includes('musky') || n.includes('musk') || n.includes('powdery')) {
    return { bg: '#64748b', text: '#ffffff' }; // Powdery Slate
  }
  if (n.includes('green') || n.includes('earthy') || n.includes('mossy') || n.includes('patchouli')) {
    return { bg: '#4d7c0f', text: '#ffffff' }; // Moss / Forest Green
  }
  return { bg: '#0369a1', text: '#ffffff' };
}

export function formatLongevity(val) {
  return formatLongevityHelper(val);
}


export function translateWhenToWearItem(item) {
  if (!item || typeof item !== 'string') return item || '';
  const lower = item.toLowerCase().trim();
  if (lower === 'versatile' || lower === 'versatil' || lower.includes('day & night') || lower.includes('siang & malam') || lower.includes('day and night')) return t('detail.timeVersatile');
  if (lower === 'siang' || lower === 'day') return t('detail.timeDay');
  if (lower === 'malam' || lower === 'night') return t('detail.timeNight');
  if (lower === 'pejabat' || lower === 'office') return t('detail.occasionOffice');
  if (lower.includes('panas') || lower.includes('outdoor')) return t('detail.occasionOutdoor');
  if (lower === 'kasual' || lower === 'casual') return t('detail.occasionCasual');
  if (lower.includes('tahun') || lower.includes('year')) return t('detail.allYearRound');
  return item;
}

/**
 * Dynamically renders 5 star icons based on numeric rating (0.0 to 5.0)
 */
export function renderStarsHtml(ratingNum = 0) {
  const r = Math.max(0, Math.min(5, Number(ratingNum) || 0));
  let starsHtml = '';
  for (let i = 1; i <= 5; i++) {
    if (r >= i) {
      starsHtml += '<span class="material-symbols-outlined text-sm fill-1 text-sunset-amber">star</span>';
    } else if (r >= i - 0.5) {
      starsHtml += '<span class="material-symbols-outlined text-sm fill-1 text-sunset-amber">star_half</span>';
    } else {
      starsHtml += '<span class="material-symbols-outlined text-sm text-outline/40">star</span>';
    }
  }
  return starsHtml;
}

export function updateRatingUI(perfumeObj, commentsList) {
  const targetPerfume = perfumeObj || activePerfume;
  const targetComments = commentsList || currentComments;
  const { rating: dynRating, ratingNum: dynRatingNum, reviewCount: dynCount } = calculatePerfumeRating(targetPerfume, targetComments);
  const ratingValEl = document.getElementById('perfume-rating-value');
  const ratingStarsEl = document.getElementById('perfume-rating-stars');
  const ratingCountEl = document.getElementById('perfume-rating-count');
  const commentsBtnLabelEl = document.getElementById('detail-comments-count-label');

  if (ratingValEl) ratingValEl.textContent = dynRating;
  if (ratingStarsEl) ratingStarsEl.innerHTML = renderStarsHtml(dynRatingNum);
  if (ratingCountEl) ratingCountEl.textContent = `(${dynCount} ${t('detail.reviews')})`;
  if (commentsBtnLabelEl) commentsBtnLabelEl.textContent = `${t('comments.communityReviews')} (${dynCount})`;
}

export async function renderDetailView(perfumeId = 'turathi-blue') {
  activePerfumeId = perfumeId;
  currentComments = [];

  // Mount skeleton loading placeholder while fetching data asynchronously
  if (typeof document !== 'undefined') {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.innerHTML = renderDetailSkeleton();
    }
  }

  const perfume = await perfumeService.getPerfumeById(perfumeId);
  if (!perfume) {
    if (typeof window !== 'undefined' && window.location) {
      const redirectUrl = '#/404?type=perfume&id=' + encodeURIComponent(perfumeId);
      if (typeof window.location.replace === 'function') {
        window.location.replace(redirectUrl);
      } else {
        window.location.hash = redirectUrl;
      }
    }
    return renderNotFoundView({ type: 'perfume', perfumeId });
  }
  activePerfume = perfume;

  const allPerfumes = await perfumeService.getAllPerfumes();
  const user = authService.getCurrentUser();
  const isGuest = authService.isGuest();

  // Fresh Firestore saved check for 100% accuracy
  let savedIds = Array.isArray(user?.savedPerfumes)
    ? user.savedPerfumes.map((id) => (typeof id === 'object' && id !== null ? id.id : String(id)))
    : [];
  if (user && user.uid) {
    try {
      const remoteObjs = await perfumeService.getSavedPerfumes(user.uid);
      if (Array.isArray(remoteObjs)) {
        savedIds = remoteObjs.map((p) => p.id);
        user.savedPerfumes = savedIds;
      }
    } catch (e) {
      console.warn(e);
    }
  }

  // Pre-load comments once for accurate initial render
  const initialCommentsList = await perfumeService.getCommentsOnce(perfumeId);
  currentComments = (initialCommentsList || []).map((c) => ({
    ...c,
    text: sanitizeCommentText(c.text),
    replies: Array.isArray(c.replies)
      ? c.replies.map((r) => ({ ...r, text: sanitizeCommentText(r.text) }))
      : []
  }));

  const { rating, ratingNum, reviewCount } = calculatePerfumeRating(perfume, currentComments);

  // Setup live Firestore listener for comments
  if (commentsUnsubscribe) {
    commentsUnsubscribe();
    commentsUnsubscribe = null;
  }
  commentsUnsubscribe = await perfumeService.getComments(perfumeId, (comments) => {
    currentComments = (comments || []).map((c) => ({
      ...c,
      text: sanitizeCommentText(c.text),
      replies: Array.isArray(c.replies)
        ? c.replies.map((r) => ({ ...r, text: sanitizeCommentText(r.text) }))
        : []
    }));
    updateRatingUI(perfume, currentComments);
    const commentsListEl = document.getElementById('comments-list-container');
    if (commentsListEl) {
      commentsListEl.innerHTML = renderCommentsList(perfume, user, isGuest);
      attachCommentItemListeners(perfume);
    }
  });

  const isSaved = savedIds.includes(perfume.id);
  const gender = (perfume.gender || 'unisex').toLowerCase();
  const genderLabel = gender === 'male' ? t('detail.genderMen') : gender === 'female' ? t('detail.genderWomen') : t('detail.genderUnisex');

  // Section 2 Accords calculation (sorted descending by percentage for Fragrantica style)
  const rawAccords = (Array.isArray(perfume.mainAccords) && perfume.mainAccords.length > 0)
    ? perfume.mainAccords
    : (perfume.accords || ['Citrus', 'Woody', 'Fresh']).map((a, idx) => ({
        name: typeof a === 'string' ? a : a.name,
        percentage: Math.max(30, 95 - idx * 15)
      }));

  const accordsData = rawAccords
    .map(item => ({
      name: typeof item === 'string' ? item : item.name,
      percentage: typeof item === 'object' ? (item.percentage || item.percent || 75) : 75
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Section 3 Notes
  const rawTopNotes = perfume.notes?.top || ['Bergamot', 'Mandarin Orange'];
  const rawMidNotes = perfume.notes?.mid || ['Woody Notes', 'Amber'];
  const rawBaseNotes = perfume.notes?.base || ['Musk', 'Patchouli'];

  const topNotes = rawTopNotes.map(n => translateNote(n));
  const midNotes = rawMidNotes.map(n => translateNote(n));
  const baseNotes = rawBaseNotes.map(n => translateNote(n));

  // Section 4 Performance metrics
  const longevity = perfume.longevity || '8 - 10 Hours';
  const sillage = perfume.sillageDistance || perfume.sillage || '2.0 m';

  // Section 5 When To Wear structured recommendations
  const rawTimes = perfume?.whenToWear?.time;
  const whenToWearTimes = Array.isArray(rawTimes) && rawTimes.length > 0
    ? rawTimes
    : (typeof rawTimes === 'string' && rawTimes.trim() ? rawTimes.split(',').map(s => s.trim()).filter(Boolean) : [getPerfumeTimeSuitability(perfume)]);

  const rawOccasions = perfume.whenToWear?.occasions || perfume.whenToWear?.occasion;
  const whenToWearOccasions = Array.isArray(rawOccasions) && rawOccasions.length > 0
    ? rawOccasions
    : (typeof rawOccasions === 'string' && rawOccasions.trim() ? rawOccasions.split(',').map(s => s.trim()).filter(Boolean) : ['Pejabat', 'Luar Panas Lembap', 'Kasual']);

  const rawSeason = perfume.whenToWear?.season || perfume.whenToWear?.weather;
  const whenToWearSeasonList = Array.isArray(rawSeason) && rawSeason.length > 0
    ? rawSeason
    : (typeof rawSeason === 'string' && rawSeason.trim() ? rawSeason.split(',').map(s => s.trim()).filter(Boolean) : [t('detail.allYearRound')]);

  // Section 7 Brand Carousel items: strictly exclude current perfume ID
  const brandPerfumes = allPerfumes.filter(p =>
    (p.brand || '').toLowerCase() === (perfume.brand || '').toLowerCase() && p.id !== perfume.id
  );

  return `
  <div class="w-full px-4 md:px-8 pt-28 pb-16 max-w-max-width mx-auto space-y-10">
    <!-- Breadcrumbs navigation -->
    <nav class="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
      <a href="#/direktori" class="hover:text-atmospheric-blue transition-colors">${t('nav.directory')}</a>
      <span>/</span>
      <span>${perfume.brand}</span>
      <span>/</span>
      <span class="text-deep-navy font-bold">${perfume.name}</span>
    </nav>

    <!-- ======================================================== -->
    <!-- 1. HEADER WANGIAN: Image + Name + Brand • Gender + ❤️ SVG -->
    <!-- ======================================================== -->
    <section id="header-section" class="header-section neu-flat rounded-3xl p-6 md:p-10 space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <!-- Bottle Flacon Cavity -->
        <div class="lg:col-span-5 flex justify-center">
          <div class="neu-inset rounded-3xl p-8 flex flex-col items-center justify-center relative aspect-square w-full max-w-sm">
            <div class="absolute top-4 left-4 neu-flat rounded-full px-3 py-1 flex items-center gap-1 text-xs font-headline font-bold text-deep-navy">
              <span class="material-symbols-outlined text-sunset-amber text-xs fill-1">verified</span>
              <span>${t('detail.cloneOf', { ref: perfume.originalDesignerRef || t('detail.original') })}</span>
            </div>
            <div class="absolute top-4 right-4 neu-flat rounded-full px-3 py-1 text-xs font-mono font-bold text-atmospheric-blue">
              ${perfume.type || 'EDP'}
            </div>

            <img
              src="${formatImageUrl(perfume.imageUrl) || DEFAULT_FLACON_PLACEHOLDER}"
              alt="${perfume.name}"
              class="w-4/5 h-4/5 object-contain hover:scale-105 transition-transform duration-500"
              onerror="this.onerror=null; this.src='${DEFAULT_FLACON_PLACEHOLDER}';"
            />
          </div>
        </div>

        <!-- Details & Interactive Love Button -->
        <div class="lg:col-span-7 flex flex-col space-y-6">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="neu-inset px-3 py-1 rounded-full text-xs font-headline text-atmospheric-blue font-bold uppercase tracking-wider">
                ${perfume.brand}
              </span>
              <span class="text-outline text-xs">•</span>
              <span class="neu-inset px-3 py-1 rounded-full text-xs font-headline text-deep-navy font-semibold">
                ${genderLabel}
              </span>
              <span class="text-outline text-xs">•</span>
              <span class="text-xs text-on-surface-variant font-headline font-medium">
                ${perfume.origin || t('detail.tropicalCollection')}
              </span>
            </div>

            <h1 class="font-headline text-3xl md:text-4xl font-bold text-deep-navy tracking-tight leading-tight">
              ${perfume.name}
            </h1>
          </div>

          <!-- Community Rating & DNA Summary -->
          <div class="flex flex-wrap items-center gap-4">
            <div id="perfume-rating-container" class="neu-inset rounded-2xl px-4 py-2.5 flex items-center gap-2">
              <span id="perfume-rating-value" class="font-headline text-xl font-bold text-deep-navy">${rating}</span>
              <div id="perfume-rating-stars" class="flex text-sunset-amber text-sm items-center">
                ${renderStarsHtml(ratingNum)}
              </div>
              <span id="perfume-rating-count" class="text-xs text-on-surface-variant font-mono">(${reviewCount} ${t('detail.reviews')})</span>
            </div>

            ${perfume.matchPercentage ? `
              <div class="neu-inset rounded-2xl px-4 py-2.5 flex items-center gap-1.5 text-xs font-headline">
                <span class="text-outline">${t('detail.dnaMatch')}:</span>
                <span class="text-sunset-amber font-bold">${perfume.matchPercentage}% vs ${perfume.originalDesignerRef}</span>
              </div>
            ` : ''}
          </div>

          <!-- Interactive Love Button (❤️ SVG) & E-Commerce Branded Buttons -->
          <div class="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="detail-love-btn"
              class="detail-love-toggle-btn neu-button px-5 py-3 rounded-full font-headline text-xs md:text-sm font-bold text-deep-navy hover:text-atmospheric-blue flex items-center gap-2 transition-all cursor-pointer ${isSaved ? 'neu-inset' : ''}"
              data-id="${perfume.id}"
              type="button"
            >
              <svg class="w-5 h-5 transition-colors ${isSaved ? 'text-red-500 fill-current' : 'text-outline hover:text-red-500'}" viewBox="0 0 24 24" fill="${isSaved ? '#ef4444' : 'none'}" stroke="${isSaved ? '#ef4444' : 'currentColor'}" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
              <span id="detail-love-label">${isSaved ? t('detail.savedInCollection') : t('detail.saveToCollection')} (❤️)</span>
            </button>

            <!-- Shopee Branded Purchase Button -->
            <a
              href="${perfume.shopeeUrl || `https://shopee.com.my/search?keyword=${encodeURIComponent(perfume.name || '')}`}"
              target="_blank"
              rel="noopener noreferrer"
              class="shopee-buy-btn flex-1 sm:flex-none min-w-[140px] px-5 py-3 rounded-full bg-[#ee4d2d] text-white font-headline text-xs md:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-95 transition-all text-center"
              title="${t('detail.buyShopee')}"
            >
              <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M19.5 7.5h-2.25V6a5.25 5.25 0 00-10.5 0v1.5H4.5A1.5 1.5 0 003 9v11.25A2.25 2.25 0 005.25 22.5h13.5A2.25 2.25 0 0021 20.25V9a1.5 1.5 0 00-1.5-1.5zm-10.5-1.5a3.75 3.75 0 017.5 0v1.5h-7.5V6zm10.5 14.25a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75h15v10.5z"/>
              </svg>
              <span>${t('detail.buyShopee')}</span>
            </a>

            <!-- Others / Official Website Purchase Button -->
            <a
              href="${perfume.tiktokUrl || perfume.otherUrl || `https://www.google.com/search?q=${encodeURIComponent((perfume.brand || '') + ' ' + (perfume.name || '') + ' official')}`}"
              target="_blank"
              rel="noopener noreferrer"
              class="others-buy-btn flex-1 sm:flex-none min-w-[140px] px-5 py-3 rounded-full bg-atmospheric-blue text-white font-headline text-xs md:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-95 transition-all text-center"
              title="${t('detail.buyOthers')}"
            >
              <svg class="w-4 h-4 fill-none stroke-current shrink-0" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span>${t('detail.buyOthers')}</span>
            </a>

            <button
              id="scroll-to-comments-btn"
              class="px-5 py-3 rounded-full neu-button text-deep-navy font-headline text-xs md:text-sm font-bold flex items-center gap-2 hover:text-atmospheric-blue transition-all cursor-pointer"
              type="button"
            >
              <span class="material-symbols-outlined text-base">forum</span>
              <span id="detail-comments-count-label">${t('comments.communityReviews')} (${reviewCount})</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================================================== -->
    <!-- 2. MAIN ACCORDS: Fragrantica-Style Vertical Stacked Bars  -->
    <!-- ======================================================== -->
    <section id="accords-section" class="accords-section neu-flat rounded-3xl p-6 md:p-8 space-y-4">
      <div class="flex items-center gap-2 border-b border-border-hairline pb-3">
        <span class="material-symbols-outlined text-atmospheric-blue text-xl">tune</span>
        <h2 class="font-headline text-lg md:text-xl font-bold text-deep-navy">
          ${t('detail.mainAccords')}
        </h2>
      </div>

      <div class="flex flex-col space-y-2 max-w-2xl mx-auto pt-2">
        ${accordsData.map(item => {
          const color = getAccordColor(item.name);
          return `
            <div class="w-full bg-slate-100/80 dark:bg-slate-800/40 rounded-xl overflow-hidden h-9 relative p-0.5 neu-inset">
              <div
                class="h-full rounded-lg flex items-center px-4 transition-all duration-700 shadow-sm"
                style="width: ${Math.max(22, item.percentage)}%; background-color: ${color.bg}; color: ${color.text};"
              >
                <span class="font-headline text-xs sm:text-sm font-bold tracking-wide capitalize truncate drop-shadow-sm">${item.name}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>

    <!-- ======================================================== -->
    <!-- 3. FRAGRANCE COMPOSITION: 3 Clean Cards (Top / Mid / Base) -->
    <!-- ======================================================== -->
    <section id="composition-section" class="composition-section neu-flat rounded-3xl p-6 md:p-8 space-y-4">
      <div class="flex items-center gap-2 border-b border-border-hairline pb-3">
        <span class="material-symbols-outlined text-atmospheric-blue text-xl">science</span>
        <h2 class="font-headline text-lg md:text-xl font-bold text-deep-navy">
          ${t('detail.composition')}
        </h2>
      </div>

      <!-- Clean Fragrance Composition without time badges (t('detail.topPhase'), t('detail.midPhase'), t('detail.basePhase') removed for clean mobile & laptop display) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <!-- Top Notes Card -->
        <div class="composition-tier-card neu-inset rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-1.5 text-atmospheric-blue">
                <span class="material-symbols-outlined text-base">cloud</span>
                <span class="font-headline text-xs font-bold uppercase tracking-wider">
                  ${t('detail.topNotes')}
                </span>
              </div>
            </div>
            <div class="flex flex-wrap gap-1.5">
              ${topNotes.map(n => `
                <span class="neu-flat px-3 py-1.5 rounded-full text-xs font-mono font-medium text-deep-navy">
                  ${n}
                </span>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Heart Notes Card -->
        <div class="composition-tier-card neu-inset rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-1.5 text-sunset-amber">
                <span class="material-symbols-outlined text-base">favorite</span>
                <span class="font-headline text-xs font-bold uppercase tracking-wider">
                  ${t('detail.midNotes')}
                </span>
              </div>
            </div>
            <div class="flex flex-wrap gap-1.5">
              ${midNotes.map(n => `
                <span class="neu-flat px-3 py-1.5 rounded-full text-xs font-mono font-medium text-deep-navy">
                  ${n}
                </span>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Base Notes Card -->
        <div class="composition-tier-card neu-inset rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-1.5 text-deep-navy">
                <span class="material-symbols-outlined text-base">foundation</span>
                <span class="font-headline text-xs font-bold uppercase tracking-wider">
                  ${t('detail.baseNotes')}
                </span>
              </div>
            </div>
            <div class="flex flex-wrap gap-1.5">
              ${baseNotes.map(n => `
                <span class="neu-flat px-3 py-1.5 rounded-full text-xs font-mono font-medium text-deep-navy">
                  ${n}
                </span>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================================================== -->
    <!-- 4. PRESTASI (PERFORMANCE): 2 Concise Metric Cards        -->
    <!-- ======================================================== -->
    <section id="performance-section" class="performance-section neu-flat rounded-3xl p-6 md:p-8 space-y-4">
      <div class="flex items-center gap-2 border-b border-border-hairline pb-3">
        <span class="material-symbols-outlined text-atmospheric-blue text-xl">speed</span>
        <h2 class="font-headline text-lg md:text-xl font-bold text-deep-navy">
          ${t('detail.performance')}
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <!-- Metric Card 1: Longevity -->
        <div class="neu-inset rounded-2xl p-6 flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs font-headline text-outline uppercase tracking-wider font-bold block">
              ${t('detail.longevity')}
            </span>
            <span class="font-headline text-2xl md:text-3xl font-bold text-deep-navy block">
              ${formatLongevity(longevity)}
            </span>
            <p class="text-[11px] text-on-surface-variant font-body">
              ${t('detail.longevityDesc')}
            </p>
          </div>
          <div class="w-14 h-14 rounded-2xl neu-flat flex items-center justify-center text-atmospheric-blue shrink-0">
            <span class="material-symbols-outlined text-2xl">schedule</span>
          </div>
        </div>

        <!-- Metric Card 2: Sillage -->
        <div class="neu-inset rounded-2xl p-6 flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs font-headline text-outline uppercase tracking-wider font-bold block">
              ${t('detail.sillage')}
            </span>
            <span class="font-headline text-2xl md:text-3xl font-bold text-atmospheric-blue block">
              ${sillage}
            </span>
            <p class="text-[11px] text-on-surface-variant font-body">
              ${t('detail.sillageDesc')}
            </p>
          </div>
          <div class="w-14 h-14 rounded-2xl neu-flat flex items-center justify-center text-atmospheric-blue shrink-0">
            <span class="material-symbols-outlined text-2xl">air</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================================================== -->
    <!-- 5. WHEN TO WEAR: Structured Recommendations              -->
    <!-- ======================================================== -->
    <section id="when-to-wear-section" class="when-to-wear-section neu-flat rounded-3xl p-6 md:p-8 space-y-4">
      <div class="flex items-center gap-2 border-b border-border-hairline pb-3">
        <span class="material-symbols-outlined text-atmospheric-blue text-xl">event_available</span>
        <h2 class="font-headline text-lg md:text-xl font-bold text-deep-navy">
          ${t('detail.whenToWear')}
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <!-- Time Recommendation -->
        <div class="neu-inset rounded-2xl p-5 space-y-3">
          <div class="flex items-center gap-2 text-deep-navy font-headline text-xs font-bold uppercase">
            <span class="material-symbols-outlined text-sunset-amber text-base">routine</span>
            <span>${t('detail.whenToWear')}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            ${whenToWearTimes.map(translateWhenToWearItem).map(timeLabel => `
              <span class="neu-flat px-3 py-1 rounded-full text-xs font-headline font-bold text-deep-navy">
                ${timeLabel}
              </span>
            `).join('')}
          </div>
        </div>

        <!-- Occasion Recommendation -->
        <div class="neu-inset rounded-2xl p-5 space-y-3">
          <div class="flex items-center gap-2 text-deep-navy font-headline text-xs font-bold uppercase">
            <span class="material-symbols-outlined text-atmospheric-blue text-base">work</span>
            <span>${t('detail.occasions')}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            ${whenToWearOccasions.map(translateWhenToWearItem).map(occLabel => `
              <span class="neu-flat px-3 py-1 rounded-full text-xs font-headline font-bold text-deep-navy">
                ${occLabel}
              </span>
            `).join('')}
          </div>
        </div>

        <!-- Season / Climate Recommendation -->
        <div class="neu-inset rounded-2xl p-5 space-y-3">
          <div class="flex items-center gap-2 text-deep-navy font-headline text-xs font-bold uppercase">
            <span class="material-symbols-outlined text-atmospheric-blue text-base">wb_twilight</span>
            <span>${t('detail.weatherSuitability')}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            ${whenToWearSeasonList.map(translateWhenToWearItem).map(seasonLabel => `
              <span class="neu-flat px-3 py-1 rounded-full text-xs font-headline font-bold text-deep-navy">
                ${seasonLabel}
              </span>
            `).join('')}
          </div>
        </div>
      </div>
    </section>

    <!-- ======================================================== -->
    <!-- 6. RUANGAN KOMEN KOMUNITI (Live Firestore onSnapshot)     -->
    <!-- ======================================================== -->
    <section id="comments-section" class="comments-section comments-container komuniti neu-flat rounded-3xl p-6 md:p-8 space-y-6">
      <div class="flex items-center justify-between border-b border-border-hairline pb-3">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-atmospheric-blue text-xl">forum</span>
          <div>
            <h2 class="font-headline text-xl font-bold text-deep-navy">
              ${t('comments.communityReviews')}
            </h2>
            <p class="font-body text-xs text-on-surface-variant">
              ${t('detail.reviewsSubtitle')}
            </p>
          </div>
        </div>
      </div>

      <!-- Add Review Form -->
      <div class="neu-inset rounded-2xl p-5 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-atmospheric-blue/10 flex items-center justify-center font-bold text-atmospheric-blue text-xs neu-flat">
              ${user ? (user.displayName || 'U').charAt(0) : 'T'}
            </div>
            <div>
              <span class="font-headline text-xs font-bold text-deep-navy">
                ${user ? (user.displayName || t('comments.communityMember')) : t('comments.guest')}
              </span>
              <span class="text-[10px] text-outline block">
                ${isGuest ? t('comments.loginToReview') : t('comments.activeSession')}
              </span>
            </div>
          </div>

          <!-- Star Rating Selector (1-5 Stars) -->
          <div class="flex items-center gap-1">
            <span class="text-xs font-headline text-outline mr-1">${t('comments.rating')}:</span>
            <div id="star-rating-selector" class="flex text-sunset-amber cursor-pointer">
              ${[1, 2, 3, 4, 5].map(star => `
                <button
                  type="button"
                  class="star-select-btn text-base hover:scale-125 transition-transform p-0.5 cursor-pointer"
                  data-star="${star}"
                  title="${star} ${t('comments.stars')}"
                >
                  <span class="material-symbols-outlined text-base ${star <= selectedStarRating ? 'fill-1' : ''}">star</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Review Text Input Area -->
        <textarea
          id="comment-text-input"
          rows="3"
          placeholder="${t('comments.reviewPlaceholder')}"
          class="w-full bg-transparent border-0 outline-none text-xs font-body text-deep-navy placeholder:text-outline resize-none"
        ></textarea>

        <!-- Situation Tags & Submit Action -->
        <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-hairline">
          <div class="flex flex-wrap gap-1.5 text-[10px] font-headline">
            <button type="button" class="review-tag-chip neu-button px-2.5 py-1 rounded-full text-deep-navy hover:text-atmospheric-blue cursor-pointer" data-tag="${t('comments.tagSprays')}">
              ${t('comments.tagSprays')}
            </button>
            <button type="button" class="review-tag-chip neu-button px-2.5 py-1 rounded-full text-deep-navy hover:text-atmospheric-blue cursor-pointer" data-tag="${t('comments.tagOfficeAC')}">
              ${t('comments.tagOfficeAC')}
            </button>
            <button type="button" class="review-tag-chip neu-button px-2.5 py-1 rounded-full text-deep-navy hover:text-atmospheric-blue cursor-pointer" data-tag="${t('comments.tagOutdoorHeat')}">
              ${t('comments.tagOutdoorHeat')}
            </button>
          </div>

          <button
            id="submit-comment-btn"
            type="button"
            class="px-5 py-2 rounded-full bg-atmospheric-blue text-white font-headline text-xs font-bold flex items-center gap-1.5 shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer"
          >
            <span class="material-symbols-outlined text-sm">send</span>
            <span>${t('comments.submitReview')}</span>
          </button>
        </div>
      </div>

      <!-- Live Comments List Container -->
      <div id="comments-list-container" class="space-y-4 pt-2">
        ${renderCommentsList(perfume, user, isGuest)}
      </div>
    </section>

    <!-- ======================================================== -->
    <!-- 7. PALING BAWAH: Horizontal Carousel "Lebih dari [Brand]"   -->
    <!-- ======================================================== -->
    <section id="brand-carousel-section" class="brand-carousel-section brand-carousel neu-flat rounded-3xl p-6 md:p-8 space-y-6">
      <div class="flex items-center justify-between border-b border-border-hairline pb-3">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-atmospheric-blue text-xl">auto_awesome</span>
          <div>
            <h2 class="font-headline text-xl font-bold text-deep-navy">
              ${t('detail.moreFromBrand', { brand: perfume.brand })}
            </h2>
            <p class="font-body text-xs text-on-surface-variant">
              ${t('detail.moreFromBrandDesc', { brand: perfume.brand })}
            </p>
          </div>
        </div>

        <a href="#/direktori" class="neu-button px-4 py-1.5 rounded-full text-xs font-headline font-bold text-atmospheric-blue hover:text-deep-navy">
          ${t('directory.allBrands')}
        </a>
      </div>

      ${brandPerfumes.length > 0 ? `
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-2">
          ${brandPerfumes.map(p => renderPerfumeCard(p)).join('')}
        </div>
      ` : `
        <div class="neu-inset rounded-2xl p-6 text-center text-xs text-on-surface-variant font-body">
          ${t('detail.noOtherFromBrand', { brand: perfume.brand })}
          <a href="#/direktori" class="text-atmospheric-blue font-bold ml-1 hover:underline">${t('notFound.exploreDirectory')}</a>
        </div>
      `}
    </section>
  </div>
  `;
}

function sanitizeCommentText(text) {
  if (!text || typeof text !== 'string') return '';
  const currencyPattern = new RegExp(
    '(?:\\b(' + '\\u0052\\u004D|\\u004D\\u0059\\u0052' + ')|[\\u0024\\u20AC\\u00A3\\u00A5])\\s*\\d+(?:\\.\\d+)?\\b',
    'gi'
  );
  return text.replace(currencyPattern, '').replace(/\s{2,}/g, ' ').trim();
}

function renderCommentsList(perfume, user, isGuest) {
  if (!currentComments || currentComments.length === 0) {
    return `
      <div class="text-center py-8 text-xs text-outline font-body neu-inset rounded-2xl">
        ${t('detail.noReviewsYet')}
      </div>
    `;
  }

  return currentComments.map(c => {
    const isOwner = user && user.uid === c.userId;
    const isEditing = editingCommentId === c.id;
    const showReplyBox = replyBoxCommentId === c.id;
    const userVoted = user && Array.isArray(c.helpfulVoters) && c.helpfulVoters.includes(user.uid);

    return `
      <div class="neu-flat rounded-2xl p-5 space-y-3 relative group" id="comment-card-${c.id}">
        <!-- Top Bar: Avatar, Name, Rating -->
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2.5">
            <img
              src="${c.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}"
              alt="${c.userName}"
              class="w-8 h-8 rounded-full object-cover neu-inset"
              onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';"
            />
            <div>
              <div class="flex items-center gap-2">
                <span class="font-headline text-xs font-bold text-deep-navy">${c.userName}</span>
                ${isOwner ? `<span class="neu-inset px-2 py-0.5 rounded-full text-[9px] font-headline text-atmospheric-blue font-bold">${t('comments.yourReview')}</span>` : ''}
              </div>
              <span class="text-[10px] text-outline font-mono">${c.weatherContext || t('comments.localWeatherTest')}</span>
            </div>
          </div>

          <div class="flex items-center text-sunset-amber text-xs neu-inset px-2 py-1 rounded-full">
            <span class="material-symbols-outlined text-xs fill-1">star</span>
            <span class="font-mono text-xs text-deep-navy ml-1 font-bold">${c.rating}</span>
          </div>
        </div>

        <!-- Body Text / Edit Box -->
        ${isEditing ? `
          <div class="space-y-2">
            <textarea id="edit-textarea-${c.id}" class="w-full neu-inset rounded-xl p-3 text-xs text-deep-navy outline-none font-body">${sanitizeCommentText(c.text)}</textarea>
            <div class="flex justify-end gap-2">
              <button class="cancel-edit-btn neu-button px-3 py-1 rounded-full text-xs font-headline cursor-pointer" data-id="${c.id}">${t('comments.cancel')}</button>
              <button class="save-edit-btn px-3 py-1 rounded-full bg-atmospheric-blue text-white text-xs font-headline font-bold cursor-pointer" data-id="${c.id}">${t('comments.save')}</button>
            </div>
          </div>
        ` : `
          <p class="font-body text-xs text-deep-navy leading-relaxed">${sanitizeCommentText(c.text)}</p>
        `}

        <!-- Situation Tags -->
        ${c.tags && c.tags.length > 0 ? `
          <div class="flex flex-wrap gap-1">
            ${c.tags.map(t => `<span class="neu-inset px-2 py-0.5 rounded-full text-[9px] font-mono text-on-surface-variant">${t}</span>`).join('')}
          </div>
        ` : ''}

        <!-- Actions Row (Helpful, Reply, Edit, Delete) -->
        <div class="flex items-center justify-between pt-2 border-t border-border-hairline text-xs">
          <div class="flex items-center gap-4">
            <!-- Anti-duplicate Helpful button -->
            <button
              class="vote-helpful-btn flex items-center gap-1 font-headline text-xs transition-colors cursor-pointer ${
                userVoted ? 'text-atmospheric-blue font-bold' : 'text-on-surface-variant hover:text-atmospheric-blue'
              }"
              data-id="${c.id}"
              title="${t('comments.voteHelpfulTitle')}"
            >
              <span class="material-symbols-outlined text-sm ${userVoted ? 'fill-1' : ''}">thumb_up</span>
              <span>${c.helpfulCount || 0} ${t('comments.helpful')}</span>
            </button>

            <!-- Threaded Reply Toggle -->
            <button
              class="toggle-reply-btn text-on-surface-variant hover:text-atmospheric-blue flex items-center gap-1 font-headline text-xs cursor-pointer"
              data-id="${c.id}"
            >
              <span class="material-symbols-outlined text-sm">reply</span>
              <span>${t('comments.reply')}</span>
            </button>
          </div>

          <!-- Edit & Delete buttons: Only for Owner -->
          ${isOwner ? `
            <div class="flex items-center gap-2">
              <button class="edit-comment-btn text-outline hover:text-deep-navy text-xs font-headline flex items-center gap-0.5 cursor-pointer" data-id="${c.id}">
                <span class="material-symbols-outlined text-xs">edit</span> ${t('comments.edit')}
              </button>
              <button class="delete-comment-btn text-outline hover:text-red-600 text-xs font-headline flex items-center gap-0.5 cursor-pointer" data-id="${c.id}">
                <span class="material-symbols-outlined text-xs">delete</span> ${t('comments.delete')}
              </button>
            </div>
          ` : ''}
        </div>

        <!-- Threaded Replies Section -->
        ${c.replies && c.replies.length > 0 ? `
          <div class="mt-3 pl-4 border-l-2 border-atmospheric-blue/20 space-y-2">
            ${c.replies.map(r => `
              <div class="neu-inset rounded-xl p-3 text-xs space-y-1">
                <div class="flex items-center justify-between">
                  <span class="font-headline font-bold text-deep-navy">${r.userName}</span>
                  <span class="text-[9px] text-outline font-mono">${t('comments.verifiedReply')}</span>
                </div>
                <p class="font-body text-on-surface-variant">${sanitizeCommentText(r.text)}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Inline Reply Input Box -->
        ${showReplyBox ? `
          <div class="mt-3 pt-2 border-t border-border-hairline flex items-center gap-2">
            <input
              id="reply-input-${c.id}"
              type="text"
              placeholder="${t('comments.replyTo', { name: c.userName })}"
              class="neu-inset rounded-full px-4 py-2 flex-1 text-xs text-deep-navy outline-none font-body"
            />
            <button
              class="submit-reply-btn px-4 py-2 rounded-full bg-atmospheric-blue text-white text-xs font-headline font-bold cursor-pointer"
              data-id="${c.id}"
            >
              ${t('comments.reply')}
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

export function attachDetailListeners() {
  if (!document.getElementById('header-section')) return;

  // Sync rating UI with latest comments
  updateRatingUI(activePerfume, currentComments);

  // Real-time live flacon image update without manual reload
  if (typeof window !== 'undefined' && !window.__detailFlaconLiveSyncAttached) {
    window.__detailFlaconLiveSyncAttached = true;
    window.addEventListener('scentcast:perfumeUpdated', (e) => {
      const id = e.detail?.id || e.detail?.perfume?.id;
      const imageUrl = e.detail?.imageUrl || e.detail?.perfume?.imageUrl;
      if (imageUrl && (id === activePerfumeId || (typeof window.location !== 'undefined' && window.location.hash.includes(id)))) {
        const flaconImg = document.querySelector('#header-section img');
        if (flaconImg) {
          flaconImg.src = imageUrl;
        }
      }
    });
  }

  // Save Love button in header section
  const loveBtn = document.getElementById('detail-love-btn');
  if (loveBtn) {
    loveBtn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (authService.isGuest()) {
        openAuthModal('login');
        return;
      }

      const currentUser = authService.getCurrentUser();
      const targetId = loveBtn.getAttribute('data-id') || activePerfumeId;
      if (!targetId) return;

      try {
        const isNowLiked = await perfumeService.toggleSavePerfume(targetId, currentUser?.uid);
        loveBtn.classList.toggle('neu-inset', isNowLiked);
        const label = document.getElementById('detail-love-label');
        if (label) {
          label.textContent = `${isNowLiked ? t('detail.savedInCollection') : t('detail.saveToCollection')} (❤️)`;
        }
        const svg = loveBtn.querySelector('svg');
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
        console.error('[DetailView] Error saving perfume to collection:', err);
      }
    };
  }

  // Smooth scroll to comments
  document.getElementById('scroll-to-comments-btn')?.addEventListener('click', () => {
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Star selector in review form
  document.querySelectorAll('.star-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedStarRating = Number(btn.getAttribute('data-star'));
      document.querySelectorAll('.star-select-btn').forEach(b => {
        const star = Number(b.getAttribute('data-star'));
        const icon = b.querySelector('.material-symbols-outlined');
        if (star <= selectedStarRating) {
          icon?.classList.add('fill-1');
        } else {
          icon?.classList.remove('fill-1');
        }
      });
    });
  });

  // Tag chips in review form
  document.querySelectorAll('.review-tag-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('neu-inset');
      chip.classList.toggle('text-atmospheric-blue');
    });
  });

  // Submit new review
  document.getElementById('submit-comment-btn')?.addEventListener('click', async () => {
    if (authService.isGuest()) {
      openAuthModal('login');
      return;
    }

    const input = document.getElementById('comment-text-input');
    const text = input?.value.trim();
    if (!text) {
      alert(t('comments.emptyReviewAlert'));
      return;
    }

    const activeTags = [];
    document.querySelectorAll('.review-tag-chip.neu-inset').forEach(c => {
      activeTags.push(c.getAttribute('data-tag'));
    });

    try {
      await perfumeService.addComment(activePerfumeId, {
        rating: selectedStarRating,
        text,
        tags: activeTags.length > 0 ? activeTags : [t('comments.tagSprays'), t('comments.tagOutdoorHeat')],
        weatherContext: t('comments.localWeatherContext')
      });
      if (input) input.value = '';
    } catch (err) {
      alert(err.message);
    }
  });

  attachCommentItemListeners({ id: activePerfumeId });

  // Only attach card listeners to brand carousel cards, avoiding header love button collision
  const brandCarousel = document.getElementById('brand-carousel-section');
  if (brandCarousel) {
    attachPerfumeCardListeners(brandCarousel);
  }
}

function attachCommentItemListeners(perfume) {
  // Anti-duplicate helpful voting
  document.querySelectorAll('.vote-helpful-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (authService.isGuest()) {
        openAuthModal('login');
        return;
      }
      const commentId = btn.getAttribute('data-id');
      await perfumeService.toggleHelpful(commentId, perfume.id);
    });
  });

  // Toggle reply form
  document.querySelectorAll('.toggle-reply-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (authService.isGuest()) {
        openAuthModal('login');
        return;
      }
      const commentId = btn.getAttribute('data-id');
      replyBoxCommentId = replyBoxCommentId === commentId ? null : commentId;
      const user = authService.getCurrentUser();
      const listEl = document.getElementById('comments-list-container');
      if (listEl) {
        listEl.innerHTML = renderCommentsList(perfume, user, false);
        attachCommentItemListeners(perfume);
      }
    });
  });

  // Submit threaded reply
  document.querySelectorAll('.submit-reply-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const commentId = btn.getAttribute('data-id');
      const input = document.getElementById(`reply-input-${commentId}`);
      const replyText = input?.value.trim();
      if (replyText) {
        await perfumeService.addReply(commentId, perfume.id, replyText);
        replyBoxCommentId = null;
      }
    });
  });

  // Edit comment (owner only)
  document.querySelectorAll('.edit-comment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const commentId = btn.getAttribute('data-id');
      editingCommentId = commentId;
      const user = authService.getCurrentUser();
      const listEl = document.getElementById('comments-list-container');
      if (listEl) {
        listEl.innerHTML = renderCommentsList(perfume, user, false);
        attachCommentItemListeners(perfume);
      }
    });
  });

  // Cancel edit
  document.querySelectorAll('.cancel-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      editingCommentId = null;
      const user = authService.getCurrentUser();
      const listEl = document.getElementById('comments-list-container');
      if (listEl) {
        listEl.innerHTML = renderCommentsList(perfume, user, false);
        attachCommentItemListeners(perfume);
      }
    });
  });

  // Save edited comment
  document.querySelectorAll('.save-edit-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const commentId = btn.getAttribute('data-id');
      const textarea = document.getElementById(`edit-textarea-${commentId}`);
      const newText = textarea?.value.trim();
      if (newText) {
        await perfumeService.editComment(commentId, newText);
        editingCommentId = null;
      }
    });
  });

  // Delete comment (owner only)
  document.querySelectorAll('.delete-comment-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm(t('comments.confirmDeleteReview'))) {
        const commentId = btn.getAttribute('data-id');
        await perfumeService.deleteComment(commentId, activePerfumeId);
      }
    });
  });
}

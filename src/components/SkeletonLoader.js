/**
 * ScentCast Malaysia — Reusable Neumorphic Skeleton Loader Component
 * Provides pulse-animated placeholders matching PerfumeCard and DetailView
 * dimensions and hierarchies to prevent layout shift during async loading.
 */

/**
 * Renders HTML string for a single pulsing skeleton card matching PerfumeCard dimensions.
 * @returns {string} HTML string
 */
export function renderSkeletonCard() {
  return `
  <div class="skeleton-card neu-flat rounded-2xl p-4 flex flex-col justify-between space-y-4 animate-pulse">
    <div>
      <!-- Recessed Image Cavity Skeleton -->
      <div class="neu-inset rounded-xl p-4 mb-3 flex items-center justify-center relative overflow-hidden h-44 bg-slate-200/40 dark:bg-slate-800/40">
        <!-- Badge placeholder -->
        <div class="absolute top-2 left-2 w-10 h-4 rounded-full neu-flat bg-slate-300/60 dark:bg-slate-700/60"></div>
        <!-- Love button placeholder -->
        <div class="absolute top-2 right-2 w-8 h-8 rounded-full neu-flat bg-slate-300/60 dark:bg-slate-700/60"></div>
        <!-- Bottle silhouette placeholder -->
        <div class="w-20 h-28 bg-slate-300/60 dark:bg-slate-700/60 rounded-xl"></div>
      </div>

      <!-- Brand & Gender Classification -->
      <div class="flex items-center justify-between mb-2">
        <div class="h-3 w-20 bg-slate-300/60 dark:bg-slate-700/60 rounded"></div>
        <div class="h-4 w-12 rounded-full neu-inset bg-slate-300/50 dark:bg-slate-700/50"></div>
      </div>

      <!-- Perfume Name placeholder -->
      <div class="space-y-1.5 mb-3">
        <div class="h-4 w-3/4 bg-slate-300/80 dark:bg-slate-700/80 rounded"></div>
        <div class="h-3 w-1/2 bg-slate-300/50 dark:bg-slate-700/50 rounded"></div>
      </div>

      <!-- Accords / Scent Profile Tags -->
      <div class="flex flex-wrap gap-1 mb-3">
        <div class="h-4 w-14 rounded-full neu-inset bg-slate-300/50 dark:bg-slate-700/50"></div>
        <div class="h-4 w-16 rounded-full neu-inset bg-slate-300/50 dark:bg-slate-700/50"></div>
        <div class="h-4 w-12 rounded-full neu-inset bg-slate-300/50 dark:bg-slate-700/50"></div>
      </div>
    </div>

    <!-- Bottom Section: Performance Pills & Detail Link -->
    <div class="pt-2 border-t border-border-hairline space-y-2.5">
      <div class="flex items-center justify-between">
        <div class="h-3 w-16 bg-slate-300/60 dark:bg-slate-700/60 rounded"></div>
        <div class="h-3 w-14 bg-slate-300/60 dark:bg-slate-700/60 rounded"></div>
      </div>
      <div class="h-8 w-full rounded-full neu-button bg-slate-300/60 dark:bg-slate-700/60"></div>
    </div>
  </div>
  `;
}

/**
 * Renders a grid container of skeleton cards.
 * @param {number} count - Number of skeleton cards to render (default = 6)
 * @returns {string} HTML string
 */
export function renderSkeletonGrid(count = 6) {
  return `
  <div class="skeleton-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    ${Array.from({ length: count }).map(() => renderSkeletonCard()).join('')}
  </div>
  `;
}

/**
 * Renders a pulsing skeleton structure matching DetailView hierarchy.
 * @returns {string} HTML string
 */
export function renderDetailSkeleton() {
  return `
  <div class="skeleton-detail w-full px-4 md:px-8 pt-28 pb-16 max-w-max-width mx-auto space-y-10 animate-pulse">
    <!-- Breadcrumb placeholder -->
    <div class="h-4 w-48 bg-slate-300/60 dark:bg-slate-700/60 rounded"></div>

    <!-- Section 1: Header Wangian Skeleton -->
    <section class="neu-flat rounded-3xl p-6 md:p-10 space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <!-- Flacon bottle cavity -->
        <div class="lg:col-span-5 flex justify-center">
          <div class="neu-inset rounded-3xl p-8 aspect-square w-full max-w-sm flex items-center justify-center bg-slate-200/40 dark:bg-slate-800/40">
            <div class="w-32 h-44 bg-slate-300/60 dark:bg-slate-700/60 rounded-2xl"></div>
          </div>
        </div>

        <!-- Details placeholder -->
        <div class="lg:col-span-7 space-y-5">
          <div class="flex items-center gap-2">
            <div class="h-5 w-24 rounded-full neu-inset bg-slate-300/60 dark:bg-slate-700/60"></div>
            <div class="h-5 w-16 rounded-full neu-inset bg-slate-300/60 dark:bg-slate-700/60"></div>
            <div class="h-5 w-20 rounded-full neu-inset bg-slate-300/60 dark:bg-slate-700/60"></div>
          </div>
          <div class="h-8 w-3/4 bg-slate-300/80 dark:bg-slate-700/80 rounded-lg"></div>
          <div class="flex items-center gap-3">
            <div class="h-10 w-36 rounded-2xl neu-inset bg-slate-300/60 dark:bg-slate-700/60"></div>
            <div class="h-10 w-44 rounded-2xl neu-inset bg-slate-300/60 dark:bg-slate-700/60"></div>
          </div>
          <!-- Action buttons placeholder -->
          <div class="flex flex-wrap gap-3 pt-2">
            <div class="h-11 flex-1 min-w-[140px] rounded-full bg-slate-300/70 dark:bg-slate-700/70"></div>
            <div class="h-11 flex-1 min-w-[140px] rounded-full bg-slate-300/70 dark:bg-slate-700/70"></div>
            <div class="h-11 w-32 rounded-full neu-button bg-slate-300/60 dark:bg-slate-700/60"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 2: Main Accords Skeleton -->
    <section class="neu-flat rounded-3xl p-6 md:p-8 space-y-4">
      <div class="h-6 w-48 bg-slate-300/70 dark:bg-slate-700/70 rounded"></div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div class="h-14 rounded-2xl neu-inset bg-slate-200/40 dark:bg-slate-800/40"></div>
        <div class="h-14 rounded-2xl neu-inset bg-slate-200/40 dark:bg-slate-800/40"></div>
        <div class="h-14 rounded-2xl neu-inset bg-slate-200/40 dark:bg-slate-800/40"></div>
        <div class="h-14 rounded-2xl neu-inset bg-slate-200/40 dark:bg-slate-800/40"></div>
      </div>
    </section>

    <!-- Section 3: Fragrance Composition Skeleton (3 cards) -->
    <section class="neu-flat rounded-3xl p-6 md:p-8 space-y-4">
      <div class="h-6 w-56 bg-slate-300/70 dark:bg-slate-700/70 rounded"></div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div class="h-44 rounded-2xl neu-inset bg-slate-200/40 dark:bg-slate-800/40 p-5 space-y-3">
          <div class="flex justify-between items-center">
            <div class="h-4 w-24 bg-slate-300/60 dark:bg-slate-700/60 rounded"></div>
            <div class="h-4 w-16 rounded-full neu-flat bg-slate-300/60 dark:bg-slate-700/60"></div>
          </div>
          <div class="flex flex-wrap gap-2 pt-2">
            <div class="h-6 w-20 rounded-full neu-flat bg-slate-300/50 dark:bg-slate-700/50"></div>
            <div class="h-6 w-24 rounded-full neu-flat bg-slate-300/50 dark:bg-slate-700/50"></div>
          </div>
        </div>
        <div class="h-44 rounded-2xl neu-inset bg-slate-200/40 dark:bg-slate-800/40 p-5 space-y-3">
          <div class="flex justify-between items-center">
            <div class="h-4 w-24 bg-slate-300/60 dark:bg-slate-700/60 rounded"></div>
            <div class="h-4 w-20 rounded-full neu-flat bg-slate-300/60 dark:bg-slate-700/60"></div>
          </div>
          <div class="flex flex-wrap gap-2 pt-2">
            <div class="h-6 w-20 rounded-full neu-flat bg-slate-300/50 dark:bg-slate-700/50"></div>
            <div class="h-6 w-16 rounded-full neu-flat bg-slate-300/50 dark:bg-slate-700/50"></div>
          </div>
        </div>
        <div class="h-44 rounded-2xl neu-inset bg-slate-200/40 dark:bg-slate-800/40 p-5 space-y-3">
          <div class="flex justify-between items-center">
            <div class="h-4 w-24 bg-slate-300/60 dark:bg-slate-700/60 rounded"></div>
            <div class="h-4 w-14 rounded-full neu-flat bg-slate-300/60 dark:bg-slate-700/60"></div>
          </div>
          <div class="flex flex-wrap gap-2 pt-2">
            <div class="h-6 w-22 rounded-full neu-flat bg-slate-300/50 dark:bg-slate-700/50"></div>
            <div class="h-6 w-18 rounded-full neu-flat bg-slate-300/50 dark:bg-slate-700/50"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 4: Performance Skeleton (2 cards) -->
    <section class="neu-flat rounded-3xl p-6 md:p-8 space-y-4">
      <div class="h-6 w-44 bg-slate-300/70 dark:bg-slate-700/70 rounded"></div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div class="h-28 rounded-2xl neu-inset bg-slate-200/40 dark:bg-slate-800/40"></div>
        <div class="h-28 rounded-2xl neu-inset bg-slate-200/40 dark:bg-slate-800/40"></div>
      </div>
    </section>

    <!-- Section 5: When To Wear Skeleton -->
    <section class="neu-flat rounded-3xl p-6 md:p-8 space-y-4">
      <div class="h-6 w-52 bg-slate-300/70 dark:bg-slate-700/70 rounded"></div>
      <div class="h-24 rounded-2xl neu-inset bg-slate-200/40 dark:bg-slate-800/40"></div>
    </section>

    <!-- Section 6: Community Reviews Skeleton -->
    <section class="neu-flat rounded-3xl p-6 md:p-8 space-y-4">
      <div class="h-6 w-48 bg-slate-300/70 dark:bg-slate-700/70 rounded"></div>
      <div class="space-y-4 pt-2">
        <div class="h-32 rounded-2xl neu-inset bg-slate-200/40 dark:bg-slate-800/40"></div>
        <div class="h-32 rounded-2xl neu-inset bg-slate-200/40 dark:bg-slate-800/40"></div>
      </div>
    </section>
  </div>
  `;
}

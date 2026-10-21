import { authService } from '../services/authService.js';
import { adminService } from '../services/adminService.js';
import { perfumeService } from '../services/perfumeService.js';
import { storageService, formatImageUrl, DEFAULT_FLACON_PLACEHOLDER } from '../services/storageService.js';
import { presenceService } from '../services/presenceService.js';
import { weatherService, getPerfumeTimeSuitability } from '../services/weatherService.js';
import { t, formatLongevity, normalizeGender, autoTranslateToEnglish, translateNotes } from '../services/i18nService.js';

let activeTab = 'catalog'; // 'catalog' | 'comments' | 'logs'
let editingPerfumeId = null;

/**
 * Access Denied screen rendering
 */
export function renderAccessDenied() {
  const isBm = t('admin.accessDenied').includes('Akses Ditolak');
  return `
  <div class="w-full px-4 md:px-8 pt-32 pb-20 max-w-xl mx-auto text-center space-y-6">
    <div class="w-20 h-20 rounded-full neu-inset mx-auto flex items-center justify-center text-red-500">
      <span class="material-symbols-outlined text-4xl">lock</span>
    </div>
    <h1 class="font-headline text-3xl font-bold text-deep-navy">${isBm ? '⛔ Akses Ditolak' : '⛔ Access Denied'}</h1>
    <p class="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed">
      ${t('admin.accessDenied')} ${t('admin.accessDeniedDesc')}
    </p>
    <div class="pt-4 flex justify-center">
      <a href="#/" class="neu-button px-8 py-3 rounded-full font-headline text-xs font-bold text-atmospheric-blue hover:text-deep-navy transition-all inline-flex items-center gap-2">
        <span class="material-symbols-outlined text-sm">home</span>
        <span>${t('notFound.backHome')}</span>
      </a>
    </div>
  </div>
  `;
}

/**
 * Helper to render individual perfume table row with responsive styling & accord badges
 */
export function renderPerfumeTableRow(p) {
  const accordsList = Array.isArray(p.mainAccords) && p.mainAccords.length > 0
    ? p.mainAccords.map(a => `${a.name} ${a.percentage}%`)
    : (p.accords || []);
  const displayedAccords = accordsList.slice(0, 3);
  const remainingCount = accordsList.length - displayedAccords.length;

  return `
    <tr class="hover:bg-atmospheric-blue/5 transition-colors" data-perfume-id="${p.id}">
      <td class="py-3 px-4">
        <img src="${formatImageUrl(p.imageUrl || p.image) || DEFAULT_FLACON_PLACEHOLDER}" alt="${p.name}" class="w-10 h-10 object-contain rounded-lg neu-inset p-1" onerror="this.onerror=null; this.src='${DEFAULT_FLACON_PLACEHOLDER}';">
      </td>
      <td class="py-3 px-4">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="font-headline font-bold text-deep-navy">${p.name}</span>
          ${p.isDupe ? `
            <span class="neu-inset px-1.5 py-0.5 rounded text-[8px] font-headline font-bold text-sunset-amber uppercase">
              Dupe (${p.matchScore || p.matchPercent || 90}%)
            </span>
          ` : ''}
        </div>
        <div class="flex items-center gap-2 mt-0.5">
          <span class="text-[10px] font-headline text-outline uppercase">${p.brand}</span>
          ${p.origin || p.originCountry ? `<span class="neu-inset px-1.5 py-0.2 rounded text-[9px] font-mono text-atmospheric-blue uppercase font-semibold">${p.origin || p.originCountry}</span>` : ''}
        </div>
      </td>
      <td class="py-3 px-4">
        <div class="flex flex-col gap-1 items-start">
          <span class="neu-inset px-2 py-0.5 rounded-full text-[10px] font-headline font-bold text-atmospheric-blue capitalize">
            ${(() => {
              const g = normalizeGender(p.gender);
              return g === 'male' ? 'Men' : g === 'female' ? 'Women' : 'Unisex';
            })()}
          </span>
          ${(() => {
            const timeSuit = getPerfumeTimeSuitability(p);
            const badgeClass = timeSuit === 'Versatile'
              ? 'neu-inset text-atmospheric-blue font-bold'
              : timeSuit === 'Night'
                ? 'neu-inset text-indigo-400 font-bold'
                : 'neu-inset text-sunset-amber font-bold';
            const icon = timeSuit === 'Versatile' ? 'all_inclusive' : timeSuit === 'Night' ? 'dark_mode' : 'light_mode';
            return `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-headline ${badgeClass}" title="When To Wear: ${timeSuit}">
              <span class="material-symbols-outlined text-[10px]">${icon}</span>
              ${timeSuit}
            </span>`;
          })()}
        </div>
      </td>
      <td class="py-3 px-4 font-mono text-[11px] text-on-surface-variant">
        <div>${formatLongevity(p.longevity || '8 - 10 Hours', 'en')}</div>
        <div class="text-outline text-[10px]">${p.sillageDistance || p.sillage || '2.0 m'}</div>
      </td>
      <td class="py-3 px-4">
        <div class="flex flex-wrap gap-1 max-w-xs">
          ${displayedAccords.map(acc => `
            <span class="neu-inset px-1.5 py-0.5 rounded text-[9px] font-mono text-on-surface-variant">
              ${acc}
            </span>
          `).join('')}
          ${remainingCount > 0 ? `
            <span class="neu-inset px-1.5 py-0.5 rounded text-[9px] font-mono text-outline" title="${accordsList.join(', ')}">
              +${remainingCount}
            </span>
          ` : ''}
        </div>
      </td>
      <td class="py-3 px-4 text-right space-x-2 shrink-0">
        <button type="button" class="admin-edit-perfume-btn neu-button p-2 rounded-full text-atmospheric-blue hover:text-deep-navy transition-all cursor-pointer" data-id="${p.id}" title="${t('admin.editPerfume')}">
          <span class="material-symbols-outlined text-sm">edit</span>
        </button>
        <button type="button" class="admin-delete-perfume-btn neu-button p-2 rounded-full text-red-500 hover:text-red-700 transition-all cursor-pointer" data-id="${p.id}" title="${t('admin.deletePerfume')}">
          <span class="material-symbols-outlined text-sm">delete</span>
        </button>
      </td>
    </tr>
  `;
}

/**
 * Renders the Admin Panel View (#/admin)
 */
export async function renderAdminView() {
  // Strict role verification guard
  if (!authService.isAdmin()) {
    return renderAccessDenied();
  }

  const user = authService.getCurrentUser() || { email: 'admin@scentcast.my' };
  const allPerfumes = await perfumeService.getAllPerfumes();
  const allComments = await adminService.getAllComments();
  const auditLogs = await adminService.getAuditLogs();
  const activeCount = presenceService.getActiveUsersCount() || 1;
  const currentStationWeather = weatherService.getCurrentWeather();

  return `
  <div class="w-full px-4 md:px-8 pt-28 pb-16 max-w-max-width mx-auto space-y-8" id="admin-view-root">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-hairline">
      <div>
        <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full neu-inset text-[10px] font-headline text-atmospheric-blue uppercase font-bold mb-1">
          <span class="material-symbols-outlined text-xs">admin_panel_settings</span>
          <span>${t('admin.roleBadge')}</span>
        </div>
        <h1 class="font-headline text-2xl sm:text-3xl font-bold text-deep-navy">${t('admin.title')}</h1>
        <p class="font-body text-xs text-on-surface-variant mt-0.5">
          ${t('admin.subtitle')}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button id="admin-open-add-modal-btn" type="button" class="neu-button px-5 py-2.5 rounded-full font-headline text-xs font-bold text-atmospheric-blue hover:text-deep-navy flex items-center gap-1.5 cursor-pointer">
          <span class="material-symbols-outlined text-sm">add_circle</span>
          <span>➕ ${t('admin.addPerfume')}</span>
        </button>
      </div>
    </div>

    <!-- Quick Stats Cards (4 Columns) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="neu-flat rounded-2xl p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl neu-inset flex items-center justify-center text-atmospheric-blue">
          <span class="material-symbols-outlined text-2xl">local_florist</span>
        </div>
        <div>
          <span class="text-[11px] font-headline text-outline uppercase font-semibold">${t('admin.totalPerfumes')}</span>
          <p id="admin-total-perfumes-count" class="font-headline text-2xl font-bold text-deep-navy">${allPerfumes.length}</p>
        </div>
      </div>

      <div class="neu-flat rounded-2xl p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl neu-inset flex items-center justify-center text-sunset-amber">
          <span class="material-symbols-outlined text-2xl">forum</span>
        </div>
        <div>
          <span class="text-[11px] font-headline text-outline uppercase font-semibold">${t('admin.communityReviews')}</span>
          <p id="admin-total-comments-count" class="font-headline text-2xl font-bold text-deep-navy">${allComments.length}</p>
        </div>
      </div>

      <!-- Live Active Users Card with pulsating green live indicator -->
      <div class="neu-flat rounded-2xl p-5 flex items-center gap-4" id="admin-active-users-card">
        <div class="w-12 h-12 rounded-xl neu-inset flex items-center justify-center text-emerald-600">
          <span class="material-symbols-outlined text-2xl">group</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1">
            <span class="text-[11px] font-headline text-outline uppercase font-semibold">${t('admin.liveUsers')}</span>
            <span class="relative flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div class="flex items-baseline gap-2 mt-0.5">
            <p id="admin-live-users-count" class="font-headline text-2xl font-bold text-deep-navy">${activeCount}</p>
            <span class="text-[10px] font-headline font-bold text-emerald-600 neu-inset px-2 py-0.5 rounded-full uppercase">${t('admin.liveBadge')}</span>
          </div>
        </div>
      </div>

      <div class="neu-flat rounded-2xl p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl neu-inset flex items-center justify-center text-green-600">
          <span class="material-symbols-outlined text-2xl">verified_user</span>
        </div>
        <div class="min-w-0 flex-1">
          <span class="text-[11px] font-headline text-outline uppercase font-semibold">${t('admin.adminSession')}</span>
          <p class="font-headline text-xs font-bold text-deep-navy mt-1 truncate" title="${user.email}">${user.email}</p>
        </div>
      </div>
    </div>

    <!-- Real-Time Station Weather Sensor Telemetry Card -->
    <div id="admin-sensor-telemetry-card" class="neu-flat rounded-2xl p-5 border border-border-hairline space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-hairline">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl neu-inset flex items-center justify-center text-atmospheric-blue">
            <span class="material-symbols-outlined text-xl">sensors</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-headline text-sm font-bold text-deep-navy">${t('admin.sensorTelemetry')}</h3>
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full neu-inset text-[10px] font-mono text-emerald-600 font-bold">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span id="admin-telemetry-status">${t('admin.rtdbLive')}</span>
              </span>
            </div>
            <p class="font-body text-xs text-on-surface-variant mt-0.5">
              ${t('admin.telemetryDesc')} <code class="font-mono text-atmospheric-blue font-bold">sensors/currentWeather</code>
            </p>
          </div>
        </div>

        <div class="text-left sm:text-right">
          <span id="admin-telemetry-station" class="text-xs font-headline font-bold text-deep-navy uppercase block">${t('admin.stationLabel')}: ${currentStationWeather?.name || 'Kuala Lumpur'}</span>
          <span id="admin-telemetry-lastsync" class="text-[10px] font-mono text-outline block">${t('admin.syncLabel')}: ${t('admin.syncRealtime')}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
        <div class="neu-inset rounded-xl p-3 text-center">
          <span class="text-[10px] font-headline text-outline uppercase font-semibold block">${t('admin.stationTemp')}</span>
          <span id="admin-telemetry-temp" class="font-headline text-lg font-bold text-deep-navy mt-0.5 block">${currentStationWeather?.temperature || currentStationWeather?.temp || 31}°C</span>
        </div>
        <div class="neu-inset rounded-xl p-3 text-center">
          <span class="text-[10px] font-headline text-outline uppercase font-semibold block">${t('admin.skinTemp')}</span>
          <span id="admin-telemetry-skintemp" class="font-headline text-lg font-bold text-deep-navy mt-0.5 block">${currentStationWeather?.skinTemp || (Number(currentStationWeather?.temperature || 31) + 2.8).toFixed(1)}°C</span>
        </div>
        <div class="neu-inset rounded-xl p-3 text-center">
          <span class="text-[10px] font-headline text-outline uppercase font-semibold block">${t('admin.humidity')}</span>
          <span id="admin-telemetry-humidity" class="font-headline text-lg font-bold text-atmospheric-blue mt-0.5 block">${currentStationWeather?.humidity || 78}% RH</span>
        </div>
        <div class="neu-inset rounded-xl p-3 text-center">
          <span class="text-[10px] font-headline text-outline uppercase font-semibold block">${t('admin.evapRate')}</span>
          <span id="admin-telemetry-evap" class="font-headline text-lg font-bold text-sunset-amber mt-0.5 block">${currentStationWeather?.evaporationRate || '3.4x'}</span>
        </div>
        <div class="neu-inset rounded-xl p-3 text-center">
          <span class="text-[10px] font-headline text-outline uppercase font-semibold block">${t('admin.projectionHold')}</span>
          <span id="admin-telemetry-projection" class="font-headline text-xs font-bold text-deep-navy mt-1.5 block">${currentStationWeather?.projectionHold || '4 - 6 Jam'}</span>
        </div>
        <div class="neu-inset rounded-xl p-3 text-center">
          <span class="text-[10px] font-headline text-outline uppercase font-semibold block">${t('admin.recFamily')}</span>
          <span id="admin-telemetry-family" class="font-headline text-[10px] font-bold text-atmospheric-blue mt-1.5 truncate block" title="${currentStationWeather?.recommendedFamily || 'Aquatic Marine'}">${currentStationWeather?.recommendedFamily || 'Aquatic Marine'}</span>
        </div>
      </div>
    </div>

    <!-- Admin Navigation Tabs -->
    <div class="flex items-center gap-3 border-b border-border-hairline pb-2 flex-wrap">
      <button id="admin-tab-catalog" type="button" class="admin-tab-btn px-5 py-2 rounded-full font-headline text-xs font-bold transition-all cursor-pointer ${activeTab === 'catalog' ? 'neu-inset text-atmospheric-blue' : 'neu-button text-deep-navy'}">
        ${t('admin.tabPerfumes')} <span id="admin-tab-catalog-count">(${allPerfumes.length})</span>
      </button>
      <button id="admin-tab-comments" type="button" class="admin-tab-btn px-5 py-2 rounded-full font-headline text-xs font-bold transition-all cursor-pointer ${activeTab === 'comments' ? 'neu-inset text-atmospheric-blue' : 'neu-button text-deep-navy'}">
        ${t('admin.tabComments')} (${allComments.length})
      </button>
      <button id="admin-tab-logs" type="button" class="admin-tab-btn px-5 py-2 rounded-full font-headline text-xs font-bold transition-all cursor-pointer ${activeTab === 'logs' ? 'neu-inset text-atmospheric-blue' : 'neu-button text-deep-navy'}">
        ${t('admin.tabLogs')} (${auditLogs.length})
      </button>
    </div>

    <!-- TAB 1: Perfume Catalog Table -->
    <div id="admin-catalog-view" class="${activeTab === 'catalog' ? 'block' : 'hidden'} space-y-4">
      <div class="neu-flat rounded-2xl overflow-hidden border border-border-hairline">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="neu-inset text-[10px] font-headline uppercase text-outline tracking-wider border-b border-border-hairline">
                <th class="py-3 px-4">${t('admin.tableImage')}</th>
                <th class="py-3 px-4">${t('admin.tableName')}</th>
                <th class="py-3 px-4">${t('admin.tableGender')}</th>
                <th class="py-3 px-4">${t('admin.longevityField').split('(')[0].trim()} & ${t('admin.sillageField').split('(')[0].trim()}</th>
                <th class="py-3 px-4">${t('admin.tableAccords')}</th>
                <th class="py-3 px-4 text-right">${t('admin.tableActions')}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-hairline text-xs font-body">
              ${allPerfumes.map(p => renderPerfumeTableRow(p)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: Comment Moderation List -->
    <div id="admin-comments-view" class="${activeTab === 'comments' ? 'block' : 'hidden'} space-y-4">
      ${allComments.length === 0 ? `
        <div class="neu-inset rounded-2xl p-12 text-center text-on-surface-variant">
          <span class="material-symbols-outlined text-3xl mb-2 text-outline">chat</span>
          <p class="font-headline text-sm font-semibold">${t('admin.noComments')}</p>
        </div>
      ` : `
        <div class="grid grid-cols-1 gap-4">
          ${allComments.map(c => `
            <div class="neu-flat rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" data-comment-id="${c.id}">
              <div class="flex items-start gap-3">
                <img src="${c.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}" alt="${c.userName}" class="w-10 h-10 rounded-full object-cover neu-inset" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-headline font-bold text-sm text-deep-navy">${c.userName || 'Pengguna'}</span>
                    <span class="neu-inset px-2 py-0.5 rounded-full text-[10px] font-mono text-sunset-amber font-bold">★ ${c.rating || 5}</span>
                    <span class="text-[10px] font-mono text-outline">${c.perfumeId ? `[Perfume: ${c.perfumeId}]` : ''}</span>
                  </div>
                  <p class="font-body text-xs text-on-surface-variant mt-1 leading-relaxed max-w-2xl">${(c.text || '').replace(/\b(?:R[M]|M[Y][R])\s*\d+(?:\.\d{2})?/gi, '').trim()}</p>
                  <span class="text-[10px] font-mono text-outline block mt-1">${c.createdAt ? new Date(c.createdAt).toLocaleDateString('ms-MY') : ''}</span>
                </div>
              </div>
              <div class="shrink-0 flex sm:justify-end">
                <button type="button" class="admin-delete-comment-btn neu-button px-4 py-2 rounded-full font-headline text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-1.5 cursor-pointer" data-id="${c.id}" data-perfume-id="${c.perfumeId || ''}">
                  <span class="material-symbols-outlined text-sm">delete</span>
                  <span>🗑️ ${t('admin.deleteComment')}</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- TAB 3: Database Architecture & Audit Logs -->
    <div id="admin-logs-view" class="${activeTab === 'logs' ? 'block' : 'hidden'} space-y-6">
      <!-- Database Separation Architecture Status -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="neu-flat rounded-2xl p-5 border border-border-hairline space-y-2">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-atmospheric-blue text-xl">group</span>
            <h4 class="font-headline text-xs font-bold text-deep-navy uppercase">${t('admin.customersCol')}</h4>
          </div>
          <p class="font-body text-xs text-on-surface-variant leading-relaxed">
            ${t('admin.customersColDesc')}
          </p>
          <div class="pt-2 flex items-center gap-2">
            <span class="neu-inset px-2.5 py-1 rounded-full text-[10px] font-mono text-green-600 font-bold">${t('admin.isolatedStatus')}</span>
          </div>
        </div>

        <div class="neu-flat rounded-2xl p-5 border border-border-hairline space-y-2">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-sunset-amber text-xl">admin_panel_settings</span>
            <h4 class="font-headline text-xs font-bold text-deep-navy uppercase">${t('admin.adminsCol')}</h4>
          </div>
          <p class="font-body text-xs text-on-surface-variant leading-relaxed">
            ${t('admin.adminsColDesc')}
          </p>
          <div class="pt-2 flex items-center gap-2">
            <span class="neu-inset px-2.5 py-1 rounded-full text-[10px] font-mono text-atmospheric-blue font-bold">${t('admin.rbacStatus')}</span>
          </div>
        </div>
      </div>

      <!-- Audit Logs Feed -->
      <div class="neu-flat rounded-2xl p-5 border border-border-hairline space-y-4">
        <h4 class="font-headline text-xs font-bold text-deep-navy uppercase">${t('admin.auditLogsTitle')}</h4>
        ${auditLogs.length === 0 ? `
          <div class="neu-inset rounded-xl p-8 text-center text-xs text-outline font-body">
            ${t('admin.noAuditLogs')}
          </div>
        ` : `
          <div class="divide-y divide-border-hairline">
            ${auditLogs.map(l => `
              <div class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-body">
                <div>
                  <span class="font-headline font-bold text-deep-navy font-mono">[${l.action}]</span>
                  <span class="text-on-surface-variant ml-2">${l.details?.name || l.details?.perfumeId || JSON.stringify(l.details || {})}</span>
                </div>
                <div class="text-[10px] font-mono text-outline shrink-0">
                  <span>${l.adminEmail}</span> • <span>${new Date(l.timestamp).toLocaleString('ms-MY')}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>

    <!-- Modal: Add / Edit Perfume Form -->
    <div id="admin-perfume-modal" class="hidden fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs pointer-events-auto overscroll-contain">
      <div class="neu-flat rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative pointer-events-auto shadow-2xl transition-all" style="max-height: 90vh; overflow-y: auto; -webkit-overflow-scrolling: touch;">
        <!-- Sticky Modal Header (always visible & easily touchable on mobile) -->
        <div class="sticky top-0 z-30 flex items-center justify-between border-b border-border-hairline px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 bg-[#F8F9FA] dark:bg-[#111827] shadow-xs">
          <h2 id="admin-modal-title" class="font-headline text-lg sm:text-xl font-bold text-deep-navy">➕ ${t('admin.addPerfume') || 'Add New Perfume'}</h2>
          <button id="admin-close-modal-btn" type="button" class="neu-button p-2 sm:p-2.5 rounded-full text-outline hover:text-deep-navy cursor-pointer flex items-center justify-center min-w-[36px] min-h-[36px] touch-manipulation pointer-events-auto" aria-label="Close modal">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <form id="admin-perfume-form" novalidate class="space-y-4">
          <div class="px-4 sm:px-6 md:px-8 pt-4 pb-2 space-y-4">
            <input type="hidden" id="admin-form-id" value="">
            <input type="hidden" id="admin-form-target-type" value="Designer">

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-[11px] font-headline font-bold text-deep-navy uppercase mb-1">${t('admin.nameField') || 'Perfume Name'} *</label>
              <input type="text" id="admin-form-name" required class="neu-inset w-full px-3.5 py-2 rounded-xl text-xs font-body text-deep-navy outline-none" placeholder="e.g. Oud Wood Intense">
            </div>
            <div>
              <label class="block text-[11px] font-headline font-bold text-deep-navy uppercase mb-1">${t('admin.brandField') || 'Brand'} *</label>
              <input type="text" id="admin-form-brand" required class="neu-inset w-full px-3.5 py-2 rounded-xl text-xs font-body text-deep-navy outline-none" placeholder="e.g. Tom Ford">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-[11px] font-headline font-bold text-deep-navy uppercase mb-1">${t('admin.genderField') || 'Gender'} *</label>
              <select id="admin-form-gender" required class="neu-inset w-full px-3.5 py-2 rounded-xl text-xs font-headline text-deep-navy outline-none cursor-pointer">
                <option value="unisex">Unisex</option>
                <option value="male">Men</option>
                <option value="female">Women</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-headline font-bold text-deep-navy uppercase mb-1">${t('admin.longevityField') || 'Longevity (e.g. 8 - 10 Hours)'}</label>
              <input type="text" id="admin-form-longevity" class="neu-inset w-full px-3.5 py-2 rounded-xl text-xs font-body text-deep-navy outline-none" placeholder="8 - 10 Hours">
            </div>
            <div>
              <label class="block text-[11px] font-headline font-bold text-deep-navy uppercase mb-1">${t('admin.sillageField') || 'Sillage (e.g. 2.0 m)'}</label>
              <input type="text" id="admin-form-sillage" class="neu-inset w-full px-3.5 py-2 rounded-xl text-xs font-body text-deep-navy outline-none" placeholder="2.0 m">
            </div>
          </div>

          <!-- Origin Country & E-Commerce Purchase Links -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-[11px] font-headline font-bold text-deep-navy uppercase mb-1">${t('admin.originField') || 'Origin Country'}</label>
              <select id="admin-form-origin" class="neu-inset w-full px-3.5 py-2 rounded-xl text-xs font-headline text-deep-navy outline-none cursor-pointer">
                <option value="UAE">UAE (United Arab Emirates)</option>
                <option value="MY">MY (Malaysia)</option>
                <option value="France">France</option>
                <option value="UK">United Kingdom</option>
                <option value="USA">United States</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-headline font-bold text-deep-navy uppercase mb-1">${t('admin.shopeeField') || 'Shopee Link'}</label>
              <input type="url" id="admin-form-shopee-url" class="neu-inset w-full px-3.5 py-2 rounded-xl text-xs font-body text-deep-navy outline-none" placeholder="https://shopee.com.my/search?keyword=...">
            </div>
            <div>
              <label class="block text-[11px] font-headline font-bold text-deep-navy uppercase mb-1">${t('admin.tiktokField') || 'Official Website / Other Link'}</label>
              <input type="url" id="admin-form-tiktok-url" class="neu-inset w-full px-3.5 py-2 rounded-xl text-xs font-body text-deep-navy outline-none" placeholder="https://brand.com, lazada.com.my, zalora.com.my/...">
            </div>
          </div>

          <!-- Dupe / Clone Toggle & Configuration -->
          <div class="neu-inset rounded-2xl p-4 space-y-3">
            <div class="flex items-center gap-3">
              <input type="checkbox" id="admin-form-is-dupe" class="w-4 h-4 text-atmospheric-blue rounded neu-inset cursor-pointer">
              <label for="admin-form-is-dupe" class="text-xs font-headline font-bold text-deep-navy cursor-pointer">
                ${t('admin.isDupeLabel') || 'Is this a Dupe / Clone?'}
              </label>
            </div>
            <div id="admin-dupe-fields-container" class="hidden pt-2 border-t border-border-hairline space-y-3">
              <div>
                <label class="block text-[10px] font-headline font-bold text-deep-navy uppercase mb-1.5">
                  ${t('admin.targetTypeField') || 'Dupe Category / Origin'}
                </label>
                <div class="inline-flex rounded-xl p-1 neu-flat gap-1">
                  <label class="cursor-pointer">
                    <input type="radio" name="admin-dupe-category" value="MY" id="admin-dupe-cat-my" class="hidden peer" checked>
                    <span class="px-3.5 py-1.5 rounded-lg text-xs font-headline font-bold flex items-center gap-1.5 transition-all text-deep-navy peer-checked:bg-atmospheric-blue peer-checked:text-white peer-checked:shadow-sm">
                      <span>🇲🇾</span>
                      <span>Malaysia</span>
                    </span>
                  </label>
                  <label class="cursor-pointer">
                    <input type="radio" name="admin-dupe-category" value="Other" id="admin-dupe-cat-other" class="hidden peer">
                    <span class="px-3.5 py-1.5 rounded-lg text-xs font-headline font-bold flex items-center gap-1.5 transition-all text-deep-navy peer-checked:bg-atmospheric-blue peer-checked:text-white peer-checked:shadow-sm">
                      <span>🌐</span>
                      <span>Other</span>
                    </span>
                  </label>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] font-headline font-bold text-deep-navy uppercase mb-1">
                    ${t('admin.designerRefField') || 'Original Designer Reference (Dupe Of)'}
                  </label>
                  <input type="text" id="admin-form-dupe-of" class="neu-inset w-full px-3 py-1.5 rounded-xl text-xs font-body text-deep-navy outline-none" placeholder="e.g. Creed Aventus">
                </div>
                <div>
                  <label class="block text-[10px] font-headline font-bold text-deep-navy uppercase mb-1">
                    ${t('admin.matchScoreField') || 'DNA Match Score (%)'}
                  </label>
                  <input type="number" id="admin-form-match-score" min="50" max="100" class="neu-inset w-full px-3 py-1.5 rounded-xl text-xs font-body text-deep-navy outline-none" placeholder="94">
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-headline font-bold text-deep-navy uppercase mb-1">
              ${t('admin.imageUploadLabel') || 'Upload Flacon Image (Firebase Storage)'}
            </label>
            <div id="admin-image-dropzone" class="neu-inset rounded-2xl p-4 text-center cursor-pointer border-2 border-dashed border-atmospheric-blue/30 hover:border-atmospheric-blue transition-all">
              <input type="file" id="admin-form-file" accept="image/*" class="hidden">
              <div id="admin-image-dropzone-content" class="flex flex-col items-center gap-2">
                <span class="material-symbols-outlined text-3xl text-atmospheric-blue">cloud_upload</span>
                <span class="text-xs font-headline font-bold text-deep-navy">
                  ${t('admin.dragDropNotice') || 'Drag & drop image here, or click to select file'}
                </span>
                <span class="text-[10px] text-outline font-mono">${t('admin.autoCompressHint') || 'PNG, JPG, WebP (Auto-compress <200KB, max 800px)'}</span>
              </div>
              <div id="admin-image-progress-container" class="hidden w-full mt-3">
                <div class="w-full bg-slate-200/60 rounded-full h-2 overflow-hidden neu-inset">
                  <div id="admin-image-progress-bar" class="bg-atmospheric-blue h-2 rounded-full transition-all duration-200" style="width: 0%"></div>
                </div>
                <div class="flex items-center justify-between mt-1 text-[10px] font-mono">
                  <span id="admin-image-progress-text" class="font-bold text-atmospheric-blue">0%</span>
                  <span id="admin-image-progress-status" class="text-outline">Processing...</span>
                </div>
              </div>
              <div id="admin-image-preview-container" class="hidden mt-3 flex items-center justify-center gap-3">
                <img id="admin-image-preview" src="" alt="" class="w-16 h-16 object-contain rounded-xl neu-flat p-1" onerror="if (this.dataset.blob) { this.src = this.dataset.blob; } else { this.onerror=null; this.src='${DEFAULT_FLACON_PLACEHOLDER}'; }">
                <div class="text-left">
                  <div class="flex items-center gap-1.5">
                    <span id="admin-image-spinner" class="hidden material-symbols-outlined text-sm text-atmospheric-blue animate-spin">progress_activity</span>
                    <div id="admin-image-status" class="text-xs font-headline font-bold text-deep-navy"></div>
                  </div>
                  <div id="admin-image-metrics" class="text-[10px] font-mono text-outline"></div>
                </div>
              </div>
            </div>
            <input type="url" id="admin-form-image" class="mt-2 neu-inset w-full px-3.5 py-2 rounded-xl text-xs font-body text-deep-navy outline-none" placeholder="https://... (Image URL)">
          </div>

          <!-- Hidden or alias designer ref for full compatibility -->
          <input type="hidden" id="admin-form-designer-ref" value="">

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-[11px] font-headline font-bold text-deep-navy uppercase">${t('admin.tableAccords') || 'Main Accords'} % (${t('admin.accordsFormatHint') || 'Format: Name %'})</label>
              <span class="text-[10px] font-mono text-outline">${t('admin.accordsFormatHint') || 'Supports up to 8 - 10 Main Accords with percentages (%)'}</span>
            </div>
            <input type="text" id="admin-form-accords" class="neu-inset w-full px-3.5 py-2 rounded-xl text-xs font-body text-deep-navy outline-none" placeholder="Citrus 88%, Amber 72%, Woody 65%, Musky 55%, Fresh 50%, Powdery 45%, Warm Spicy 40%, Patchouli 35%">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-[11px] font-headline font-bold text-deep-navy uppercase mb-1">${t('admin.topNotesField') || 'Top Notes (comma separated)'}</label>
              <input type="text" id="admin-form-notes-top" class="neu-inset w-full px-3.5 py-2 rounded-xl text-xs font-body text-deep-navy outline-none" placeholder="Bergamot, Lemon">
            </div>
            <div>
              <label class="block text-[11px] font-headline font-bold text-deep-navy uppercase mb-1">${t('admin.midNotesField') || 'Heart Notes (comma separated)'}</label>
              <input type="text" id="admin-form-notes-mid" class="neu-inset w-full px-3.5 py-2 rounded-xl text-xs font-body text-deep-navy outline-none" placeholder="Jasmine, Birch">
            </div>
            <div>
              <label class="block text-[11px] font-headline font-bold text-deep-navy uppercase mb-1">${t('admin.baseNotesField') || 'Base Notes (comma separated)'}</label>
              <input type="text" id="admin-form-notes-base" class="neu-inset w-full px-3.5 py-2 rounded-xl text-xs font-body text-deep-navy outline-none" placeholder="Ambroxan, Musk">
            </div>
          </div>

          <!-- When To Wear (3 Separate Categories) -->
          <div class="space-y-3 border-t border-border-hairline pt-3">
            <div class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-atmospheric-blue text-sm">event_available</span>
              <label class="block text-[11px] font-headline font-bold text-deep-navy uppercase">${t('admin.whenToWearField') || 'When To Wear'}</label>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <!-- 1. Day / Night / Versatile -->
              <div>
                <label class="block text-[10px] font-headline font-bold text-deep-navy uppercase mb-1">
                  1. When To Wear (Day / Night / Versatile)
                </label>
                <select
                  id="admin-form-whentowear-time"
                  class="neu-inset w-full px-3.5 py-2 rounded-xl text-xs font-body text-deep-navy outline-none bg-surface-container-low cursor-pointer"
                >
                  <option value="Versatile">Versatile (Day & Night)</option>
                  <option value="Day">Day</option>
                  <option value="Night">Night</option>
                </select>
                <div class="flex gap-1.5 mt-1.5">
                  <button type="button" class="admin-time-chip px-2 py-0.5 rounded-full text-[9px] font-headline font-bold neu-button text-atmospheric-blue hover:text-deep-navy cursor-pointer" data-val="Versatile">Versatile</button>
                  <button type="button" class="admin-time-chip px-2 py-0.5 rounded-full text-[9px] font-headline font-bold neu-button text-sunset-amber hover:text-deep-navy cursor-pointer" data-val="Day">Day</button>
                  <button type="button" class="admin-time-chip px-2 py-0.5 rounded-full text-[9px] font-headline font-bold neu-button text-indigo-400 hover:text-deep-navy cursor-pointer" data-val="Night">Night</button>
                </div>
              </div>

              <!-- 2. Occasions & Setting -->
              <div>
                <label class="block text-[10px] font-headline font-bold text-deep-navy uppercase mb-1">
                  2. Occasions & Setting (Setting)
                </label>
                <input
                  type="text"
                  id="admin-form-whentowear-occasions"
                  class="neu-inset w-full px-3.5 py-2 rounded-xl text-xs font-body text-deep-navy outline-none"
                  placeholder="Office, Outdoor Warm & Humid, Casual"
                >
              </div>

              <!-- 3. Weather Suitability -->
              <div>
                <label class="block text-[10px] font-headline font-bold text-deep-navy uppercase mb-1">
                  3. Weather Suitability (Weather)
                </label>
                <input
                  type="text"
                  id="admin-form-whentowear-weather"
                  class="neu-inset w-full px-3.5 py-2 rounded-xl text-xs font-body text-deep-navy outline-none"
                  placeholder="Year-Round (Tropical)"
                >
              </div>
            </div>
            <input type="hidden" id="admin-form-whentowear" value="">
          </div>
          </div>

          <!-- Sticky Bottom Footer with Dark Background & Mobile-Friendly Touchable Area -->
          <div class="sticky bottom-0 z-30 px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 bg-[#F8F9FA] dark:bg-[#111827] border-t border-border-hairline shadow-[0_-4px_16px_rgba(0,0,0,0.12)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.5)] flex items-center justify-end gap-3 pointer-events-auto">
            <button type="button" id="admin-cancel-modal-btn" class="neu-button min-h-[44px] px-5 sm:px-6 py-2.5 rounded-full font-headline text-xs font-bold text-outline hover:text-deep-navy cursor-pointer touch-manipulation pointer-events-auto flex items-center justify-center">
              ${t('admin.cancel') || 'Cancel'}
            </button>
            <button type="submit" id="admin-save-perfume-btn" class="min-h-[44px] px-6 sm:px-8 py-2.5 rounded-full bg-atmospheric-blue text-white font-headline text-xs font-bold shadow-md hover:brightness-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px] touch-manipulation pointer-events-auto z-30">
              <span id="admin-save-spinner" class="hidden material-symbols-outlined text-sm animate-spin">progress_activity</span>
              <span id="admin-save-btn-text">${t('admin.savePerfume') || 'Save Perfume'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  `;
}

/**
 * Attaches event listeners for AdminView with preserved scroll positions and real-time updates
 */
export function attachAdminListeners() {
  if (!authService.isAdmin()) return;
  const root = document.getElementById('admin-view-root');
  if (!root) return;

  // Cleanup existing subscriptions if view was re-mounted
  if (typeof window !== 'undefined') {
    if (window.__adminPresenceUnsub && typeof window.__adminPresenceUnsub === 'function') {
      try { window.__adminPresenceUnsub(); } catch (_) {}
      window.__adminPresenceUnsub = null;
    }
    if (window.__adminTelemetryUnsub && typeof window.__adminTelemetryUnsub === 'function') {
      try { window.__adminTelemetryUnsub(); } catch (_) {}
      window.__adminTelemetryUnsub = null;
    }
  }

  // 1. Live Active Users Real-Time Subscription
  const liveUsersEl = document.getElementById('admin-live-users-count');
  if (liveUsersEl) {
    const unsubPresence = presenceService.subscribeActiveUsersCount((count) => {
      const el = document.getElementById('admin-live-users-count');
      if (el) {
        el.textContent = String(count > 0 ? count : 1);
      }
    });
    if (typeof window !== 'undefined') {
      window.__adminPresenceUnsub = unsubPresence;
    }
  }

  // 2. Weather Sensor Telemetry Real-Time Subscription
  const unsubTelemetry = weatherService.subscribeSensorTelemetry((telemetry) => {
    if (!telemetry) return;
    const tempEl = document.getElementById('admin-telemetry-temp');
    const skinEl = document.getElementById('admin-telemetry-skintemp');
    const humEl = document.getElementById('admin-telemetry-humidity');
    const evapEl = document.getElementById('admin-telemetry-evap');
    const projEl = document.getElementById('admin-telemetry-projection');
    const famEl = document.getElementById('admin-telemetry-family');
    const stationEl = document.getElementById('admin-telemetry-station');
    const lastSyncEl = document.getElementById('admin-telemetry-lastsync');

    if (tempEl) tempEl.textContent = `${telemetry.temperature || 31}°C`;
    if (skinEl) skinEl.textContent = `${telemetry.skinTemp || (Number(telemetry.temperature || 31) + 2.8).toFixed(1)}°C`;
    if (humEl) humEl.textContent = `${telemetry.humidity || 78}% RH`;
    if (evapEl) evapEl.textContent = `${telemetry.evaporationRate || '3.4x'}`;
    if (projEl) projEl.textContent = `${telemetry.projectionHold || '4 - 6 Jam'}`;
    if (famEl) {
      famEl.textContent = telemetry.recommendedFamily || 'Aquatic Marine';
      famEl.title = telemetry.recommendedFamily || 'Aquatic Marine';
    }
    if (stationEl) stationEl.textContent = `${t('admin.stationLabel')}: ${telemetry.stationName || telemetry.stationId || 'Kuala Lumpur'}`;
    if (lastSyncEl) {
      const d = telemetry.lastSync ? new Date(telemetry.lastSync) : new Date();
      lastSyncEl.textContent = `${t('admin.syncLabel')}: ${d.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    }
  });
  if (typeof window !== 'undefined') {
    window.__adminTelemetryUnsub = unsubTelemetry;
  }

  // Tabs switching (Catalog, Comments, Logs)
  const tabCatalogBtn = document.getElementById('admin-tab-catalog');
  const tabCommentsBtn = document.getElementById('admin-tab-comments');
  const tabLogsBtn = document.getElementById('admin-tab-logs');
  const catalogView = document.getElementById('admin-catalog-view');
  const commentsView = document.getElementById('admin-comments-view');
  const logsView = document.getElementById('admin-logs-view');

  const switchTab = (target) => {
    activeTab = target;
    [tabCatalogBtn, tabCommentsBtn, tabLogsBtn].forEach(btn => {
      btn?.classList.remove('neu-inset', 'text-atmospheric-blue');
      btn?.classList.add('neu-button', 'text-deep-navy');
    });
    [catalogView, commentsView, logsView].forEach(view => view?.classList.add('hidden'));

    if (target === 'catalog') {
      tabCatalogBtn?.classList.add('neu-inset', 'text-atmospheric-blue');
      tabCatalogBtn?.classList.remove('neu-button', 'text-deep-navy');
      catalogView?.classList.remove('hidden');
    } else if (target === 'comments') {
      tabCommentsBtn?.classList.add('neu-inset', 'text-atmospheric-blue');
      tabCommentsBtn?.classList.remove('neu-button', 'text-deep-navy');
      commentsView?.classList.remove('hidden');
    } else if (target === 'logs') {
      tabLogsBtn?.classList.add('neu-inset', 'text-atmospheric-blue');
      tabLogsBtn?.classList.remove('neu-button', 'text-deep-navy');
      logsView?.classList.remove('hidden');
    }
  };

  tabCatalogBtn?.addEventListener('click', (e) => { e.preventDefault(); switchTab('catalog'); });
  tabCommentsBtn?.addEventListener('click', (e) => { e.preventDefault(); switchTab('comments'); });
  tabLogsBtn?.addEventListener('click', (e) => { e.preventDefault(); switchTab('logs'); });

  // Modal helpers
  const modal = document.getElementById('admin-perfume-modal');
  const modalTitle = document.getElementById('admin-modal-title');
  const form = document.getElementById('admin-perfume-form');
  const isDupeCheckbox = document.getElementById('admin-form-is-dupe');
  const dupeContainer = document.getElementById('admin-dupe-fields-container');

  let isUploadingImage = false;
  let uploadedImageUrl = null;
  let hasUploadedNewImage = false;
  let lastUploadedStorageUrl = null;
  let currentBlobUrl = null;

  // Centralized reactive form state matching formData / setFormData specification
  let formData = {
    id: '',
    name: '',
    brand: '',
    gender: 'unisex',
    longevity: '8 - 10 Hours',
    sillage: '2.0 m',
    imageUrl: '',
    image: '',
    origin: 'UAE',
    shopeeUrl: '',
    tiktokUrl: '',
    isDupe: false,
    dupeCategory: 'MY',
    dupeOf: '',
    targetType: 'Designer',
    matchScore: 90,
    accords: '',
    topNotes: '',
    midNotes: '',
    baseNotes: '',
    whenToWear: '',
    whenToWearTime: 'Versatile',
    whenToWearOccasions: '',
    whenToWearWeather: ''
  };

  const setFormData = (updater) => {
    if (typeof updater === 'function') {
      formData = updater(formData);
    } else if (typeof updater === 'object' && updater !== null) {
      formData = { ...formData, ...updater };
    }

    if (formData.imageUrl) {
      uploadedImageUrl = formData.imageUrl;
      lastUploadedStorageUrl = formData.imageUrl;
      hasUploadedNewImage = true;
      if (urlInput && urlInput.value !== formData.imageUrl) {
        urlInput.value = formData.imageUrl;
      }
      if (previewImg && previewImg.src !== formData.imageUrl) {
        previewImg.src = formData.imageUrl;
      }
    }
  };

  const saveBtn = document.getElementById('admin-save-perfume-btn');
  const saveSpinner = document.getElementById('admin-save-spinner');
  const saveBtnText = document.getElementById('admin-save-btn-text');

  const setUploadingState = (uploading) => {
    isUploadingImage = uploading;
    if (saveBtn) {
      saveBtn.disabled = uploading;
    }
    if (saveSpinner) {
      if (uploading) {
        saveSpinner.classList.remove('hidden');
      } else {
        saveSpinner.classList.add('hidden');
      }
    }
    if (saveBtnText) {
      saveBtnText.textContent = uploading ? (t('admin.uploading') || 'Memuat naik...') : t('admin.savePerfume');
    }
    const imgSpinner = document.getElementById('admin-image-spinner');
    if (imgSpinner) {
      if (uploading) imgSpinner.classList.remove('hidden');
      else imgSpinner.classList.add('hidden');
    }
  };

  isDupeCheckbox?.addEventListener('change', () => {
    if (isDupeCheckbox.checked) {
      dupeContainer?.classList.remove('hidden');
    } else {
      dupeContainer?.classList.add('hidden');
      const dupeOfInput = document.getElementById('admin-form-dupe-of');
      const targetTypeInput = document.getElementById('admin-form-target-type');
      const matchScoreInput = document.getElementById('admin-form-match-score');
      if (dupeOfInput) dupeOfInput.value = '';
      if (targetTypeInput) targetTypeInput.value = 'Designer';
      if (matchScoreInput) matchScoreInput.value = '';
    }
  });

  const openModal = (isEdit = false, perfume = null) => {
    setUploadingState(false);
    hasUploadedNewImage = false;
    lastUploadedStorageUrl = null;
    if (currentBlobUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
      try { URL.revokeObjectURL(currentBlobUrl); } catch (_) {}
    }
    currentBlobUrl = null;
    const existingImg = perfume?.imageUrl || perfume?.image || '';
    uploadedImageUrl = existingImg || null;
    modalTitle.textContent = isEdit 
      ? `✏️ ${t('admin.editPerfume') || 'Edit Perfume'}` 
      : `➕ ${t('admin.addPerfume') || 'Add New Perfume'}`;
    if (saveBtnText) {
      saveBtnText.textContent = t('admin.savePerfume') || 'Save Perfume';
    }
    editingPerfumeId = isEdit && perfume ? perfume.id : null;

    // Auto-translate/normalize Malay data to English standard when loading form
    const normGender = normalizeGender(perfume?.gender);
    const rawLongevity = perfume?.longevity || '';
    const normLongevity = rawLongevity ? autoTranslateToEnglish(rawLongevity) : (isEdit ? '' : '8 - 10 Hours');

    // Notes auto-translation to English
    const topNotesArr = translateNotes(perfume?.notes?.top || [], 'en');
    const topNotesVal = Array.isArray(topNotesArr) ? topNotesArr.join(', ') : (topNotesArr || '');

    const midNotesArr = translateNotes(perfume?.notes?.mid || [], 'en');
    const midNotesVal = Array.isArray(midNotesArr) ? midNotesArr.join(', ') : (midNotesArr || '');

    const baseNotesArr = translateNotes(perfume?.notes?.base || [], 'en');
    const baseNotesVal = Array.isArray(baseNotesArr) ? baseNotesArr.join(', ') : (baseNotesArr || '');

    // Accords auto-translation to English
    let accordsVal = '';
    if (Array.isArray(perfume?.mainAccords) && perfume.mainAccords.length > 0) {
      accordsVal = perfume.mainAccords.map(a => `${autoTranslateToEnglish(a.name)} ${a.percentage}%`).join(', ');
    } else if (Array.isArray(perfume?.accords)) {
      accordsVal = perfume.accords.map(autoTranslateToEnglish).join(', ');
    } else if (typeof perfume?.accords === 'string') {
      accordsVal = autoTranslateToEnglish(perfume.accords);
    }

    // When to wear (3 separate categories) with English translation
    let timeVal = 'Versatile';
    if (perfume) {
      timeVal = getPerfumeTimeSuitability(perfume);
    }

    const rawOccasions = perfume?.whenToWear?.occasions || perfume?.whenToWear?.occasion;
    let occasionsVal = '';
    if (Array.isArray(rawOccasions) && rawOccasions.length > 0) {
      occasionsVal = rawOccasions.map(autoTranslateToEnglish).join(', ');
    } else if (typeof rawOccasions === 'string' && rawOccasions.trim()) {
      occasionsVal = autoTranslateToEnglish(rawOccasions);
    }

    const rawWeather = perfume?.whenToWear?.weather || perfume?.whenToWear?.season;
    let weatherVal = '';
    if (Array.isArray(rawWeather) && rawWeather.length > 0) {
      weatherVal = rawWeather.map(autoTranslateToEnglish).join(', ');
    } else if (typeof rawWeather === 'string' && rawWeather.trim()) {
      weatherVal = autoTranslateToEnglish(rawWeather);
    }

    setFormData({
      id: perfume?.id || '',
      name: perfume?.name || '',
      brand: perfume?.brand || '',
      gender: normGender,
      longevity: normLongevity,
      sillage: perfume?.sillageDistance || perfume?.sillage || '',
      imageUrl: existingImg,
      image: existingImg,
      origin: perfume?.originCountry || perfume?.origin || 'UAE',
      shopeeUrl: perfume?.shopeeUrl || '',
      tiktokUrl: perfume?.tiktokUrl || '',
      isDupe: Boolean(perfume?.isDupe || perfume?.dupeOf || perfume?.originalDesignerRef),
      dupeCategory: perfume?.dupeCategory || (((perfume?.origin || perfume?.originCountry || '').toUpperCase() === 'MY') ? 'MY' : 'Other'),
      dupeOf: perfume?.dupeOf || perfume?.originalDesignerRef || '',
      targetType: perfume?.targetType || 'Designer',
      matchScore: perfume?.matchScore || perfume?.matchPercent || 90,
      accords: accordsVal,
      topNotes: topNotesVal,
      midNotes: midNotesVal,
      baseNotes: baseNotesVal,
      whenToWear: occasionsVal,
      whenToWearTime: timeVal,
      whenToWearOccasions: occasionsVal,
      whenToWearWeather: weatherVal
    });

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined && val !== null ? val : '';
    };

    setVal('admin-form-id', perfume?.id || '');
    setVal('admin-form-name', perfume?.name || '');
    setVal('admin-form-brand', perfume?.brand || '');
    setVal('admin-form-gender', normGender);
    setVal('admin-form-longevity', normLongevity);
    setVal('admin-form-sillage', perfume?.sillageDistance || perfume?.sillage || '');
    setVal('admin-form-image', existingImg);

    // Origin Country & E-Commerce links
    const originSelect = document.getElementById('admin-form-origin');
    if (originSelect) originSelect.value = perfume?.originCountry || perfume?.origin || 'UAE';
    setVal('admin-form-shopee-url', perfume?.shopeeUrl || '');
    setVal('admin-form-tiktok-url', perfume?.tiktokUrl || '');

    // Dupe configuration
    const isDupe = Boolean(perfume?.isDupe || perfume?.dupeOf || perfume?.originalDesignerRef);
    if (isDupeCheckbox) isDupeCheckbox.checked = isDupe;
    if (dupeContainer) {
      if (isDupe) dupeContainer.classList.remove('hidden');
      else dupeContainer.classList.add('hidden');
    }
    const dupeCategoryVal = perfume?.dupeCategory || (((perfume?.origin || perfume?.originCountry || '').toUpperCase() === 'MY') ? 'MY' : 'Other');
    const rMy = document.getElementById('admin-dupe-cat-my');
    const rOther = document.getElementById('admin-dupe-cat-other');
    if (rMy && rOther) {
      if (dupeCategoryVal === 'Other') {
        rOther.checked = true;
      } else {
        rMy.checked = true;
      }
    }
    setVal('admin-form-dupe-of', perfume?.dupeOf || perfume?.originalDesignerRef || '');
    setVal('admin-form-designer-ref', perfume?.originalDesignerRef || perfume?.dupeOf || '');
    setVal('admin-form-target-type', perfume?.targetType || 'Designer');
    setVal('admin-form-match-score', perfume?.matchScore || perfume?.matchPercent || 90);

    // Accords format (supporting 8-10 accords)
    setVal('admin-form-accords', accordsVal);

    // Notes
    setVal('admin-form-notes-top', topNotesVal);
    setVal('admin-form-notes-mid', midNotesVal);
    setVal('admin-form-notes-base', baseNotesVal);

    // When to wear (3 separate categories populated on edit & add)
    const timeInput = document.getElementById('admin-form-whentowear-time');
    if (timeInput) timeInput.value = timeVal;
    const occasionsInput = document.getElementById('admin-form-whentowear-occasions');
    if (occasionsInput) occasionsInput.value = occasionsVal;
    const weatherInput = document.getElementById('admin-form-whentowear-weather');
    if (weatherInput) weatherInput.value = weatherVal;
    const legacyWhenToWear = document.getElementById('admin-form-whentowear');
    if (legacyWhenToWear) legacyWhenToWear.value = occasionsVal;

    // Image Preview & Upload dropzone reset/population
    const previewContainer = document.getElementById('admin-image-preview-container');
    const previewImg = document.getElementById('admin-image-preview');
    const statusEl = document.getElementById('admin-image-status');
    const metricsEl = document.getElementById('admin-image-metrics');
    const fileInput = document.getElementById('admin-form-file');
    if (fileInput) fileInput.value = '';

    if (existingImg) {
      if (previewImg) {
        delete previewImg.dataset.blob;
        previewImg.src = existingImg;
      }
      if (previewContainer) previewContainer.classList.remove('hidden');
      if (statusEl) {
        statusEl.textContent = 'Existing image';
        statusEl.className = 'text-xs font-headline font-bold text-deep-navy';
      }
      if (metricsEl) metricsEl.textContent = '';
    } else {
      if (previewContainer) previewContainer.classList.add('hidden');
      if (previewImg) {
        delete previewImg.dataset.blob;
        previewImg.src = '';
      }
      if (statusEl) statusEl.textContent = '';
      if (metricsEl) metricsEl.textContent = '';
    }

    const progressContainer = document.getElementById('admin-image-progress-container');
    const progressBar = document.getElementById('admin-image-progress-bar');
    const progressText = document.getElementById('admin-image-progress-text');
    const progressStatus = document.getElementById('admin-image-progress-status');
    if (progressContainer) progressContainer.classList.add('hidden');
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.textContent = '0%';
    if (progressStatus) progressStatus.textContent = '';

    modal?.classList.remove('hidden');
    const scrollContainer = modal?.querySelector('.overflow-y-auto');
    if (scrollContainer && scrollContainer.scrollTo) {
      scrollContainer.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const closeModal = () => {
    try {
      modal?.classList.add('hidden');
      form?.reset();
      editingPerfumeId = null;
      uploadedImageUrl = null;
      hasUploadedNewImage = false;
      lastUploadedStorageUrl = null;
      setFormData({
        id: '',
        name: '',
        brand: '',
        imageUrl: '',
        image: ''
      });
      if (currentBlobUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
        try { URL.revokeObjectURL(currentBlobUrl); } catch (_) {}
      }
      currentBlobUrl = null;
      setUploadingState(false);

      const previewContainer = document.getElementById('admin-image-preview-container');
      const previewImg = document.getElementById('admin-image-preview');
      const statusEl = document.getElementById('admin-image-status');
      const metricsEl = document.getElementById('admin-image-metrics');
      const fileInput = document.getElementById('admin-form-file');
      const progressContainer = document.getElementById('admin-image-progress-container');
      const progressBar = document.getElementById('admin-image-progress-bar');
      const progressText = document.getElementById('admin-image-progress-text');
      const progressStatus = document.getElementById('admin-image-progress-status');

      if (fileInput) fileInput.value = '';
      if (previewContainer) previewContainer.classList.add('hidden');
      if (progressContainer) progressContainer.classList.add('hidden');
      if (progressBar) progressBar.style.width = '0%';
      if (progressText) progressText.textContent = '0%';
      if (progressStatus) progressStatus.textContent = '';
      if (previewImg) {
        delete previewImg.dataset.blob;
        previewImg.src = '';
      }
      if (statusEl) statusEl.textContent = '';
      if (metricsEl) metricsEl.textContent = '';
      const rMy = document.getElementById('admin-dupe-cat-my');
      if (rMy) rMy.checked = true;
    } catch (err) {
      console.warn('[AdminView] Error in closeModal:', err);
    } finally {
      modal?.classList.add('hidden');
    }
  };

  document.getElementById('admin-open-add-modal-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(false);
  });
  document.getElementById('admin-close-modal-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal();
  });
  document.getElementById('admin-cancel-modal-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal();
  });
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // When To Wear Time chip selection
  document.querySelectorAll('.admin-time-chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const val = btn.dataset.val;
      const select = document.getElementById('admin-form-whentowear-time');
      if (select && val) {
        select.value = val;
      }
    });
  });

  // Image Upload & Dropzone Handling
  const dropzone = document.getElementById('admin-image-dropzone');
  const fileInput = document.getElementById('admin-form-file');
  const previewContainer = document.getElementById('admin-image-preview-container');
  const previewImg = document.getElementById('admin-image-preview');
  const statusEl = document.getElementById('admin-image-status');
  const metricsEl = document.getElementById('admin-image-metrics');
  const urlInput = document.getElementById('admin-form-image');

  urlInput?.addEventListener('input', () => {
    const val = urlInput.value.trim() || '';
    setFormData((prev) => ({ ...prev, imageUrl: val, image: val }));
    uploadedImageUrl = val || null;
    hasUploadedNewImage = false;
    lastUploadedStorageUrl = null;
    if (val && previewImg) {
      delete previewImg.dataset.blob;
      previewImg.src = val;
      if (previewContainer) previewContainer.classList.remove('hidden');
    }
  });

  const processAndUploadFile = async (file) => {
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    setUploadingState(true);

    const progressContainer = document.getElementById('admin-image-progress-container');
    const progressBar = document.getElementById('admin-image-progress-bar');
    const progressText = document.getElementById('admin-image-progress-text');
    const progressStatus = document.getElementById('admin-image-progress-status');

    const updateProgress = (pct, msg) => {
      if (progressContainer) progressContainer.classList.remove('hidden');
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (progressText) progressText.textContent = `${pct}%`;
      if (progressStatus && msg) progressStatus.textContent = msg;
    };

    updateProgress(5, 'Compressing image...');

    if (previewContainer) previewContainer.classList.remove('hidden');
    if (statusEl) {
      statusEl.textContent = 'Compressing image...';
      statusEl.className = 'text-xs font-headline font-bold text-atmospheric-blue';
    }
    if (metricsEl) metricsEl.textContent = '';

    try {
      if (typeof URL !== 'undefined' && URL.createObjectURL && previewImg && typeof file === 'object') {
        try {
          if (currentBlobUrl && URL.revokeObjectURL) {
            try { URL.revokeObjectURL(currentBlobUrl); } catch (_) {}
          }
          currentBlobUrl = URL.createObjectURL(file);
          previewImg.dataset.blob = currentBlobUrl;
          previewImg.src = currentBlobUrl;
        } catch (_) {}
      }

      // Non-blocking yield to allow browser to render preview and spinner smoothly
      await new Promise(r => setTimeout(r, 10));

      // 1. Upload to Firebase Storage with Canvas compression (< 180KB, max 800px) & progress observer
      const perfumeId = editingPerfumeId || document.getElementById('admin-form-id')?.value || null;
      const uploadRes = await storageService.uploadPerfumeImage(file, perfumeId, (pct, msg) => {
        updateProgress(pct, msg);
        if (statusEl && msg) {
          statusEl.textContent = msg;
        }
      });

      // 2. Immediately overwrite imageUrl state with download URL and alt=media token
      const finalUrl = uploadRes.downloadUrl || uploadRes.url;
      const downloadURL = finalUrl;
      hasUploadedNewImage = true;
      lastUploadedStorageUrl = downloadURL;
      uploadedImageUrl = downloadURL;

      // Automatic Form State Sync via callback matching requirement
      setFormData((prev) => ({ ...prev, imageUrl: downloadURL }));

      if (urlInput) {
        urlInput.value = downloadURL;
      }

      const originalSize = file.size || 0;
      const compressedSize = uploadRes.sizeBytes || originalSize;
      const origKb = Math.round(originalSize / 1024);
      const compKb = Math.round(compressedSize / 1024);
      if (metricsEl) {
        metricsEl.textContent = `Original: ${origKb}KB ➔ Compressed: ${compKb}KB`;
      }

      // Update image preview: test remote load or retain blob preview smoothly
      if (previewImg) {
        const testRemote = new Image();
        testRemote.onload = () => {
          if (previewImg) previewImg.src = finalUrl;
        };
        testRemote.onerror = () => {
          // If CORS prevents loading the remote URL in local environment, keep local blob
          if (previewImg && currentBlobUrl) {
            previewImg.src = currentBlobUrl;
          }
        };
        testRemote.src = finalUrl;
      }

      if (statusEl) {
        statusEl.textContent = '✓ Uploaded & compressed successfully!';
        statusEl.className = 'text-xs font-headline font-bold text-green-600';
      }

      // 3. Immediate Firebase Storage to Firestore sync if editing existing perfume
      if (editingPerfumeId) {
        try {
          await adminService.updatePerfume(editingPerfumeId, {
            imageUrl: finalUrl,
            image: finalUrl
          });
        } catch (syncErr) {
          console.warn('[AdminView] Firestore image sync error:', syncErr);
        }
      }
    } catch (err) {
      console.error('[AdminView] Upload error:', err);
      if (statusEl) {
        statusEl.textContent = '✗ Failed to upload image.';
        statusEl.className = 'text-xs font-headline font-bold text-red-600';
      }
      if (progressStatus) {
        progressStatus.textContent = 'Upload error';
      }
    } finally {
      setUploadingState(false);
    }
  };

  dropzone?.addEventListener('click', (e) => {
    if (e.target !== fileInput) {
      fileInput?.click();
    }
  });

  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  });

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-atmospheric-blue', 'bg-atmospheric-blue/5');
  });

  dropzone?.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-atmospheric-blue', 'bg-atmospheric-blue/5');
  });

  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-atmospheric-blue', 'bg-atmospheric-blue/5');
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  });

  // Table action listeners helper
  const attachTableListeners = () => {
    // Edit buttons
    document.querySelectorAll('.admin-edit-perfume-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        const perfumes = await perfumeService.getAllPerfumes();
        const p = perfumes.find(item => item.id === id);
        if (p) {
          openModal(true, p);
        }
      });
    });

    // Delete buttons
    document.querySelectorAll('.admin-delete-perfume-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const scrollY = window.scrollY;
        const id = btn.getAttribute('data-id');
        if (confirm(t('admin.confirmDeletePerfume'))) {
          await adminService.deletePerfume(id);
          const row = root.querySelector(`tr[data-perfume-id="${id}"]`);
          if (row) {
            row.remove();
          }
          const perfumes = await perfumeService.getAllPerfumes();
          const countEl = document.getElementById('admin-total-perfumes-count');
          if (countEl) countEl.textContent = String(perfumes.length);
          const tabCountEl = document.getElementById('admin-tab-catalog-count');
          if (tabCountEl) tabCountEl.textContent = `(${perfumes.length})`;
          window.scrollTo({ top: scrollY, behavior: 'instant' });
        }
      });
    });
  };

  // Form submit handler with in-place table update & scroll preservation
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isUploadingImage) {
      alert('Sila tunggu sehingga muat naik imej selesai.');
      return;
    }
    const scrollY = window.scrollY;
    let isSubmitting = true;
    let saveSuccess = false;

    // Set loading / submitting UI state
    if (saveBtn) saveBtn.disabled = true;
    if (saveSpinner) saveSpinner.classList.remove('hidden');

    try {
      // 1. Safe extraction of form values without assuming DOM elements exist
      const name = document.getElementById('admin-form-name')?.value?.trim() || '';
      const brand = document.getElementById('admin-form-brand')?.value?.trim() || '';
      const gender = normalizeGender(document.getElementById('admin-form-gender')?.value || 'unisex');
      const longevity = autoTranslateToEnglish(document.getElementById('admin-form-longevity')?.value?.trim() || '') || '8 - 10 Hours';
      const sillage = document.getElementById('admin-form-sillage')?.value?.trim() || '2.0 m';
      const inputImageUrl = document.getElementById('admin-form-image')?.value?.trim() || '';
      
      // Prioritize latest Firebase Storage uploaded URL from formData.imageUrl strictly over stale data
      const finalImageUrl = formData.imageUrl || (hasUploadedNewImage && lastUploadedStorageUrl ? lastUploadedStorageUrl : null) || uploadedImageUrl || inputImageUrl || DEFAULT_FLACON_PLACEHOLDER;
      const cleanFinalImageUrl = formatImageUrl(finalImageUrl) || DEFAULT_FLACON_PLACEHOLDER;
      
      // Origin & E-Commerce links
      const origin = document.getElementById('admin-form-origin')?.value || 'UAE';
      const shopeeUrl = document.getElementById('admin-form-shopee-url')?.value?.trim() || '';
      const tiktokUrl = document.getElementById('admin-form-tiktok-url')?.value?.trim() || '';

      // Dupe handling (Target Category removed from UI, safe fallback)
      const isDupe = isDupeCheckbox ? isDupeCheckbox.checked : false;
      const dupeCategory = isDupe
        ? (document.querySelector('input[name="admin-dupe-category"]:checked')?.value || 'MY')
        : '';
      const dupeOf = isDupe ? (document.getElementById('admin-form-dupe-of')?.value?.trim() || '') : '';
      const targetType = isDupe ? (document.getElementById('admin-form-target-type')?.value || 'Designer') : 'Designer';
      const matchScoreRaw = isDupe ? (document.getElementById('admin-form-match-score')?.value?.trim() || '') : '';
      const matchScore = matchScoreRaw ? parseInt(matchScoreRaw, 10) : 90;

      // 2. Explicit Validation with actionable user alerts (no freezing)
      if (!name) {
        alert('Sila masukkan Nama Wangian (Perfume Name).');
        document.getElementById('admin-form-name')?.focus();
        return;
      }
      if (!brand) {
        alert('Sila masukkan Jenama Wangian (Brand).');
        document.getElementById('admin-form-brand')?.focus();
        return;
      }
      if (!gender) {
        alert('Sila pilih Jantina (Gender).');
        document.getElementById('admin-form-gender')?.focus();
        return;
      }
      if (isDupe && !dupeOf) {
        alert('Sila masukkan Rujukan Designer Asal (Dupe Of) atau nyah-tanda pilihan Dupe/Clone.');
        document.getElementById('admin-form-dupe-of')?.focus();
        return;
      }

      // 3. Parse accords (supports up to 8 - 10 accords with percentages)
      const accordsRaw = document.getElementById('admin-form-accords')?.value || '';
      const mainAccords = [];
      const accordsList = [];
      accordsRaw.split(',').forEach(item => {
        const trimmed = item.trim();
        if (!trimmed) return;
        const match = trimmed.match(/(\d+)%/);
        const pct = match ? parseInt(match[1], 10) : 80;
        const rawAccName = trimmed.replace(/\s*\d+%\s*/, '').trim();
        const accName = autoTranslateToEnglish(rawAccName);
        if (accName) {
          accordsList.push(accName);
          mainAccords.push({ name: accName, percentage: pct });
        }
      });

      // 4. Parse notes with English auto-translation
      const rawTopNotes = document.getElementById('admin-form-notes-top')?.value || '';
      const rawMidNotes = document.getElementById('admin-form-notes-mid')?.value || '';
      const rawBaseNotes = document.getElementById('admin-form-notes-base')?.value || '';

      const topNotes = translateNotes(rawTopNotes, 'en').split(',').map(s => s.trim()).filter(Boolean);
      const midNotes = translateNotes(rawMidNotes, 'en').split(',').map(s => s.trim()).filter(Boolean);
      const baseNotes = translateNotes(rawBaseNotes, 'en').split(',').map(s => s.trim()).filter(Boolean);

      // 5. Parse when to wear across 3 categories
      const whenToWearTimeRaw = document.getElementById('admin-form-whentowear-time')?.value || '';
      const whenToWearOccasionsRaw = document.getElementById('admin-form-whentowear-occasions')?.value || document.getElementById('admin-form-whentowear')?.value || '';
      const whenToWearWeatherRaw = document.getElementById('admin-form-whentowear-weather')?.value || '';

      const normalizedTime = getPerfumeTimeSuitability({ whenToWear: { time: whenToWearTimeRaw } });
      const parsedTimes = [normalizedTime];
      const parsedOccasions = whenToWearOccasionsRaw.split(',').map(s => autoTranslateToEnglish(s.trim())).filter(Boolean);
      const weatherClean = autoTranslateToEnglish(whenToWearWeatherRaw.trim());

      const whenToWearPayload = {
        time: parsedTimes,
        occasions: parsedOccasions.length > 0 ? parsedOccasions : ['Office', 'Casual'],
        occasion: parsedOccasions.length > 0 ? parsedOccasions : ['Office', 'Casual'],
        weather: weatherClean || 'Year-Round (Tropical)',
        season: weatherClean || 'Year-Round (Tropical)'
      };

      const payload = {
        name,
        brand,
        gender,
        longevity,
        sillage,
        sillageDistance: sillage,
        imageUrl: cleanFinalImageUrl,
        image: cleanFinalImageUrl,
        origin,
        originCountry: origin,
        shopeeUrl: shopeeUrl || `https://shopee.com.my/search?keyword=${encodeURIComponent(name)}`,
        tiktokUrl: tiktokUrl || '',
        isDupe,
        dupeCategory: isDupe ? dupeCategory : '',
        dupeOf: isDupe ? dupeOf : '',
        originalDesignerRef: isDupe ? dupeOf : '',
        targetType: isDupe ? targetType : '',
        matchScore: isDupe ? matchScore : null,
        matchPercent: isDupe ? matchScore : null,
        accords: accordsList.length > 0 ? accordsList : ['Citrus', 'Woody'],
        mainAccords: mainAccords.length > 0 ? mainAccords : [{ name: 'Citrus', percentage: 85 }],
        notes: {
          top: topNotes.length > 0 ? topNotes : ['Bergamot'],
          mid: midNotes.length > 0 ? midNotes : ['Cedar'],
          base: baseNotes.length > 0 ? baseNotes : ['Musk']
        },
        whenToWear: whenToWearPayload
      };

      // 6. Firestore persistence
      let savedResult = null;
      if (editingPerfumeId) {
        savedResult = await adminService.updatePerfume(editingPerfumeId, payload);
      } else {
        savedResult = await adminService.createPerfume(payload);
      }
      saveSuccess = true;

      // Real-time live card and view updates across Admin, Home (Utama), and Detail without manual refresh
      const targetId = editingPerfumeId || savedResult?.id || payload.id;
      if (targetId) {
        // 1. Update any matching card image in current DOM
        document.querySelectorAll(`[data-id="${targetId}"] img, [data-perfume-id="${targetId}"] img`).forEach(img => {
          if (img) img.src = cleanFinalImageUrl;
        });

        // 2. Update Detail view flacon image if mounted
        const detailFlacon = document.querySelector('#header-section img');
        if (detailFlacon && (window.location.hash.includes(targetId) || window.location.hash.toLowerCase().includes(targetId.toLowerCase()))) {
          detailFlacon.src = cleanFinalImageUrl;
        }

        // 3. Broadcast custom event across the application shell
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('scentcast:perfumeUpdated', {
            detail: { id: targetId, imageUrl: cleanFinalImageUrl, image: cleanFinalImageUrl, perfume: { ...payload, id: targetId, imageUrl: cleanFinalImageUrl, image: cleanFinalImageUrl } }
          }));
        }
      }
    } catch (err) {
      console.error('[AdminView] Submit error:', err);
      alert(err.message || 'Ralat menyimpan wangian. Sila semak semula maklumat borang.');
    } finally {
      // 1. Reset loading / submitting state
      isSubmitting = false;
      if (saveBtn) saveBtn.disabled = false;
      if (saveSpinner) saveSpinner.classList.add('hidden');

      // 2. Force close modal and refresh catalog list state if save was successful
      if (saveSuccess) {
        closeModal();

        try {
          const freshPerfumes = await perfumeService.getAllPerfumes();
          const tbody = root.querySelector('#admin-catalog-view tbody');
          if (tbody) {
            tbody.innerHTML = freshPerfumes.map(p => renderPerfumeTableRow(p)).join('');
            attachTableListeners();
          }
          const countEl = document.getElementById('admin-total-perfumes-count');
          if (countEl) countEl.textContent = String(freshPerfumes.length);
          const tabCountEl = document.getElementById('admin-tab-catalog-count');
          if (tabCountEl) tabCountEl.textContent = `(${freshPerfumes.length})`;
          window.scrollTo({ top: scrollY, behavior: 'instant' });
        } catch (refreshErr) {
          console.warn('[AdminView] Error refreshing catalog table:', refreshErr);
        }
      }
    }
  });

  // Initial table listeners
  attachTableListeners();

  // Delete comment buttons in moderation list
  document.querySelectorAll('.admin-delete-comment-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const scrollY = window.scrollY;
      const id = btn.getAttribute('data-id');
      const perfumeId = btn.getAttribute('data-perfume-id');
      if (confirm(t('admin.confirmDeleteComment'))) {
        await adminService.deleteComment(perfumeId, id);
        const card = root.querySelector(`[data-comment-id="${id}"]`);
        if (card) {
          card.remove();
        }
        const comments = await adminService.getAllComments();
        const comCountEl = document.getElementById('admin-total-comments-count');
        if (comCountEl) comCountEl.textContent = String(comments.length);
        window.scrollTo({ top: scrollY, behavior: 'instant' });
      }
    });
  });
}

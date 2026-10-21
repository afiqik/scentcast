import { authService } from '../services/authService.js';
import { perfumeService } from '../services/perfumeService.js';
import { openAuthModal } from '../components/AuthModal.js';
import { renderPerfumeCard, attachPerfumeCardListeners } from '../components/PerfumeCard.js';
import { t } from '../services/i18nService.js';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'
];

let profileSavedUnsubscribe = null;

/**
 * ProfileView Data Helper
 * Provides collection data model without exposing bio, badges, or wardrobe stats.
 */
export function getProfileViewData(catalog = [], user = null) {
  if (!user) {
    return {
      rendered: false,
      message: 'Sila log masuk untuk melihat koleksi anda.',
      requiresAuth: true
    };
  }

  const savedIds = Array.isArray(user.savedPerfumes) ? user.savedPerfumes : [];
  const savedPerfumes = (catalog || []).filter(p => p && savedIds.includes(p.id));

  return {
    title: '❤️ Koleksi Saya',
    countText: `${savedPerfumes.length} wangian disimpan`,
    count: savedPerfumes.length,
    perfumes: savedPerfumes,
    isEmpty: savedPerfumes.length === 0,
    emptyMessage: 'Belum ada wangian disimpan. Tekan ❤️ pada mana-mana parfume.'
  };
}

/**
 * Renders Protected 3-Tier Neumorphic Profile View (#/profil)
 */
export async function renderProfileView() {
  const user = authService.getCurrentUser();
  const isGuest = authService.isGuest();

  // 1. Protected Route: Unauthenticated guest barrier
  if (isGuest || !user) {
    return `
    <div class="w-full px-4 md:px-8 pt-32 pb-20 max-w-xl mx-auto text-center space-y-6">
      <div class="w-20 h-20 rounded-full neu-inset mx-auto flex items-center justify-center text-atmospheric-blue">
        <span class="material-symbols-outlined text-4xl">lock</span>
      </div>
      <h1 class="font-headline text-3xl font-bold text-deep-navy">${t('profile.protectedTitle')}</h1>
      <p class="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed">
        ${t('profile.protectedDesc')}
      </p>
      <div class="pt-4 flex justify-center gap-3">
        <button id="profile-login-btn" class="px-8 py-3 rounded-full bg-atmospheric-blue text-white font-headline text-xs font-bold shadow-md hover:brightness-105 cursor-pointer">
          ${t('auth.loginBtn')}
        </button>
        <a href="#/" class="neu-button px-6 py-3 rounded-full font-headline text-xs font-bold text-deep-navy hover:text-atmospheric-blue transition-all">
          ${t('common.back')}
        </a>
      </div>
    </div>
    `;
  }

  const allPerfumes = await perfumeService.getAllPerfumes();
  let savedPerfumes = [];
  try {
    savedPerfumes = await perfumeService.getSavedPerfumes(user.uid);
    if (!Array.isArray(savedPerfumes)) savedPerfumes = [];
    user.savedPerfumes = savedPerfumes.map(p => p.id);
  } catch (err) {
    console.warn('[ProfileView] Could not fetch remote saved perfumes:', err);
    const localSavedIds = Array.isArray(user.savedPerfumes) ? user.savedPerfumes : [];
    savedPerfumes = allPerfumes.filter(p => localSavedIds.includes(p.id));
  }
  const userAvatar = user.photoURL || DEFAULT_AVATAR;
  const username = user.username || user.email?.split('@')[0] || 'user';
  const displayName = user.displayName || username;
  const roleName = user.role === 'admin' ? t('profile.adminRole') : t('profile.memberRole');

  return `
  <div class="w-full px-4 md:px-8 pt-28 pb-16 max-w-max-width mx-auto space-y-8" id="profile-view-root">
    
    <!-- TIER 1: User Info Card -->
    <div class="neu-flat rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-border-hairline">
      <div class="flex items-center gap-5">
        <!-- Circular Neumorphic Avatar -->
        <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full neu-inset p-1 shrink-0 overflow-hidden flex items-center justify-center">
          <img id="profile-display-avatar" src="${userAvatar}" alt="${displayName}" class="w-full h-full rounded-full object-cover" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';">
        </div>
        
        <!-- User Metadata -->
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="font-headline text-xl sm:text-2xl font-bold text-deep-navy" id="profile-display-name">
              ${displayName}
            </h1>
            <span class="neu-inset px-2.5 py-0.5 rounded-full text-[10px] font-headline font-bold uppercase tracking-wider ${user.role === 'admin' ? 'text-sunset-amber' : 'text-atmospheric-blue'}">
              ${roleName}
            </span>
          </div>
          <p class="font-mono text-xs sm:text-sm text-atmospheric-blue font-semibold" id="profile-display-handle">
            @${username}
          </p>
          <p class="font-body text-xs text-on-surface-variant">
            ${user.email}
          </p>
        </div>
      </div>

      <!-- Stats & Logout Action -->
      <div class="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-border-hairline">
        <div class="neu-inset px-4 py-2 rounded-2xl flex items-center gap-2">
          <span class="material-symbols-outlined text-red-500 text-lg">favorite</span>
          <span class="font-mono text-xs font-bold text-deep-navy" id="profile-stat-count">
            ${t('profile.savedCountText', { count: savedPerfumes.length })}
          </span>
        </div>

        <button id="profile-logout-btn" class="neu-button px-5 py-2.5 rounded-full font-headline text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 transition-all flex items-center gap-1.5 cursor-pointer">
          <span class="material-symbols-outlined text-sm">logout</span>
          <span>${t('profile.logoutBtn')}</span>
        </button>
      </div>
    </div>

    <!-- TIER 2: Profile Settings Panel (Avatar Selector, Display Name, Username Editor) -->
    <div class="neu-flat rounded-3xl p-6 sm:p-8 space-y-6 border border-border-hairline">
      <div class="border-b border-border-hairline pb-3">
        <h2 class="font-headline text-lg font-bold text-deep-navy flex items-center gap-2">
          <span class="material-symbols-outlined text-atmospheric-blue">manage_accounts</span>
          <span>${t('profile.accountSettings')}</span>
        </h2>
        <p class="font-body text-xs text-on-surface-variant mt-0.5">
          ${t('profile.accountSettingsSubtitle')}
        </p>
      </div>

      <!-- Feedback Alert -->
      <div id="profile-settings-feedback" class="hidden p-3 rounded-2xl neu-inset text-xs font-bold text-center"></div>

      <!-- Avatar Selector Section with Live Preview -->
      <div class="space-y-3">
        <h3 class="font-headline text-xs uppercase font-bold text-deep-navy tracking-wider flex items-center gap-1.5">
          <span class="material-symbols-outlined text-sm text-atmospheric-blue">face</span>
          <span>${t('profile.avatarSelectorTitle')}</span>
        </h3>
        
        <!-- Live Avatar Preview & Preset Buttons -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div class="w-14 h-14 rounded-full neu-inset p-0.5 overflow-hidden shrink-0 flex items-center justify-center" title="${t('profile.preview')}">
            <img id="profile-preview-avatar" src="${userAvatar}" alt="Avatar Preview" class="w-full h-full rounded-full object-cover" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';">
          </div>

          <!-- Preset Avatar Buttons (6 Curated Options) -->
          <div class="flex flex-wrap gap-2.5">
            ${PRESET_AVATARS.map((url, idx) => `
              <button type="button" class="preset-avatar-btn w-11 h-11 rounded-full p-0.5 neu-button hover:scale-105 transition-all cursor-pointer overflow-hidden ${userAvatar === url ? 'ring-2 ring-atmospheric-blue neu-inset' : ''}" data-url="${url}" title="Preset ${idx + 1}">
                <img src="${url}" alt="Preset ${idx + 1}" class="w-full h-full rounded-full object-cover" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';">
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Custom Image URL Input -->
        <div class="pt-1">
          <label class="block text-xs font-body text-on-surface-variant mb-1">${t('profile.customAvatarUrl')}</label>
          <div class="neu-inset rounded-full px-4 py-2 flex items-center gap-2 max-w-xl">
            <span class="material-symbols-outlined text-outline text-sm">link</span>
            <input id="profile-custom-avatar-url" type="url" value="${userAvatar}" placeholder="https://images.unsplash.com/..." class="w-full bg-transparent border-0 outline-none text-xs text-deep-navy font-body">
          </div>
        </div>
      </div>

      <!-- Inputs Grid: Display Name & Username -->
      <div class="pt-4 border-t border-border-hairline grid grid-cols-1 md:grid-cols-2 gap-5">
        <!-- Display Name -->
        <div>
          <label class="block text-xs font-headline font-bold text-deep-navy mb-1">${t('profile.displayNameLabel')}</label>
          <div class="neu-inset rounded-full px-4 py-2 flex items-center gap-2">
            <span class="material-symbols-outlined text-outline text-sm">badge</span>
            <input id="profile-edit-name-input" type="text" value="${displayName}" placeholder="Aiman Rahim" class="w-full bg-transparent border-0 outline-none text-xs text-deep-navy font-body">
          </div>
        </div>

        <!-- Username with Async Check -->
        <div>
          <label class="block text-xs font-headline font-bold text-deep-navy mb-1">${t('auth.username')}</label>
          <div class="neu-inset rounded-full px-4 py-2 flex items-center gap-2">
            <span class="material-symbols-outlined text-outline text-sm">alternate_email</span>
            <input id="profile-edit-username-input" type="text" value="${username}" placeholder="${t('auth.usernamePlaceholder')}" class="w-full bg-transparent border-0 outline-none text-xs text-deep-navy font-body lowercase" pattern="[a-z0-9_]{3,20}">
          </div>
          <div id="profile-username-feedback" class="text-[10px] text-outline font-mono mt-0.5 block ml-3">${t('auth.usernameHelp')}</div>
        </div>
      </div>

      <!-- Save Changes Button -->
      <div class="pt-4 border-t border-border-hairline flex justify-end">
        <button type="button" id="profile-save-btn" class="px-8 py-3 rounded-full bg-atmospheric-blue text-white font-headline text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2">
          <span class="material-symbols-outlined text-sm">save</span>
          <span>${t('profile.saveChanges')}</span>
        </button>
      </div>
    </div>

    <!-- TIER 3: Saved Perfumes Grid -->
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-hairline">
        <div>
          <h2 class="font-headline text-xl sm:text-2xl font-bold text-deep-navy">${t('profile.myCollection')}</h2>
          <p id="profile-saved-count" class="font-mono text-xs sm:text-sm text-on-surface-variant mt-1">
            ${t('profile.savedCountText', { count: savedPerfumes.length })}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <a href="#/direktori" class="neu-button px-4 py-2 rounded-full font-headline text-xs font-bold text-atmospheric-blue hover:text-deep-navy flex items-center gap-1.5 transition-all">
            <span class="material-symbols-outlined text-sm">explore</span>
            <span>${t('profile.exploreBtn')}</span>
          </a>
        </div>
      </div>

      <!-- Grid or Empty State Container -->
      <div id="profile-content-container">
        ${savedPerfumes.length === 0 ? `
          <div id="profile-empty-state" class="neu-inset rounded-3xl p-12 text-center space-y-4 my-8">
            <div class="w-16 h-16 rounded-full neu-flat mx-auto flex items-center justify-center text-outline">
              <span class="material-symbols-outlined text-3xl">favorite</span>
            </div>
            <h3 class="font-headline text-lg sm:text-xl font-bold text-deep-navy">
              ${t('profile.emptyTitle')}
            </h3>
            <p class="font-body text-xs text-on-surface-variant max-w-sm mx-auto">
              ${t('profile.emptyDesc')}
            </p>
            <div class="pt-2">
              <a href="#/direktori" class="inline-block px-6 py-2.5 rounded-full bg-atmospheric-blue text-white font-headline text-xs font-bold shadow-md hover:brightness-105 transition-all">
                ${t('profile.exploreBtn')}
              </a>
            </div>
          </div>
        ` : `
          <div id="profile-perfumes-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-2">
            ${savedPerfumes.map(p => renderPerfumeCard(p, { isLiked: true })).join('')}
          </div>
        `}
      </div>
    </div>

  </div>
  `;
}

/**
 * Attaches event listeners for ProfileView.
 * Handles login gate, logout, avatar selection, username update, and un-liking removal.
 */
export function attachProfileListeners() {
  // Guest login gate: auto trigger login modal and handle barrier button
  if (authService.isGuest()) {
    openAuthModal('login');
    document.getElementById('profile-login-btn')?.addEventListener('click', () => {
      openAuthModal('login');
    });
    return;
  }

  // Logout button
  document.getElementById('profile-logout-btn')?.addEventListener('click', async () => {
    await authService.logout();
    window.location.hash = '#/';
  });

  // Preset avatar buttons
  document.querySelectorAll('.preset-avatar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      const urlInput = document.getElementById('profile-custom-avatar-url');
      const previewImg = document.getElementById('profile-preview-avatar');
      if (urlInput) urlInput.value = url;
      if (previewImg) previewImg.src = url;
      document.querySelectorAll('.preset-avatar-btn').forEach(b => {
        b.classList.remove('ring-2', 'ring-atmospheric-blue', 'neu-inset');
      });
      btn.classList.add('ring-2', 'ring-atmospheric-blue', 'neu-inset');
    });
  });

  // Custom avatar URL live preview
  const customAvatarInput = document.getElementById('profile-custom-avatar-url');
  if (customAvatarInput) {
    customAvatarInput.addEventListener('input', () => {
      const url = customAvatarInput.value.trim();
      const previewImg = document.getElementById('profile-preview-avatar');
      if (previewImg && url) {
        previewImg.src = url;
      }
      document.querySelectorAll('.preset-avatar-btn').forEach(b => {
        b.classList.remove('ring-2', 'ring-atmospheric-blue', 'neu-inset');
      });
    });
  }

  // Realtime username input normalization and live availability check
  const usernameInput = document.getElementById('profile-edit-username-input');
  const usernameFeedback = document.getElementById('profile-username-feedback');
  let usernameDebounce = null;
  if (usernameInput) {
    usernameInput.addEventListener('input', () => {
      usernameInput.value = usernameInput.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
      const newUsername = usernameInput.value.trim();
      const currentUser = authService.getCurrentUser();

      if (usernameDebounce) clearTimeout(usernameDebounce);
      if (!newUsername) {
        if (usernameFeedback) {
          usernameFeedback.textContent = t('auth.usernameHelp');
          usernameFeedback.className = 'text-[10px] text-outline font-mono mt-0.5 block ml-3';
        }
        return;
      }
      if (newUsername.length < 3) {
        if (usernameFeedback) {
          usernameFeedback.textContent = t('auth.usernameErrorInvalid');
          usernameFeedback.className = 'text-[10px] text-outline font-mono mt-0.5 block ml-3';
        }
        return;
      }

      if (currentUser && newUsername === currentUser.username) {
        if (usernameFeedback) {
          usernameFeedback.textContent = t('auth.usernameHelp');
          usernameFeedback.className = 'text-[10px] text-outline font-mono mt-0.5 block ml-3';
        }
        return;
      }

      if (usernameFeedback) {
        usernameFeedback.textContent = t('auth.usernameChecking');
        usernameFeedback.className = 'text-[10px] text-atmospheric-blue font-mono mt-0.5 block ml-3';
      }

      usernameDebounce = setTimeout(async () => {
        try {
          const isAvail = await authService.checkUsernameUnique(newUsername, currentUser?.uid);
          if (usernameFeedback) {
            if (isAvail) {
              usernameFeedback.textContent = '✓ ' + (t('auth.usernameAvailable') || 'Nama pengguna tersedia');
              usernameFeedback.className = 'text-[10px] text-green-600 font-mono mt-0.5 block ml-3';
            } else {
              usernameFeedback.textContent = '✗ ' + t('auth.usernameErrorTaken');
              usernameFeedback.className = 'text-[10px] text-red-600 font-mono mt-0.5 block ml-3';
            }
          }
        } catch {
          // ignore
        }
      }, 300);
    });
  }

  // Unified Save Changes button handler
  document.getElementById('profile-save-btn')?.addEventListener('click', async () => {
    const feedbackEl = document.getElementById('profile-settings-feedback');
    const saveBtn = document.getElementById('profile-save-btn');
    const nameInput = document.getElementById('profile-edit-name-input');
    const usernameInput = document.getElementById('profile-edit-username-input');
    const avatarInput = document.getElementById('profile-custom-avatar-url');

    const displayName = nameInput?.value.trim() || '';
    const username = usernameInput?.value.trim().toLowerCase() || '';
    const photoURL = avatarInput?.value.trim() || '';

    if (feedbackEl) feedbackEl.classList.add('hidden');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">refresh</span><span>Menyimpan...</span>';
    }

    try {
      if (username) {
        const formatRegex = /^[a-z0-9_]{3,20}$/;
        if (!formatRegex.test(username)) {
          throw new Error(t('auth.usernameErrorInvalid'));
        }
      }

      const updated = await authService.updateProfileData({ displayName, username, photoURL });

      // Update UI elements in User Info Card
      const displayAvatar = document.getElementById('profile-display-avatar');
      const displayNameEl = document.getElementById('profile-display-name');
      const displayHandleEl = document.getElementById('profile-display-handle');

      if (displayAvatar && updated.photoURL) displayAvatar.src = updated.photoURL;
      if (displayNameEl && updated.displayName) displayNameEl.textContent = updated.displayName;
      if (displayHandleEl && updated.username) displayHandleEl.textContent = `@${updated.username}`;

      if (feedbackEl) {
        feedbackEl.textContent = t('profile.updateSuccess');
        feedbackEl.className = 'p-3 rounded-2xl neu-inset text-xs font-bold text-center text-green-600 block bg-green-50/50';
      }
    } catch (err) {
      if (feedbackEl) {
        feedbackEl.textContent = err.message || 'Ralat mengemaskini profil.';
        feedbackEl.className = 'p-3 rounded-2xl neu-inset text-xs font-bold text-center text-red-600 block bg-red-50/50';
      }
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<span class="material-symbols-outlined text-sm">save</span><span>${t('profile.saveChanges')}</span>`;
      }
    }
  });

  // Saved Perfumes Grid: Handle unliking removal
  const grid = document.getElementById('profile-perfumes-grid');
  if (grid) {
    attachPerfumeCardListeners(grid, (perfumeId, isLiked) => {
      if (!isLiked) {
        const card = grid.querySelector(`[data-id="${perfumeId}"]`);
        if (card) {
          card.remove();
        }

        const remainingCards = grid.querySelectorAll('.perfume-card');
        const count = remainingCards.length;

        // Update count text in header
        const countEl = document.getElementById('profile-saved-count');
        if (countEl) {
          countEl.textContent = t('profile.savedCountText', { count });
        }

        // Update stat count in user card
        const statCountEl = document.getElementById('profile-stat-count');
        if (statCountEl) {
          statCountEl.textContent = t('profile.savedCountText', { count });
        }

        // If zero items left, transition smoothly to the empty state
        if (count === 0) {
          const container = document.getElementById('profile-content-container');
          if (container) {
            container.innerHTML = `
              <div id="profile-empty-state" class="neu-inset rounded-3xl p-12 text-center space-y-4 my-8">
                <div class="w-16 h-16 rounded-full neu-flat mx-auto flex items-center justify-center text-outline">
                  <span class="material-symbols-outlined text-3xl">favorite</span>
                </div>
                <h3 class="font-headline text-lg sm:text-xl font-bold text-deep-navy">
                  ${t('profile.emptyTitle')}
                </h3>
                <p class="font-body text-xs text-on-surface-variant max-w-sm mx-auto">
                  ${t('profile.emptyDesc')}
                </p>
                <div class="pt-2">
                  <a href="#/direktori" class="inline-block px-6 py-2.5 rounded-full bg-atmospheric-blue text-white font-headline text-xs font-bold shadow-md hover:brightness-105 transition-all">
                    ${t('profile.exploreBtn')}
                  </a>
                </div>
              </div>
            `;
          }
        }
      }
    });
  }

  // Real-time Firestore sync for saved perfumes
  const currentUser = authService.getCurrentUser();
  if (currentUser && currentUser.uid) {
    if (profileSavedUnsubscribe) {
      profileSavedUnsubscribe();
      profileSavedUnsubscribe = null;
    }
    profileSavedUnsubscribe = perfumeService.subscribeToSavedPerfumes(currentUser.uid, (savedPerfumes) => {
      const container = document.getElementById('profile-content-container');
      if (!container) return;

      const count = savedPerfumes.length;
      const countEl = document.getElementById('profile-saved-count');
      if (countEl) countEl.textContent = t('profile.savedCountText', { count });
      const statCountEl = document.getElementById('profile-stat-count');
      if (statCountEl) statCountEl.textContent = t('profile.savedCountText', { count });

      if (count === 0) {
        container.innerHTML = `
          <div id="profile-empty-state" class="neu-inset rounded-3xl p-12 text-center space-y-4 my-8">
            <div class="w-16 h-16 rounded-full neu-flat mx-auto flex items-center justify-center text-outline">
              <span class="material-symbols-outlined text-3xl">favorite</span>
            </div>
            <h3 class="font-headline text-lg sm:text-xl font-bold text-deep-navy">
              ${t('profile.emptyTitle')}
            </h3>
            <p class="font-body text-xs text-on-surface-variant max-w-sm mx-auto">
              ${t('profile.emptyDesc')}
            </p>
            <div class="pt-2">
              <a href="#/direktori" class="inline-block px-6 py-2.5 rounded-full bg-atmospheric-blue text-white font-headline text-xs font-bold shadow-md hover:brightness-105 transition-all">
                ${t('profile.exploreBtn')}
              </a>
            </div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-2" id="profile-perfumes-grid">
            ${savedPerfumes.map(p => renderPerfumeCard(p)).join('')}
          </div>
        `;
        const newGrid = document.getElementById('profile-perfumes-grid');
        if (newGrid) {
          attachPerfumeCardListeners(newGrid);
        }
      }
    });
  }
}

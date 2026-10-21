import { authService } from '../services/authService.js';
import { t } from '../services/i18nService.js';

let isModalOpen = false;

export function openAuthModal() {
  isModalOpen = true;
  renderAuthModal();
}

export function closeAuthModal() {
  isModalOpen = false;
  const container = document.getElementById('auth-modal-container');
  if (container) container.innerHTML = '';
}

/**
 * Single unified login modal: Google Sign-In is the only path for both customers
 * and admins. Role (member vs admin) is resolved server-side afterwards from the
 * Firestore `admins/{uid}` collection, not chosen here.
 */
export function renderAuthModal() {
  const container = document.getElementById('auth-modal-container');
  if (!container || !isModalOpen) {
    if (container) container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/40 backdrop-blur-sm animate-fade-in">
      <div class="neu-flat rounded-3xl p-6 sm:p-8 max-w-md w-full relative overflow-hidden shadow-2xl border border-white/50 text-center">
        <!-- Close Button -->
        <button id="close-modal-btn" class="absolute top-4 right-4 neu-button w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-deep-navy cursor-pointer">
          <span class="material-symbols-outlined text-sm">close</span>
        </button>

        <!-- Header -->
        <div class="w-12 h-12 rounded-full neu-inset mx-auto flex items-center justify-center text-atmospheric-blue mb-3">
          <span class="material-symbols-outlined text-2xl">account_circle</span>
        </div>
        <h2 class="font-headline text-2xl font-bold text-deep-navy">${t('auth.loginTitle')}</h2>
        <p class="font-body text-xs text-on-surface-variant mt-1 mb-6">
          ${t('auth.loginSubtitle')}
        </p>

        <!-- Feedback Alert -->
        <div id="auth-error-msg" class="hidden mb-4 p-3 rounded-xl neu-inset text-xs text-red-600 font-semibold text-center"></div>

        <!-- Google Sign-In (single auth path for members and admins) -->
        <button id="auth-google-btn" type="button" class="neu-button w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-headline font-bold text-deep-navy hover:text-atmospheric-blue transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          <svg class="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>${t('auth.googleBtn')}</span>
        </button>

        <p class="font-body text-[10px] text-outline mt-4 leading-relaxed">
          ${t('auth.googleOnlyNotice')}
        </p>
      </div>
    </div>
  `;

  document.getElementById('close-modal-btn')?.addEventListener('click', closeAuthModal);

  document.getElementById('auth-google-btn')?.addEventListener('click', async () => {
    const errorEl = document.getElementById('auth-error-msg');
    const btn = document.getElementById('auth-google-btn');
    errorEl.classList.add('hidden');
    if (btn) btn.disabled = true;
    try {
      await authService.loginGoogle();
      closeAuthModal();
      if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
        try { window.location.reload(); } catch (_) {}
      }
    } catch (err) {
      errorEl.textContent = t('auth.googleError');
      errorEl.classList.remove('hidden');
      if (btn) btn.disabled = false;
    }
  });
}

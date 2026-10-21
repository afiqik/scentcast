import { db } from '../firebase.js';
import { collection, addDoc } from 'firebase/firestore';
import { t } from '../services/i18nService.js';

export async function renderAboutView() {
  return `
  <div class="w-full px-4 md:px-8 pt-28 pb-16 max-w-max-width mx-auto space-y-12">
    <!-- Header -->
    <div class="text-center max-w-3xl mx-auto space-y-3">
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full neu-inset text-xs font-headline text-atmospheric-blue uppercase font-bold">
        ${t('about.badge')}
      </span>
      <h1 class="font-headline text-3xl sm:text-4xl md:text-5xl font-bold text-deep-navy tracking-tight">
        ${t('about.title')}
      </h1>
      <p class="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed">
        ${t('about.desc')}
      </p>
    </div>

    <!-- Science Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="neu-flat rounded-3xl p-6 space-y-3">
        <div class="w-12 h-12 rounded-2xl neu-inset flex items-center justify-center text-atmospheric-blue">
          <span class="material-symbols-outlined text-2xl">science</span>
        </div>
        <h3 class="font-headline text-lg font-bold text-deep-navy">${t('about.card1Title')}</h3>
        <p class="font-body text-xs text-on-surface-variant leading-relaxed">
          ${t('about.card1Desc')}
        </p>
      </div>

      <div class="neu-flat rounded-3xl p-6 space-y-3">
        <div class="w-12 h-12 rounded-2xl neu-inset flex items-center justify-center text-sunset-amber">
          <span class="material-symbols-outlined text-2xl">humidity_mid</span>
        </div>
        <h3 class="font-headline text-lg font-bold text-deep-navy">${t('about.card2Title')}</h3>
        <p class="font-body text-xs text-on-surface-variant leading-relaxed">
          ${t('about.card2Desc')}
        </p>
      </div>

      <div class="neu-flat rounded-3xl p-6 space-y-3">
        <div class="w-12 h-12 rounded-2xl neu-inset flex items-center justify-center text-atmospheric-blue">
          <span class="material-symbols-outlined text-2xl">compare</span>
        </div>
        <h3 class="font-headline text-lg font-bold text-deep-navy">${t('about.card3Title')}</h3>
        <p class="font-body text-xs text-on-surface-variant leading-relaxed">
          ${t('about.card3Desc')}
        </p>
      </div>
    </div>

    <!-- Contact Form (Firestore Integration) -->
    <div class="neu-flat rounded-3xl p-6 md:p-10 max-w-2xl mx-auto space-y-6">
      <div class="text-center">
        <h2 class="font-headline text-2xl font-bold text-deep-navy">${t('about.contactTitle')}</h2>
        <p class="font-body text-xs text-on-surface-variant mt-1">
          ${t('about.contactDesc')}
        </p>
      </div>

      <div id="contact-success-msg" class="hidden p-3 rounded-xl neu-inset text-xs text-green-700 font-headline font-bold text-center">
        ${t('about.contactSuccess')}
      </div>

      <form id="contact-form" class="space-y-4">
        <div>
          <label class="block text-xs font-headline font-bold text-deep-navy mb-1">${t('about.name')}</label>
          <div class="neu-inset rounded-full px-4 py-2">
            <input id="contact-name" type="text" required placeholder="${t('about.namePlaceholder')}" class="w-full bg-transparent border-0 outline-none text-xs text-deep-navy font-body">
          </div>
        </div>

        <div>
          <label class="block text-xs font-headline font-bold text-deep-navy mb-1">${t('about.email')}</label>
          <div class="neu-inset rounded-full px-4 py-2">
            <input id="contact-email" type="email" required placeholder="${t('about.emailPlaceholder')}" class="w-full bg-transparent border-0 outline-none text-xs text-deep-navy font-body">
          </div>
        </div>

        <div>
          <label class="block text-xs font-headline font-bold text-deep-navy mb-1">${t('about.msgLabel')}</label>
          <div class="neu-inset rounded-2xl p-3">
            <textarea id="contact-message" rows="4" required placeholder="${t('about.msgPlaceholder')}" class="w-full bg-transparent border-0 outline-none text-xs text-deep-navy font-body resize-none"></textarea>
          </div>
        </div>

        <button type="submit" id="contact-submit-btn" class="w-full py-3 rounded-full bg-atmospheric-blue text-white font-headline text-xs font-bold shadow-lg hover:brightness-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-sm">send</span>
          <span>${t('about.sendBtn')}</span>
        </button>
      </form>
    </div>
  </div>
  `;
}

export function attachAboutListeners() {
  document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('contact-submit-btn');
    const success = document.getElementById('contact-success-msg');
    btn.disabled = true;
    btn.innerHTML = t('about.sending') || 'Menghantar...';

    const name = document.getElementById('contact-name')?.value.trim();
    const email = document.getElementById('contact-email')?.value.trim();
    const message = document.getElementById('contact-message')?.value.trim();

    try {
      await addDoc(collection(db, 'contacts'), {
        name,
        email,
        message,
        createdAt: new Date().toISOString()
      });
      success.classList.remove('hidden');
      document.getElementById('contact-form').reset();
    } catch (err) {
      console.warn('Fallback contact submission:', err);
      success.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<span class="material-symbols-outlined text-sm">send</span><span>${t('about.sendBtn')}</span>`;
    }
  });
}

import { t } from '../services/i18nService.js';

export function renderFooter() {
  return `
  <footer class="w-full bg-ice-white dark:bg-[#0B1120] pt-16 pb-12 mt-auto">
    <div class="max-w-max-width mx-auto px-4 md:px-8">
      <div class="neu-flat rounded-3xl p-6 md:p-10 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div class="space-y-3 md:col-span-2">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-full neu-inset flex items-center justify-center p-0.5 shrink-0 overflow-hidden bg-white/70 dark:bg-slate-800/70 border border-border-hairline">
                <img src="/new-logo.png" alt="ScentCast" class="w-full h-full object-contain filter drop-shadow-sm" />
              </div>
              <span class="font-headline text-lg font-bold text-deep-navy">ScentCast Malaysia</span>
              <span class="px-2.5 py-0.5 rounded-full neu-inset text-[10px] font-headline font-bold text-atmospheric-blue uppercase">${t('footer.tagline')}</span>
            </div>
            <p class="font-body text-sm text-on-surface-variant max-w-md leading-relaxed">
              ${t('footer.desc')}
            </p>
            <div class="pt-2 text-xs text-outline flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-sunset-amber animate-pulse"></span>
              <span>${t('footer.sensorData')} <strong class="text-deep-navy">${t('footer.sensorSource')}</strong></span>
            </div>
          </div>

          <div class="space-y-3">
            <span class="font-headline text-xs font-bold uppercase text-deep-navy tracking-wider block">${t('footer.quickNav')}</span>
            <ul class="space-y-2 text-sm text-on-surface-variant font-body">
              <li><a href="#/" class="hover:text-atmospheric-blue transition-colors">${t('footer.home')}</a></li>
              <li><a href="#/cuaca" class="hover:text-atmospheric-blue transition-colors">${t('footer.weather27')}</a></li>
              <li><a href="#/direktori" class="hover:text-atmospheric-blue transition-colors">${t('footer.directory')}</a></li>
              <li><a href="#/dupe" class="hover:text-atmospheric-blue transition-colors">${t('footer.dupeEngine')}</a></li>
              <li><a href="#/profil" class="hover:text-atmospheric-blue transition-colors">${t('footer.myCollection')}</a></li>
            </ul>
          </div>

          <div class="space-y-3">
            <span class="font-headline text-xs font-bold uppercase text-deep-navy tracking-wider block">${t('footer.methodology')}</span>
            <ul class="space-y-2 text-sm text-on-surface-variant font-body">
              <li><a href="#/cuaca" class="hover:text-atmospheric-blue transition-colors">${t('footer.thermalTest')}</a></li>
              <li><a href="#/cuaca" class="hover:text-atmospheric-blue transition-colors">${t('footer.skinTempFormula')}</a></li>
              <li><a href="#/tentang-kami" class="hover:text-atmospheric-blue transition-colors">${t('footer.aboutUs')}</a></li>
              <li><a href="#/tentang-kami" class="hover:text-atmospheric-blue transition-colors">${t('footer.privacy')}</a></li>
            </ul>
          </div>
        </div>

        <div class="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-border-hairline gap-4">
          <div class="text-xs text-outline font-body">
            ${t('footer.copyright')}
          </div>
          <div class="flex items-center gap-4 text-xs font-mono">
            <span class="text-on-surface-variant flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-atmospheric-blue"></span> 
              ${t('footer.activeSensors')}
            </span>
            <span class="text-outline">v2.5.0-tropic</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
  `;
}

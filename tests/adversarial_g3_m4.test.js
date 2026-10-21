/**
 * ScentCast Malaysia — Adversarial Test Harness
 * Milestone G3-M4: 100% Localization Parity, UI Consistency & Dark Mode Integrity
 *
 * Scope:
 * 1. Deep i18n Dictionary Parity (BM vs EN keys, leaf non-empty, placeholder symmetry).
 * 2. Dynamic i18n Service Reactivity (BM <-> EN toggle, parameter interpolation, safe fallbacks).
 * 3. View Localization Audit (All views + Header + Footer + Cards import t() and render dynamic translations).
 * 4. Zero-Price Rule Compliance (Exhaustive scan across all rendered views for RM, MYR, price, diskaun, penjimatan).
 * 5. UI Background & Dark Mode Uniformity (#0B1120 enforcement in style.css, main.js, Footer.js).
 * 6. Skeleton Loader & Layout Shift Prevention (Detail and Directory/Search loading states).
 * 7. Mobile Viewport & Responsiveness Integrity (No overflow-inducing fixed widths, responsive grids).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupTestEnvironment } from './e2e/runner.js';

// 1. Initialize DOM / Node test environment shims
setupTestEnvironment();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Dynamic module imports
const { i18nService, t } = await import('../src/services/i18nService.js');
const { authService } = await import('../src/services/authService.js');
const { renderHeader } = await import('../src/components/Header.js');
const { renderFooter } = await import('../src/components/Footer.js');
const { renderPerfumeCard } = await import('../src/components/PerfumeCard.js');
const { renderHomeView } = await import('../src/views/HomeView.js');
const { renderWeatherView } = await import('../src/views/WeatherView.js');
const { renderDirectoryView } = await import('../src/views/DirectoryView.js');
const { renderSearchView } = await import('../src/views/SearchView.js');
const { renderDetailView } = await import('../src/views/DetailView.js');
const { renderDupeView } = await import('../src/views/DupeView.js');
const { renderProfileView } = await import('../src/views/ProfileView.js');
const { renderAdminView, renderAccessDenied } = await import('../src/views/AdminView.js');
const { renderAboutView } = await import('../src/views/AboutView.js');
const { renderNotFoundView } = await import('../src/views/NotFoundView.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, message, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    const err = `  ✗ FAIL: ${message}${details ? ' -> ' + details : ''}`;
    console.error(err);
    failures.push({ message, details });
  }
}

// Helper: extract all dotted paths from nested object
function getDeepKeys(obj, prefix = '') {
  let keys = [];
  for (const k of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      keys = keys.concat(getDeepKeys(obj[k], full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

// Helper: extract placeholders like {count} or {brand}
function extractPlaceholders(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(/\{[a-zA-Z0-9_-]+\}/g);
  return matches ? matches.sort() : [];
}

async function runAdversarialSuiteM4() {
  console.log('================================================================');
  console.log('🌐 RUNNING ADVERSARIAL TEST HARNESS: MILESTONE G3-M4');
  console.log('   Localization Parity, Zero-Price Audit, Dark Mode & Mobile UI');
  console.log('================================================================\n');

  // ==========================================================================
  // SECTION 1: Deep i18n Dictionary Parity (BM vs EN)
  // ==========================================================================
  console.log('► SECTION 1: Deep i18n Dictionary Parity & Quality Audit');

  const bmRaw = JSON.parse(fs.readFileSync(path.join(rootDir, 'src', 'i18n', 'bm.json'), 'utf8'));
  const enRaw = JSON.parse(fs.readFileSync(path.join(rootDir, 'src', 'i18n', 'en.json'), 'utf8'));

  const bmKeys = getDeepKeys(bmRaw);
  const enKeys = getDeepKeys(enRaw);

  assert(bmKeys.length > 0, `BM dictionary loaded with ${bmKeys.length} keys`);
  assert(enKeys.length > 0, `EN dictionary loaded with ${enKeys.length} keys`);
  assert(bmKeys.length === enKeys.length, `Key count parity: BM (${bmKeys.length}) === EN (${enKeys.length})`);

  const missingInEn = bmKeys.filter(k => !enKeys.includes(k));
  const missingInBm = enKeys.filter(k => !bmKeys.includes(k));

  assert(missingInEn.length === 0, 'Zero keys missing in EN dictionary', missingInEn.join(', '));
  assert(missingInBm.length === 0, 'Zero keys missing in BM dictionary', missingInBm.join(', '));

  // Check leaf non-empty values
  let emptyLeavesBm = [];
  let emptyLeavesEn = [];
  for (const key of bmKeys) {
    const valBm = key.split('.').reduce((acc, part) => acc?.[part], bmRaw);
    const valEn = key.split('.').reduce((acc, part) => acc?.[part], enRaw);

    if (typeof valBm !== 'string' || valBm.trim() === '') emptyLeavesBm.push(key);
    if (typeof valEn !== 'string' || valEn.trim() === '') emptyLeavesEn.push(key);

    // Placeholder symmetry
    const phBm = extractPlaceholders(valBm);
    const phEn = extractPlaceholders(valEn);
    if (phBm.join(',') !== phEn.join(',')) {
      assert(false, `Placeholder symmetry mismatch for key "${key}"`, `BM: [${phBm}], EN: [${phEn}]`);
    }
  }

  assert(emptyLeavesBm.length === 0, 'All BM translation leaves contain non-empty strings');
  assert(emptyLeavesEn.length === 0, 'All EN translation leaves contain non-empty strings');

  // ==========================================================================
  // SECTION 2: Dynamic i18n Service Reactivity & Switching
  // ==========================================================================
  console.log('\n► SECTION 2: Dynamic i18n Service Reactivity & Switching');

  i18nService.setLanguage('bm');
  assert(i18nService.getLanguage() === 'bm', 'i18nService active language set to "bm"');
  assert(t('nav.home') === 'Laman Utama', 't("nav.home") in BM returns "Laman Utama"');
  assert(t('card.genderMale') === 'Lelaki', 't("card.genderMale") in BM returns "Lelaki"');

  i18nService.setLanguage('en');
  assert(i18nService.getLanguage() === 'en', 'i18nService active language switched to "en"');
  assert(t('nav.home') === 'Home', 't("nav.home") in EN returns "Home"');
  assert(t('card.genderMale') === 'Men' || t('card.genderMale') === 'Male', 't("card.genderMale") in EN returns "Men"');

  // Parameter interpolation
  i18nService.setLanguage('bm');
  assert(t('search.resultsCount', { count: 12 }).includes('12 wangian dijumpai'), 'Parameter interpolation replaces {count} in BM');
  i18nService.setLanguage('en');
  assert(t('search.resultsCount', { count: 12 }).includes('12 fragrances found'), 'Parameter interpolation replaces {count} in EN');

  // Fallback resilience
  assert(t('nonexistent.fake.key') === 'nonexistent.fake.key', 'Missing key safely falls back to key string');
  i18nService.setLanguage('invalid_locale');
  assert(i18nService.getLanguage() === 'bm', 'Invalid locale safely falls back to "bm"');

  // Reset to BM for subsequent assertions
  i18nService.setLanguage('bm');

  // ==========================================================================
  // SECTION 3: View & Component Localization Completeness
  // ==========================================================================
  console.log('\n► SECTION 3: View & Component Localization Completeness');

  const viewsToTest = [
    { file: 'src/views/HomeView.js', render: () => renderHomeView() },
    { file: 'src/views/WeatherView.js', render: () => renderWeatherView() },
    { file: 'src/views/DirectoryView.js', render: () => renderDirectoryView() },
    { file: 'src/views/SearchView.js', render: () => renderSearchView('fresh') },
    { file: 'src/views/DetailView.js', render: () => renderDetailView('turathi-blue') },
    { file: 'src/views/DupeView.js', render: () => renderDupeView() },
    { file: 'src/views/AboutView.js', render: () => renderAboutView() },
    { file: 'src/views/NotFoundView.js', render: () => renderNotFoundView() },
    { file: 'src/components/Header.js', render: () => renderHeader('#/') },
    { file: 'src/components/Footer.js', render: () => renderFooter() }
  ];

  for (const item of viewsToTest) {
    const src = fs.readFileSync(path.join(rootDir, item.file), 'utf8');
    assert(src.includes("import { t") || src.includes("import { i18nService, t") || src.includes("t } from") || src.includes("i18nService.js"), `${item.file} imports t from i18nService`);

    // Verify dynamic output changes on language switch
    i18nService.setLanguage('bm');
    const htmlBm = await item.render();
    i18nService.setLanguage('en');
    const htmlEn = await item.render();

    assert(htmlBm !== htmlEn, `${item.file} dynamically reacts and yields differentiated markup between BM and EN`);
  }

  // Reset to BM
  i18nService.setLanguage('bm');

  // ==========================================================================
  // SECTION 4: Zero-Price Rule Compliance (Global Forensic Scan)
  // ==========================================================================
  console.log('\n► SECTION 4: Zero-Price Rule Compliance (Global Forensic Scan)');

  const mockPerfume = {
    id: 'test-turathi',
    name: 'Turathi Blue',
    brand: 'Afnan',
    type: 'EDP',
    gender: 'male',
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300',
    longevity: '8 - 10 Jam',
    sillageDistance: '2.0 m',
    rating: 4.8,
    shopeeUrl: 'https://shopee.com.my/test',
    tiktokUrl: 'https://www.tiktok.com/test',
    mainAccords: [{ name: 'Citrus', percentage: 85 }],
    topNotes: ['Bergamot'],
    midNotes: ['Amber'],
    baseNotes: ['Woody'],
    whenToWear: 'Siang & Malam'
  };

  // Test card rendering
  const cardHtml = renderPerfumeCard(mockPerfume);
  assert(!cardHtml.includes('RM'), 'PerfumeCard contains ZERO "RM"');
  assert(!cardHtml.includes('MYR'), 'PerfumeCard contains ZERO "MYR"');
  assert(!cardHtml.includes('diskaun'), 'PerfumeCard contains ZERO "diskaun"');
  assert(!cardHtml.includes('penjimatan'), 'PerfumeCard contains ZERO "penjimatan"');

  // Test all rendered views in BM and EN for price leakage
  for (const lang of ['bm', 'en']) {
    i18nService.setLanguage(lang);

    const renderedPages = [
      { name: 'HomeView', html: await renderHomeView() },
      { name: 'WeatherView', html: await renderWeatherView() },
      { name: 'DirectoryView', html: await renderDirectoryView() },
      { name: 'SearchView', html: await renderSearchView('citrus') },
      { name: 'DetailView', html: await renderDetailView('turathi-blue') },
      { name: 'DupeView', html: await renderDupeView() },
      { name: 'AboutView', html: await renderAboutView() },
      { name: 'NotFoundView', html: renderNotFoundView() },
      { name: 'Footer', html: renderFooter() }
    ];

    for (const page of renderedPages) {
      // Currency regex matching prices like RM 150, RM150, MYR 200, $99
      const priceMatch = page.html.match(/\b(RM\s*\d+|MYR\s*\d+|\$\s*\d+)\b/i);
      assert(!priceMatch, `[Zero-Price] ${page.name} (${lang}) has zero currency price leakage`, priceMatch ? `Matched: ${priceMatch[0]}` : '');

      // Check for purged promotional / savings phrases
      assert(!page.html.includes('penjimatan sehingga'), `[Zero-Price] ${page.name} (${lang}) has no "penjimatan sehingga"`);
      assert(!page.html.includes('harga murah'), `[Zero-Price] ${page.name} (${lang}) has no "harga murah"`);
      assert(!page.html.includes('diskaun hebat'), `[Zero-Price] ${page.name} (${lang}) has no "diskaun hebat"`);
    }
  }

  // Reset to BM
  i18nService.setLanguage('bm');

  // ==========================================================================
  // SECTION 5: Dark Mode & Background Uniformity (#0B1120)
  // ==========================================================================
  console.log('\n► SECTION 5: Dark Mode & Background Uniformity (#0B1120)');

  const styleCssPath = path.join(rootDir, 'src', 'style.css');
  const styleCss = fs.readFileSync(styleCssPath, 'utf8');

  assert(styleCss.includes('html.dark {'), 'style.css defines html.dark root variables');
  assert(styleCss.includes('--ice-white: #0B1120;'), 'style.css sets --ice-white to #0B1120 in dark mode');
  assert(styleCss.includes('html.dark body {\n  background-color: #0B1120;'), 'style.css sets html.dark body background-color to #0B1120');
  assert(styleCss.includes('html.dark main {\n  background-color: #0B1120 !important;'), 'style.css enforces html.dark main background-color to #0B1120 !important');
  assert(styleCss.includes('html.dark footer {\n  background-color: #0B1120 !important;'), 'style.css enforces html.dark footer background-color to #0B1120 !important');

  // Main.js application shell inspection
  const mainJsPath = path.join(rootDir, 'src', 'main.js');
  const mainJs = fs.readFileSync(mainJsPath, 'utf8');

  assert(mainJs.includes('bg-ice-white dark:bg-[#0B1120]'), 'main.js applies bg-ice-white dark:bg-[#0B1120] on <main> container');

  // Footer.js background inspection
  const footerJsPath = path.join(rootDir, 'src', 'components', 'Footer.js');
  const footerJs = fs.readFileSync(footerJsPath, 'utf8');
  assert(footerJs.includes('bg-ice-white dark:bg-[#0B1120]'), 'Footer.js applies bg-ice-white dark:bg-[#0B1120] on <footer> container');

  // ==========================================================================
  // SECTION 6: Skeleton Loader & Anti-Layout-Shift Verification
  // ==========================================================================
  console.log('\n► SECTION 6: Skeleton Loader & Layout Shift Prevention');

  assert(mainJs.includes('renderDetailSkeleton()'), 'main.js integrates renderDetailSkeleton during detail route resolution');
  assert(mainJs.includes('renderSkeletonGrid('), 'main.js integrates renderSkeletonGrid during catalog/search route resolution');
  assert(mainJs.includes('animate-pulse'), 'main.js contains animate-pulse shimmer during async rendering');

  // ==========================================================================
  // SECTION 7: Mobile Viewport & Responsiveness Integrity
  // ==========================================================================
  console.log('\n► SECTION 7: Mobile Viewport & Responsiveness Integrity');

  // Check container classes in major views
  const detailViewSrc = fs.readFileSync(path.join(rootDir, 'src', 'views', 'DetailView.js'), 'utf8');
  assert(detailViewSrc.includes('max-w-max-width'), 'DetailView uses max-w-max-width container');
  assert(detailViewSrc.includes('px-4 md:px-8'), 'DetailView uses responsive horizontal padding px-4 md:px-8');

  const homeViewSrc = fs.readFileSync(path.join(rootDir, 'src', 'views', 'HomeView.js'), 'utf8');
  assert(homeViewSrc.includes('grid-cols-2') || homeViewSrc.includes('grid-cols-1'), 'HomeView supports responsive mobile layout');

  const dupeViewSrc = fs.readFileSync(path.join(rootDir, 'src', 'views', 'DupeView.js'), 'utf8');
  assert(dupeViewSrc.includes('grid-cols-2'), 'DupeView supports 2-column mobile grid');

  const directoryViewSrc = fs.readFileSync(path.join(rootDir, 'src', 'views', 'DirectoryView.js'), 'utf8');
  assert(directoryViewSrc.includes('grid-cols-2'), 'DirectoryView supports 2-column mobile grid');

  // Ensure no fixed width that would overflow a 360px screen
  const forbiddenOverflowPatterns = [/w-\[800px\]/, /w-\[1000px\]/, /w-\[1200px\]/, /w-\[1440px\]/];
  for (const pat of forbiddenOverflowPatterns) {
    assert(!pat.test(homeViewSrc), `HomeView has no fixed viewport overflow pattern ${pat}`);
    assert(!pat.test(detailViewSrc), `DetailView has no fixed viewport overflow pattern ${pat}`);
    assert(!pat.test(directoryViewSrc), `DirectoryView has no fixed viewport overflow pattern ${pat}`);
  }

  // ==========================================================================
  // SUMMARY & VERDICT
  // ==========================================================================
  console.log('\n================================================================');
  console.log('📊 ADVERSARIAL CHALLENGER G3-M4 SUMMARY');
  console.log(`  Total Tests Run : ${totalTests}`);
  console.log(`  Passed          : ${passedTests}`);
  console.log(`  Failed          : ${failedTests}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    console.error('❌ ADVERSARIAL FAILURES ENCOUNTERED:');
    failures.forEach((f, idx) => {
      console.error(`  ${idx + 1}. ${f.message}${f.details ? ' -> ' + f.details : ''}`);
    });
    process.exit(1);
  } else {
    console.log('🎉 ALL MILESTONE G3-M4 VERIFICATIONS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  }
}

runAdversarialSuiteM4().catch(err => {
  console.error('Unhandled suite error:', err);
  process.exitCode = 1;
});

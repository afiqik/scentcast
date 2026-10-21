/**
 * ScentCast Malaysia - G6 5-Fixes Forensic Verification Test Suite
 *
 * Verifies:
 * 1. Navbar Layout & Text: Desktop nav links have whitespace-nowrap and shrink-0.
 * 2. Bilingual Support (100% i18n Parity): BM and EN dictionaries 100% synchronized (403 keys),
 *    zero hardcoded labels in DetailView.
 * 3. Save to Collection (❤️): Firestore setDoc with merge: true, arrayUnion/arrayRemove,
 *    getSavedPerfumes integration in ProfileView.
 * 4. Fragrantica-Style Main Accords: getAccordColor palette, sorted descending by percentage,
 *    vertical stacked horizontal bars with dynamic widths.
 * 5. DupeView Section Headers & (Max 5) Removal: Zero occurrences of '(Max 5)',
 *    harmonized typography on Arab and Local section headers.
 * 6. Zero-Price Policy: Strict compliance across all modified components.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { formatLongevity, translateNote, translateNotes } from '../src/services/i18nService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('\n===============================================================');
console.log('  🔍 G6 5-FIXES & DEPLOYMENT FORENSIC INTEGRITY AUDIT SUITE');
console.log('===============================================================\n');

// -------------------------------------------------------------
// 1. NAVBAR LAYOUT & TEXT (Whitespace-Nowrap)
// -------------------------------------------------------------
console.log('► 1. Navbar Layout & Typography:');
const headerPath = path.join(ROOT, 'src', 'components', 'Header.js');
const headerContent = fs.readFileSync(headerPath, 'utf8');

assert(
  headerContent.includes('whitespace-nowrap'),
  'Header navigation items contain whitespace-nowrap'
);
assert(
  headerContent.includes('shrink-0'),
  'Header navigation items contain shrink-0'
);
assert(
  headerContent.includes("whitespace-nowrap shrink-0"),
  'Header navigation anchor tags combine whitespace-nowrap and shrink-0'
);
assert(
  headerContent.includes('gap-1.5 xl:gap-2.5'),
  'Header navigation flex container has tightened responsive gap'
);

// -------------------------------------------------------------
// 2. BILINGUAL SUPPORT (100% i18n Parity)
// -------------------------------------------------------------
console.log('\n► 2. Bilingual Dictionary Parity & DetailView i18n:');
const bmPath = path.join(ROOT, 'src', 'i18n', 'bm.json');
const enPath = path.join(ROOT, 'src', 'i18n', 'en.json');
const bmData = JSON.parse(fs.readFileSync(bmPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

function getLeafKeys(obj, prefix = '') {
  let keys = [];
  for (const k of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      keys = keys.concat(getLeafKeys(obj[k], full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

const bmKeys = getLeafKeys(bmData).sort();
const enKeys = getLeafKeys(enData).sort();

assert(bmKeys.length >= 480, `BM dictionary contains >= 480 keys (found: ${bmKeys.length})`);
assert(enKeys.length >= 480, `EN dictionary contains >= 480 keys (found: ${enKeys.length})`);
assert(bmKeys.length === enKeys.length, `Equal key count between BM (${bmKeys.length}) and EN (${enKeys.length})`);

const missingInEn = bmKeys.filter(k => !enKeys.includes(k));
const missingInBm = enKeys.filter(k => !bmKeys.includes(k));

assert(missingInEn.length === 0, `Zero missing keys in en.json (missing: ${missingInEn.join(', ') || 'none'})`);
assert(missingInBm.length === 0, `Zero missing keys in bm.json (missing: ${missingInBm.join(', ') || 'none'})`);

// Home Buttons & Card Component Keys
assert(bmData.home.btnWeather === 'Cuaca & Bauan', 'home.btnWeather in BM is "Cuaca & Bauan"');
assert(enData.home.btnWeather === 'Weather & Scent', 'home.btnWeather in EN is "Weather & Scent"');
assert(bmData.home.btnDupe === 'Pencari Dupe', 'home.btnDupe in BM is "Pencari Dupe"');
assert(enData.home.btnDupe === 'Dupe Finder', 'home.btnDupe in EN is "Dupe Finder"');

assert(bmData.card.viewDetails === 'Lihat Perincian', 'card.viewDetails in BM is "Lihat Perincian"');
assert(enData.card.viewDetails === 'View Details', 'card.viewDetails in EN is "View Details"');
assert(bmData.card.genderUnisex === 'Unisex', 'card.genderUnisex in BM is "Unisex"');
assert(enData.card.genderUnisex === 'Unisex', 'card.genderUnisex in EN is "Unisex"');
assert(bmData.card.genderMale === 'Lelaki', 'card.genderMale in BM is "Lelaki"');
assert(enData.card.genderMale === 'Men', 'card.genderMale in EN is "Men"');
assert(bmData.card.genderFemale === 'Wanita', 'card.genderFemale in BM is "Wanita"');
assert(enData.card.genderFemale === 'Women', 'card.genderFemale in EN is "Women"');

// Weather View Bilingual Keys & Spray Advisory
assert(enData.weather.scienceTitle === 'Olfactory Science & Tropical Sillage Projection', 'weather.scienceTitle in EN is "Olfactory Science & Tropical Sillage Projection"');
assert(bmData.weather.scienceTitle === 'Sains Olfaktori & Unjuran Sillage Tropika', 'weather.scienceTitle in BM is "Sains Olfaktori & Unjuran Sillage Tropika"');
assert(enData.weather.stationNetworkTitle === 'Malaysia 27 Weather Station Network', 'weather.stationNetworkTitle in EN is "Malaysia 27 Weather Station Network"');
assert(bmData.weather.stationNetworkTitle === 'Rangkaian 27 Stesen Cuaca Malaysia', 'weather.stationNetworkTitle in BM is "Rangkaian 27 Stesen Cuaca Malaysia"');
assert(enData.weather.sprayAdviceHighHumidity === 'High humidity (>80% RH): Spray on collar or clothing fabric to prevent sweat from washing away aroma molecules.', 'weather.sprayAdviceHighHumidity in EN is translated correctly');
assert(bmData.weather.sprayAdviceHighHumidity.startsWith('Kelembapan tinggi (>80% RH)'), 'weather.sprayAdviceHighHumidity in BM starts with "Kelembapan tinggi"');

// WeatherView.js i18n Inspection
const weatherViewPath = path.join(ROOT, 'src', 'views', 'WeatherView.js');
const weatherViewContent = fs.readFileSync(weatherViewPath, 'utf8');
assert(weatherViewContent.includes("t('weather.scienceTitle')"), 'WeatherView uses t("weather.scienceTitle")');
assert(weatherViewContent.includes("t('weather.stationNetworkTitle')"), 'WeatherView uses t("weather.stationNetworkTitle")');
assert(weatherViewContent.includes("translateSprayAdvice"), 'WeatherView defines and uses translateSprayAdvice');
assert(weatherViewContent.includes("translateCondition"), 'WeatherView defines and uses translateCondition');
assert(weatherViewContent.includes("translateProjectionHold"), 'WeatherView defines and uses translateProjectionHold');

// Specific newly added keys
const criticalKeys = [
  'detail.saveToCollection',
  'detail.savedInCollection',
  'detail.genderMen',
  'detail.genderWomen',
  'detail.genderUnisex',
  'detail.topPhase',
  'detail.midPhase',
  'detail.basePhase',
  'detail.allYearRound',
  'detail.tropicalCollection',
  'detail.longevityDesc',
  'detail.sillageDesc',
  'detail.reviewsSubtitle',
  'detail.noReviewsYet',
  'detail.moreFromBrandDesc',
  'detail.noOtherFromBrand',
  'detail.hours',
  'detail.original',
  'detail.timeDay',
  'detail.timeNight',
  'detail.occasionOffice',
  'detail.occasionOutdoor',
  'detail.occasionCasual',
  'comments.tagSprays',
  'comments.tagOfficeAC',
  'comments.tagOutdoorHeat',
  'comments.activeSession',
  'comments.localWeatherTest',
  'comments.emptyReviewAlert',
  'comments.confirmDeleteReview',
  'comments.localWeatherContext'
];

for (const key of criticalKeys) {
  const parts = key.split('.');
  const hasBm = parts.reduce((o, p) => o && o[p], bmData) !== undefined;
  const hasEn = parts.reduce((o, p) => o && o[p], enData) !== undefined;
  assert(hasBm && hasEn, `Critical key '${key}' exists in both BM & EN`);
}

// Check DetailView.js for no hardcoded legacy strings
const detailViewPath = path.join(ROOT, 'src', 'views', 'DetailView.js');
const detailViewContent = fs.readFileSync(detailViewPath, 'utf8');

assert(!detailViewContent.includes('0 - 30 minit'), 'DetailView has NO hardcoded "0 - 30 minit"');
assert(!detailViewContent.includes('Impak semburan pertama'), 'DetailView has NO hardcoded "Impak semburan pertama"');
assert(!detailViewContent.includes('Jantung aroma'), 'DetailView has NO hardcoded "Jantung aroma"');
assert(!detailViewContent.includes('Asas bertahan'), 'DetailView has NO hardcoded "Asas bertahan"');
assert(!detailViewContent.includes("alert('Teks ulasan"), 'DetailView has NO hardcoded alert in Malay');
assert(!detailViewContent.includes("confirm('Adakah anda"), 'DetailView has NO hardcoded confirm in Malay');
assert(detailViewContent.includes("t('detail.topPhase')"), "DetailView uses t('detail.topPhase')");
assert(detailViewContent.includes("t('detail.midPhase')"), "DetailView uses t('detail.midPhase')");
assert(detailViewContent.includes("t('detail.basePhase')"), "DetailView uses t('detail.basePhase')");
assert(detailViewContent.includes("t('detail.genderMen')"), "DetailView uses t('detail.genderMen')");
assert(detailViewContent.includes("t('detail.genderWomen')"), "DetailView uses t('detail.genderWomen')");
assert(detailViewContent.includes("t('detail.genderUnisex')"), "DetailView uses t('detail.genderUnisex')");
assert(detailViewContent.includes("formatLongevity("), "DetailView uses formatLongevity helper");
assert(detailViewContent.includes("translateWhenToWearItem("), "DetailView uses translateWhenToWearItem helper");

// -------------------------------------------------------------
// 3. SAVE TO COLLECTION (❤️) FIRESTORE SYNC
// -------------------------------------------------------------
console.log('\n► 3. Save to Collection (❤️) Firestore Sync:');
const perfumeServicePath = path.join(ROOT, 'src', 'services', 'perfumeService.js');
const perfumeServiceContent = fs.readFileSync(perfumeServicePath, 'utf8');

assert(
  perfumeServiceContent.includes('setDoc('),
  'perfumeService toggleSavePerfume uses setDoc'
);
assert(
  perfumeServiceContent.includes('{ merge: true }'),
  'perfumeService toggleSavePerfume uses { merge: true }'
);
assert(
  perfumeServiceContent.includes('arrayUnion(') && perfumeServiceContent.includes('arrayRemove('),
  'perfumeService toggleSavePerfume uses atomic arrayUnion and arrayRemove'
);
assert(
  perfumeServiceContent.includes('getSavedPerfumes('),
  'perfumeService provides getSavedPerfumes method'
);
assert(
  perfumeServiceContent.includes('subscribeToSavedPerfumes('),
  'perfumeService provides subscribeToSavedPerfumes for real-time sync'
);

const profileViewPath = path.join(ROOT, 'src', 'views', 'ProfileView.js');
const profileViewContent = fs.readFileSync(profileViewPath, 'utf8');

assert(
  profileViewContent.includes('perfumeService.getSavedPerfumes'),
  'ProfileView calls perfumeService.getSavedPerfumes for fresh data on render'
);
assert(
  profileViewContent.includes('perfumeService.subscribeToSavedPerfumes'),
  'ProfileView subscribes to real-time saved perfumes via subscribeToSavedPerfumes'
);
assert(
  detailViewContent.includes("t('detail.savedInCollection')"),
  "DetailView uses t('detail.savedInCollection') for dynamic love button"
);
assert(
  detailViewContent.includes("t('detail.saveToCollection')"),
  "DetailView uses t('detail.saveToCollection') for dynamic love button"
);
assert(
  detailViewContent.includes("detail-love-toggle-btn"),
  "DetailView uses isolated detail-love-toggle-btn class avoiding card listener collisions"
);

// -------------------------------------------------------------
// 4. FRAGRANTICA-STYLE MAIN ACCORDS
// -------------------------------------------------------------
console.log('\n► 4. Fragrantica-Style Main Accords (Vertical Stacked Bars):');

assert(
  detailViewContent.includes('function getAccordColor('),
  'DetailView defines getAccordColor helper'
);
assert(
  detailViewContent.includes('citrus') && detailViewContent.includes('#eab308'),
  'getAccordColor maps citrus to yellow palette (#eab308)'
);
assert(
  detailViewContent.includes('woody') && detailViewContent.includes('#854d0e'),
  'getAccordColor maps woody to brown palette (#854d0e)'
);
assert(
  detailViewContent.includes('spicy') && detailViewContent.includes('#dc2626'),
  'getAccordColor maps spicy/warm spicy to red palette'
);
assert(
  detailViewContent.includes('aquatic') || detailViewContent.includes('marine'),
  'getAccordColor maps aquatic/marine notes'
);
assert(
  detailViewContent.includes('.sort((a, b) => b.percentage - a.percentage)'),
  'DetailView sorts accords descending by percentage (highest on top)'
);
assert(
  detailViewContent.includes('style="width: ${Math.max(22, item.percentage)}%; background-color: ${color.bg}; color: ${color.text};"'),
  'DetailView renders horizontal stacked bar with dynamic width, bg color, and text color'
);
assert(
  detailViewContent.includes('id="accords-section"'),
  'DetailView maintains #accords-section container ID for structural hierarchy'
);

// -------------------------------------------------------------
// 5. DUPEVIEW SECTION HEADERS & REMOVAL OF (MAX 5)
// -------------------------------------------------------------
console.log('\n► 5. DupeView Headers & Removal of (Max 5):');
const dupeViewPath = path.join(ROOT, 'src', 'views', 'DupeView.js');
const dupeViewContent = fs.readFileSync(dupeViewPath, 'utf8');

assert(
  !dupeViewContent.includes('(Max 5)'),
  'DupeView has ZERO occurrences of "(Max 5)"'
);
assert(
  !bmData.dupe.arabSection.includes('(Max 5)') && !bmData.dupe.localSection.includes('(Max 5)'),
  'bm.json dupe section keys have ZERO occurrences of "(Max 5)"'
);
assert(
  !enData.dupe.arabSection.includes('(Max 5)') && !enData.dupe.localSection.includes('(Max 5)'),
  'en.json dupe section keys have ZERO occurrences of "(Max 5)"'
);
assert(
  dupeViewContent.includes('font-headline text-lg sm:text-xl md:text-2xl font-bold text-deep-navy tracking-tight'),
  'DupeView uses standardized responsive headline typography on section headers'
);
assert(
  dupeViewContent.includes('id="arab-dupe-section"') && dupeViewContent.includes('id="local-dupe-section"'),
  'DupeView maintains separate #arab-dupe-section and #local-dupe-section containers'
);

// -------------------------------------------------------------
// 6. ZERO-PRICE COMPLIANCE
// -------------------------------------------------------------
console.log('\n► 6. Zero-Price Rule Compliance Scan:');
const checkFiles = [
  'src/components/Header.js',
  'src/views/DetailView.js',
  'src/views/DupeView.js',
  'src/views/ProfileView.js',
  'src/views/WeatherView.js',
  'src/views/HomeView.js',
  'src/i18n/bm.json',
  'src/i18n/en.json'
];

for (const relPath of checkFiles) {
  const content = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  assert(!content.includes('RM '), `${relPath} has NO 'RM ' price tags`);
  assert(!content.includes('MYR '), `${relPath} has NO 'MYR ' currency`);
  assert(!/jimat\s+\d+%/i.test(content), `${relPath} has NO discount/savings marketing`);
}

// -------------------------------------------------------------
// 7. LONGEVITY & FRAGRANCE NOTES LOCALIZATION (EN / BM)
// -------------------------------------------------------------
console.log('\n► 7. Longevity Units/Phrases & Fragrance Notes Localization:');

// 7.1 Longevity dictionary keys
assert(bmData.longevityPhrases.hours === 'Jam', 'bm.json longevityPhrases.hours is "Jam"');
assert(enData.longevityPhrases.hours === 'Hours', 'en.json longevityPhrases.hours is "Hours"');
assert(bmData.longevityPhrases.hotWeather === 'Panas Terik', 'bm.json longevityPhrases.hotWeather is "Panas Terik"');
assert(enData.longevityPhrases.hotWeather === 'Hot Weather', 'en.json longevityPhrases.hotWeather is "Hot Weather"');
assert(bmData.longevityPhrases.daily === '(Harian)', 'bm.json longevityPhrases.daily is "(Harian)"');
assert(enData.longevityPhrases.daily === '(Daily)', 'en.json longevityPhrases.daily is "(Daily)"');
assert(bmData.longevityPhrases.acMallOffice === '(AC Mall/Offis)', 'bm.json longevityPhrases.acMallOffice is "(AC Mall/Offis)"');
assert(enData.longevityPhrases.acMallOffice === '(AC Mall/Office)', 'en.json longevityPhrases.acMallOffice is "(AC Mall/Office)"');

// 7.2 Longevity format execution tests
assert(formatLongevity('10+ Jam Panas Terik', 'en') === '10+ Hours Hot Weather', 'formatLongevity("10+ Jam Panas Terik", "en") translates to "10+ Hours Hot Weather"');
assert(formatLongevity('10+ Jam Panas Terik', 'bm') === '10+ Jam Panas Terik', 'formatLongevity("10+ Jam Panas Terik", "bm") preserves "10+ Jam Panas Terik"');
assert(formatLongevity('6+ Jam (Harian)', 'en') === '6+ Hours (Daily)', 'formatLongevity("6+ Jam (Harian)", "en") translates to "6+ Hours (Daily)"');
assert(formatLongevity('6+ Jam (Harian)', 'bm') === '6+ Jam (Harian)', 'formatLongevity("6+ Jam (Harian)", "bm") preserves "6+ Jam (Harian)"');
assert(formatLongevity('7 Jam (AC Mall/Offis)', 'en') === '7 Hours (AC Mall/Office)', 'formatLongevity("7 Jam (AC Mall/Offis)", "en") translates to "7 Hours (AC Mall/Office)"');
assert(formatLongevity('7 Jam (AC Mall/Offis)', 'bm') === '7 Jam (AC Mall/Offis)', 'formatLongevity("7 Jam (AC Mall/Offis)", "bm") preserves "7 Jam (AC Mall/Offis)"');
assert(formatLongevity('8 - 10 Jam', 'en') === '8 - 10 Hours', 'formatLongevity("8 - 10 Jam", "en") translates to "8 - 10 Hours"');
assert(formatLongevity('8 - 10 Jam', 'bm') === '8 - 10 Jam', 'formatLongevity("8 - 10 Jam", "bm") preserves "8 - 10 Jam"');

// 7.3 Fragrance Notes dictionary keys
assert(bmData.fragranceNotes.smokyPineapple === 'Nanas Berasap', 'bm.json fragranceNotes.smokyPineapple is "Nanas Berasap"');
assert(enData.fragranceNotes.smokyPineapple === 'Smoky Pineapple', 'en.json fragranceNotes.smokyPineapple is "Smoky Pineapple"');
assert(bmData.fragranceNotes.milkChocolateWarmSugar === 'Coklat Susu, Gula Hangat', 'bm.json fragranceNotes.milkChocolateWarmSugar is "Coklat Susu, Gula Hangat"');
assert(enData.fragranceNotes.milkChocolateWarmSugar === 'Milk Chocolate, Warm Sugar', 'en.json fragranceNotes.milkChocolateWarmSugar is "Milk Chocolate, Warm Sugar"');
assert(bmData.fragranceNotes.orange === 'Oren', 'bm.json fragranceNotes.orange is "Oren"');
assert(enData.fragranceNotes.orange === 'Orange', 'en.json fragranceNotes.orange is "Orange"');
assert(bmData.fragranceNotes.cleanNeroliBlackPepper === 'Neroli Bersih, Lada Hitam', 'bm.json fragranceNotes.cleanNeroliBlackPepper is "Neroli Bersih, Lada Hitam"');
assert(enData.fragranceNotes.cleanNeroliBlackPepper === 'Clean Neroli, Black Pepper', 'en.json fragranceNotes.cleanNeroliBlackPepper is "Clean Neroli, Black Pepper"');
assert(bmData.fragranceNotes.cinnamon === 'Kayu Manis', 'bm.json fragranceNotes.cinnamon is "Kayu Manis"');
assert(enData.fragranceNotes.cinnamon === 'Cinnamon', 'en.json fragranceNotes.cinnamon is "Cinnamon"');
assert(bmData.fragranceNotes.nutmeg === 'Buah Pala', 'bm.json fragranceNotes.nutmeg is "Buah Pala"');
assert(enData.fragranceNotes.nutmeg === 'Nutmeg', 'en.json fragranceNotes.nutmeg is "Nutmeg"');
assert(bmData.fragranceNotes.youngCoconut === 'Kelapa Muda', 'bm.json fragranceNotes.youngCoconut is "Kelapa Muda"');
assert(enData.fragranceNotes.youngCoconut === 'Young Coconut', 'en.json fragranceNotes.youngCoconut is "Young Coconut"');

// 7.4 Fragrance Notes translation execution tests
assert(translateNotes('Nanas Berasap', 'en') === 'Smoky Pineapple', 'translateNotes("Nanas Berasap", "en") is "Smoky Pineapple"');
assert(translateNotes('Nanas Berasap (Smoky Pineapple)', 'en') === 'Smoky Pineapple', 'translateNotes("Nanas Berasap (Smoky Pineapple)", "en") is "Smoky Pineapple"');
assert(translateNotes('Nanas Berasap', 'bm') === 'Nanas Berasap', 'translateNotes("Nanas Berasap", "bm") is "Nanas Berasap"');
assert(translateNotes('Coklat Susu, Gula Hangat', 'en') === 'Milk Chocolate, Warm Sugar', 'translateNotes("Coklat Susu, Gula Hangat", "en") is "Milk Chocolate, Warm Sugar"');
assert(translateNotes('Coklat Susu, Gula Hangat', 'bm') === 'Coklat Susu, Gula Hangat', 'translateNotes("Coklat Susu, Gula Hangat", "bm") is "Coklat Susu, Gula Hangat"');
assert(translateNotes('Oren', 'en') === 'Orange', 'translateNotes("Oren", "en") is "Orange"');
assert(translateNotes('Oren', 'bm') === 'Oren', 'translateNotes("Oren", "bm") is "Oren"');
assert(translateNotes('Neroli Bersih, Lada Hitam', 'en') === 'Clean Neroli, Black Pepper', 'translateNotes("Neroli Bersih, Lada Hitam", "en") is "Clean Neroli, Black Pepper"');
assert(translateNotes('Neroli Bersih, Lada Hitam', 'bm') === 'Neroli Bersih, Lada Hitam', 'translateNotes("Neroli Bersih, Lada Hitam", "bm") is "Neroli Bersih, Lada Hitam"');
assert(translateNotes('Kayu Manis', 'en') === 'Cinnamon', 'translateNotes("Kayu Manis", "en") is "Cinnamon"');
assert(translateNotes('Kayu Manis (Cinnamon)', 'en') === 'Cinnamon', 'translateNotes("Kayu Manis (Cinnamon)", "en") is "Cinnamon"');
assert(translateNotes('Kayu Manis', 'bm') === 'Kayu Manis', 'translateNotes("Kayu Manis", "bm") is "Kayu Manis"');
assert(translateNotes('Buah Pala', 'en') === 'Nutmeg', 'translateNotes("Buah Pala", "en") is "Nutmeg"');
assert(translateNotes('Buah Pala (Nutmeg)', 'en') === 'Nutmeg', 'translateNotes("Buah Pala (Nutmeg)", "en") is "Nutmeg"');
assert(translateNotes('Buah Pala', 'bm') === 'Buah Pala', 'translateNotes("Buah Pala", "bm") is "Buah Pala"');
assert(translateNotes('Kelapa Muda', 'en') === 'Young Coconut', 'translateNotes("Kelapa Muda", "en") is "Young Coconut"');
assert(translateNotes('Kelapa Muda', 'bm') === 'Kelapa Muda', 'translateNotes("Kelapa Muda", "bm") is "Kelapa Muda"');

// 7.5 Array of notes translation
const translatedArray = translateNotes(['Kayu Manis (Cinnamon)', 'Buah Pala (Nutmeg)', 'Kelapa Muda'], 'en');
assert(translatedArray[0] === 'Cinnamon' && translatedArray[1] === 'Nutmeg' && translatedArray[2] === 'Young Coconut', 'translateNotes array translates all elements to EN');

// 7.6 Component Wiring Verification
const cardPath = path.join(ROOT, 'src', 'components', 'PerfumeCard.js');
const cardContent = fs.readFileSync(cardPath, 'utf8');
assert(cardContent.includes('formatLongevity('), 'PerfumeCard.js uses formatLongevity');
assert(cardContent.includes('translateNotes('), 'PerfumeCard.js uses translateNotes');
assert(cardContent.includes('const notes ='), 'PerfumeCard.js defines notes variable');

assert(weatherViewContent.includes('const notes = translateNotes'), 'WeatherView.js defines notes with translateNotes');
assert(weatherViewContent.includes('${notes}'), 'WeatherView.js renders translated notes variable in card');
assert(weatherViewContent.includes('translateProjectionHold'), 'WeatherView.js uses translateProjectionHold with formatLongevity');

assert(detailViewContent.includes('translateNote'), 'DetailView.js uses translateNote on notes pyramid');
assert(detailViewContent.includes('formatLongevity'), 'DetailView.js uses formatLongevity');

const dupeContent = fs.readFileSync(path.join(ROOT, 'src', 'views', 'DupeView.js'), 'utf8');
assert(dupeContent.includes('formatLongevity('), 'DupeView.js uses formatLongevity');

// -------------------------------------------------------------
// 8. 2-GRID MOBILE LAYOUT & COMPACT UI VERIFICATION
// -------------------------------------------------------------
console.log('\n► 8. 2-Grid Mobile Layout & Compact UI Verification:');

// 8.1 Dupe Finder Grid Layout
const dupeViewFresh = fs.readFileSync(path.join(ROOT, 'src', 'views', 'DupeView.js'), 'utf8');
assert(
  dupeViewFresh.includes('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-2'),
  'DupeView Arab and Local sections use "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-2"'
);
assert(
  (dupeViewFresh.match(/grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-2/g) || []).length >= 2,
  'DupeView applies 2-column mobile grid to both Arab and Local sections'
);

// 8.2 Catalog / Directory View Grid Layout
const dirViewFresh = fs.readFileSync(path.join(ROOT, 'src', 'views', 'DirectoryView.js'), 'utf8');
assert(
  dirViewFresh.includes('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-2'),
  'DirectoryView uses "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-2" for mobile 2-column layout'
);

// 8.3 Search & Profile Views Grid Layout
const searchViewFresh = fs.readFileSync(path.join(ROOT, 'src', 'views', 'SearchView.js'), 'utf8');
assert(
  searchViewFresh.includes('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-2'),
  'SearchView uses 2-column mobile grid layout'
);
const profileViewFresh = fs.readFileSync(path.join(ROOT, 'src', 'views', 'ProfileView.js'), 'utf8');
assert(
  profileViewFresh.includes('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-2'),
  'ProfileView uses 2-column mobile grid layout'
);

// 8.4 Compact Card UI in DupeView
assert(
  dupeViewFresh.includes('p-2.5 sm:p-5'),
  'renderDupeCard uses compact padding p-2.5 sm:p-5'
);
assert(
  dupeViewFresh.includes('h-28 sm:h-40'),
  'renderDupeCard uses compact image cavity height h-28 sm:h-40'
);
assert(
  dupeViewFresh.includes('h-20 sm:h-28'),
  'renderDupeCard flacon image uses compact height h-20 sm:h-28'
);
assert(
  dupeViewFresh.includes('text-xs sm:text-base'),
  'renderDupeCard uses responsive compact title text-xs sm:text-base'
);
assert(
  dupeViewFresh.includes('py-1 sm:py-1.5'),
  'renderDupeCard View Details button uses compact py-1 sm:py-1.5'
);

// 8.5 Compact Card UI in PerfumeCard.js
const cardFresh = fs.readFileSync(cardPath, 'utf8');
assert(
  cardFresh.includes('p-2.5 sm:p-4'),
  'renderPerfumeCard uses compact padding p-2.5 sm:p-4'
);
assert(
  cardFresh.includes('h-28 sm:h-44'),
  'renderPerfumeCard uses compact image cavity height h-28 sm:h-44'
);
assert(
  cardFresh.includes('h-20 sm:h-32'),
  'renderPerfumeCard flacon image uses compact height h-20 sm:h-32'
);
assert(
  cardFresh.includes('text-xs sm:text-sm md:text-base'),
  'renderPerfumeCard uses responsive compact title text-xs sm:text-sm md:text-base'
);
assert(
  cardFresh.includes('py-1 sm:py-1.5'),
  'renderPerfumeCard View Details button uses compact py-1 sm:py-1.5'
);

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n===============================================================');
console.log(`📊 G6 5-FIXES AUDIT: Passed: ${passedTests} | Failed: ${failedTests} | Total: ${totalTests}`);
console.log('===============================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

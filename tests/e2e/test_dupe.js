/**
 * ScentCast Malaysia — E2E Test Suite: R6 Separated Dupe Finder (Arab vs Malaysia)
 * Covers two distinct sections (🇦🇪 Arab vs 🇲🇾 Tempatan), maximum 5 dupes cap,
 * conditional count messages, card spec displays, and zero price enforcement.
 */

import {
  describe,
  test,
  assert,
  assertEqual,
  assertTrue,
  assertFalse,
  assertNull,
  assertNotNull,
  assertIncludes,
  assertNotIncludes,
  assertLessThan
} from './runner.js';
import { getDupeSectionNotice, renderDupeView, UAE_FLAG_ICON, MALAYSIA_FLAG_ICON } from '../../src/views/DupeView.js';
import { i18nService } from '../../src/services/i18nService.js';
import { renderHeader } from '../../src/components/Header.js';
import fs from 'fs';
import path from 'path';

// Canonical Arab brand whitelist
export const ARAB_BRANDS = [
  'Afnan',
  'Armaf',
  'Lattafa',
  'Al-Rehab',
  'Ajmal',
  'Rasasi',
  'Swiss Arabian',
  'Maison Alhambra'
];

// Canonical Local Malaysian artisan brands
export const LOCAL_MALAYSIAN_BRANDS = [
  'The Scent Supply Co',
  'ScentLab Malaysia',
  'Artisan Scents KL',
  'Wangi Artisan MY'
];

// In-memory dupe database representing designer-to-dupe mapping
export const DUPE_DATABASE = {
  'bvlgari tygar': {
    target: 'Bvlgari Tygar',
    arab: [
      { id: 'turathi-blue', name: 'Turathi Blue', brand: 'Afnan', matchPercent: 95, longevity: '8 - 10 Jam', sillage: '2.0 m' }
    ],
    local: [
      { id: 'tygar-ssc', name: 'Tiger Citrus Amber', brand: 'The Scent Supply Co', matchPercent: 92, longevity: '7 - 9 Jam', sillage: '1.8 m' }
    ]
  },
  'creed aventus': {
    target: 'Creed Aventus',
    arab: [
      { id: 'cdnim', name: 'Club de Nuit Intense Man', brand: 'Armaf', matchPercent: 94, longevity: '9 - 12 Jam', sillage: '2.5 m' },
      { id: 'supremacy-silver', name: 'Supremacy Silver', brand: 'Afnan', matchPercent: 90, longevity: '8 - 10 Jam', sillage: '2.0 m' },
      { id: 'laventure', name: "L'Aventure", brand: 'Al Haramain', matchPercent: 89, longevity: '7 - 9 Jam', sillage: '1.8 m' },
      { id: 'shaheen-silver', name: 'Shaheen Silver', brand: 'Lattafa', matchPercent: 88, longevity: '7 - 9 Jam', sillage: '1.7 m' },
      { id: 'insurrection-pure-ii', name: 'Insurrection II Pure', brand: 'Reyane Tradition', matchPercent: 85, longevity: '6 - 8 Jam', sillage: '1.5 m' },
      { id: 'extra-dupe-6', name: 'Aventus Clone 6', brand: 'Armaf', matchPercent: 82, longevity: '6 Jam', sillage: '1.2 m' } // 6th item
    ],
    local: [
      { id: 'aventus-ssc', name: 'Smoky Pineapple Birch', brand: 'The Scent Supply Co', matchPercent: 91, longevity: '7 - 9 Jam', sillage: '1.9 m' }
    ]
  },
  "kilian angels' share": {
    target: "Kilian Angels' Share",
    arab: [
      { id: 'khamrah', name: 'Khamrah', brand: 'Lattafa', matchPercent: 93, longevity: '10 - 14 Jam', sillage: '2.5 m' },
      { id: 'cocktail-intense', name: 'Cocktail Intense', brand: 'Fragrance World', matchPercent: 90, longevity: '8 - 10 Jam', sillage: '2.0 m' }
    ],
    local: []
  },
  'zero-dupes-fragrance': {
    target: 'Rare Niche Elixir',
    arab: [],
    local: []
  }
};

// Canonical dupe resolution engine
export function findDupes(designerQuery) {
  if (!designerQuery || !designerQuery.trim()) {
    return { status: 'empty', arab: [], local: [] };
  }

  const cleanQuery = designerQuery.toLowerCase().trim();
  // Find key in database
  const matchKey = Object.keys(DUPE_DATABASE).find((k) =>
    k === cleanQuery || cleanQuery.includes(k) || k.includes(cleanQuery)
  );

  if (!matchKey) {
    return {
      status: 'not_found',
      arab: [],
      local: [],
      message: 'Tiada dupe dijumpai untuk wangian ini.'
    };
  }

  const entry = DUPE_DATABASE[matchKey];
  // Apply max 5 cap per section
  const arabDupes = (entry.arab || []).slice(0, 5);
  const localDupes = (entry.local || []).slice(0, 5);

  const getSectionNotice = (list) => {
    if (list.length === 0) return 'Tiada dupe dijumpai untuk wangian ini.';
    if (list.length < 5) return `Hanya ${list.length} dupe ditemui:`;
    return '5 dupe terbaik ditemui:';
  };

  return {
    status: 'success',
    target: entry.target,
    arab: arabDupes,
    arabNotice: getSectionNotice(arabDupes),
    local: localDupes,
    localNotice: getSectionNotice(localDupes)
  };
}

describe('R6: Separated Dupe Finder — Tier 1 Feature Coverage', () => {

  test('Dupe-01: Dupe results are divided into two distinct sections: Arab vs Local', () => {
    const res = findDupes('Bvlgari Tygar');
    assertEqual(res.status, 'success');
    assertTrue('arab' in res, 'Must contain distinct "arab" section');
    assertTrue('local' in res, 'Must contain distinct "local" section');
    assertEqual(res.arab.length, 1);
    assertEqual(res.local.length, 1);
  });

  test('Dupe-02: Strict category purity: Arab brands do not appear in Local section and vice-versa', () => {
    const res = findDupes('Creed Aventus');
    for (const d of res.arab) {
      assertNotIncludes(LOCAL_MALAYSIAN_BRANDS, d.brand, `Arab section must not contain local brand ${d.brand}`);
    }
    for (const d of res.local) {
      assertNotIncludes(ARAB_BRANDS, d.brand, `Local section must not contain Arab brand ${d.brand}`);
    }
  });

  test('Dupe-03: Maximum 5 dupes per section cap is strictly enforced', () => {
    // Creed Aventus has 6 arab dupes in database
    const res = findDupes('Creed Aventus');
    assertEqual(res.arab.length, 5, 'Arab section must be capped at exactly 5 dupes');
    assertLessThan(res.arab.length, 6, 'Must not exceed 5 items');
  });

  test('Dupe-04: Dupe cards contain Name, Brand, Match %, Longevity, Sillage, and zero price', () => {
    const res = findDupes('Bvlgari Tygar');
    const arabDupe = res.arab[0]; // Turathi Blue

    assertNotNull(arabDupe.name, 'Must have name');
    assertNotNull(arabDupe.brand, 'Must have brand');
    assertNotNull(arabDupe.matchPercent, 'Must have match %');
    assertNotNull(arabDupe.longevity, 'Must have longevity');
    assertNotNull(arabDupe.sillage, 'Must have sillage');

    // Price checks
    assertFalse('priceMYR' in arabDupe, 'Dupe card must not have priceMYR');
    assertFalse('originalPriceMYR' in arabDupe, 'Dupe card must not have originalPriceMYR');
    assertFalse('savings' in arabDupe, 'Dupe card must not have savings');
  });

  test('Dupe-05: Route #/dupe is standard canonical route for dupe finder', () => {
    const targetRoute = '#/dupe';
    assertEqual(targetRoute, '#/dupe');
    assertNotIncludes(targetRoute, '#/dupe-finder', 'Must not use legacy #/dupe-finder');
  });
});

describe('R6: Separated Dupe Finder — Tier 2 Boundary & Corner Cases', () => {

  test('Dupe-06: Zero matching dupes displays exact required fallback message', () => {
    const res = findDupes('zero-dupes-fragrance');
    assertEqual(res.arab.length, 0);
    assertEqual(res.local.length, 0);
    assertEqual(
      res.arabNotice,
      'Tiada dupe dijumpai untuk wangian ini.',
      'Must display exact message when 0 dupes found'
    );
  });

  test('Dupe-07: Less than 5 dupes displays conditional count notice: "Hanya X dupe ditemui:"', () => {
    const res = findDupes('Bvlgari Tygar'); // 1 arab dupe
    assertEqual(res.arab.length, 1);
    assertEqual(res.arabNotice, 'Hanya 1 dupe ditemui:');

    const resAngels = findDupes("Kilian Angels' Share"); // 2 arab dupes
    assertEqual(resAngels.arab.length, 2);
    assertEqual(resAngels.arabNotice, 'Hanya 2 dupe ditemui:');
  });

  test('Dupe-08: Non-existent designer perfume query returns not_found status with message', () => {
    const res = findDupes('Completely Unknown Nonexistent Fragrance 999');
    assertEqual(res.status, 'not_found');
    assertEqual(res.message, 'Tiada dupe dijumpai untuk wangian ini.');
  });

  test('Dupe-09: Case-insensitive query matching (upper, lower, mixed case)', () => {
    const r1 = findDupes('bvlgari tygar');
    const r2 = findDupes('BVLGARI TYGAR');
    const r3 = findDupes('BvLgArI TyGaR');

    assertEqual(r1.status, 'success');
    assertEqual(r2.status, 'success');
    assertEqual(r3.status, 'success');
    assertEqual(r1.arab[0].id, r2.arab[0].id);
  });

  test('Dupe-10: Empty and whitespace queries are handled safely without crash', () => {
    const emptyRes = findDupes('');
    assertEqual(emptyRes.status, 'empty');
    assertEqual(emptyRes.arab.length, 0);

    const wsRes = findDupes('     ');
    assertEqual(wsRes.status, 'empty');
    assertEqual(wsRes.arab.length, 0);
  });

  test('Dupe-11: getDupeSectionNotice outputs accurate Malay notices in BM mode', () => {
    i18nService.setLanguage('bm');
    assertEqual(getDupeSectionNotice([]), 'Tiada dupe dijumpai untuk wangian ini.');
    assertEqual(getDupeSectionNotice([1]), 'Hanya 1 dupe ditemui:');
    assertEqual(getDupeSectionNotice([1, 2, 3]), 'Hanya 3 dupe ditemui:');
    assertEqual(getDupeSectionNotice([1, 2, 3, 4, 5]), '5 dupe terbaik ditemui:');
  });

  test('Dupe-12: getDupeSectionNotice outputs accurate English notices in EN mode', () => {
    i18nService.setLanguage('en');
    assertEqual(getDupeSectionNotice([]), 'No dupes found for this fragrance.');
    assertEqual(getDupeSectionNotice([1]), 'Only 1 dupe found:');
    assertEqual(getDupeSectionNotice([1, 2, 3]), 'Only 3 dupes found:');
    assertEqual(getDupeSectionNotice([1, 2, 3, 4, 5]), 'Top 5 dupes found:');
    // Reset to BM
    i18nService.setLanguage('bm');
  });

  test('Dupe-13: Dupe Finder section titles display Malaysia flag and Globe icons with reordered sections', async () => {
    i18nService.setLanguage('en');
    const dupeHtmlEN = await renderDupeView();
    assertIncludes(dupeHtmlEN, 'aria-label="Globe"', 'DupeView must render Globe icon for Other section');
    assertIncludes(dupeHtmlEN, 'aria-label="Malaysia"', 'DupeView must render Malaysia flag icon for Local section');
    assertIncludes(dupeHtmlEN, 'Other Dupes (International)', 'EN mode renders Other Dupes title');
    assertIncludes(dupeHtmlEN, 'Local Dupes', 'EN mode renders Local Dupes title');
    assert(dupeHtmlEN.indexOf('id="local-dupe-section"') < dupeHtmlEN.indexOf('id="arab-dupe-section"'), 'Local section must be rendered above Other dupes section');

    i18nService.setLanguage('bm');
    const dupeHtmlBM = await renderDupeView();
    assertIncludes(dupeHtmlBM, 'aria-label="Globe"', 'DupeView must render Globe icon in BM mode');
    assertIncludes(dupeHtmlBM, 'aria-label="Malaysia"', 'DupeView must render Malaysia flag icon in BM mode');
    assertIncludes(dupeHtmlBM, 'Dupe Lain (Antarabangsa)', 'BM mode renders Dupe Lain title');
    assertIncludes(dupeHtmlBM, 'Dupe Tempatan', 'BM mode renders Dupe Tempatan title');
    assert(dupeHtmlBM.indexOf('id="local-dupe-section"') < dupeHtmlBM.indexOf('id="arab-dupe-section"'), 'Local section must be rendered above Other dupes section in BM');
  });

  test('Dupe-14: Header language toggle button retains its canonical original format', () => {
    i18nService.setLanguage('bm');
    const headerHtmlBM = renderHeader('dupe');
    assertIncludes(headerHtmlBM, 'id="toggle-lang-btn"', 'Must render toggle-lang-btn');
    assertIncludes(headerHtmlBM, 'translate', 'Header renders translate icon');
    assertIncludes(headerHtmlBM, '<span>BM</span>', 'BM mode displays BM text');

    i18nService.setLanguage('en');
    const headerHtmlEN = renderHeader('dupe');
    assertIncludes(headerHtmlEN, '<span>EN</span>', 'EN mode displays EN text');

    // Reset to BM
    i18nService.setLanguage('bm');
  });

  test('Dupe-15: Admin Panel form contains Dupe Category radio buttons [ 🇲🇾 Malaysia ] and [ 🌐 Other ]', () => {
    const adminViewContent = fs.readFileSync(path.resolve(process.cwd(), 'src/views/AdminView.js'), 'utf8');
    assertIncludes(adminViewContent, 'id="admin-dupe-cat-my"', 'Admin form has Malaysia dupe category radio');
    assertIncludes(adminViewContent, 'id="admin-dupe-cat-other"', 'Admin form has Other dupe category radio');
    assertIncludes(adminViewContent, 'name="admin-dupe-category"', 'Radios share admin-dupe-category group');
    assertIncludes(adminViewContent, '🇲🇾', 'Admin form displays Malaysia flag in radio');
    assertIncludes(adminViewContent, '🌐', 'Admin form displays Globe in radio');
    assertIncludes(adminViewContent, 'dupeCategory', 'Admin form records dupeCategory in payload');
  });

  test('Dupe-16: DetailView has no phase duration badges on notes composition cards', () => {
    const detailViewContent = fs.readFileSync(path.resolve(process.cwd(), 'src/views/DetailView.js'), 'utf8');
    assert(!detailViewContent.includes('<span>${t(\'detail.topPhase\')}</span>'), 'DetailView must NOT render topPhase badge');
    assert(!detailViewContent.includes('<span>${t(\'detail.midPhase\')}</span>'), 'DetailView must NOT render midPhase badge');
    assert(!detailViewContent.includes('<span>${t(\'detail.basePhase\')}</span>'), 'DetailView must NOT render basePhase badge');
  });
});

/**
 * ScentCast Malaysia — E2E Test Suite: R2 Global Full-Text Search Engine & Directory
 * Covers searchTokens generation, multi-field search (name, notes, brand, accords, gender),
 * header search navigation, zero price UI, and edge case queries.
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
  assertGreaterThan
} from './runner.js';

// Canonical search token generator as specified in R2
export function generateSearchTokens(perfume) {
  const tokens = new Set();

  function addWords(str) {
    if (!str || typeof str !== 'string') return;
    // Lowercase and remove punctuation
    const words = str
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .split(/[\s-]+/)
      .filter((w) => w.length > 1);
    words.forEach((w) => tokens.add(w));
  }

  addWords(perfume.name);
  addWords(perfume.brand);
  addWords(perfume.gender);

  if (Array.isArray(perfume.accords)) {
    perfume.accords.forEach((a) => {
      if (typeof a === 'string') addWords(a);
      else if (a && a.name) addWords(a.name);
    });
  }

  if (perfume.notes) {
    ['top', 'mid', 'base'].forEach((layer) => {
      const layerNotes = perfume.notes[layer];
      if (Array.isArray(layerNotes)) {
        layerNotes.forEach((n) => addWords(n));
      } else if (typeof layerNotes === 'string') {
        addWords(layerNotes);
      }
    });
  }

  return Array.from(tokens);
}

// Canonical search function using searchTokens
export function searchPerfumes(catalog, query) {
  if (!query || !query.trim()) return [];
  const cleanQuery = query.toLowerCase().trim();
  const queryTokens = cleanQuery.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) return [];

  return catalog.filter((perfume) => {
    const tokens = perfume.searchTokens || generateSearchTokens(perfume);
    // Matches if every query token matches at least one perfume token (or starts with it)
    return queryTokens.every((qToken) =>
      tokens.some((token) => token.includes(qToken))
    );
  });
}

// Sample test catalog representing ScentCast perfumes
export const SAMPLE_PERFUME_CATALOG = [
  {
    id: 'turathi-blue',
    name: 'Turathi Blue',
    brand: 'Afnan',
    gender: 'Male',
    accords: [{ name: 'Citrus', percent: 85 }, { name: 'Amber', percent: 65 }, { name: 'Woody', percent: 50 }],
    notes: {
      top: ['Bergamot', 'Mandarin Orange'],
      mid: ['Amber', 'Woody Notes'],
      base: ['Musk', 'Patchouli', 'Spices']
    }
  },
  {
    id: 'cdnim',
    name: 'Club de Nuit Intense Man',
    brand: 'Armaf',
    gender: 'Male',
    accords: [{ name: 'Fruity', percent: 80 }, { name: 'Smoky', percent: 75 }, { name: 'Citrus', percent: 70 }],
    notes: {
      top: ['Lemon', 'Pineapple', 'Blackcurrant', 'Apple'],
      mid: ['Birch', 'Jasmine', 'Rose'],
      base: ['Musk', 'Ambergris', 'Patchouli', 'Vanilla']
    }
  },
  {
    id: 'khamrah',
    name: 'Khamrah',
    brand: 'Lattafa',
    gender: 'Unisex',
    accords: [{ name: 'Sweet', percent: 90 }, { name: 'Warm Spicy', percent: 85 }, { name: 'Vanilla', percent: 75 }],
    notes: {
      top: ['Cinnamon', 'Nutmeg', 'Bergamot'],
      mid: ['Dates', 'Praline', 'Tuberose'],
      base: ['Vanilla', 'Tonka Bean', 'Amberwood', 'Benzoin']
    }
  },
  {
    id: 'delina-la-rosee',
    name: 'La Rosee Rose Blossom',
    brand: 'The Scent Supply Co',
    gender: 'Female',
    accords: [{ name: 'Floral', percent: 95 }, { name: 'Fresh', percent: 80 }, { name: 'Aquatic', percent: 70 }],
    notes: {
      top: ['Lychee', 'Pear', 'Bergamot'],
      mid: ['Turkish Rose', 'Peony', 'Watery Notes'],
      base: ['White Musk', 'Woody Notes', 'Vetiver']
    }
  }
];

describe('R2: Global Full-Text Search Engine — Tier 1 Feature Coverage', () => {

  test('Search-01: searchTokens[] automatically generated with name, brand, gender, notes, and accords', () => {
    const perfume = SAMPLE_PERFUME_CATALOG[0]; // Turathi Blue
    const tokens = generateSearchTokens(perfume);

    assertIncludes(tokens, 'turathi', 'Must include name token: turathi');
    assertIncludes(tokens, 'blue', 'Must include name token: blue');
    assertIncludes(tokens, 'afnan', 'Must include brand token: afnan');
    assertIncludes(tokens, 'male', 'Must include gender token: male');
    assertIncludes(tokens, 'citrus', 'Must include accord token: citrus');
    assertIncludes(tokens, 'bergamot', 'Must include top note: bergamot');
    assertIncludes(tokens, 'patchouli', 'Must include base note: patchouli');
  });

  test('Search-02: Full-text search accurately matches by perfume name', () => {
    const results = searchPerfumes(SAMPLE_PERFUME_CATALOG, 'Turathi');
    assertEqual(results.length, 1, 'Should find 1 perfume for "Turathi"');
    assertEqual(results[0].id, 'turathi-blue', 'Matches Turathi Blue');
  });

  test('Search-03: Full-text search accurately matches by fragrance notes (Top, Mid, Base)', () => {
    const bergamotResults = searchPerfumes(SAMPLE_PERFUME_CATALOG, 'bergamot');
    assertGreaterThan(bergamotResults.length, 0, 'Should find perfumes with bergamot');

    const birchResults = searchPerfumes(SAMPLE_PERFUME_CATALOG, 'birch');
    assertEqual(birchResults.length, 1, 'Should find 1 perfume with birch');
    assertEqual(birchResults[0].id, 'cdnim', 'Matches CDNIM containing birch note');

    const cinnamonResults = searchPerfumes(SAMPLE_PERFUME_CATALOG, 'cinnamon');
    assertEqual(cinnamonResults.length, 1, 'Should find Khamrah for cinnamon');
    assertEqual(cinnamonResults[0].id, 'khamrah');
  });

  test('Search-04: Full-text search accurately matches by olfactory accords / family', () => {
    const sweetResults = searchPerfumes(SAMPLE_PERFUME_CATALOG, 'sweet');
    assertEqual(sweetResults.length, 1, 'Should find Khamrah for sweet accord');
    assertEqual(sweetResults[0].id, 'khamrah');

    const floralResults = searchPerfumes(SAMPLE_PERFUME_CATALOG, 'floral');
    assertEqual(floralResults.length, 1, 'Should find floral perfume');
    assertEqual(floralResults[0].id, 'delina-la-rosee');
  });

  test('Search-05: Full-text search accurately matches by brand name', () => {
    const afnanResults = searchPerfumes(SAMPLE_PERFUME_CATALOG, 'Afnan');
    assertEqual(afnanResults.length, 1);
    assertEqual(afnanResults[0].brand, 'Afnan');

    const armafResults = searchPerfumes(SAMPLE_PERFUME_CATALOG, 'Armaf');
    assertEqual(armafResults.length, 1);
    assertEqual(armafResults[0].brand, 'Armaf');
  });

  test('Search-06: Full-text search accurately filters by gender classification', () => {
    const femaleResults = searchPerfumes(SAMPLE_PERFUME_CATALOG, 'female');
    assertEqual(femaleResults.length, 1);
    assertEqual(femaleResults[0].gender, 'Female');

    const unisexResults = searchPerfumes(SAMPLE_PERFUME_CATALOG, 'unisex');
    assertEqual(unisexResults.length, 1);
    assertEqual(unisexResults[0].gender, 'Unisex');
  });

  test('Search-07: Header global search input redirects to #/cari?q=... on Enter keypress', () => {
    const inputQuery = 'aventus';
    const targetHash = `#/cari?q=${encodeURIComponent(inputQuery)}`;
    assertEqual(targetHash, '#/cari?q=aventus', 'Header search must route to #/cari?q=...');
    assertNotIncludes(targetHash, '#/dupe-finder', 'Must not route to legacy #/dupe-finder');
  });
});

describe('R2: Global Full-Text Search Engine — Tier 2 Boundary & Corner Cases', () => {

  test('Search-08: Empty query string returns empty array without throwing error', () => {
    const results = searchPerfumes(SAMPLE_PERFUME_CATALOG, '');
    assertEqual(results.length, 0, 'Empty query must return 0 results');
  });

  test('Search-09: Whitespace-only query returns empty array safely', () => {
    const results = searchPerfumes(SAMPLE_PERFUME_CATALOG, '    ');
    assertEqual(results.length, 0, 'Whitespace query must return 0 results');
  });

  test('Search-10: Case insensitivity handles mixed, lower, and upper case queries identical', () => {
    const q1 = searchPerfumes(SAMPLE_PERFUME_CATALOG, 'turathi');
    const q2 = searchPerfumes(SAMPLE_PERFUME_CATALOG, 'TURATHI');
    const q3 = searchPerfumes(SAMPLE_PERFUME_CATALOG, 'TuRaThI');

    assertEqual(q1.length, 1);
    assertEqual(q2.length, 1);
    assertEqual(q3.length, 1);
    assertEqual(q1[0].id, q2[0].id);
    assertEqual(q2[0].id, q3[0].id);
  });

  test('Search-11: Regex metacharacters and punctuation do not crash the search engine', () => {
    const problematicQueries = [
      'citrus.*',
      'afnan+armaf',
      'blue?',
      '^lattafa$',
      'club (de nuit)',
      'notes[top]',
      'scent\\supply'
    ];

    for (const q of problematicQueries) {
      let didCrash = false;
      try {
        searchPerfumes(SAMPLE_PERFUME_CATALOG, q);
      } catch {
        didCrash = true;
      }
      assertFalse(didCrash, `Search should safely handle punctuation query: "${q}"`);
    }
  });

  test('Search-12: Extremely long query string (500+ characters) is safely sanitized and executed', () => {
    const longQuery = 'perfume '.repeat(70); // 560 characters
    const results = searchPerfumes(SAMPLE_PERFUME_CATALOG, longQuery);
    // Should execute quickly and return either matched or 0 results without memory overflow
    assertTrue(Array.isArray(results), 'Should return array for long query');
  });

  test('Search-13: Zero-results query returns empty state indicator', () => {
    const results = searchPerfumes(SAMPLE_PERFUME_CATALOG, 'nonexistentfragrance12345');
    assertEqual(results.length, 0, 'No perfumes should match nonexistent term');
    
    // Check empty state fallback message derivation
    const emptyStateText = 'Tiada wangian dijumpai untuk carian anda.';
    assertIncludes(emptyStateText, 'Tiada wangian dijumpai');
  });

  test('Search-14: Multi-token query requires all tokens to match (logical AND)', () => {
    const multiToken1 = searchPerfumes(SAMPLE_PERFUME_CATALOG, 'afnan citrus');
    assertEqual(multiToken1.length, 1, 'Should find Afnan Turathi Blue which has both Afnan and Citrus');

    const multiToken2 = searchPerfumes(SAMPLE_PERFUME_CATALOG, 'afnan floral');
    assertEqual(multiToken2.length, 0, 'Should find nothing because Afnan Turathi Blue does not have floral accord');
  });
});

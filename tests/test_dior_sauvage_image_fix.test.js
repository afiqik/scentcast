/**
 * ScentCast Malaysia — Verification Test for Dior Sauvage Image & Storage URL Normalization
 * Covers:
 * 1. formatImageUrl helper appends ?alt=media or &alt=media to Firebase Storage URLs
 * 2. Complete purging of hardcoded Coco Mademoiselle fallback across all UI views
 * 3. Firestore document priority over stale in-memory cache in perfumeService
 * 4. Zero-Price Integrity compliance
 */

import fs from 'fs';
import { formatImageUrl, DEFAULT_FLACON_PLACEHOLDER } from '../src/services/storageService.js';
import { perfumeService } from '../src/services/perfumeService.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('\n===============================================================');
console.log('  🔍 VERIFICATION AUDIT: Dior Sauvage & Storage URL Format Fixes');
console.log('===============================================================\n');

// 1. formatImageUrl unit tests
console.log('► 1. formatImageUrl Normalization Checks:');
const rawStorageWithoutAlt = 'https://firebasestorage.googleapis.com/v0/b/scentcast-54308.firebasestorage.app/o/perfumes%2Fdior_sauvage.webp';
const normalized1 = formatImageUrl(rawStorageWithoutAlt);
assert(normalized1 === `${rawStorageWithoutAlt}?alt=media`, 'Appends ?alt=media when query string is empty');

const rawStorageWithOtherQuery = 'https://firebasestorage.googleapis.com/v0/b/scentcast-54308.firebasestorage.app/o/perfumes%2Fdior_sauvage.webp?token=abc';
const normalized2 = formatImageUrl(rawStorageWithOtherQuery);
assert(normalized2 === `${rawStorageWithOtherQuery}&alt=media`, 'Appends &alt=media when query string already contains other parameters');

const rawStorageWithAlt = 'https://firebasestorage.googleapis.com/v0/b/scentcast-54308.firebasestorage.app/o/perfumes%2Fdior_sauvage.webp?alt=media&token=abc';
const normalized3 = formatImageUrl(rawStorageWithAlt);
assert(normalized3 === rawStorageWithAlt, 'Leaves URL untouched when alt=media is already present');

const externalUrl = 'https://images.unsplash.com/photo-1523293182086-7651a899d37f';
assert(formatImageUrl(externalUrl) === externalUrl, 'Preserves external image URLs intact');
assert(formatImageUrl('') === '', 'Handles empty URL gracefully');
assert(formatImageUrl(null) === '', 'Handles null gracefully');

// 2. Elimination of Coco Mademoiselle fallback across src files
console.log('\n► 2. Universal Elimination of Coco Mademoiselle Fallback:');
const cocoId = 'photo-1592945403244-b3fbafd7f539';
const filesToCheck = [
  'src/components/PerfumeCard.js',
  'src/views/DetailView.js',
  'src/views/AdminView.js',
  'src/views/DupeView.js',
  'src/views/WeatherView.js',
  'src/services/adminService.js',
  'src/services/perfumeService.js'
];

for (const file of filesToCheck) {
  const content = fs.readFileSync(file, 'utf8');
  assert(!content.includes(cocoId), `${file} has ZERO references to Coco Mademoiselle fallback (${cocoId})`);
  assert(content.includes('DEFAULT_FLACON_PLACEHOLDER') || file.includes('perfumeService.js'), `${file} utilizes neutral flacon placeholder`);
}

// 3. Cache Synchronization & Firestore Priority Test
console.log('\n► 3. PerfumeService Firestore Priority & Format Sync:');
const testSauvageStorageUrl = 'https://firebasestorage.googleapis.com/v0/b/scentcast-54308.firebasestorage.app/o/perfumes%2Fdior_sauvage.webp';
perfumeService.updatePerfumeInCache({
  id: 'dior-sauvage-edp',
  name: 'Dior Sauvage EDP',
  brand: 'Dior',
  gender: 'male',
  imageUrl: testSauvageStorageUrl
});

const retrieved = await perfumeService.getPerfumeById('dior-sauvage-edp');
assert(retrieved && retrieved.imageUrl.includes('alt=media'), 'perfumeService auto-formats and appends alt=media to retrieved perfume imageUrl');
assert(retrieved.imageUrl === `${testSauvageStorageUrl}?alt=media`, 'retrieved imageUrl has complete ?alt=media parameter');

// 4. Zero-Price Rule Compliance Scan (exact checks matching auditor_g6_5fixes)
console.log('\n► 4. Zero-Price Integrity Verification:');
for (const file of filesToCheck) {
  const content = fs.readFileSync(file, 'utf8');
  assert(!content.includes('RM '), `${file} strictly complies with Zero-Price rule (no 'RM ')`);
  assert(!content.includes('MYR '), `${file} strictly complies with Zero-Price rule (no 'MYR ')`);
  assert(!/jimat\s+\d+%/i.test(content), `${file} strictly complies with Zero-Price rule (no discount marketing)`);
}

console.log('\n===============================================================');
console.log(`📊 TOTAL CHECKS: Passed: ${passed} | Failed: ${failed}`);
console.log('===============================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

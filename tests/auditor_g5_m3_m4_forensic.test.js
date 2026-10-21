/**
 * ScentCast Malaysia — G5-M3 & G5-M4 Forensic Integrity Audit Suite
 * Verifies:
 * 1. 100% Bilingual Parity between bm.json and en.json.
 * 2. Elimination of residual hardcoded UI strings.
 * 3. Firestore & Storage Security Rules (RBAC, < 2MB limit, image MIME).
 * 4. Zero-Price Rule compliance across all components.
 */

import fs from 'fs';
import path from 'path';

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
console.log('  🔍 G5-M3 & G5-M4 FORENSIC INTEGRITY AUDIT SUITE');
console.log('===============================================================\n');

// =========================================================================
// SECTION 1: 100% i18n Dictionary Parity & Cleanliness
// =========================================================================
console.log('► 1. Bilingual Dictionary Parity & Structure:');

const bmRaw = fs.readFileSync('src/i18n/bm.json', 'utf8');
const enRaw = fs.readFileSync('src/i18n/en.json', 'utf8');
const bm = JSON.parse(bmRaw);
const en = JSON.parse(enRaw);

function getDeepKeys(obj, prefix = '') {
  let keys = [];
  for (const k of Object.keys(obj)) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      keys = keys.concat(getDeepKeys(obj[k], next));
    } else {
      keys.push(next);
    }
  }
  return keys;
}

const bmKeys = getDeepKeys(bm);
const enKeys = getDeepKeys(en);

assert(bmKeys.length > 0, `bm.json has valid keys (found ${bmKeys.length})`);
assert(enKeys.length > 0, `en.json has valid keys (found ${enKeys.length})`);
assert(bmKeys.length === enKeys.length, `Equal key count between BM (${bmKeys.length}) and EN (${enKeys.length})`);

const missingInEn = bmKeys.filter(k => !enKeys.includes(k));
const missingInBm = enKeys.filter(k => !bmKeys.includes(k));

assert(missingInEn.length === 0, `Zero keys missing in en.json (missing: ${missingInEn.join(', ') || 'none'})`);
assert(missingInBm.length === 0, `Zero keys missing in bm.json (missing: ${missingInBm.join(', ') || 'none'})`);

// Check required new keys
const requiredKeys = [
  'admin.imageUploadLabel',
  'admin.dragDropNotice',
  'admin.autoCompressHint',
  'admin.preview',
  'admin.uploading',
  'admin.uploadSuccess',
  'admin.uploadError',
  'auth.adminLoginTitle',
  'auth.adminLoginSubtitle',
  'auth.adminLoginBtn',
  'auth.tabMember',
  'auth.tabAdmin',
  'auth.loginSubtitle',
  'auth.registerSubtitle',
  'auth.or',
  'profile.myCollection',
  'profile.savedCountText',
  'profile.emptyTitle',
  'profile.emptyDesc'
];

for (const key of requiredKeys) {
  assert(bmKeys.includes(key) && enKeys.includes(key), `Key '${key}' exists in both BM & EN`);
}

// =========================================================================
// SECTION 2: Elimination of Hardcoded Residuals
// =========================================================================
console.log('\n► 2. Source Code Hardcoded String Inspection:');

const authModalCode = fs.readFileSync('src/components/AuthModal.js', 'utf8');
const profileViewCode = fs.readFileSync('src/views/ProfileView.js', 'utf8');
const homeViewCode = fs.readFileSync('src/views/HomeView.js', 'utf8');

assert(!authModalCode.includes('>👤 Ahli<'), 'AuthModal has no hardcoded ">👤 Ahli<" button text');
assert(!authModalCode.includes('>🛡️ Pentadbir<'), 'AuthModal has no hardcoded ">🛡️ Pentadbir<" button text');
assert(!authModalCode.includes('>Atau<'), 'AuthModal has no hardcoded ">Atau<" divider text');
assert(authModalCode.includes("t('auth.tabMember')"), "AuthModal uses t('auth.tabMember')");
assert(authModalCode.includes("t('auth.tabAdmin')"), "AuthModal uses t('auth.tabAdmin')");
assert(authModalCode.includes("t('auth.or')"), "AuthModal uses t('auth.or')");

assert(!profileViewCode.includes('<h2>❤️ Koleksi Saya</h2>'), 'ProfileView does not hardcode static collection title');
assert(profileViewCode.includes("t('profile.myCollection')"), "ProfileView uses t('profile.myCollection')");
assert(profileViewCode.includes("t('profile.savedCountText'"), "ProfileView uses t('profile.savedCountText')");
assert(profileViewCode.includes("t('profile.emptyTitle')"), "ProfileView uses t('profile.emptyTitle')");
assert(profileViewCode.includes("t('profile.emptyDesc')"), "ProfileView uses t('profile.emptyDesc')");

assert(!homeViewCode.includes('title="Lihat Sensor Cuaca 27 Bandar"'), 'HomeView does not hardcode static weather pill title');
assert(homeViewCode.includes("t('home.seeAllCities')") || homeViewCode.includes("t('footer.weather27')"), 'HomeView uses i18n for weather pill title');

// =========================================================================
// SECTION 3: Firestore & Storage Security Rules Audit
// =========================================================================
console.log('\n► 3. Firebase Security Rules Forensic Verification:');

assert(fs.existsSync('firestore.rules'), 'firestore.rules exists');
assert(fs.existsSync('storage.rules'), 'storage.rules exists');

const firestoreRules = fs.readFileSync('firestore.rules', 'utf8');
const storageRules = fs.readFileSync('storage.rules', 'utf8');
const firebaseJson = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));

assert(firebaseJson.firestore?.rules === 'firestore.rules', 'firebase.json links firestore.rules');
assert(firebaseJson.storage?.rules === 'storage.rules', 'firebase.json links storage.rules');

// Firestore rules checks
assert(firestoreRules.includes('isAdmin()'), 'firestore.rules defines isAdmin() helper');
assert(firestoreRules.includes("match /perfumes/{perfumeId}"), 'firestore.rules targets /perfumes/');
assert(firestoreRules.includes('allow read: if true;'), 'firestore.rules allows public read for catalog');
assert(firestoreRules.includes('allow create, update, delete: if isAdmin();'), 'firestore.rules locks perfume mutations to isAdmin()');
assert(firestoreRules.includes("match /users/{userId}"), 'firestore.rules targets /users/{userId}');
assert(firestoreRules.includes("match /comments/{commentId}"), 'firestore.rules targets /comments/{commentId}');
assert(firestoreRules.includes('resource.data.userId == request.auth.uid'), 'firestore.rules allows author to update/delete comment');

// Storage rules checks
assert(storageRules.includes("match /b/{bucket}/o"), 'storage.rules matches root storage bucket');
assert(storageRules.includes("match /perfumes/{allPaths=**}"), 'storage.rules defines /perfumes/ path');
assert(storageRules.includes('allow read: if true;'), 'storage.rules allows public read for flacon images');
assert(storageRules.includes('2 * 1024 * 1024'), 'storage.rules enforces max 2MB size limit');
assert(storageRules.includes("contentType.matches('image/.*')"), 'storage.rules enforces image MIME validation');

// =========================================================================
// SECTION 4: Zero-Price Rule Compliance
// =========================================================================
console.log('\n► 4. Zero-Price Rule Compliance Scan:');

const scannedFiles = [
  'src/i18n/bm.json',
  'src/i18n/en.json',
  'src/components/AuthModal.js',
  'src/views/ProfileView.js',
  'src/views/HomeView.js',
  'src/views/AdminView.js',
  'storage.rules',
  'firestore.rules'
];

for (const f of scannedFiles) {
  const content = fs.readFileSync(f, 'utf8');
  assert(!content.includes('RM ') && !content.includes('RM\n'), `${f} has NO 'RM ' price tags`);
  assert(!content.includes('MYR ') && !content.includes('MYR\n'), `${f} has NO 'MYR ' currency`);
  assert(!content.includes('diskaun') && !content.includes('penjimatan'), `${f} has NO discount/savings marketing`);
}

console.log('\n===============================================================');
console.log(`📊 G5-M3 & G5-M4 FORENSIC AUDIT: Passed: ${passed} | Failed: ${failed}`);
console.log('===============================================================\n');

if (failed > 0) {
  process.exit(1);
}

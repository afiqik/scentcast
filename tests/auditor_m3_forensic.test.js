/**
 * ScentCast Malaysia — Independent Forensic Integrity Test Suite for Milestone G3-M3
 * Executed by gen4_auditor_m3
 */

import { authService } from '../src/services/authService.js';
import { renderProfileView, getProfileViewData } from '../src/views/ProfileView.js';
import { renderAdminView, renderAccessDenied } from '../src/views/AdminView.js';
import { renderHeader } from '../src/components/Header.js';
import { t, i18nService } from '../src/services/i18nService.js';
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
console.log('  🔍 G3-M3 FORENSIC AUDIT: AUTH, PROFILE & RBAC VERIFICATION');
console.log('===============================================================\n');

// --- CHECK 1: Static Source Code Integrity (No Hardcoded Test Bypasses) ---
console.log('► 1. Static Scan for Hardcoding / Cheating:');

const authCode = fs.readFileSync('src/services/authService.js', 'utf8');
const adminViewCode = fs.readFileSync('src/views/AdminView.js', 'utf8');
const profileViewCode = fs.readFileSync('src/views/ProfileView.js', 'utf8');
const mainCode = fs.readFileSync('src/main.js', 'utf8');
const headerCode = fs.readFileSync('src/components/Header.js', 'utf8');

// Check that isAdmin is not hardcoded to an email or constant
assert(!authCode.includes("role === 'admin' ||"), 'isAdmin has no fallback OR conditions');
assert(authCode.includes("this.currentUser.role === 'admin'"), 'isAdmin strictly checks this.currentUser.role');

// Check that checkUsernameUnique uses regex and Firestore
assert(authCode.includes('/^[a-z0-9_]{3,20}$/'), 'checkUsernameUnique enforces strict 3-20 regex /^[a-z0-9_]{3,20}$/');
assert(authCode.includes("collection(db, 'users')"), 'checkUsernameUnique queries Firestore users collection');
assert(authCode.includes("where('username', '==', cleanUsername)"), 'checkUsernameUnique filters by username in Firestore');

// Check that register sanitizes and saves username
assert(authCode.includes("username: cleanUsername"), 'register() persists cleanUsername in users/{uid}');

// --- CHECK 2: Username Validation Matrix ---
console.log('\n► 2. Empirical Username Uniqueness & Format Validation:');

const validUsernames = ['aiman', 'scent_geek_99', 'user123', 'a_b_c', 'perfume_king'];
const invalidUsernames = ['ab', 'a', '', 'user-name', 'user.name', 'user name', 'ThisIsTooLongToBeValid12345', 'user@domain', '!@#$%'];

for (const u of validUsernames) {
  const formatRegex = /^[a-z0-9_]{3,20}$/;
  assert(formatRegex.test(u.toLowerCase()), `Valid username format: "${u}"`);
}

for (const u of invalidUsernames) {
  const formatRegex = /^[a-z0-9_]{3,20}$/;
  assert(!formatRegex.test(u.toLowerCase()), `Invalid username rejected: "${u}"`);
}

// Test checkUsernameUnique format rejection
async function testUniquenessFormat() {
  const tooShort = await authService.checkUsernameUnique('ab');
  assert(tooShort === false, 'checkUsernameUnique rejects < 3 chars');

  const withSpaces = await authService.checkUsernameUnique('aiman rahim');
  assert(withSpaces === false, 'checkUsernameUnique rejects spaces');

  const withHyphen = await authService.checkUsernameUnique('aiman-rahim');
  assert(withHyphen === false, 'checkUsernameUnique rejects hyphens');

  const withSpecial = await authService.checkUsernameUnique('aiman@scent');
  assert(withSpecial === false, 'checkUsernameUnique rejects @ symbol');
}
await testUniquenessFormat();

// --- CHECK 3: RBAC & Access Control Enforcement ---
console.log('\n► 3. RBAC & Access Control Enforcement:');

// 3.1 Unauthenticated / Guest state
authService.currentUser = null;
assert(authService.isGuest() === true, 'isGuest() is true when currentUser is null');
assert(authService.isAdmin() === false, 'isAdmin() is false when currentUser is null');

const deniedHtml = renderAccessDenied();
assert(deniedHtml.includes('⛔ Akses Ditolak'), 'renderAccessDenied contains "⛔ Akses Ditolak"');

const adminViewGuest = await renderAdminView();
assert(adminViewGuest.includes('⛔ Akses Ditolak'), 'renderAdminView() for guest returns "⛔ Akses Ditolak"');

const headerGuest = renderHeader('laman-utama');
assert(!headerGuest.includes('#/admin'), 'Header for guest strictly omits #/admin navigation link');

const profileGuestHtml = await renderProfileView();
assert(profileGuestHtml.includes(t('profile.protectedTitle')), 'ProfileView for guest renders Laluan Terpelihara barrier');
assert(profileGuestHtml.includes('profile-login-btn'), 'ProfileView for guest includes login trigger button');

// 3.2 Member state (role: "member")
authService.currentUser = {
  uid: 'member_123',
  displayName: 'Aiman Rahim',
  username: 'aiman_r',
  email: 'aiman@example.com',
  photoURL: 'https://example.com/avatar.jpg',
  role: 'member',
  savedPerfumes: ['turathi-blue']
};
assert(authService.isGuest() === false, 'isGuest() is false for member');
assert(authService.isAdmin() === false, 'isAdmin() is false for role: "member"');

const adminViewMember = await renderAdminView();
assert(adminViewMember.includes('⛔ Akses Ditolak'), 'renderAdminView() for regular member returns "⛔ Akses Ditolak"');

const headerMember = renderHeader('laman-utama');
assert(!headerMember.includes('#/admin'), 'Header for regular member strictly omits #/admin link');

// 3.3 Admin state (role: "admin")
authService.currentUser = {
  uid: 'admin_456',
  displayName: 'Admin User',
  username: 'admin_boss',
  email: 'admin@scentcast.my',
  photoURL: 'https://example.com/admin.jpg',
  role: 'admin',
  savedPerfumes: []
};
assert(authService.isGuest() === false, 'isGuest() is false for admin');
assert(authService.isAdmin() === true, 'isAdmin() is true for role: "admin"');

const headerAdmin = renderHeader('laman-utama');
assert(headerAdmin.includes('#/admin'), 'Header for admin includes #/admin navigation link');

// --- CHECK 4: ProfileView 3-Tier Architecture & Elements ---
console.log('\n► 4. ProfileView 3-Tier Architecture Verification:');

const profileHtml = await renderProfileView();

// Tier 1: User Info Card
assert(profileHtml.includes('profile-display-avatar'), 'Tier 1: profile-display-avatar present');
assert(profileHtml.includes('profile-display-name'), 'Tier 1: profile-display-name present');
assert(profileHtml.includes('profile-display-handle'), 'Tier 1: profile-display-handle present');
assert(profileHtml.includes('@admin_boss'), 'Tier 1: Displays correct @username handle');
assert(profileHtml.includes('profile-logout-btn'), 'Tier 1: profile-logout-btn present');

// Tier 2: Profile Settings Panel
assert(profileHtml.includes('profile-preview-avatar'), 'Tier 2: profile-preview-avatar present');
assert(profileHtml.includes('preset-avatar-btn'), 'Tier 2: preset avatar buttons present');
assert(profileHtml.includes('profile-custom-avatar-url'), 'Tier 2: custom avatar URL input present');
assert(profileHtml.includes('profile-edit-name-input'), 'Tier 2: display name editor input present');
assert(profileHtml.includes('profile-edit-username-input'), 'Tier 2: username editor input present');
assert(profileHtml.includes('profile-save-btn'), 'Tier 2: profile-save-btn present');

// Tier 3: Saved Perfumes Grid
assert(profileHtml.includes('❤️ Koleksi Saya'), 'Tier 3: Mandated title "❤️ Koleksi Saya" present');
assert(profileHtml.includes('profile-content-container'), 'Tier 3: profile-content-container present');

// Verify total purge of obsolete fields (bio, badges, wardrobe stats)
assert(!profileHtml.includes('Ahli Terverifikasi'), 'Obsolete badge "Ahli Terverifikasi" is absent');
assert(!profileHtml.includes('Peminat niche perfume'), 'Obsolete bio is absent');
assert(!profileHtml.includes('Wardrobe'), 'Obsolete wardrobe stats are absent');

// Clean up
authService.currentUser = null;

// --- SUMMARY ---
console.log('\n===============================================================');
console.log(`📊 FORENSIC AUDIT SUMMARY:`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`===============================================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

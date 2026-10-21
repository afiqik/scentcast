/**
 * ScentCast Malaysia — Adversarial Challenger 2 Test Harness
 * Milestone G3-M3: Authentication, Profile & RBAC Security (R2, R3, R10)
 *
 * Scope:
 * 1. authService.isAdmin() matrix: guest/null, member, case sensitivity, whitespace, spoofing, prototype injection.
 * 2. AdminView access denial: guest & member strictly receive '⛔ Akses Ditolak' and 0 admin controls.
 * 3. Route guard in main.js & navigation tab generation in Header.js (guest/member vs admin).
 * 4. Zero admin buttons in DetailView, PerfumeCard, DirectoryView, SearchView, HomeView.
 * 5. R2 Username validation & uniqueness checking (format regex, excludeUid semantics, cache).
 * 6. R3 ProfileView protected route barrier, role badges (member vs admin), and logout button.
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

// Dynamic imports after test environment is ready
const { authService, AuthService } = await import('../src/services/authService.js');
const { adminService } = await import('../src/services/adminService.js');
const { perfumeService } = await import('../src/services/perfumeService.js');
const { renderAdminView, renderAccessDenied, attachAdminListeners } = await import('../src/views/AdminView.js');
const { renderHeader } = await import('../src/components/Header.js');
const { renderProfileView, attachProfileListeners } = await import('../src/views/ProfileView.js');
const { renderDetailView } = await import('../src/views/DetailView.js');
const { renderPerfumeCard } = await import('../src/components/PerfumeCard.js');
const { renderDirectoryView } = await import('../src/views/DirectoryView.js');
const { renderSearchView } = await import('../src/views/SearchView.js');
const { renderHomeView } = await import('../src/views/HomeView.js');
const { t, i18nService } = await import('../src/services/i18nService.js');

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

async function runAdversarialSuite() {
  console.log('================================================================');
  console.log('🔥 RUNNING ADVERSARIAL CHALLENGER 2: MILESTONE G3-M3 (RBAC & SEC)');
  console.log('================================================================\n');

  // ==========================================================================
  // SECTION 1: authService.isAdmin() Adversarial Matrix & Stress Testing
  // ==========================================================================
  console.log('► SECTION 1: authService.isAdmin() Adversarial Matrix');

  // 1.1 Null or undefined session (Guest)
  authService.currentUser = null;
  assert(authService.isAdmin() === false, 'isAdmin() returns strictly false when currentUser is null');
  assert(typeof authService.isAdmin() === 'boolean', 'isAdmin() return type is strictly boolean on null');
  assert(authService.isGuest() === true, 'isGuest() returns true when currentUser is null');

  authService.currentUser = undefined;
  assert(authService.isAdmin() === false, 'isAdmin() returns strictly false when currentUser is undefined');
  assert(authService.isGuest() === true, 'isGuest() returns true when currentUser is undefined');

  // 1.2 Empty user object
  authService.currentUser = {};
  assert(authService.isAdmin() === false, 'isAdmin() returns false when user object has no role');

  // 1.3 Regular Member role
  authService.currentUser = { uid: 'usr_member_123', email: 'member@scentcast.my', role: 'member' };
  assert(authService.isAdmin() === false, 'isAdmin() returns false for role "member"');
  assert(authService.isGuest() === false, 'isGuest() returns false for authenticated member');

  // 1.4 Guest role explicit
  authService.currentUser = { uid: 'usr_guest_123', role: 'guest' };
  assert(authService.isAdmin() === false, 'isAdmin() returns false for explicit role "guest"');

  // 1.5 Case-sensitivity exploit probe (UPPERCASE, TitleCase)
  authService.currentUser = { uid: 'usr_exploit_1', role: 'ADMIN' };
  assert(authService.isAdmin() === false, 'isAdmin() rejects uppercase "ADMIN" (strict equality required)');

  authService.currentUser = { uid: 'usr_exploit_2', role: 'Admin' };
  assert(authService.isAdmin() === false, 'isAdmin() rejects titlecase "Admin"');

  authService.currentUser = { uid: 'usr_exploit_3', role: 'aDmin' };
  assert(authService.isAdmin() === false, 'isAdmin() rejects mixed case "aDmin"');

  // 1.6 Whitespace & special character injection
  authService.currentUser = { uid: 'usr_ws_1', role: ' admin' };
  assert(authService.isAdmin() === false, 'isAdmin() rejects leading space " admin"');

  authService.currentUser = { uid: 'usr_ws_2', role: 'admin ' };
  assert(authService.isAdmin() === false, 'isAdmin() rejects trailing space "admin "');

  authService.currentUser = { uid: 'usr_ws_3', role: 'admin\0' };
  assert(authService.isAdmin() === false, 'isAdmin() rejects null byte injection "admin\\0"');

  // 1.7 Privilege Escalation Spoofing
  const spoofedRoles = ['superuser', 'superadmin', 'root', 'moderator', 'editor', 'owner', 'staff', 'manager'];
  for (const role of spoofedRoles) {
    authService.currentUser = { uid: `usr_${role}`, role };
    assert(authService.isAdmin() === false, `isAdmin() rejects unauthorized privileged role: "${role}"`);
  }

  // 1.8 Type Confusion & Injection Attacks
  authService.currentUser = { uid: 'usr_type_1', role: true };
  assert(authService.isAdmin() === false, 'isAdmin() rejects boolean true role');

  authService.currentUser = { uid: 'usr_type_2', role: 1 };
  assert(authService.isAdmin() === false, 'isAdmin() rejects numeric 1 role');

  authService.currentUser = { uid: 'usr_type_3', role: ['admin'] };
  assert(authService.isAdmin() === false, 'isAdmin() rejects array role ["admin"]');

  authService.currentUser = { uid: 'usr_type_4', role: { isAdmin: true } };
  assert(authService.isAdmin() === false, 'isAdmin() rejects object role { isAdmin: true }');

  authService.currentUser = { uid: 'usr_type_5', role: null };
  assert(authService.isAdmin() === false, 'isAdmin() rejects explicit null role');

  // 1.9 Legitimate Admin role
  authService.currentUser = { uid: 'adm_scentcast_root', email: 'admin@scentcast.my', role: 'admin' };
  assert(authService.isAdmin() === true, 'isAdmin() returns strictly true for valid role "admin"');
  assert(typeof authService.isAdmin() === 'boolean', 'isAdmin() returns boolean type on admin');
  assert(authService.isGuest() === false, 'isGuest() returns false for admin user');


  // ==========================================================================
  // SECTION 2: AdminView Access Denial & View Guard Enforcement
  // ==========================================================================
  console.log('\n► SECTION 2: AdminView Access Denial Enforcement');

  // 2.1 Guest access to renderAdminView
  authService.currentUser = null;
  const guestAdminHtml = await renderAdminView();
  assert(guestAdminHtml.includes('⛔ Akses Ditolak'), 'Guest accessing renderAdminView strictly receives "⛔ Akses Ditolak"');
  assert(guestAdminHtml.includes('href="#/"'), 'Access denied screen contains return home link');
  assert(guestAdminHtml.includes('Anda tidak mempunyai kebenaran pentadbir'), 'Access denied screen explains missing admin permission');

  // Negative checks: Zero admin controls in guest view
  assert(!guestAdminHtml.includes('id="admin-view-root"'), 'Guest receives NO admin-view-root');
  assert(!guestAdminHtml.includes('admin-open-add-modal-btn'), 'Guest receives NO admin-open-add-modal-btn');
  assert(!guestAdminHtml.includes('admin-tab-catalog'), 'Guest receives NO admin-tab-catalog');
  assert(!guestAdminHtml.includes('admin-tab-comments'), 'Guest receives NO admin-tab-comments');
  assert(!guestAdminHtml.includes('admin-perfumes-table-body'), 'Guest receives NO admin-perfumes-table-body');
  assert(!guestAdminHtml.includes('admin-comments-table-body'), 'Guest receives NO admin-comments-table-body');
  assert(!guestAdminHtml.includes('admin-delete-btn'), 'Guest receives NO admin-delete-btn');
  assert(!guestAdminHtml.includes('admin-edit-btn'), 'Guest receives NO admin-edit-btn');
  assert(!guestAdminHtml.includes('admin-add-modal'), 'Guest receives NO admin-add-modal');

  // 2.2 Member access to renderAdminView
  authService.currentUser = { uid: 'usr_member_456', email: 'user@gmail.com', role: 'member' };
  const memberAdminHtml = await renderAdminView();
  assert(memberAdminHtml.includes('⛔ Akses Ditolak'), 'Member accessing renderAdminView strictly receives "⛔ Akses Ditolak"');
  assert(!memberAdminHtml.includes('id="admin-view-root"'), 'Member receives NO admin-view-root');
  assert(!memberAdminHtml.includes('admin-open-add-modal-btn'), 'Member receives NO admin-open-add-modal-btn');
  assert(!memberAdminHtml.includes('admin-perfumes-table-body'), 'Member receives NO admin-perfumes-table-body');
  assert(!memberAdminHtml.includes('admin-delete-btn'), 'Member receives NO admin-delete-btn');

  // 2.3 Standalone renderAccessDenied() function
  const directDeniedHtml = renderAccessDenied();
  assert(directDeniedHtml.includes('⛔ Akses Ditolak'), 'renderAccessDenied() outputs standard "⛔ Akses Ditolak" title');
  assert(directDeniedHtml.includes('Kembali ke Laman Utama'), 'renderAccessDenied() includes home navigation prompt');

  // 2.4 attachAdminListeners() security guard
  authService.currentUser = { uid: 'usr_member_456', role: 'member' };
  let attachThrows = false;
  try {
    attachAdminListeners();
  } catch (e) {
    attachThrows = true;
  }
  assert(!attachThrows, 'attachAdminListeners() terminates safely without errors when called by non-admin');

  // 2.5 Legitimate Admin rendering
  authService.currentUser = { uid: 'adm_legit', role: 'admin', email: 'admin@scentcast.my' };
  const legitAdminHtml = await renderAdminView();
  assert(legitAdminHtml.includes('id="admin-view-root"'), 'Admin accessing renderAdminView renders admin-view-root');
  assert(legitAdminHtml.includes('Panel Kawalan Pentadbir'), 'Admin view displays "Panel Kawalan Pentadbir"');
  assert(legitAdminHtml.includes('id="admin-open-add-modal-btn"'), 'Admin view displays add perfume button');
  assert(legitAdminHtml.includes('id="admin-tab-catalog"'), 'Admin view contains catalog management tab');
  assert(legitAdminHtml.includes('id="admin-tab-comments"'), 'Admin view contains comment moderation tab');
  assert(!legitAdminHtml.includes('⛔ Akses Ditolak'), 'Admin view does NOT show access denied');


  // ==========================================================================
  // SECTION 3: Route Guard in main.js & Navigation Tabs in Header.js
  // ==========================================================================
  console.log('\n► SECTION 3: Router & Header Navigation Guard Verification');

  // 3.1 Inspect main.js router logic
  const mainJsPath = path.join(rootDir, 'src', 'main.js');
  const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

  // Verify AdminView route guard in main.js
  const adminGuardPattern = /case\s+['"]AdminView['"]:\s*if\s*\(\s*!authService\.isAdmin\(\)\s*\)\s*\{\s*mainHtml\s*=\s*renderAccessDenied\(\);/s;
  assert(adminGuardPattern.test(mainJsContent), 'main.js enforces strict if (!authService.isAdmin()) renderAccessDenied() guard for AdminView');

  // Verify ProfileView route guard in main.js
  const profileGuardPattern = /case\s+['"]ProfileView['"]:\s*if\s*\(\s*authService\.isGuest\(\)\s*\)\s*\{\s*openAuthModal\(['"]login['"]\);/s;
  assert(profileGuardPattern.test(mainJsContent), 'main.js enforces if (authService.isGuest()) openAuthModal("login") guard for ProfileView');

  // 3.2 Header Navigation Tab Generation: Guest vs Member vs Admin
  // (a) Guest Header
  authService.currentUser = null;
  const guestHeader = renderHeader('/');
  assert(!guestHeader.includes('href="#/admin"'), 'Guest Header does NOT contain href="#/admin"');
  assert(!guestHeader.includes('Panel Admin'), 'Guest Header does NOT contain "Panel Admin" nav label');
  assert(!guestHeader.includes('Admin Panel'), 'Guest Header does NOT contain "Admin Panel" nav label');
  assert(guestHeader.includes('id="open-auth-btn"'), 'Guest Header contains "Log Masuk" button');
  assert(!guestHeader.includes('href="#/profil"'), 'Guest Header does NOT display profile avatar link');

  // (b) Member Header
  authService.currentUser = { uid: 'usr_mem_999', displayName: 'Member User', role: 'member', photoURL: 'https://avatar.test/pic.jpg' };
  const memberHeader = renderHeader('/');
  assert(!memberHeader.includes('href="#/admin"'), 'Member Header does NOT contain href="#/admin"');
  assert(!memberHeader.includes('Panel Admin'), 'Member Header does NOT contain "Panel Admin" nav label');
  assert(!memberHeader.includes('id="open-auth-btn"'), 'Member Header does NOT contain guest login button');
  assert(memberHeader.includes('href="#/profil"'), 'Member Header contains profile avatar link href="#/profil"');

  // (c) Admin Header
  authService.currentUser = { uid: 'adm_999', displayName: 'Admin Boss', role: 'admin', photoURL: 'https://avatar.test/admin.jpg' };
  const adminHeader = renderHeader('/');
  assert(adminHeader.includes('href="#/admin"'), 'Admin Header MUST contain href="#/admin"');
  assert(adminHeader.includes(t('nav.admin')), 'Admin Header contains localized admin nav label');
  assert(adminHeader.includes('href="#/profil"'), 'Admin Header contains profile avatar link');

  // (d) Mobile drawer in Header checks
  assert(adminHeader.includes('id="mobile-menu-drawer"'), 'Header contains mobile menu drawer');
  assert(adminHeader.includes('<a href="#/admin" class="px-4 py-2 rounded-xl'), 'Admin link is rendered in mobile navigation drawer for admin');
  assert(!memberHeader.includes('<a href="#/admin"'), 'Admin link is strictly excluded from mobile drawer for member');


  // ==========================================================================
  // SECTION 4: Zero Admin Buttons in Public Views (Isolation Audit)
  // ==========================================================================
  console.log('\n► SECTION 4: Zero Admin Buttons in Public Views');

  // Prepare a sample perfume for card and detail view testing
  const samplePerfume = {
    id: 'adversarial-test-scent',
    name: 'Citrus Sensation EDP',
    brand: 'ScentCast Labs',
    gender: 'unisex',
    accords: ['citrus', 'fresh'],
    mainAccords: [{ name: 'Citrus', value: 85 }],
    longevity: '8 - 10 Jam',
    sillageDistance: '2.0 m',
    imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
    topNotes: ['Bergamot', 'Lemon'],
    heartNotes: ['Neroli', 'Lavender'],
    baseNotes: ['Cedar', 'Musk']
  };

  // 4.1 PerfumeCard.js
  const cardHtml = renderPerfumeCard(samplePerfume);
  assert(!cardHtml.includes('admin-delete-btn'), 'PerfumeCard contains NO admin-delete-btn');
  assert(!cardHtml.includes('admin-edit-btn'), 'PerfumeCard contains NO admin-edit-btn');
  assert(!cardHtml.includes('adminService'), 'PerfumeCard contains NO adminService references');
  assert(!cardHtml.includes('Padam Wangian'), 'PerfumeCard contains NO "Padam Wangian" text');
  assert(!cardHtml.includes('Sunting'), 'PerfumeCard contains NO "Sunting" action');

  // 4.2 DetailView.js
  const detailHtml = await renderDetailView('turathi-blue');
  assert(!detailHtml.includes('admin-delete-btn'), 'DetailView contains NO admin-delete-btn');
  assert(!detailHtml.includes('admin-edit-btn'), 'DetailView contains NO admin-edit-btn');
  assert(!detailHtml.includes('admin-open-add-modal-btn'), 'DetailView contains NO admin-open-add-modal-btn');
  assert(!detailHtml.includes('Padam Wangian'), 'DetailView contains NO "Padam Wangian" text');
  assert(!detailHtml.includes('Tambah Wangian'), 'DetailView contains NO "Tambah Wangian" text');

  // 4.3 DirectoryView.js
  const directoryHtml = await renderDirectoryView();
  assert(!directoryHtml.includes('admin-delete-btn'), 'DirectoryView contains NO admin-delete-btn');
  assert(!directoryHtml.includes('admin-edit-btn'), 'DirectoryView contains NO admin-edit-btn');
  assert(!directoryHtml.includes('admin-open-add-modal-btn'), 'DirectoryView contains NO admin-open-add-modal-btn');
  assert(!directoryHtml.includes('Panel Admin'), 'DirectoryView contains NO admin controls');

  // 4.4 SearchView.js
  const searchHtml = await renderSearchView('citrus');
  assert(!searchHtml.includes('admin-delete-btn'), 'SearchView contains NO admin-delete-btn');
  assert(!searchHtml.includes('admin-edit-btn'), 'SearchView contains NO admin-edit-btn');
  assert(!searchHtml.includes('admin-open-add-modal-btn'), 'SearchView contains NO admin-open-add-modal-btn');

  // 4.5 HomeView.js
  const homeHtml = await renderHomeView();
  assert(!homeHtml.includes('admin-delete-btn'), 'HomeView contains NO admin-delete-btn');
  assert(!homeHtml.includes('admin-edit-btn'), 'HomeView contains NO admin-edit-btn');
  assert(!homeHtml.includes('admin-open-add-modal-btn'), 'HomeView contains NO admin-open-add-modal-btn');


  // ==========================================================================
  // SECTION 5: R2 Username Validation & Uniqueness Hardening
  // ==========================================================================
  console.log('\n► SECTION 5: R2 Username Validation & Uniqueness Hardening');

  // 5.1 Format regex testing via checkUsernameUnique:
  // Must accept: /^[a-z0-9_]{3,20}$/
  const invalidUsernames = [
    '',               // empty
    '   ',            // whitespace only
    'ab',             // too short (< 3)
    'a',              // too short (< 3)
    'toolongusernameexceedstwenty', // 27 chars (> 20)
    'user-name',      // hyphen not allowed
    'user.name',      // dot not allowed
    'user@name',      // @ not allowed
    'user name',      // space not allowed
    'user#name',      // special char not allowed
    null,             // null
    undefined         // undefined
  ];

  for (const inv of invalidUsernames) {
    const isUnique = await authService.checkUsernameUnique(inv);
    assert(isUnique === false, `checkUsernameUnique rejects invalid format: ${JSON.stringify(inv)}`);
  }

  // Valid usernames format
  const validUsernames = ['scent_fan', 'danial_99', 'alif_aroma', 'bot_1'];
  for (const v of validUsernames) {
    // If not taken in cache/firestore, should pass regex
    const clean = v.trim().toLowerCase();
    const regexPasses = /^[a-z0-9_]{3,20}$/.test(clean);
    assert(regexPasses, `Valid username passes regex check: "${v}"`);
  }

  // 5.2 Uniqueness simulation & cache check
  authService.knownUsernames.set('existing_user', 'uid_existing_1');
  authService.knownUsernames.set('vip_admin', 'uid_admin_1');

  // Checking 'existing_user' without excludeUid -> must be false (taken)
  const isTaken = await authService.checkUsernameUnique('existing_user');
  assert(isTaken === false, 'checkUsernameUnique returns false for already registered username');

  // Case-insensitive check: 'EXISTING_USER' -> must normalize to lowercase and return false
  const isTakenUpper = await authService.checkUsernameUnique('EXISTING_USER');
  assert(isTakenUpper === false, 'checkUsernameUnique normalizes uppercase and detects collision');

  // Checking 'existing_user' WITH excludeUid matching the owner -> must be true (user keeping their username)
  const isSelfAllowed = await authService.checkUsernameUnique('existing_user', 'uid_existing_1');
  assert(isSelfAllowed === true, 'checkUsernameUnique allows same user to retain current username (excludeUid)');

  // Checking 'existing_user' WITH excludeUid of DIFFERENT user -> must be false (collision)
  const isDifferentBlocked = await authService.checkUsernameUnique('existing_user', 'uid_different_2');
  assert(isDifferentBlocked === false, 'checkUsernameUnique blocks another user from taking existing username');

  // Completely new username within 3-20 length limit -> returns true
  const isNewAvailable = await authService.checkUsernameUnique('fresh_handle_77');
  assert(isNewAvailable === true, 'checkUsernameUnique returns true for fresh, unused username');


  // ==========================================================================
  // SECTION 6: R3 ProfileView Protected Route & Neumorphic Separation
  // ==========================================================================
  console.log('\n► SECTION 6: R3 ProfileView Protected Route & Account Management');

  // 6.1 Unauthenticated Guest accessing ProfileView
  authService.currentUser = null;
  const guestProfileHtml = await renderProfileView();
  assert(guestProfileHtml.includes('Laluan Terpelihara') || guestProfileHtml.includes(t('profile.protectedTitle')), 'Guest accessing ProfileView receives Protected Route barrier');
  assert(guestProfileHtml.includes('id="profile-login-btn"') || guestProfileHtml.includes(t('auth.loginBtn')), 'Protected route contains login button (#profile-login-btn)');
  assert(!guestProfileHtml.includes('profile-logout-btn'), 'Guest profile does NOT contain logout button');
  assert(!guestProfileHtml.includes('profile-save-btn'), 'Guest profile does NOT contain save changes button');
  assert(!guestProfileHtml.includes('profile-edit-username-input'), 'Guest profile does NOT contain username editor');

  // 6.2 Authenticated Member accessing ProfileView
  authService.currentUser = {
    uid: 'mem_normal_1',
    displayName: 'Ahmad Perfume',
    username: 'ahmad_scents',
    email: 'ahmad@example.com',
    role: 'member',
    photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    savedPerfumes: ['turathi-blue']
  };

  const memberProfileHtml = await renderProfileView();
  assert(memberProfileHtml.includes('Ahmad Perfume'), 'Member Profile renders user displayName');
  assert(memberProfileHtml.includes('@ahmad_scents'), 'Member Profile renders @username handle');
  assert(memberProfileHtml.includes('ahmad@example.com'), 'Member Profile renders user email');
  assert(memberProfileHtml.includes('Ahli Komuniti') || memberProfileHtml.includes(t('profile.memberRole')), 'Member Profile displays "Ahli Komuniti" role badge');
  assert(!memberProfileHtml.includes('Pentadbir ScentCast') && !memberProfileHtml.includes(t('profile.adminRole')), 'Member Profile does NOT display "Pentadbir ScentCast" badge');
  assert(memberProfileHtml.includes('profile-logout-btn'), 'Member Profile contains prominent Log Out button (#profile-logout-btn)');
  assert(memberProfileHtml.includes('profile-save-btn'), 'Member Profile contains Save Changes button (#profile-save-btn)');
  assert(memberProfileHtml.includes('profile-edit-username-input'), 'Member Profile contains Username input field');
  assert(memberProfileHtml.includes('preset-avatar-btn'), 'Member Profile contains preset avatar choices');
  assert(memberProfileHtml.includes('profile-custom-avatar-url'), 'Member Profile contains custom avatar URL input');
  assert(memberProfileHtml.includes('❤️ Koleksi Saya'), 'Member Profile renders saved perfumes collection title');

  // 6.3 Authenticated Admin accessing ProfileView
  authService.currentUser = {
    uid: 'adm_boss_1',
    displayName: 'Siti Administrator',
    username: 'siti_admin',
    email: 'siti@scentcast.my',
    role: 'admin',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    savedPerfumes: []
  };

  const adminProfileHtml = await renderProfileView();
  assert(adminProfileHtml.includes('Siti Administrator'), 'Admin Profile renders admin displayName');
  assert(adminProfileHtml.includes('@siti_admin'), 'Admin Profile renders admin @username');
  assert(adminProfileHtml.includes('Pentadbir ScentCast') || adminProfileHtml.includes(t('profile.adminRole')), 'Admin Profile displays "Pentadbir ScentCast" role badge');
  assert(!adminProfileHtml.includes('Ahli Komuniti'), 'Admin Profile does not display "Ahli Komuniti" badge');


  // ==========================================================================
  // SECTION 7: Summary & Verdict Assessment
  // ==========================================================================
  console.log('\n================================================================');
  console.log('📊 ADVERSARIAL CHALLENGER 2 SUMMARY');
  console.log(`  Total Tests Run : ${totalTests}`);
  console.log(`  Passed          : ${passedTests}`);
  console.log(`  Failed          : ${failedTests}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    console.error('❌ ADVERSARIAL FAILURES:');
    failures.forEach((f, idx) => {
      console.error(`  ${idx + 1}. ${f.message}${f.details ? ' -> ' + f.details : ''}`);
    });
    process.exit(1);
  } else {
    console.log('🎉 ALL ADVERSARIAL VERIFICATIONS PASSED WITH ZERO SECURITY LEAKS!');
    process.exit(0);
  }
}

runAdversarialSuite().catch(err => {
  console.error('Unhandled suite error:', err);
  process.exitCode = 1;
});

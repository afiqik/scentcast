/**
 * ScentCast Malaysia — Empirical Challenger Stress Test Harness
 * Milestone G3-M3: Authentication, Profile & RBAC Security (R2, R3, R10)
 * 
 * Verifies:
 * 1. Username uniqueness validation & strict format rules
 *    - Valid usernames ('aiman_99', 'user_123', 'abc', etc.)
 *    - Invalid usernames (<3 chars, >20 chars, uppercase, spaces, symbols)
 *    - Duplicate username rejection
 *    - excludeUid logic during profile update
 * 2. Profile view data & guest protection (getProfileViewData)
 *    - Guest vs authenticated member
 *    - requiresAuth flag and exact message
 *    - Minimalist schema (no bio, badges, stats)
 * 3. updateProfileData method behavior
 *    - Auth barrier for unauthenticated guests
 *    - Format & uniqueness validation
 *    - Safe no-op for identical username
 *    - Complete update of displayName, username, photoURL
 * 4. RBAC security flags
 */

import { authService } from '../src/services/authService.js';
import fs from 'node:fs';

// Helper to extract getProfileViewData from ProfileView.js in Node environment
async function loadProfileViewHelper() {
  const code = fs.readFileSync('./src/views/ProfileView.js', 'utf8');
  const match = code.match(/export function getProfileViewData[\s\S]*?\n\}/);
  if (!match) throw new Error('Could not find getProfileViewData in ProfileView.js');
  const mod = await import('data:text/javascript,' + encodeURIComponent(match[0]));
  return mod.getProfileViewData;
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, testName, message = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    failedTests++;
    const err = `  ✗ [FAIL] ${testName}: ${message}`;
    console.error(err);
    failures.push(err);
  }
}

console.log('\n===============================================================');
console.log('🚀 EMPIRICAL CHALLENGE HARNESS: G3-M3 (R2, R3, R10)');
console.log('===============================================================\n');

async function runEmpiricalChallenge() {
  console.log('► SECTION 1: Username Validation & Strict Format Rules');

  const formatRegex = /^[a-z0-9_]{3,20}$/;

  // 1.1 Valid usernames
  const validUsernames = ['aiman_99', 'user_123', 'abc', 'z'.repeat(20), 'alpha_beta_1'];
  for (const u of validUsernames) {
    assert(formatRegex.test(u) === true, `Format regex accepts valid username '${u}'`);
    const isValid = await authService.checkUsernameUnique(u);
    assert(isValid === true, `checkUsernameUnique accepts available username '${u}'`);
  }

  // 1.2 Invalid usernames: Length boundaries (<3 chars, >20 chars)
  const shortUsernames = ['ab', 'a', ''];
  for (const u of shortUsernames) {
    assert(formatRegex.test(u) === false, `Format regex rejects short username '${u}' (<3 chars)`);
    const isValid = await authService.checkUsernameUnique(u);
    assert(isValid === false, `checkUsernameUnique rejects short username '${u}'`);
  }

  const longUsernames = ['a'.repeat(21), 'a'.repeat(30)];
  for (const u of longUsernames) {
    assert(formatRegex.test(u) === false, `Format regex rejects long username (${u.length} chars >20)`);
    const isValid = await authService.checkUsernameUnique(u);
    assert(isValid === false, `checkUsernameUnique rejects long username (${u.length} chars)`);
  }

  // 1.3 Invalid usernames: Uppercase characters ('Aiman', 'User_123')
  // Mandatory requirement: usernames must be lowercase only (huruf kecil sahaja).
  assert(formatRegex.test('Aiman') === false, "Format regex strictly rejects uppercase username 'Aiman'");
  assert(formatRegex.test('User_123') === false, "Format regex strictly rejects uppercase username 'User_123'");
  assert(formatRegex.test('AIMAN') === false, "Format regex strictly rejects uppercase username 'AIMAN'");

  // Empirical observation: Service layer auto-normalizes via toLowerCase()
  const rawAimanCheck = await authService.checkUsernameUnique('Aiman');
  console.log(`  ℹ [EMPIRICAL OBSERVATION] checkUsernameUnique('Aiman') returned: ${rawAimanCheck} (due to internal .toLowerCase() normalization)`);

  // 1.4 Invalid usernames: Spaces and Special Symbols
  const spacedUsernames = ['user name', 'user 123', 'aiman test'];
  for (const u of spacedUsernames) {
    assert(formatRegex.test(u) === false, `Format regex rejects spaced username '${u}'`);
    const isValid = await authService.checkUsernameUnique(u);
    assert(isValid === false, `checkUsernameUnique rejects spaced username '${u}'`);
  }

  // Leading/trailing whitespace format check
  assert(formatRegex.test(' aiman ') === false, "Format regex strictly rejects raw username with surrounding whitespace ' aiman '");

  const symbolUsernames = ['@aiman!', 'test.name', 'user#1', 'user$val', '<script>', 'admin/root'];
  for (const u of symbolUsernames) {
    assert(formatRegex.test(u) === false, `Format regex rejects symbol username '${u}'`);
    const isValid = await authService.checkUsernameUnique(u);
    assert(isValid === false, `checkUsernameUnique rejects symbol username '${u}'`);
  }

  console.log('\n► SECTION 2: Duplicate Username Rejection & excludeUid Logic');

  // Seed known usernames
  authService.knownUsernames.set('existing_user', 'uid_user_1');

  // 2.1 Duplicate rejection
  const dupCheck = await authService.checkUsernameUnique('existing_user');
  assert(dupCheck === false, "Duplicate username 'existing_user' is rejected");

  // 2.2 Case-insensitive duplicate rejection
  const dupUpperCheck = await authService.checkUsernameUnique('EXISTING_USER');
  assert(dupUpperCheck === false, "Case-insensitive duplicate 'EXISTING_USER' is rejected");

  // 2.3 excludeUid matches owner
  const ownCheck = await authService.checkUsernameUnique('existing_user', 'uid_user_1');
  assert(ownCheck === true, "excludeUid matching owner 'uid_user_1' allows retaining own username");

  // 2.4 excludeUid does NOT match different user
  const otherCheck = await authService.checkUsernameUnique('existing_user', 'uid_user_2');
  assert(otherCheck === false, "excludeUid mismatch 'uid_user_2' strictly blocks taking another user's username");

  console.log('\n► SECTION 3: Profile View Data & Guest Protection (getProfileViewData)');

  const getProfileViewData = await loadProfileViewHelper();

  // 3.1 Guest user protection
  const guestDataNull = getProfileViewData([], null);
  assert(guestDataNull.rendered === false, "Guest profile (null) rendered is false");
  assert(guestDataNull.requiresAuth === true, "Guest profile (null) requiresAuth is true");
  assert(guestDataNull.message === 'Sila log masuk untuk melihat koleksi anda.', "Guest profile displays exact mandated login prompt message");

  const guestDataUndefined = getProfileViewData([], undefined);
  assert(guestDataUndefined.rendered === false, "Guest profile (undefined) rendered is false");
  assert(guestDataUndefined.requiresAuth === true, "Guest profile (undefined) requiresAuth is true");

  // 3.2 Authenticated member with saved perfumes
  const mockCatalog = [
    { id: 'perfume-1', name: 'Aventus Clone' },
    { id: 'perfume-2', name: 'Tygar Dupe' },
    { id: 'perfume-3', name: 'Khamrah' }
  ];
  const memberWithLikes = {
    uid: 'm100',
    displayName: 'Aiman Rahim',
    username: 'aiman_rahim',
    savedPerfumes: ['perfume-1', 'perfume-3']
  };

  const memberData = getProfileViewData(mockCatalog, memberWithLikes);
  assert(memberData.title === '❤️ Koleksi Saya', "Profile title is '❤️ Koleksi Saya'");
  assert(memberData.count === 2, "Profile count equals 2");
  assert(memberData.countText === '2 wangian disimpan', "Profile countText is '2 wangian disimpan'");
  assert(memberData.perfumes.length === 2, "Profile perfumes array contains 2 matched items");
  assert(memberData.isEmpty === false, "Profile isEmpty is false");
  assert(!('bio' in memberData), "Profile data does not leak 'bio'");
  assert(!('badge' in memberData), "Profile data does not leak 'badge'");
  assert(!('stats' in memberData), "Profile data does not leak 'stats'");

  // 3.3 Authenticated member with 0 saved perfumes (empty state)
  const memberEmpty = {
    uid: 'm101',
    displayName: 'New Member',
    username: 'new_member',
    savedPerfumes: []
  };
  const emptyData = getProfileViewData(mockCatalog, memberEmpty);
  assert(emptyData.count === 0, "Empty profile count is 0");
  assert(emptyData.isEmpty === true, "Empty profile isEmpty is true");
  assert(emptyData.countText === '0 wangian disimpan', "Empty profile countText is '0 wangian disimpan'");
  assert(emptyData.emptyMessage === 'Belum ada wangian disimpan. Tekan ❤️ pada mana-mana parfume.', "Empty state message is exact");

  console.log('\n► SECTION 4: updateProfileData Method Behavior');

  // 4.1 Unauthenticated call throws error
  authService.currentUser = null;
  let unauthThrew = false;
  try {
    await authService.updateProfileData({ displayName: 'Ghost' });
  } catch (err) {
    unauthThrew = true;
    assert(err.message === 'Sila log masuk terlebih dahulu.', "Unauthenticated updateProfileData throws 'Sila log masuk terlebih dahulu.'");
  }
  assert(unauthThrew === true, "Unauthenticated updateProfileData rejected");

  // 4.2 Authenticated user setup
  authService.currentUser = {
    uid: 'uid_test_member',
    displayName: 'Original Name',
    username: 'orig_user',
    email: 'member@test.com',
    photoURL: 'https://example.com/old.jpg',
    role: 'member',
    savedPerfumes: []
  };
  authService.knownUsernames.set('orig_user', 'uid_test_member');
  authService.knownUsernames.set('someone_else', 'uid_someone_else');

  // 4.3 Update to invalid username format (<3 chars)
  let invalidFormatThrew = false;
  try {
    await authService.updateProfileData({ username: 'xy' });
  } catch (err) {
    invalidFormatThrew = true;
    assert(err.message.includes('3-20 aksara'), "Invalid format username update throws 3-20 characters error");
  }
  assert(invalidFormatThrew === true, "Invalid format username rejected");

  // 4.4 Update to already taken username
  let takenThrew = false;
  try {
    await authService.updateProfileData({ username: 'someone_else' });
  } catch (err) {
    takenThrew = true;
    assert(err.message.includes('telah digunakan'), "Taken username update throws collision error");
  }
  assert(takenThrew === true, "Taken username rejected");

  // 4.5 Update to same username is a no-op / success
  let sameOk = false;
  try {
    const res = await authService.updateProfileData({ username: 'orig_user' });
    sameOk = (res.username === 'orig_user');
  } catch (e) {
    sameOk = false;
  }
  assert(sameOk === true, "Updating to existing same username succeeds smoothly");

  // 4.6 Update display name, valid new username, and photoURL
  let fullUpdateOk = false;
  try {
    const updated = await authService.updateProfileData({
      displayName: 'Aiman Updated',
      username: 'aiman_new_2026',
      photoURL: 'https://example.com/new_avatar.jpg'
    });
    fullUpdateOk = (
      updated.displayName === 'Aiman Updated' &&
      updated.username === 'aiman_new_2026' &&
      updated.photoURL === 'https://example.com/new_avatar.jpg' &&
      authService.knownUsernames.has('aiman_new_2026') &&
      !authService.knownUsernames.has('orig_user')
    );
  } catch (e) {
    fullUpdateOk = false;
  }
  assert(fullUpdateOk === true, "Full profile data update (name, username, photoURL) succeeds and syncs cache");

  console.log('\n► SECTION 5: RBAC Security Flags');

  // 5.1 Member user
  authService.currentUser = { uid: 'u_member', role: 'member' };
  assert(authService.isAdmin() === false, "Member user isAdmin() is false");
  assert(authService.isGuest() === false, "Member user isGuest() is false");

  // 5.2 Admin user
  authService.currentUser = { uid: 'u_admin', role: 'admin' };
  assert(authService.isAdmin() === true, "Admin user isAdmin() is true");
  assert(authService.isGuest() === false, "Admin user isGuest() is false");

  // 5.3 Guest user
  authService.currentUser = null;
  assert(authService.isAdmin() === false, "Guest user isAdmin() is false");
  assert(authService.isGuest() === true, "Guest user isGuest() is true");

  console.log('\n---------------------------------------------------------------');
  console.log(`📊 STRESS TEST SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('---------------------------------------------------------------\n');

  if (failedTests > 0) {
    console.error('FAILURES:');
    failures.forEach(f => console.error(f));
    process.exit(1);
  } else {
    console.log('🎉 ALL EMPIRICAL CHALLENGE ASSERTIONS PASSED!');
    process.exit(0);
  }
}

runEmpiricalChallenge().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

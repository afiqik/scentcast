/**
 * Adversarial Test Suite for Milestone G3-M3
 * ScentCast Malaysia — Reviewer 1 (gen4_reviewer_m3_1)
 *
 * Scope:
 * 1. R2: Username input validation, /^[a-z0-9_]{3,20}$/ regex, checkUsernameUnique,
 *        pre-flight check in register(), lowercase persistence in users/{uid}.
 * 2. R3: Protected route barrier on #/profil when guest, 3-tier Neumorphic layout
 *        (User Info Card, Profile Settings Panel with 6 presets + custom URL live preview,
 *        Saved Perfumes Grid with ❤️ collection, logout functionality).
 * 3. R10: Strict RBAC enforcement via authService.isAdmin(), AdminView guard, main.js guard,
 *         Header navigation item visibility, adminService CRUD guard, public view purity.
 * 4. i18n: Complete dictionary verification in bm.json and en.json.
 * 5. Integrity: Verification against dummy facades, hardcoded test values, or shortcuts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Environment Setup
function initMockEnv() {
  class MemoryStorage {
    constructor() {
      this.store = new Map();
    }
    getItem(k) { return this.store.has(String(k)) ? this.store.get(String(k)) : null; }
    setItem(k, v) { this.store.set(String(k), String(v)); }
    removeItem(k) { this.store.delete(String(k)); }
    clear() { this.store.clear(); }
    get length() { return this.store.size; }
    key(i) { return Array.from(this.store.keys())[i] || null; }
  }

  class MockElement {
    constructor(tagName = 'div') {
      this.tagName = tagName.toUpperCase();
      this.id = '';
      this._classes = new Set();
      this.innerHTML = '';
      this.textContent = '';
      this.value = '';
      this.dataset = {};
      this.attributes = new Map();
      this.children = [];
      this.parentElement = null;
      this.eventListeners = new Map();
    }

    get className() {
      return Array.from(this._classes).join(' ');
    }
    set className(val) {
      this._classes = new Set(String(val).split(/\s+/).filter(Boolean));
    }

    get classList() {
      const self = this;
      return {
        add(...tokens) {
          tokens.forEach(t => self._classes.add(t));
          self.className = Array.from(self._classes).join(' ');
        },
        remove(...tokens) {
          tokens.forEach(t => self._classes.delete(t));
          self.className = Array.from(self._classes).join(' ');
        },
        contains(t) { return self._classes.has(t); },
        toggle(t, force) {
          if (force === true) { this.add(t); return true; }
          if (force === false) { this.remove(t); return false; }
          if (self._classes.has(t)) { this.remove(t); return false; }
          this.add(t); return true;
        }
      };
    }

    setAttribute(n, v) {
      this.attributes.set(n, String(v));
      if (n === 'id') this.id = String(v);
      if (n === 'class') this.className = String(v);
    }
    getAttribute(n) { return this.attributes.get(n) || null; }
    removeAttribute(n) { this.attributes.delete(n); }
    hasAttribute(n) { return this.attributes.has(n); }

    appendChild(c) {
      c.parentElement = this;
      this.children.push(c);
      return c;
    }
    removeChild(c) {
      const idx = this.children.indexOf(c);
      if (idx !== -1) {
        this.children.splice(idx, 1);
        c.parentElement = null;
      }
      return c;
    }
    querySelector(sel) {
      return this.children.find(c => {
        if (sel.startsWith('#')) return c.id === sel.slice(1);
        if (sel.startsWith('.')) return c._classes.has(sel.slice(1));
        return false;
      }) || null;
    }
    querySelectorAll(sel) {
      return this.children.filter(c => {
        if (sel.startsWith('#')) return c.id === sel.slice(1);
        if (sel.startsWith('.')) return c._classes.has(sel.slice(1));
        return false;
      });
    }

    addEventListener(evt, h) {
      if (!this.eventListeners.has(evt)) this.eventListeners.set(evt, []);
      this.eventListeners.get(evt).push(h);
    }
    removeEventListener(evt, h) {
      if (!this.eventListeners.has(evt)) return;
      this.eventListeners.set(evt, this.eventListeners.get(evt).filter(fn => fn !== h));
    }
    dispatchEvent(evt) {
      const handlers = this.eventListeners.get(evt.type) || [];
      handlers.forEach(h => h(evt));
      return true;
    }
  }

  const elementsById = new Map();
  const documentMock = {
    createElement(tag) { return new MockElement(tag); },
    getElementById(id) {
      if (!elementsById.has(id)) {
        const el = new MockElement('div');
        el.id = id;
        elementsById.set(id, el);
      }
      return elementsById.get(id);
    },
    querySelector(sel) {
      if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
      return new MockElement('div');
    },
    querySelectorAll() { return []; },
    documentElement: new MockElement('html'),
    body: new MockElement('body')
  };

  const windowMock = {
    location: { hash: '#/', reload() {} },
    localStorage: new MemoryStorage(),
    addEventListener() {},
    removeEventListener() {},
    setTimeout: setTimeout.bind(globalThis),
    clearTimeout: clearTimeout.bind(globalThis)
  };

  globalThis.window = windowMock;
  globalThis.document = documentMock;
  globalThis.localStorage = windowMock.localStorage;
  globalThis.location = windowMock.location;
}

initMockEnv();

// Import target modules
const { authService } = await import('../src/services/authService.js');
const { adminService } = await import('../src/services/adminService.js');
const { renderProfileView, attachProfileListeners, getProfileViewData } = await import('../src/views/ProfileView.js');
const { renderAdminView, renderAccessDenied } = await import('../src/views/AdminView.js');
const { renderHeader } = await import('../src/components/Header.js');
const { i18nService, t } = await import('../src/services/i18nService.js');

// Test Harness
let passCount = 0;
let failCount = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function runTest(name, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      passCount++;
      console.log(`  ✓ ${name}`);
    })
    .catch(err => {
      failCount++;
      failures.push({ name, err: err.message });
      console.error(`  ✗ ${name}: ${err.message}`);
    });
}

console.log('\n===============================================================');
console.log('⚔️  ADVERSARIAL STRESS-TEST SUITE: G3-M3 (R2, R3, R10)');
console.log('===============================================================\n');

// ----------------------------------------------------------------------------
// SUITE 1: R2 Username Validation & Uniqueness Collision Tests
// ----------------------------------------------------------------------------
console.log('► SUITE 1: R2 — Username Validation & Uniqueness Robustness');

await runTest('R2-01: Username regex /^[a-z0-9_]{3,20}$/ accepts valid usernames', async () => {
  const validUsernames = ['aiman', 'aiman_99', 'scent_guru_123', 'abc', '12345678901234567890', 'a_b_c'];
  for (const un of validUsernames) {
    const isAvail = await authService.checkUsernameUnique(un);
    assert(isAvail === true, `Expected valid username "${un}" to pass checkUsernameUnique, got false`);
  }
});

await runTest('R2-02: Username regex /^[a-z0-9_]{3,20}$/ rejects uppercase and special chars, while checkUsernameUnique normalizes and rejects invalid formats', async () => {
  const regex = /^[a-z0-9_]{3,20}$/;
  // Direct regex checks
  assert(regex.test('Aiman') === false, 'Raw regex should reject uppercase');
  assert(regex.test('AIMAN_99') === false, 'Raw regex should reject uppercase');
  assert(regex.test('user@name') === false, 'Raw regex should reject @');
  assert(regex.test('user.name') === false, 'Raw regex should reject .');
  assert(regex.test('user-name') === false, 'Raw regex should reject -');
  assert(regex.test('a') === false, 'Raw regex should reject < 3 chars');
  assert(regex.test('ab') === false, 'Raw regex should reject < 3 chars');
  assert(regex.test('abcdefghijklmnopqrstu') === false, 'Raw regex should reject > 20 chars');

  // checkUsernameUnique checks (normalizes lowercase/trim, then validates regex)
  const invalidUsernames = [
    '',               // empty
    '  ',             // spaces
    'a',              // too short (< 3)
    'ab',             // too short (< 3)
    'abcdefghijklmnopqrstu', // too long (> 20, 21 chars)
    'user@name',      // @ character
    'user.name',      // . character
    'user-name',      // hyphen not allowed in regex [a-z0-9_]
    'user name',      // internal space
    'user!name',      // exclamation
    'user#name',      // hash
    '<script>alert',  // XSS attempt
    'admin\'--',       // SQL injection attempt
    null,
    undefined
  ];

  for (const un of invalidUsernames) {
    const isAvail = await authService.checkUsernameUnique(un);
    assert(isAvail === false, `Expected invalid username "${un}" to be rejected (false), but got true`);
  }
});

await runTest('R2-03: Known username collision correctly reports as unavailable', async () => {
  // Pre-seed known username
  authService.knownUsernames.set('reserved_user', 'uid_12345');

  const check1 = await authService.checkUsernameUnique('reserved_user');
  assert(check1 === false, 'Expected taken username "reserved_user" to return false');

  // Case insensitive check
  const checkCase = await authService.checkUsernameUnique('RESERVED_USER');
  assert(checkCase === false, 'Expected uppercase "RESERVED_USER" to be normalized and return false');

  // Check with excludeUid matching owner
  const checkOwner = await authService.checkUsernameUnique('reserved_user', 'uid_12345');
  assert(checkOwner === true, 'Expected owner of username to return true with excludeUid');

  // Check with excludeUid of different user
  const checkOther = await authService.checkUsernameUnique('reserved_user', 'uid_other');
  assert(checkOther === false, 'Expected non-owner with excludeUid to return false');
});

await runTest('R2-04: register() pre-flight check rejects missing or invalid username BEFORE user creation', async () => {
  let threw = false;
  try {
    await authService.register('test@example.com', 'password123', 'Test User', 'ab');
  } catch (err) {
    threw = true;
    assert(err.message.includes('3-20 aksara'), `Unexpected error message: ${err.message}`);
  }
  assert(threw, 'register() did not throw on invalid short username');

  threw = false;
  try {
    await authService.register('test@example.com', 'password123', 'Test User', 'reserved_user');
  } catch (err) {
    threw = true;
    assert(err.message.includes('telah digunakan'), `Unexpected error message: ${err.message}`);
  }
  assert(threw, 'register() did not throw on taken username');
});

// ----------------------------------------------------------------------------
// SUITE 2: R3 — Protected Route Barrier & 3-Tier Profile Layout
// ----------------------------------------------------------------------------
console.log('\n► SUITE 2: R3 — Protected Route & 3-Tier Profile Layout');

await runTest('R3-01: Guest accessing ProfileView receives Protected Barrier card (#/profil)', async () => {
  // Ensure unauthenticated state
  authService.currentUser = null;
  assert(authService.isGuest() === true, 'Expected isGuest() to be true');

  const html = await renderProfileView();
  assert(html.includes('Laluan Terpelihara') || html.includes(t('profile.protectedTitle')), 'Barrier title missing');
  assert(html.includes('id="profile-login-btn"'), 'Profile login button missing in barrier');
  assert(html.includes('lock'), 'Lock icon missing in barrier');
  assert(!html.includes('profile-display-avatar'), 'Protected route leaked user card when guest');
  assert(!html.includes('profile-settings-feedback'), 'Protected route leaked settings panel when guest');
});

await runTest('R3-02: Authenticated user receives complete 3-Tier Neumorphic layout', async () => {
  // Set mock authenticated user
  authService.currentUser = {
    uid: 'test_user_uid_1',
    displayName: 'Aiman Hakimi',
    username: 'aiman_scents',
    email: 'aiman@scentcast.my',
    photoURL: 'https://example.com/avatar.jpg',
    role: 'member',
    savedPerfumes: ['turathi-blue', 'club-de-nuit-intense']
  };

  const html = await renderProfileView();

  // Tier 1: User Info Card
  assert(html.includes('id="profile-display-avatar"'), 'User avatar missing in Tier 1');
  assert(html.includes('id="profile-display-name"'), 'Display name missing in Tier 1');
  assert(html.includes('Aiman Hakimi'), 'Display name content missing');
  assert(html.includes('id="profile-display-handle"'), 'Username handle missing in Tier 1');
  assert(html.includes('@aiman_scents'), 'Username handle text missing');
  assert(html.includes('aiman@scentcast.my'), 'Email text missing in Tier 1');
  assert(html.includes('Ahli Komuniti') || html.includes(t('profile.memberRole')), 'Role badge missing in Tier 1');
  assert(html.includes('id="profile-stat-count"'), 'Stat count indicator missing in Tier 1');
  assert(html.includes('id="profile-logout-btn"'), 'Prominent logout button missing in Tier 1');

  // Tier 2: Profile Settings Panel
  assert(html.includes('id="profile-preview-avatar"'), 'Avatar preview missing in Tier 2');
  assert(html.includes('preset-avatar-btn'), 'Preset avatar buttons missing in Tier 2');
  assert(html.includes('id="profile-custom-avatar-url"'), 'Custom avatar URL input missing in Tier 2');
  assert(html.includes('id="profile-edit-name-input"'), 'Display name edit input missing in Tier 2');
  assert(html.includes('id="profile-edit-username-input"'), 'Username edit input missing in Tier 2');
  assert(html.includes('id="profile-save-btn"'), 'Profile save changes button missing in Tier 2');

  // Tier 3: Saved Perfumes Grid
  assert(html.includes('❤️ Koleksi Saya'), 'Saved collection header missing in Tier 3');
  assert(html.includes('profile-content-container'), 'Profile content container missing in Tier 3');
});

await runTest('R3-03: updateProfileData() handles display name, avatar, and username updates safely', async () => {
  authService.currentUser = {
    uid: 'test_user_uid_1',
    displayName: 'Aiman Hakimi',
    username: 'aiman_scents',
    email: 'aiman@scentcast.my',
    photoURL: 'https://example.com/avatar.jpg',
    role: 'member',
    savedPerfumes: []
  };

  // 1. Update display name & avatar URL
  const updated = await authService.updateProfileData({
    displayName: 'Aiman R.',
    photoURL: 'https://example.com/new_avatar.png'
  });

  assert(updated.displayName === 'Aiman R.', 'Display name not updated');
  assert(updated.photoURL === 'https://example.com/new_avatar.png', 'PhotoURL not updated');
  assert(updated.username === 'aiman_scents', 'Username should remain unchanged');

  // 2. Reject taken username during profile update
  authService.knownUsernames.set('taken_name', 'another_uid_999');
  let threw = false;
  try {
    await authService.updateProfileData({ username: 'taken_name' });
  } catch (err) {
    threw = true;
    assert(err.message.includes('telah digunakan'), `Unexpected error: ${err.message}`);
  }
  assert(threw, 'Expected collision error when updating to taken username');

  // 3. Update to new valid and unique username
  const updated2 = await authService.updateProfileData({ username: 'aiman_fresh' });
  assert(updated2.username === 'aiman_fresh', 'Username was not updated to new unique value');
  assert(authService.knownUsernames.has('aiman_fresh'), 'New username not registered in knownUsernames cache');
  assert(!authService.knownUsernames.has('aiman_scents'), 'Old username not evicted from knownUsernames cache');
});

await runTest('R3-04: logout() clears session, resets state, and notifies listeners', async () => {
  let notified = false;
  const unsub = authService.subscribe(state => {
    if (state.isGuest && state.user === null) notified = true;
  });

  await authService.logout();
  assert(authService.currentUser === null, 'authService.currentUser not null after logout');
  assert(authService.isGuest() === true, 'authService.isGuest() not true after logout');
  assert(notified === true, 'Subscribers not notified on logout');
  unsub();
});

// ----------------------------------------------------------------------------
// SUITE 3: R10 — Role-Based Access Control (RBAC) & Security Enforcement
// ----------------------------------------------------------------------------
console.log('\n► SUITE 3: R10 — Strict RBAC Enforcement & Public View Purity');

await runTest('R10-01: authService.isAdmin() strictly returns true ONLY for role === "admin"', () => {
  // Guest
  authService.currentUser = null;
  assert(authService.isAdmin() === false, 'Guest user should not be admin');

  // Member
  authService.currentUser = { uid: 'u1', role: 'member' };
  assert(authService.isAdmin() === false, 'Member role should not be admin');

  // Corrupted / Spoofed roles
  authService.currentUser = { uid: 'u2', role: 'ADMIN' }; // case sensitive
  assert(authService.isAdmin() === false, 'Uppercase ADMIN role should not pass');

  authService.currentUser = { uid: 'u3', role: 'moderator' };
  assert(authService.isAdmin() === false, 'Moderator role should not pass');

  authService.currentUser = { uid: 'u4', role: true };
  assert(authService.isAdmin() === false, 'Boolean role should not pass');

  // Valid admin
  authService.currentUser = { uid: 'u5', role: 'admin' };
  assert(authService.isAdmin() === true, 'Valid role "admin" must return true');
});

await runTest('R10-02: Header navigation bar strictly hides Admin link from guest and member', () => {
  // Guest
  authService.currentUser = null;
  const guestHeader = renderHeader('laman-utama');
  assert(!guestHeader.includes('href="#/admin"'), 'Admin route leaked to guest in Header');
  assert(!guestHeader.includes(t('nav.admin')), 'Admin label leaked to guest in Header');

  // Member
  authService.currentUser = { uid: 'u1', role: 'member', email: 'mem@scentcast.my' };
  const memberHeader = renderHeader('laman-utama');
  assert(!memberHeader.includes('href="#/admin"'), 'Admin route leaked to member in Header');
  assert(!memberHeader.includes(t('nav.admin')), 'Admin label leaked to member in Header');

  // Admin
  authService.currentUser = { uid: 'u2', role: 'admin', email: 'admin@scentcast.my' };
  const adminHeader = renderHeader('laman-utama');
  assert(adminHeader.includes('href="#/admin"'), 'Admin route missing in Header for admin');
  assert(adminHeader.includes(t('nav.admin')), 'Admin label missing in Header for admin');
});

await runTest('R10-03: AdminView strictly enforces role check and returns ⛔ Akses Ditolak for non-admins', async () => {
  // Guest
  authService.currentUser = null;
  const guestAdminHtml = await renderAdminView();
  assert(guestAdminHtml.includes('⛔ Akses Ditolak'), 'Access Denied title missing for guest in AdminView');
  assert(!guestAdminHtml.includes('admin-open-add-modal-btn'), 'Add perfume button leaked to guest');
  assert(!guestAdminHtml.includes('admin-catalog-view'), 'Catalog view leaked to guest');

  // Member
  authService.currentUser = { uid: 'm1', role: 'member' };
  const memberAdminHtml = await renderAdminView();
  assert(memberAdminHtml.includes('⛔ Akses Ditolak'), 'Access Denied title missing for member in AdminView');
  assert(!memberAdminHtml.includes('admin-open-add-modal-btn'), 'Add perfume button leaked to member');

  // Admin
  authService.currentUser = { uid: 'a1', role: 'admin' };
  const adminHtml = await renderAdminView();
  assert(adminHtml.includes('Panel Kawalan Pentadbir'), 'Admin panel header missing for admin');
  assert(adminHtml.includes('admin-open-add-modal-btn'), 'Add button missing for admin');
  assert(!adminHtml.includes('⛔ Akses Ditolak'), 'Access denied incorrectly shown to admin');
});

await runTest('R10-04: adminService CRUD methods strictly reject non-admin users with error', async () => {
  const member = { uid: 'm1', role: 'member' };
  authService.currentUser = member;

  let threw = false;
  try {
    await adminService.createPerfume(member, { name: 'Unauthorized Perfume', brand: 'Hacker', gender: 'Unisex' });
  } catch (err) {
    threw = true;
    assert(err.message.includes('⛔ Akses Ditolak'), `Unexpected error: ${err.message}`);
  }
  assert(threw, 'adminService.createPerfume failed to reject member');

  threw = false;
  try {
    await adminService.deletePerfume(member, 'turathi-blue');
  } catch (err) {
    threw = true;
    assert(err.message.includes('⛔ Akses Ditolak'), `Unexpected error: ${err.message}`);
  }
  assert(threw, 'adminService.deletePerfume failed to reject member');
});

await runTest('R10-05: Public views verification: Zero admin controls present in public views', () => {
  const publicViewFiles = [
    'src/views/HomeView.js',
    'src/views/DetailView.js',
    'src/views/DirectoryView.js',
    'src/views/SearchView.js',
    'src/components/PerfumeCard.js'
  ];

  for (const relPath of publicViewFiles) {
    const fullPath = path.join(rootDir, relPath);
    const content = fs.readFileSync(fullPath, 'utf8');

    assert(!content.includes('adminService'), `Found adminService import or usage in public view ${relPath}`);
    assert(!content.includes('admin-open-add-modal-btn'), `Found admin add button in ${relPath}`);
    assert(!content.includes('admin-delete-btn'), `Found admin delete button in ${relPath}`);
    assert(!content.includes('admin-edit-btn'), `Found admin edit button in ${relPath}`);
  }
});

// ----------------------------------------------------------------------------
// SUITE 4: i18n Completeness Verification
// ----------------------------------------------------------------------------
console.log('\n► SUITE 4: i18n — Complete Dictionary & Parity Verification');

await runTest('i18n-01: All required auth and profile translation keys exist in bm.json and en.json', () => {
  const bm = JSON.parse(fs.readFileSync(path.join(rootDir, 'src/i18n/bm.json'), 'utf8'));
  const en = JSON.parse(fs.readFileSync(path.join(rootDir, 'src/i18n/en.json'), 'utf8'));

  const requiredAuthKeys = [
    'loginTitle', 'registerTitle', 'emailLabel', 'passwordLabel', 'nameLabel',
    'loginBtn', 'registerBtn', 'googleBtn', 'noAccount', 'haveAccount',
    'username', 'usernameLabel', 'usernamePlaceholder', 'usernameHelp',
    'usernameErrorTaken', 'usernameErrorInvalid', 'usernameChecking', 'usernameAvailable'
  ];

  const requiredProfileKeys = [
    'title', 'pageTitle', 'count', 'empty', 'exploreBtn',
    'protectedTitle', 'protectedDesc', 'accountSettings', 'accountSettingsSubtitle',
    'avatarSelector', 'avatarSelectorTitle', 'customAvatarUrl', 'preview',
    'displayNameLabel', 'editUsername', 'saveChanges', 'updateSuccess',
    'logout', 'logoutBtn', 'memberRole', 'adminRole'
  ];

  const requiredAdminKeys = [
    'title', 'accessDenied', 'accessDeniedDesc', 'tabPerfumes', 'tabComments',
    'addPerfume', 'editPerfume', 'deletePerfume'
  ];

  for (const key of requiredAuthKeys) {
    assert(bm.auth && typeof bm.auth[key] === 'string' && bm.auth[key].length > 0, `Missing auth.${key} in bm.json`);
    assert(en.auth && typeof en.auth[key] === 'string' && en.auth[key].length > 0, `Missing auth.${key} in en.json`);
  }

  for (const key of requiredProfileKeys) {
    assert(bm.profile && typeof bm.profile[key] === 'string' && bm.profile[key].length > 0, `Missing profile.${key} in bm.json`);
    assert(en.profile && typeof en.profile[key] === 'string' && en.profile[key].length > 0, `Missing profile.${key} in en.json`);
  }

  for (const key of requiredAdminKeys) {
    assert(bm.admin && typeof bm.admin[key] === 'string' && bm.admin[key].length > 0, `Missing admin.${key} in bm.json`);
    assert(en.admin && typeof en.admin[key] === 'string' && en.admin[key].length > 0, `Missing admin.${key} in en.json`);
  }
});

// ----------------------------------------------------------------------------
// SUITE 5: Integrity Verification (Anti-Cheat / Facade Inspection)
// ----------------------------------------------------------------------------
console.log('\n► SUITE 5: Integrity Verification — Checking for Facades or Hardcoded Results');

await runTest('INT-01: Verify authService.js contains real Firestore & Auth logic without dummy stubs', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/services/authService.js'), 'utf8');

  // Verify real Firebase imports
  assert(content.includes('createUserWithEmailAndPassword'), 'authService missing createUserWithEmailAndPassword');
  assert(content.includes('signInWithEmailAndPassword'), 'authService missing signInWithEmailAndPassword');
  assert(content.includes('updateProfile'), 'authService missing updateProfile');
  assert(content.includes('where(\'username\', \'==\', cleanUsername)'), 'authService missing Firestore query by username');
  assert(content.includes('/^[a-z0-9_]{3,20}$/'), 'authService missing regex /^[a-z0-9_]{3,20}$/');

  // Verify no hardcoded test shortcuts
  assert(!content.includes('if (testMode)'), 'authService contains testMode shortcut');
  assert(!content.includes('// mock pass'), 'authService contains fake pass comment');
  assert(!content.includes('bypassRBAC'), 'authService contains RBAC bypass');
});

await runTest('INT-02: Verify ProfileView.js implements genuine 3-tier Neumorphic UI and dynamic state', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/views/ProfileView.js'), 'utf8');

  assert(content.includes('authService.isGuest()'), 'ProfileView missing guest check');
  assert(content.includes('PRESET_AVATARS'), 'ProfileView missing PRESET_AVATARS');
  assert(content.includes('authService.updateProfileData'), 'ProfileView missing updateProfileData call');
  assert(content.includes('authService.checkUsernameUnique'), 'ProfileView missing live async checkUsernameUnique');
  assert(content.includes('attachPerfumeCardListeners'), 'ProfileView missing perfume card listener attachment');
});

// ----------------------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------------------
console.log('\n---------------------------------------------------------------');
console.log(`📊 ADVERSARIAL STRESS TEST SUMMARY:`);
console.log(`  Passed: ${passCount}`);
console.log(`  Failed: ${failCount}`);
console.log('---------------------------------------------------------------\n');

if (failCount > 0) {
  console.error('FAILED TESTS DETAILS:');
  failures.forEach(f => console.error(`  - ${f.name}: ${f.err}`));
  process.exit(1);
} else {
  console.log('🎉 ALL ADVERSARIAL TESTS PASSED SUCCESSFULLY!\n');
}
